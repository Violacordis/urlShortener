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
import { JwtGuard } from 'src/auth/guard';
import { ApiResponseMetadata, GetUser } from 'src/auth/decorators';
import { User } from '@prisma/client';
import { UpdateUserDto } from './dto/updateUser.dto';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { ThrottlerGuard } from '@nestjs/throttler';

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

  @ApiResponseMetadata({
    message: 'Your account has been deleted successfully',
  })
  @Delete('/:id')
  @UseGuards(JwtGuard)
  async deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.deleteUser(id);
  }
}
