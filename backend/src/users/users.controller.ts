import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserRole } from '../database/entities/user.entity';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async findAll(@Req() req: any) {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can list users');
    }
    return this.usersService.findAll();
  }

  @Get('me')
  async me(@Req() req: any) {
    return this.usersService.findById(req.user.id);
  }

  @Patch('me')
  async updateMe(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          // @ts-ignore
          cb(null, `${req.user.id}-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async uploadAvatar(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const url = `/api/uploads/${file.filename}`;
    await this.usersService.updateAvatar(req.user.id, url);
    return { avatarUrl: url };
  }

  @Post('me/change-password')
  async changePassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.id, dto);
  }

  @Post()
  async create(@Req() req: any, @Body() dto: CreateUserDto) {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can create users');
    }
    return this.usersService.create(dto);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    if (req.user.role !== UserRole.ADMIN && req.user.id !== id) {
      throw new ForbiddenException();
    }
    return this.usersService.findById(id);
  }
}
