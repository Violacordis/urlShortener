import { Body, Injectable, Param, ParseUUIDPipe, Req } from '@nestjs/common';
import { User } from '@prisma/client';
import { GetUser } from '../auth/decorators/getUser.decorator';
import { UpdateUserDto } from './dto/updateUser.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findUser(@GetUser() user: User) {
    return user;
  }

  async updateUser(
    @GetUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateUserDto,
  ) {
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: {
        ...updateDto,
        updatedBy: user.id,
      },
    });
    if (!updatedUser) {
      return {
        message: 'You are not authorized to update this user',
      };
    }
    delete updatedUser.password;
    return updatedUser;
  }
}
