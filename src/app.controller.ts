import { Controller, Get, Param, Res } from '@nestjs/common';
import { UrlService } from './url/url.service';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private url: UrlService) {}

  @Get()
  getHello(): string {
    return 'Hello World!';
  }

  @Get('/:shortUrl')
  async redirectToLongUrl(
    @Param('shortUrl') shortUrl: string,
    @Res() response: Response,
  ) {
    const longUrl = await this.url.redirectToLongUrl(shortUrl);

    if (longUrl) {
      response.redirect(301, longUrl);
    } else {
      response.status(404).send('URL not found');
    }
  }
}
