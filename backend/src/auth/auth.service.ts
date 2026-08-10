import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../database/entities/user.entity';

@Injectable()
export class AuthService {
  private resetTokens = new Map<string, { userId: string; code: string; expiresAt: number }>();

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findByUsername(username);
    if (user && (await bcrypt.compare(pass, user.passwordHash))) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: User) {
    const payload = { username: user.username, sub: user.id, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
      user,
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);
      if (!user) throw new UnauthorizedException();
      return this.login(user);
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout() {
    return { success: true, message: 'Logged out successfully' };
  }

  async forgotPassword(identity: string): Promise<{ success: boolean; message: string; devResetCode?: string }> {
    const user = await this.usersService.findByEmailOrUsername(identity);
    if (!user) {
      throw new NotFoundException('No user account found matching username or email address.');
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    this.resetTokens.set(user.id, { userId: user.id, code: resetCode, expiresAt });

    const emailTo = user.email || 'user@hoorain.app';
    const emailResult = await this.mailService.sendPasswordResetEmail(emailTo, resetCode);

    return {
      success: true,
      message: emailResult.success
        ? `Password reset code sent to ${emailTo}.`
        : `Generated reset code for ${user.username}. Use code below to set new password.`,
      devResetCode: resetCode,
    };
  }

  async resetPassword(identity: string, code: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const user = await this.usersService.findByEmailOrUsername(identity);
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const tokenData = this.resetTokens.get(user.id);
    if (!tokenData) {
      throw new BadRequestException('No password reset requested or session expired.');
    }

    if (Date.now() > tokenData.expiresAt) {
      this.resetTokens.delete(user.id);
      throw new BadRequestException('Password reset code has expired. Please request a new code.');
    }

    if (tokenData.code !== code.trim()) {
      throw new BadRequestException('Invalid reset code provided.');
    }

    await this.usersService.updatePasswordHash(user.id, newPassword);
    this.resetTokens.delete(user.id);

    return {
      success: true,
      message: 'Password reset successfully. You can now login with your new password.',
    };
  }
}
