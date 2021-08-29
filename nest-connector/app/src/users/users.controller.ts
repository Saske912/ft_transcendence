import { Controller, Get, Res, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { Response } from 'express';
import { AvatarGenerator } from 'random-avatar-generator';

@Controller('users')
export class UsersController {
  constructor(private UsersService: UsersService) {}

  @Get('create')
  createUser(@Query('login') login, @Query('password') pass) {
    if (login && pass) {
      this.UsersService.create(login, pass);
    } else {
      console.log('error: ' + login + ' ' + pass);
    }
  }
  @Get('getAll')
  getUsers(@Res() res: Response) {
    this.UsersService.findAll(res);
  }
  @Get('del')
  delUser(@Query('id') id) {
    this.UsersService.remove(id);
  }
  @Get('avatar')
  getAvatar(@Query('id') id): string {
    const generator = new AvatarGenerator();
    return generator.generateRandomAvatar(id);
  }
}
