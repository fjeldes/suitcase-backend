// backend/src/notifications/notifications.controller.ts
import { Body, Controller, Post, UseGuards, Req } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { RegisterTokenDto } from "./dto/register-token.dto"; import { JwtAuthGuard } from "src/auth/jwt/jwt.guard";

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @UseGuards(JwtAuthGuard) 
    @Post('register-token')
    async registerToken(
        @Body() registerTokenDto: RegisterTokenDto,
        @Req() req: any // El usuario viene inyectado por el Guard
    ) {

        const userId = req.user.userId;
        return this.notificationsService.registerToken(userId, registerTokenDto);
    }
}