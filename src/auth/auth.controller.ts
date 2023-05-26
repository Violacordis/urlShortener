import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { loginDto, signUpDto } from './dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() dto: signUpDto) {
    return this.authService.signUp(dto);
  }

  @Post('login')
  async login(@Body() dto: loginDto) {
    return this.authService.login(dto);
  }
}
