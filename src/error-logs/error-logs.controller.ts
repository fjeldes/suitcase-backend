import { Controller, Get, Post, Query, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { RolesGuard } from 'src/auth/guards/roles.guards';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { ErrorLogsService } from './error-logs.service';
import { ErrorLogSource } from './entities/error-log.entity';

const MAX_BODY = 5000;

@Controller('error-logs')
export class ErrorLogsController {
  constructor(private readonly service: ErrorLogsService) {}

  @Post()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  create(@Body() body: { source?: string; level?: string; message: string; stack?: string; userAgent?: string; context?: any }) {
    if (!body.message || typeof body.message !== 'string') {
      throw new BadRequestException('message is required');
    }
    const sanitize = (s: string | undefined) => s ? s.replace(/<[^>]*>/g, '').slice(0, MAX_BODY) : undefined;
    return this.service.create({
      source: body.source === 'backend' ? ErrorLogSource.BACKEND : ErrorLogSource.FRONTEND,
      level: body.level === 'fatal' || body.level === 'warn' ? body.level : 'error',
      message: sanitize(body.message)!.slice(0, 1000),
      stack: sanitize(body.stack)?.slice(0, MAX_BODY),
      userAgent: sanitize(body.userAgent)?.slice(0, 500),
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
