import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { UrlService } from './url/url.service';
import { Request, Response } from 'express';
import { ApiTags } from '@nestjs/swagger';

@Controller()
export class AppController {
  constructor(private url: UrlService) {}

  @ApiTags('Base URL')
  @Get()
  getHello(): string {
    return 'Hello World!';
  }

  @ApiTags('Redirect URL')
  @Get('/:shortUrl')
  async redirectToLongUrl(
    @Param('shortUrl') shortUrl: string,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const longUrl = await this.url.redirectToLongUrl(shortUrl, request);

    if (longUrl) {
      response.redirect(301, longUrl);
    } else {
      response.status(404).send('URL not found');
    }
  }
}
