import { Body, Controller, Post, UseGuards, Req, Get, Patch, Param, Query } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { RegisterTokenDto } from "./dto/register-token.dto";
import { JwtAuthGuard } from "src/auth/jwt/jwt.guard";

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    @UseGuards(JwtAuthGuard)
    @Post('register-token')
    async registerToken(@Body() registerTokenDto: RegisterTokenDto, @Req() req: any) {
        return this.notificationsService.registerToken(req.user.userId, registerTokenDto);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    findAll(@Req() req: any) {
        return this.notificationsService.findByUser(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id/read')
    async markAsRead(@Param('id') id: string, @Req() req: any) {
        return this.notificationsService.markAsRead(id, req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Post('mark-all-read')
    async markAllRead(@Req() req: any) {
        return this.notificationsService.markAllAsRead(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('unread-count')
    async getUnreadCount(@Req() req: any) {
        return this.notificationsService.getUnreadCount(req.user.userId);
    }
}