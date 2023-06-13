import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Param,
  ParseUUIDPipe,
  UnauthorizedException,
} from '@nestjs/common';
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
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from '../utils/token/token.service';
import { TokenEnumType } from '../utils/token/enum';
import { MailerService } from '../utils/mailer/mailer.service';
import { User } from '@prisma/client';

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
        5 * 60 * 1000,
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

    if (user.isVerified) {
      return { message: 'This Email is already verified' };
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

    await this.mailer.emailConfirmedMail(user);
  }

  async resendToken(id: string, TokenEnumType) {
    const user = await this.prisma.user.findFirst({
      where: { id, isVerified: false },
    });

    if (!user || user.isVerified) {
      throw new BadRequestException(
        `It's either this email is already verified or invalid`,
      );
    }

    const token = await this.tokenService.generateToken(
      TokenEnumType,
      user.email,
      5 * 60 * 1000,
    );

    await this.mailer.sendEmailConfirmationMail(user, token);
  }

  async login({ email, password }: loginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException(
        `User with email ${email} does not exist`,
      );
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
      5 * 60 * 1000,
    );
    delete user.password;

    await this.mailer.sendPasswordResetEmail(user, token);
    return user;
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

    await this.mailer.sendPasswordResetSuccessMail(user);
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
