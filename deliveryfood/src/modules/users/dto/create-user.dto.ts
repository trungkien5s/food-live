import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
    @ApiProperty({ example: 'Nguyễn Văn A' })
    @IsNotEmpty({ message: 'Tên không được để trống' })
    @IsString()
    name: string;

    @ApiProperty({ example: 'user@example.com' })
    @IsNotEmpty({ message: 'Email không được để trống' })
    @IsEmail({}, { message: 'Email không đúng định dạng' })
    email: string;

    @ApiProperty({ example: 'password123' })
    @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
    @IsString()
    password: string;

    @ApiProperty({ required: false, example: '0901234567' })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({ required: false, example: '123 Đường ABC, Quận 1, TP.HCM' })
    @IsOptional()
    @IsString()
    address?: string;

    @ApiProperty({ required: false, example: 'https://example.com/avatar.jpg' })
    @IsOptional()
    @IsString()
    image?: string;
}
