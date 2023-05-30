import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Param,
  ParseUUIDPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon from 'argon2';
import {
  changePasswordDto,
  forgotPasswordDto,
  loginDto,
  resetPasswordDto,
  signUpDto,
  verifyEmailDto,
} from './dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenService } from 'src/utils/token/token.service';
import { TokenEnumType } from 'src/utils/token/enum';
import { User } from '@prisma/client';
import { MailerService } from 'src/utils/mailer/mailer.service';
import { GetUser } from './decorators';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private tokenService: TokenService,
    private mailer: MailerService,
  ) {}

  async signUp({ email, password, userName }: signUpDto) {
    const hashPassword = await argon.hash(password);
    try {
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashPassword,
          userName,
        },
      });

      delete user.password;

      const token = await this.tokenService.generateToken(
        TokenEnumType.EMAIL_VERIFICATION,
        user.email,
        15 * 60 * 1000,
      );

      await this.mailer.sendEmailConfirmationMail(user, token);

      return user;
    } catch (err) {
      console.log(err.message);
      if (err.code === 'P2002') {
        throw new ForbiddenException('Email address already exists');
      }

      throw err;
    }
  }

  async verifyEmail(
    @Param('id', ParseUUIDPipe) id: string,
    { token }: verifyEmailDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new BadRequestException(
        `Invalid credentials !!. We are unable to verify your email address`,
      );
    }

    const verifyToken = await this.tokenService.validateToken(
      TokenEnumType.EMAIL_VERIFICATION,
      user.email,
      token,
    );

    if (!verifyToken) {
      throw new BadRequestException(
        `Invalid credentials !!. We are unable to verify your email address yet`,
      );
    }

    await this.prisma.user.update({
      where: { id },
      data: { isVerified: true },
    });
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

  async forgotPassword({ email }: forgotPasswordDto) {
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

  async changePassword(
    { email }: User,
    { currentPassword, newPassword }: changePasswordDto,
  ) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException(`Invalid credentials`);
    }

    const isPasswordAMatch = await argon.verify(user.password, currentPassword);

    if (!isPasswordAMatch) {
      throw new ForbiddenException(`Incorrect Password`);
    }
    const hashPassword = await argon.hash(newPassword);

    await this.prisma.user.update({
      where: { email: user.email },
      data: { password: hashPassword },
    });

    delete user.password;
  }

  private async signToken(userId: string, email: string): Promise<string> {
    const payLoad = { sub: userId, email };
    const secret = this.config.get('JWT_SECRET');
    const expiresIn = this.config.get('JWT_EXPIRES_IN');

    return await this.jwt.signAsync(payLoad, { secret, expiresIn });
  }
}
