import { Controller, Get, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from './firebase-auth.guard';
import { CurrentUser } from './current-user.decorator';
import type { User } from '@prisma/client';

@Controller('auth')
export class AuthController {
  @Get('me')
  @UseGuards(FirebaseAuthGuard)
  getMe(@CurrentUser() user: User) {
    return user;
  }
}
