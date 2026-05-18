import { Controller, Post, Get, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt/jwt.guard';
import { StaffService } from './staff.service';

@Controller('staff')
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post('invite')
  @UseGuards(JwtAuthGuard)
  async invite(@Req() req: any, @Body() body: { locationId: string; name: string; email: string }) {
    return this.staffService.invite(req.user.userId, body.locationId, body.name, body.email);
  }

  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @Get('accept')
  async acceptInvitation(@Query('token') token: string, @Query('userId') userId?: string) {
    return this.staffService.acceptInvitation(token, userId);
  }

  @Get('location/:locationId')
  @UseGuards(JwtAuthGuard)
  async getByLocation(@Param('locationId') locationId: string) {
    return this.staffService.getStaffByLocation(locationId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async removeStaff(@Req() req: any, @Param('id') id: string) {
    return this.staffService.removeStaff(req.user.userId, id);
  }

  @Get('my-locations')
  @UseGuards(JwtAuthGuard)
  async getMyLocations(@Req() req: any) {
    if (!req.user.roles.includes('staff')) return [];
    return this.staffService.getAssignedLocations(req.user.userId);
  }
}
