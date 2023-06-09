import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as pactum from 'pactum';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { loginDto, signUpDto } from '../src/auth/dto';
import { UpdateUserDto } from '../src/user/dto/updateUser.dto';
import { shortenLongUrlDto } from '../src/url/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

    await app.init();
    await app.listen(3300);

    prisma = app.get(PrismaService);
    await prisma.cleanDb();
    pactum.request.setBaseUrl('http://localhost:3300');
  });
  afterAll(() => {
    app.close();
  });

  describe('Auth', () => {
    const dto: signUpDto = {
      email: 'ada@getnada.com',
      password: 'Password1@',
      userName: 'Ada',
    };

    const loginDto: loginDto = {
      email: 'ada@getnada.com',
      password: 'Password1@',
    };

    describe('signup', () => {
      it('should signup', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201);
      });

      it('should throw an error if email is empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ password: dto.password, userName: dto.userName })
          .expectStatus(400);
      });
      it('should throw an error if password is empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ email: dto.email, userName: dto.userName })
          .expectStatus(400);
      });
      it('should throw an error if userName is empty', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ email: dto.email, password: dto.password })
          .expectStatus(400);
      });
      it('should throw an error if all entries are empty', () => {
        return pactum.spec().post('/auth/signup').expectStatus(400);
      });
    });

    describe('login', () => {
      it('should login', () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody(loginDto)
          .expectStatus(200)
          .stores('userAt', 'access_token');
      });
      it('should throw an error if email is empty', () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody({ password: loginDto.password })
          .expectStatus(400);
      });
      it('should throw an error if password is empty', () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody({ email: loginDto.email })
          .expectStatus(400);
      });
      it('should throw an error if both entries are empty', () => {
        return pactum.spec().post('/auth/login').expectStatus(400);
      });
      it('should throw an error if email is invalid', () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody({ email: 'invalid', password: loginDto.password })
          .expectStatus(400);
      });
      it('should throw an error if password is invalid', () => {
        return pactum
          .spec()
          .post('/auth/login')
          .withBody({ email: loginDto.password, password: '23456765' })
          .expectStatus(400);
      });
    });
  });
});
