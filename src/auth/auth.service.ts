import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon from 'argon2';
import { loginDto, signUpDto } from './dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
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

      const token = await this.signToken(user.id, user.email);
      delete user.password;

      return {
        token,
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

    const token = await this.signToken(user.id, user.email);

    delete user.password;
    return {
      token,
      data: {
        user,
      },
    };
  }

  async signToken(userId: string, email: string): Promise<string> {
    const payLoad = { sub: userId, email };
    const secret = this.config.get('JWT_SECRET');
    const expiresIn = this.config.get('JWT_EXPIRES_IN');

    return await this.jwt.signAsync(payLoad, { secret, expiresIn });
  }
}
