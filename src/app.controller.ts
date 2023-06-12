import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { UrlService } from './url/url.service';
import { Request, Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private url: UrlService, private prisma: PrismaService) {}

  @ApiTags('Home page')
  @Get()
  getHello(): string {
    return 'Hello World! Welcome to my Shortify Web app';
  }

  @ApiTags('Redirect URL')
  @Get('/:shortUrl')
  async redirectToLongUrl(
    @Param('shortUrl') shortUrl: string,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const url = await this.prisma.url.findFirst({
      where: { shortUrl, isActive: true },
    });

    if (url.customDomain) {
      const domain = url.customDomain;
      const originalUrl = decodeURIComponent(request.originalUrl);
      const path = originalUrl.replace(`/${domain}/`, '');
      const customDomainUrl = `${domain}/${path}`;

      const longUrl = await this.url.redirectToLongUrl(
        customDomainUrl,
        request,
      );

      if (longUrl) {
        response.redirect(301, longUrl);
      } else {
        response.status(404).send('URL not found');
      }
    } else {
      const longUrl = await this.url.redirectToLongUrl(shortUrl, request);

      if (longUrl) {
        response.redirect(301, longUrl);
      } else {
        response.status(404).send('URL not found');
      }
    }
  }
}
