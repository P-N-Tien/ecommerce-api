import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'The email address of the user',
    example: 'john.doe@example.com',
  })
  @IsNotEmpty({ message: 'Email cannot be empty' })
  @IsEmail({}, { message: 'Invalid email format' })
  email!: string;

  @ApiProperty({
    description: 'The password for the account',
    example: 'StrongPass123!',
    minLength: 6,
    maxLength: 20,
    writeOnly: true,
  })
  @IsNotEmpty({ message: 'Password cannot be empty' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(20, { message: 'Password cannot exceed 20 characters' })
  password!: string;
}

export class LoginDto extends RegisterDto {}

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current account password', writeOnly: true })
  @IsNotEmpty({ message: 'Current password cannot be empty' })
  @IsString({ message: 'Current password must be a string' })
  currentPassword!: string;

  @ApiProperty({ description: 'New account password', minLength: 6, maxLength: 20, writeOnly: true })
  @IsNotEmpty({ message: 'New password cannot be empty' })
  @IsString({ message: 'New password must be a string' })
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  @MaxLength(20, { message: 'New password cannot exceed 20 characters' })
  newPassword!: string;

  @ApiProperty({ description: 'Must match the new password', writeOnly: true })
  @IsNotEmpty({ message: 'Password confirmation cannot be empty' })
  @IsString({ message: 'Password confirmation must be a string' })
  confirmNewPassword!: string;
}

export class LoginResponseDto {
  accessToken!: string;
  refreshToken!: string;
}
