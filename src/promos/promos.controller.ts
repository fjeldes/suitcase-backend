import { Controller, Post, Get, Param, Body, UseGuards, Req } from '@nestjs/common';
import { PromosService } from './promos.service';
import { ValidatePromoDto } from './dto/validate-promo.dto';
import { CreatePromoDto } from './dto/create-promo.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guards';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('promos')
export class PromosController {
  constructor(private readonly promosService: PromosService) {}

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  async validate(@Body() dto: ValidatePromoDto, @Req() req: any) {
    return this.promosService.validate(dto, req.user?.userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async create(@Body() dto: CreatePromoDto) {
    return this.promosService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async findAll() {
    return this.promosService.findAll();
  }

  @Post(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async deactivate(@Param('id') id: string) {
    return this.promosService.deactivate(id);
  }
}
