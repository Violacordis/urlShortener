import { CacheInterceptor } from '@nestjs/cache-manager';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UrlService } from './url.service';
import { editUrlDto, shortenLongUrlDto } from './dto';
import { ApiResponseMetadata, GetUser } from 'src/auth/decorators';
import { User } from '@prisma/client';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { PrismaService } from 'src/prisma/prisma.service';

@ApiTags('URL')
@UseGuards(JwtGuard)
@ApiBearerAuth()
@Controller('url')
export class UrlController {
  constructor(private url: UrlService, private prisma: PrismaService) {}

  @Post('shorten')
  async shortenLongUrl(@Body() dto: shortenLongUrlDto, @GetUser() user: User) {
    return this.url.shortenLongUrl(user, dto);
  }

  @Get('all')
  async fetchUserUrls(@GetUser() user: User) {
    return await this.url.fetchUserUrls(user);
  }

  @ApiResponseMetadata({ message: 'Url is updated successfully !!!' })
  @Patch('/:id')
  async editUrl(@Param('id') id: string, @Body() dto: editUrlDto) {
    return await this.url.editUrl(id, dto);
  }
}
