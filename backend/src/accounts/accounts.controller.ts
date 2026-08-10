import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @ApiOperation({ summary: 'List all accounts for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Accounts including current balances' })
  findAll(@Req() req: any) {
    return this.accountsService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single account by id' })
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.accountsService.findOne(id, req.user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new account' })
  create(@Body() dto: CreateAccountDto, @Req() req: any) {
    return this.accountsService.create(req.user.id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing account' })
  update(@Param('id') id: string, @Body() dto: UpdateAccountDto, @Req() req: any) {
    return this.accountsService.update(id, req.user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete (deactivate) an account' })
  remove(@Param('id') id: string, @Req() req: any) {
    return this.accountsService.remove(id, req.user.id);
  }
}
