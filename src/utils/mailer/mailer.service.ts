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
}
