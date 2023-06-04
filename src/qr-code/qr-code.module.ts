import { Module } from '@nestjs/common';
import { QrCodeService } from './qr-code.service';

@Module({
  providers: [QrCodeService],
  exports: [QrCodeService],
})
export class QrCodeModule {}
