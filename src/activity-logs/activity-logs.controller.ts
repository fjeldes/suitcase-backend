import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ActivityLogsService } from './activity-logs.service';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';

@Controller('activity-logs')
@UseGuards(JwtAuthGuard)
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) { }

  @Get('owner')
  async getRecentActivity(@Req() req: any, @Query('limit') limit?: number, @Query('locationId') locationId?: string) {
    const ownerId = req.user.userId;
    const items = limit ? Number(limit) : 10;
    return this.activityLogsService.getOwnerRecentActivity(ownerId, items, locationId);
  }
}
