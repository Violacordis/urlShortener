import { Test } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import * as pactum from 'pactum';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { loginDto, signUpDto } from '../src/auth/dto';
import { UpdateUserDto } from '../src/user/dto/updateUser.dto';
import { editUrlDto, shortenLongUrlDto } from '../src/url/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    app.enableVersioning({
      type: VersioningType.URI,
      prefix: 'api/v1',
    });

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
          .post('/api/v1/auth/signup')
          .withBody(dto)
          .expectStatus(201)
          .inspect();
      });

      it('should throw an error if email is empty', () => {
        return pactum
          .spec()
          .post('/api/v1/auth/signup')
          .withBody({ password: dto.password, userName: dto.userName })
          .expectStatus(400);
      });
      it('should throw an error if password is empty', () => {
        return pactum
          .spec()
          .post('/api/v1/auth/signup')
          .withBody({ email: dto.email, userName: dto.userName })
          .expectStatus(400);
      });
      it('should throw an error if userName is empty', () => {
        return pactum
          .spec()
          .post('/api/v1/auth/signup')
          .withBody({ email: dto.email, password: dto.password })
          .expectStatus(400);
      });
      it('should throw an error if all entries are empty', () => {
        return pactum.spec().post('/api/v1/auth/signup').expectStatus(400);
      });
    });

    describe('login', () => {
      it('should login', () => {
        return pactum
          .spec()
          .post('/api/v1/auth/login')
          .withBody(loginDto)
          .expectStatus(200)
          .stores('userAt', 'access_token')
          .inspect();
      });
      it('should throw an error if email is empty', () => {
        return pactum
          .spec()
          .post('/api/v1/auth/login')
          .withBody({ password: loginDto.password })
          .expectStatus(400);
      });
      it('should throw an error if password is empty', () => {
        return pactum
          .spec()
          .post('/api/v1/auth/login')
          .withBody({ email: loginDto.email })
          .expectStatus(400);
      });
      it('should throw an error if both entries are empty', () => {
        return pactum.spec().post('/api/v1/auth/login').expectStatus(400);
      });
      it('should throw an error if email is invalid', () => {
        return pactum
          .spec()
          .post('/api/v1/auth/login')
          .withBody({ email: 'invalid', password: loginDto.password })
          .expectStatus(400);
      });
      it('should throw an error if password is invalid', () => {
        return pactum
          .spec()
          .post('/api/v1/auth/login')
          .withBody({ email: loginDto.password, password: '23456765' })
          .expectStatus(400);
      });
    });
  });

  // User
  describe('User', () => {
    describe('Get me', () => {
      it('should not fetch user when unauthorized', () => {
        return pactum.spec().get('/api/v1/users/me').expectStatus(401);
      });
    });
    it('should get current user', () => {
      return pactum
        .spec()
        .get('/api/v1/users/me')
        .withHeaders({ Authorization: `Bearer $S{userAt}` })
        .stores('userId', 'id')
        .expectStatus(200);
    });

    describe('Edit user', () => {
      it('should edit user details', () => {
        const dto: UpdateUserDto = {
          userName: 'Adaobi',
        };
        return pactum
          .spec()
          .patch('/api/v1/users/{id}')
          .withHeaders({ Authorization: `Bearer $S{userAt}` })
          .withPathParams('id', '$S{userId}')
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.userName);
      });
    });
  });

  // Url
  describe('Url', () => {
    describe('get empty url', () => {
      it('should have an empty url', () => {
        return pactum
          .spec()
          .get('/api/v1/url/all')
          .withHeaders({ Authorization: `Bearer $S{userAt}` })
          .expectStatus(200)
          .expectBody([]);
      });
    });

    describe('Shorten url', () => {
      const dto: shortenLongUrlDto = {
        longUrl: 'https://dev.octocare.co/billings/company-accounts',
        title: 'octocare',
      };
      it('should create shortUrl (shortened longUrl)', () => {
        return pactum
          .spec()
          .post('/api/v1/url/create-shortUrl')
          .withHeaders({ Authorization: `Bearer $S{userAt}` })
          .withBody(dto)
          .expectStatus(201)
          .stores('urlId', 'id')
          .stores('shUrl', 'shortUrl')
          .stores('lngUrl', 'longUrl')
          .inspect();
      });
    });

    describe('Get urls by id', () => {
      it('should get a url by the id', () => {
        return pactum
          .spec()
          .get('/api/v1/url/{id}')
          .withHeaders({ Authorization: `Bearer $S{userAt}` })
          .withPathParams('id', `$S{urlId}`)
          .expectStatus(200);
      });
    });

    describe('URL redirect', () => {
      it('should redirect short url to longUrl', () => {
        return pactum
          .spec()
          .get('/api/v1/{shortUrl}')
          .withHeaders({ Authorization: `Bearer $S{userAt}` })
          .withPathParams('shortUrl', `$S{shUrl}`)
          .withFollowRedirects(true)
          .expectStatus(200)
          .inspect();
      });
    });

    describe('qrcode', () => {
      it('should generate qrcode for shortUrl', () => {
        return pactum
          .spec()
          .post('/api/v1/url/{id}/qrcode')
          .withHeaders({ Authorization: `Bearer $S{userAt}` })
          .withPathParams('id', `$S{urlId}`)
          .expectStatus(201);
      });
    });

    describe('Edit url', () => {
      const dto: editUrlDto = {
        longUrl: 'https://twitter.com/home',
        title: 'Twitter',
      };
      it('should edit and update url ', () => {
        return pactum
          .spec()
          .patch('/api/v1/url/{id}')
          .withHeaders({ Authorization: `Bearer $S{userAt}` })
          .withPathParams('id', `$S{urlId}`)
          .withBody(dto)
          .expectStatus(200)
          .inspect();
      });
    });

    describe('Get urls', () => {
      it('should get all loggedIn user urls', () => {
        return pactum
          .spec()
          .get('/api/v1/url/all')
          .withHeaders({ Authorization: `Bearer $S{userAt}` })
          .expectStatus(200)
          .expectJsonLength(1)
          .inspect();
      });
    });

    describe('Delete qrcode', () => {
      it('should delete a url qrcode', () => {
        return pactum
          .spec()
          .delete('/api/v1/url/{id}/qrcode')
          .withHeaders({ Authorization: `Bearer $S{userAt}` })
          .withPathParams('id', '$S{urlId}')
          .expectStatus(200);
      });
    });
    describe('Delete url', () => {
      it('should delete url', () => {
        return pactum
          .spec()
          .delete('/api/v1/url/{id}')
          .withHeaders({ Authorization: `Bearer $S{userAt}` })
          .withPathParams('id', `$S{urlId}`)
          .expectStatus(200);
      });
    });
  });
});
