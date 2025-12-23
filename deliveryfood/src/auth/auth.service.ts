// src/auth/auth.service.ts
import { comparePasswordHelper } from '@/helpers/util';
import { UsersService } from '@/modules/users/users.service';
import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateAuthDto } from './dto/create-auth.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailerService: MailerService
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(username);
    if (!user) return null;

    const isValidPassword = await comparePasswordHelper(pass, user.password);
    if (!isValidPassword) return null;

    return user;
  }

  async login(user: any) {
    if (!user.isActive) {
      throw new BadRequestException('Tài khoản chưa được kích hoạt.');
    }
    const payload = { username: user.email, sub: user._id, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRED || '30m',
    });

    // Tạo refresh token (random)
    const refreshToken = randomBytes(64).toString('hex');
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

    // Lưu refreshToken vào DB (UsersService phải implement)
    await this.usersService.saveRefreshToken(user._id, refreshToken, refreshTokenExpiry);

    return {
      user: { _id: user._id, email: user.email, name: user.name, role: user.role },
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refreshToken(userId: string, refreshToken: string) {
    // Kiểm tra refresh token trong DB
    const user = await this.usersService.findById(userId);
    if (
      !user ||
      !user.refreshToken ||
      user.refreshToken !== refreshToken ||
      !user.refreshTokenExpiry ||
      new Date() > new Date(user.refreshTokenExpiry)
    ) {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn.');
    }
    // Cấp access token mới
    const payload = { username: user.email, sub: user._id, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRED || '30m',
    });
    return { access_token: accessToken };
  }

  
async handleRegister(registerDto: CreateAuthDto) {
  if (typeof this.usersService.handleRegister === 'function') {
    return await this.usersService.handleRegister(registerDto);
  }

  // Kiểm tra email tồn tại
  const existing = await this.usersService.findByEmail(registerDto.email);
  if (existing) {
    throw new BadRequestException('Email already exists');
  }

  const createUserPayload = {
    name: registerDto.name,
    email: registerDto.email,
    password: registerDto.password,
    phone: (registerDto as any).phone ?? '',
    address: (registerDto as any).address ?? '',
    image: (registerDto as any).image ?? '',
  } as any; // hoặc 'as CreateUserDto' nếu import được

  // Tạo user
  const created = await this.usersService.create(createUserPayload);

  // Lấy userId an toàn (tùy usersService.create trả document hay chỉ { _id })
  const userId =
    created && created._id
      ? typeof created._id.toString === 'function'
        ? created._id.toString()
        : String(created._id)
      : String(created);

  // tạo activation token (plaintext). Bạn có thể đổi sang hash nếu muốn.
  const activationToken = randomBytes(32).toString('hex');
  const activationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  // Lưu token vào user
  await this.usersService.updateActivationToken(userId, activationToken, activationTokenExpiry);

  // Gửi email kích hoạt
  await this.sendActivationEmail(registerDto.email, registerDto.name, activationToken);

  return {
    message: 'Registration successful! Please check your email to activate your account.',
  };
}


  async activateAccountByToken(token: string) {
    const user = await this.usersService.findByActivationToken(token);
    if (!user) {
      throw new BadRequestException('Invalid or expired activation token');
    }
    await this.usersService.activateUser(user._id.toString());
    return { message: 'Account activated successfully! You can now login.' };
  }

  async resendActivationLink(email: string) {
    const user = await this.usersService.findByEmail(email);
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isActive) {
      throw new BadRequestException('Account is already activated');
    }

    // tạo token mới
    const activationToken = randomBytes(32).toString('hex');
    const activationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // lưu token & expiry (UsersService must implement updateActivationToken)
    await this.usersService.updateActivationToken(user._id.toString(), activationToken, activationTokenExpiry);

    // gửi email
    await this.sendActivationEmail(user.email, user.name, activationToken);

    return {
      message: 'Activation link resent successfully! Please check your email.',
    };
  }

  private async sendActivationEmail(email: string, name: string, token: string) {
    const activationUrl = `${process.env.FRONTEND_URL || process.env.BACKEND_URL || 'http://localhost:3000'}/auth/activate?token=${token}`;
    await this.mailerService.sendMail({
      to: email,
      subject: 'Activate Your Account',
      template: 'activation', // đảm bảo template này tồn tại
      context: {
        name,
        activationUrl,
      },
    });
  }

  async logout(user: any) {
    await this.usersService.removeRefreshToken(user._id || user.sub);
    return {
      message: 'Đăng xuất thành công',
      statusCode: 200,
      data: {
        userId: user._id || user.sub,
        email: user.email || user.username,
        logoutTime: new Date().toISOString(),
      },
    };
  }
}
