import { CacheInterceptor } from '@nestjs/cache-manager';
import {
  Body,
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UrlService } from './url.service';
import { shortenLongUrlDto } from './dto';
import { GetUser } from 'src/auth/decorators';
import { User } from '@prisma/client';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { PrismaService } from 'src/prisma/prisma.service';

@ApiTags('URL')
@ApiBearerAuth()
@UseInterceptors(CacheInterceptor)
@Controller('url')
export class UrlController {
  constructor(private url: UrlService, private prisma: PrismaService) {}

  @UseGuards(JwtGuard)
  @Post('shorten')
  async shortenLongUrl(@Body() dto: shortenLongUrlDto, @GetUser() user: User) {
    return this.url.shortenLongUrl(user, dto);
  }
}
