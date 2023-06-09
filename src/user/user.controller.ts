import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { UpdateUserDto } from './dto/updateUser.dto';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtGuard } from '../auth/guard';
import { ApiResponseMetadata, GetUser } from '../auth/decorators';

@ApiTags('Users')
@ApiBearerAuth()
@UseInterceptors(CacheInterceptor)
@UseGuards(ThrottlerGuard)
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('/me')
  @UseGuards(JwtGuard)
  async findUser(@GetUser() user: User) {
    return this.userService.findUser(user);
  }

  @Patch('/:id')
  @UseGuards(JwtGuard)
  async updateUser(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body() updateDto: UpdateUserDto,
  ) {
    return this.userService.updateUser(user, id, updateDto);
  }
}
