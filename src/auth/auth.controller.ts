import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  changePasswordDto,
  forgotPasswordDto,
  loginDto,
  resetPasswordDto,
  signUpDto,
  verifyEmailDto,
} from './dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApiResponseMetadata, GetUser } from 'src/auth/decorators';
import { User } from '@prisma/client';
import { JwtGuard } from './guard/jwt.guard';
import { CacheInterceptor } from '@nestjs/cache-manager';

@ApiTags('Auth')
@UseInterceptors(CacheInterceptor)
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiResponseMetadata({
    message:
      'Email Confirmation sent !!!. Please check your inbox to confirm your email address',
  })
  @Post('signup')
  async signUp(@Body() dto: signUpDto) {
    return this.authService.signUp(dto);
  }

  @ApiResponseMetadata({ message: 'Email address verified successfully' })
  @Post('verify-email/:id')
  async verifyEmail(@Param('id') id: string, @Body() dto: verifyEmailDto) {
    return this.authService.verifyEmail(id, dto);
  }

  @ApiResponseMetadata({ message: 'You have logged in!' })
  @Post('login')
  async login(@Body() dto: loginDto) {
    return this.authService.login(dto);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: forgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @ApiResponseMetadata({
    message: 'You have successfully reset your Password !!',
  })
  @Patch('reset-password')
  async resetPassword(@Param('id') id: string, @Body() dto: resetPasswordDto) {
    return this.authService.resetPassword(id, dto);
  }

  @ApiResponseMetadata({
    message: 'You have changed your Password Successfully !!',
  })
  @Patch('change-password')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  async changePassword(@GetUser() user: User, @Body() dto: changePasswordDto) {
    return this.authService.changePassword(user, dto);
  }
}
