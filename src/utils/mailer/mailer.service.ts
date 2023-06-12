import { Injectable } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';
import { User } from '@prisma/client';

@Injectable()
export class MailerService {
  constructor(private mailer: NestMailerService) {}

  async sendEmailConfirmationMail({ email, userName }: User, token: string) {
    await this.mailer.sendMail({
      to: email,
      subject: 'Confirm your Email Address',
      template: 'confirmEmail',
      context: { userName, token },
    });
    return {
      message:
        'Email Confirmation sent !!!. Please check your inbox to confirm your email address',
    };
  }
  async emailConfirmedMail({ email, userName }: User) {
    await this.mailer.sendMail({
      to: email,
      subject: 'Congratulations! Your Email Address is Confirmed',
      template: 'emailConfirmed',
      context: { userName },
    });
    return {
      message: 'Email Confirmed successfully !!!',
    };
  }

  async sendPasswordResetEmail({ email, userName }: User, token: string) {
    await this.mailer.sendMail({
      to: email,
      subject: 'Reset your Password',
      template: 'passwordReset',
      context: { userName, token },
    });

    return {
      message: 'Password reset code sent. Please check your inbox',
    };
  }

  async sendPasswordResetSuccessMail({ email, userName }: User) {
    await this.mailer.sendMail({
      to: email,
      subject: 'Password Reset is Successful',
      template: 'passwordResetSuccess',
      context: { userName },
    });

    return {
      message: 'Your Password reset is successful',
    };
  }
}
