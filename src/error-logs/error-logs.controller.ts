import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guards';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ErrorLogsService } from './error-logs.service';
import { ErrorLogSource } from './entities/error-log.entity';

@Controller('error-logs')
export class ErrorLogsController {
  constructor(private readonly service: ErrorLogsService) {}

  @Post()
  create(@Body() body: { source?: string; level?: string; message: string; stack?: string; userAgent?: string; context?: any }) {
    return this.service.create({
      source: body.source === 'backend' ? ErrorLogSource.BACKEND : ErrorLogSource.FRONTEND,
      level: body.level || 'error',
      message: body.message,
      stack: body.stack,
      userAgent: body.userAgent,
      context: body.context,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('level') level?: string,
    @Query('source') source?: string,
    @Query('days') days?: string,
  ) {
    return this.service.findAll(Number(page) || 1, Number(limit) || 30, {
      level, source, days: days ? Number(days) : undefined,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('stats')
  getStats() {
    return this.service.getStats();
  }
}
