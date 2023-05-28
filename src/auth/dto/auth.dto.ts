import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class signUpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  password: string;

  @IsString()
  @IsNotEmpty()
  userName: string;
}

export class loginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  password: string;
}

export class forgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class resetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  newPassword: string;
}
