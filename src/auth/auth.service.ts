import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon from 'argon2';
import { loginDto, resetPasswordDto, signUpDto } from './dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenService } from 'src/utils/token/token.service';
import { TokenEnumType } from 'src/utils/token/enum';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private tokenService: TokenService,
  ) {}

  async signUp({ email, password, ...rest }: signUpDto) {
    const hashPassword = await argon.hash(password);
    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashPassword,
          ...rest,
        },
      });

      const access_token = await this.signToken(user.id, user.email);
      delete user.password;

      return {
        access_token,
        data: {
          user,
        },
      };
    } catch (err) {
      throw new ForbiddenException(`Email already exists`);
    }
  }

  async login({ email, password }: loginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException(`Invalid credentials`);
    }

    const verifyPassword = await argon.verify(user.password, password);
    if (!verifyPassword) {
      throw new UnauthorizedException(`Invalid credentials`);
    }

    const access_token = await this.signToken(user.id, user.email);

    delete user.password;
    return {
      access_token,
      data: {
        user,
      },
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new UnauthorizedException(`Invalid credentials`);
    }

    const token = await this.tokenService.generateToken(
      TokenEnumType.PASSWORD_RESET,
      user.email,
      15 * 60 * 1000,
    );
    delete user.password;
    return { data: { token, user } };
  }

  async resetPassword(id: string, { token, newPassword }: resetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: { id },
    });

    if (!user) {
      throw new UnauthorizedException(`Invalid credentials`);
    }

    await this.tokenService.validateToken(
      TokenEnumType.PASSWORD_RESET,
      user.email,
      token,
    );

    const hashPassword = await argon.hash(newPassword);

    await this.prisma.user.update({
      where: { email: user.email },
      data: { password: hashPassword },
    });
  }

  private async signToken(userId: string, email: string): Promise<string> {
    const payLoad = { sub: userId, email };
    const secret = this.config.get('JWT_SECRET');
    const expiresIn = this.config.get('JWT_EXPIRES_IN');

    return await this.jwt.signAsync(payLoad, { secret, expiresIn });
  }
}
