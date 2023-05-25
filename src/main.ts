import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RequestInterceptor } from './utils/interceptors/req.interceptor';
import { ResponseInterceptor } from './utils/interceptors/res.interceptor';
import { INestApplication, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  app.useGlobalInterceptors(
    new RequestInterceptor(),
    new ResponseInterceptor(),
  );

  const config = new DocumentBuilder()
    .setTitle('Url Shortener')
    .setDescription('Url Shortener API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Url Shortener, AltschoolAfrica Capstone Project')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  const configService = app.get<ConfigService>(ConfigService);

  await app.listen(configService.get('PORT') || 3000);
}
bootstrap();
