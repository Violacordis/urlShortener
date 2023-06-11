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
import { Url, User } from '@prisma/client';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtGuard } from '../auth/guard';
import { QrCodeService } from '../qr-code/qr-code.service';
import { ApiResponseMetadata, GetUser } from '../auth/decorators';

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

  @Post('create-shortUrl')
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

  @ApiResponseMetadata({ message: 'Url is activated successfully !!!' })
  @Patch('/:id/activate')
  async activateUrl(@Param('id') id: string) {
    return await this.url.activateUrl(id);
  }

  @ApiResponseMetadata({ message: 'Url is deactivated successfully !!!' })
  @Patch('/:id/deactivate')
  async deactivateUrl(@Param('id') id: string) {
    return await this.url.deactivateUrl(id);
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
