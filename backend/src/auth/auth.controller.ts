import { Controller, Request, Post, UseGuards, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@ApiTags('auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req, @Body() loginDto: LoginDto) {
    return this.authService.login(req.user);
  }

  @Post('refresh')
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  async logout() {
    return this.authService.logout();
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { identity: string }) {
    return this.authService.forgotPassword(body.identity);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { identity: string; code: string; newPassword: string }) {
    return this.authService.resetPassword(body.identity, body.code, body.newPassword);
  }
}
