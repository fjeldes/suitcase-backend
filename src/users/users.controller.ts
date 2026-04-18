import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common'
import { UsersService } from './users.service'
import { CreateUserDto } from './dto/create-user.dto'
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard'
import { RolesGuard } from 'src/auth/guards/roles.guards'
import { Roles } from 'src/auth/decorators/roles.decorator'

// @UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto)
    }

    @Roles('admin')
    @Get()
    findAll() {
        return this.usersService.findAll()
    }
}