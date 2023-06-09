import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { RequestInterceptor } from './auth/interceptors/req.interceptor';
import { ResponseInterceptor } from './auth/interceptors/res.interceptor';
import { ValidationPipe, VersioningType } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.enableCors({ origin: '*' });
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'api/v1',
  });

  app.useGlobalInterceptors(
    new RequestInterceptor(),
    new ResponseInterceptor(),
  );

  const config = new DocumentBuilder()
    .setTitle('Shortify')
    .setDescription('A Url Shortener Web App')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('My AltschoolAfrica Capstone Project')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger', app, document);

  const configService = app.get<ConfigService>(ConfigService);

  await app.listen(configService.get('PORT') || 3000);
}
bootstrap();
