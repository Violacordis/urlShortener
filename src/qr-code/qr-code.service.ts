import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { toBuffer } from 'qrcode';
import * as sharp from 'sharp';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class QrCodeService {
  constructor(private prisma: PrismaService, private config: ConfigService) {}

  async generateQrCode(urlId: string): Promise<Buffer> {
    try {
      const url = await this.prisma.url.findFirst({ where: { id: urlId } });

      if (!url) throw new NotFoundException(`URL not found`);

      const baseUrl = this.config.get('BASE_URL');
      const qrCodeUrl = `${baseUrl}/${url.shortUrl}`;

      const qrCodeOptions = {
        errorCorrectionLevel: 'H',
        type: 'png',
        width: 300,
        margin: 2,
      };

      const qrCodeBuffer = await toBuffer(qrCodeUrl, qrCodeOptions);

      const qrCodeImage = await sharp(qrCodeBuffer)
        .resize(200, 200)
        .png()
        .toBuffer();

      await this.prisma.qrCode.create({
        data: {
          url: { connect: { id: urlId } },
          image: qrCodeImage,
        },
      });

      return qrCodeImage;
    } catch (err) {
      throw new Error(err.message);
    }
  }

  async fetchQrCode(id: string) {
    try {
      const qrcode = await this.prisma.qrCode.findFirst({ where: { id } });

      if (!qrcode) throw new NotFoundException(`QR Code not found`);

      return qrcode.image;
    } catch (err) {
      throw new Error(err.message);
    }
  }

  async deleteQrCode(id: string) {
    try {
      const qrcode = await this.prisma.qrCode.findFirst({
        where: { urlId: id },
      });

      if (!qrcode) throw new NotFoundException(`QR Code not found`);

      await this.prisma.qrCode.delete({ where: { urlId: id } });
    } catch (err) {
      throw new Error(err.message);
    }
  }
}
