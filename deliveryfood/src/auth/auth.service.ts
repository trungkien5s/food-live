// src/auth/auth.service.ts
import { comparePasswordHelper } from '@/helpers/util';
import { UsersService } from '@/modules/users/users.service';
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import { randomBytes } from 'crypto';
import { ConfigService } from '@nestjs/config';

import { CreateAuthDto } from './dto/create-auth.dto';
import {
  IUser,
  LoginResponse,
  RefreshTokenResponse,
  LogoutResponse,
  RegisterResponse,
  ActivationResponse,
  UserFromDB,
  JwtPayload,
} from './interfaces/auth.interface';
import { CreateUserDto } from '@/modules/users/dto/create-user.dto';

type MaybeRegisterResult = unknown;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, pass: string): Promise<UserFromDB | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;

    const isValidPassword = await comparePasswordHelper(pass, user.password);
    if (!isValidPassword) return null;

    return user as UserFromDB;
  }

  async login(user: IUser | UserFromDB): Promise<LoginResponse> {
    if (!user.isActive) {
      throw new BadRequestException('Tài khoản chưa được kích hoạt.');
    }

    const payload: JwtPayload = {
      username: user.email,
      sub: user._id.toString(),
      role: user.role,
    };

    const accessTokenExpiresIn =
      this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRED') ?? '30m';

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: accessTokenExpiresIn,
    });

    const refreshToken = randomBytes(64).toString('hex');
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

    await this.usersService.saveRefreshToken(
      user._id.toString(),
      refreshToken,
      refreshTokenExpiry,
    );

    return {
      user: {
        _id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refreshToken(userId: string, refreshToken: string): Promise<RefreshTokenResponse> {
    const user = await this.usersService.findById(userId);

    const invalid =
      !user ||
      !user.refreshToken ||
      user.refreshToken !== refreshToken ||
      !user.refreshTokenExpiry ||
      new Date() > new Date(user.refreshTokenExpiry);

    if (invalid) {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn.');
    }

    const payload: JwtPayload = {
      username: user.email,
      sub: user._id.toString(),
      role: user.role,
    };

    const accessTokenExpiresIn =
      this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRED') ?? '30m';

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: accessTokenExpiresIn,
    });

    return { access_token: accessToken };
  }

  async handleRegister(registerDto: CreateAuthDto): Promise<RegisterResponse> {
    // Nếu UsersService có handleRegister và bạn muốn dùng lại logic ở đó:
    const maybeHandleRegister = (this.usersService as unknown as { handleRegister?: (dto: CreateAuthDto) => Promise<MaybeRegisterResult> })
      .handleRegister;

    if (typeof maybeHandleRegister === 'function') {
      const result = await maybeHandleRegister(registerDto);

      // ✅ FIX TS2741: đảm bảo luôn trả về RegisterResponse có message
      if (result && typeof result === 'object' && 'message' in (result as Record<string, unknown>)) {
        const message = (result as { message?: unknown }).message;
        if (typeof message === 'string') return { message };
      }

      // fallback nếu UsersService trả về kiểu khác (vd: { _id: '...' })
      return {
        message: 'Registration successful! Please check your email to activate your account.',
      };
    }

    // --------- Default flow nếu không có usersService.handleRegister ----------
    const existing = await this.usersService.findByEmail(registerDto.email);
    if (existing) throw new BadRequestException('Email already exists');

    const createUserPayload: CreateUserDto = {
      name: registerDto.name,
      email: registerDto.email,
      password: registerDto.password,
      phone: registerDto.phone ?? '',
      address: registerDto.address ?? '',
      image: registerDto.image ?? '',
    };

    const created = await this.usersService.create(createUserPayload);
    const userId = created._id.toString();

    const activationToken = randomBytes(32).toString('hex');
    const activationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.usersService.updateActivationToken(userId, activationToken, activationTokenExpiry);
    await this.sendActivationEmail(registerDto.email, registerDto.name, activationToken);

    return {
      message: 'Registration successful! Please check your email to activate your account.',
    };
  }

  async activateAccountByToken(token: string): Promise<ActivationResponse> {
    const user = await this.usersService.findByActivationToken(token);
    if (!user) throw new BadRequestException('Invalid or expired activation token');

    await this.usersService.activateUser(user._id.toString());
    return { message: 'Account activated successfully! You can now login.' };
  }

  async resendActivationLink(email: string): Promise<RegisterResponse> {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');
    if (user.isActive) throw new BadRequestException('Account is already activated');

    const activationToken = randomBytes(32).toString('hex');
    const activationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.usersService.updateActivationToken(
      user._id.toString(),
      activationToken,
      activationTokenExpiry,
    );

    await this.sendActivationEmail(user.email, user.name, activationToken);

    return { message: 'Activation link resent successfully! Please check your email.' };
  }

  private async sendActivationEmail(email: string, name: string, token: string): Promise<void> {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ??
      this.configService.get<string>('BACKEND_URL') ??
      'http://localhost:3000';

    const activationUrl = `${frontendUrl}/auth/activate?token=${token}`;

    await this.mailerService.sendMail({
      to: email,
      subject: 'Activate Your Account',
      template: 'activation',
      context: { name, activationUrl },
    });
  }

  async logout(user: IUser): Promise<LogoutResponse> {
    await this.usersService.removeRefreshToken(user._id.toString());

    return {
      message: 'Đăng xuất thành công',
      statusCode: 200,
      data: {
        userId: user._id.toString(),
        email: user.email,
        logoutTime: new Date().toISOString(),
      },
    };
  }
}
