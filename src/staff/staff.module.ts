import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StaffAssignment } from './entities/staff-assignment.entity';
import { StaffInvitation } from './entities/staff-invitation.entity';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/entities/role.entity';
import { UserRole } from '../users/entities/user-role.entity';
import { Location } from '../locations/entities/location.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StaffAssignment, StaffInvitation, User, Role, UserRole, Location]),
    MailModule,
  ],
  controllers: [StaffController],
  providers: [StaffService],
  exports: [StaffService],
})
export class StaffModule {}
