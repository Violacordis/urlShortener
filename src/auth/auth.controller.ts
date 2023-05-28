import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  forgotPasswordDto,
  loginDto,
  resetPasswordDto,
  signUpDto,
} from './dto';
import { ApiTags } from '@nestjs/swagger';
import { ApiResponseMetadata } from 'src/auth/decorators';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() dto: signUpDto) {
    return this.authService.signUp(dto);
  }

  @ApiResponseMetadata({ message: 'You have logged in!' })
  @Post('login')
  async login(@Body() dto: loginDto) {
    return this.authService.login(dto);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() { email }: forgotPasswordDto) {
    return this.authService.forgotPassword(email);
  }

  @ApiResponseMetadata({
    message: 'You have successfully reset your Password !!',
  })
  @Patch('reset-password')
  async resetPassword(@Param('id') id: string, @Body() dto: resetPasswordDto) {
    return this.authService.resetPassword(id, dto);
  }
}
