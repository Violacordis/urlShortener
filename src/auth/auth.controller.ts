import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
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
import { User } from '@prisma/client';
import { JwtGuard } from './guard/jwt.guard';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { ApiResponseMetadata, GetUser } from './decorators';
import { TokenEnumType } from '../utils/token/enum/token.enum';

@ApiTags('Auth')
@UseInterceptors(CacheInterceptor)
@Controller({ version: '/auth' })
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
  @Post('verify-email/:email')
  async verifyEmail(
    @Param('email') email: string,
    @Body() dto: verifyEmailDto,
  ) {
    return this.authService.verifyEmail(email, dto);
  }

  @ApiResponseMetadata({ message: 'New Token sent successfully!!!' })
  @HttpCode(HttpStatus.OK)
  @Post('new-token/:email')
  resendToken(@Param('email') email: string) {
    return this.authService.resendToken(
      email,
      TokenEnumType.EMAIL_VERIFICATION,
    );
  }

  @ApiResponseMetadata({ message: 'You have logged in!' })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: loginDto) {
    return this.authService.login(dto);
  }

  @ApiResponseMetadata({
    message: 'Password reset code sent. Please check your inbox',
  })
  @Post('forgot-password')
  async forgotPassword(@Body() dto: forgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @ApiResponseMetadata({
    message: 'You have successfully reset your Password !!',
  })
  @Patch('reset-password/:email')
  async resetPassword(
    @Param('email') email: string,
    @Body() dto: resetPasswordDto,
  ) {
    return this.authService.resetPassword(email, dto);
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
