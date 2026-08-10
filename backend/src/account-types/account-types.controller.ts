import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AccountTypesService } from './account-types.service';
import { CreateAccountTypeDto } from './dto/create-account-type.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('account-types')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/account-types')
export class AccountTypesController {
  constructor(private readonly typesService: AccountTypesService) {}

  @Get()
  @ApiOperation({ summary: 'List all account types' })
  findAll(@Req() req: any) {
    return this.typesService.findAll(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create custom account type' })
  create(@Body() dto: CreateAccountTypeDto, @Req() req: any) {
    return this.typesService.create(req.user.id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update custom account type' })
  update(@Param('id') id: string, @Body() dto: Partial<CreateAccountTypeDto>, @Req() req: any) {
    return this.typesService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete custom account type' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.typesService.remove(id, req.user.id);
  }
}
