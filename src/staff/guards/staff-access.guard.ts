import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StaffAssignment } from '../entities/staff-assignment.entity';

@Injectable()
export class StaffAccessGuard implements CanActivate {
  constructor(
    @InjectRepository(StaffAssignment)
    private readonly staffRepository: Repository<StaffAssignment>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const locationId = request.params.locationId || request.body?.locationId;

    if (user.roles?.includes('owner') || user.roles?.includes('admin')) return true;

    if (!user.roles?.includes('staff')) {
      throw new ForbiddenException('Access denied');
    }

    if (!locationId) {
      throw new ForbiddenException('Location ID required');
    }

    const assignment = await this.staffRepository.findOne({
      where: {
        staff: { id: user.userId },
        location: { id: locationId },
      },
    });

    if (!assignment) {
      throw new ForbiddenException('You are not assigned to this location');
    }

    request.staffPermissions = assignment.permissions;
    return true;
  }
}
