import { Controller, Get, Post, Param, Patch, Query, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guards';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ClaimsService } from './claims.service';
import { ClaimStatus } from './entities/claim.entity';
import { CreateClaimDto } from './dto/create-claim.dto';

@Controller('claims')
export class ClaimsController {
  constructor(private readonly service: ClaimsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateClaimDto, @Req() req: any) {
    return this.service.create(dto, req.user.userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.findAll(Number(page) || 1, Number(limit) || 20);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getStats() {
    return this.service.getStats();
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  findMy(@Req() req: any) {
    return this.service.findByUser(req.user.userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateStatus(@Param('id') id: string, @Body() body: { status: ClaimStatus; resolution?: string }) {
    return this.service.updateStatus(id, body.status, body.resolution);
  }
}
