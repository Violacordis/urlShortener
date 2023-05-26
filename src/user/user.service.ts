import { Body, Injectable, Param, ParseUUIDPipe } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { GetUser } from 'src/utils/decorators';
import { UpdateUserDto } from './dto/updateUser.dto';

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

  async deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    await this.prisma.user.delete({
      where: { id },
      include: { urls: true },
    });
  }
}
