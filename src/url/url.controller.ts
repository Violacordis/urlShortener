import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UrlService } from './url.service';
import { editUrlDto, shortenLongUrlDto } from './dto';
import { ApiResponseMetadata, GetUser } from 'src/auth/decorators';
import { User } from '@prisma/client';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { QrCodeService } from 'src/qr-code/qr-code.service';

@ApiTags('URL')
@UseGuards(JwtGuard)
@UseGuards(ThrottlerGuard)
@ApiBearerAuth()
@Controller('url')
export class UrlController {
  constructor(private url: UrlService, private qrCode: QrCodeService) {}

  @Get('all')
  async fetchUserUrls(@GetUser() user: User) {
    return await this.url.fetchUserUrls(user);
  }

  @Get('/:id')
  async getUrl(@Param('id') id: string) {
    return await this.url.getUrl(id);
  }

  @Post('shorten')
  async shortenLongUrl(@Body() dto: shortenLongUrlDto, @GetUser() user: User) {
    return this.url.shortenLongUrl(user, dto);
  }

  @Post('/:id/qrcode')
  async generateQrCode(@Param('id') id: string) {
    return await this.qrCode.generateQrCode(id);
  }

  @ApiResponseMetadata({ message: 'Url is updated successfully !!!' })
  @Patch('/:id')
  async editUrl(@Param('id') id: string, @Body() dto: editUrlDto) {
    return await this.url.editUrl(id, dto);
  }

  @ApiResponseMetadata({ message: 'Url is deleted successfully !!!' })
  @Delete('/:id')
  async deleteUrl(@Param('id') id: string) {
    return await this.url.deleteUrl(id);
  }

  @ApiResponseMetadata({
    message: ' The QR Code of this URL is deleted successfully !!!',
  })
  @Delete('/:id/qrcode')
  async deleteQrCode(@Param('id') id: string) {
    return await this.qrCode.deleteQrCode(id);
  }
}
