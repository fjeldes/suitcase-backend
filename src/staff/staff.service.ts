import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { StaffAssignment } from './entities/staff-assignment.entity';
import { StaffInvitation } from './entities/staff-invitation.entity';
import { User } from '../users/entities/user.entity';
import { Role } from '../users/entities/role.entity';
import { UserRole } from '../users/entities/user-role.entity';
import { Location } from '../locations/entities/location.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(StaffAssignment)
    private readonly staffRepository: Repository<StaffAssignment>,
    @InjectRepository(StaffInvitation)
    private readonly invitationRepository: Repository<StaffInvitation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
    private readonly mailService: MailService,
  ) {}

  async invite(ownerId: string, locationId: string, name: string, email: string) {
    const location = await this.locationRepository.findOne({
      where: { id: locationId as any },
      relations: ['owners', 'owners.user'],
    });
    if (!location) throw new NotFoundException('Location not found');

    const isOwner = location.owners?.some((o: any) => o.user?.id === ownerId);
    if (!isOwner) throw new ForbiddenException('Only location owners can invite staff');

    const existing = await this.invitationRepository.findOne({
      where: { email, location: { id: locationId as any }, status: 'pending' },
    });
    if (existing) throw new BadRequestException('An invitation is already pending for this email');

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const invitation = await this.invitationRepository.save({
      email,
      name,
      token,
      expiresAt,
      location: { id: locationId } as any,
      invitedBy: { id: ownerId } as any,
    });

    const inviter = await this.userRepository.findOne({ where: { id: ownerId as any }, relations: ['profile'] });
    const inviterName = inviter?.profile?.firstName || 'A store owner';

    const link = `luggageapp://accept-staff?token=${token}`;
    this.mailService.sendStaffInvitation(email, name, inviterName, location.name, link).catch(() => {});

    return { message: 'Invitation sent', id: invitation.id, link, token };
  }

  async acceptInvitation(token: string, existingUserId?: string) {
    const invitation = await this.invitationRepository.findOne({
      where: { token, status: 'pending' },
      relations: ['location'],
    });
    if (!invitation) throw new NotFoundException('Invalid or expired invitation');
    if (new Date() > invitation.expiresAt) {
      invitation.status = 'expired';
      await this.invitationRepository.save(invitation);
      throw new BadRequestException('Invitation has expired');
    }

    let user: User | null = null;

    if (existingUserId) {
      user = await this.userRepository.findOne({ where: { id: existingUserId as any } });
    } else {
      user = await this.userRepository.findOne({ where: { email: invitation.email } });
    }

    if (user) {
      const role = await this.roleRepository.findOne({ where: { name: 'staff' } });
      if (!role) throw new NotFoundException('Role staff not found');

      const hasStaff = await this.userRoleRepository.findOne({
        where: { user: { id: user.id as any }, role: { id: role.id } },
      });
      if (!hasStaff) {
        await this.userRoleRepository.save({ user: { id: user.id } as any, role: { id: role.id } as any });
      }

      const hasAssignment = await this.staffRepository.findOne({
        where: { staff: { id: user.id as any }, location: { id: invitation.location.id as any } },
      });
      if (!hasAssignment) {
        await this.staffRepository.save({
          staff: { id: user.id } as any,
          location: { id: invitation.location.id } as any,
          permissions: ['check_in', 'check_out'],
        });
      }

      invitation.status = 'accepted';
      await this.invitationRepository.save(invitation);

      return { accepted: true, locationName: invitation.location.name };
    }

    return { requiresSignup: true, email: invitation.email, token };
  }

  async getStaffByLocation(locationId: string): Promise<StaffAssignment[]> {
    return this.staffRepository.find({
      where: { location: { id: locationId as any } },
      relations: ['staff', 'staff.profile'],
    });
  }

  async removeStaff(ownerId: string, assignmentId: string): Promise<void> {
    const assignment = await this.staffRepository.findOne({
      where: { id: assignmentId as any },
      relations: ['location', 'location.owners', 'location.owners.user'],
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    const isOwner = assignment.location.owners?.some((o: any) => o.user?.id === ownerId);
    if (!isOwner) throw new ForbiddenException('Only location owners can remove staff');
    await this.staffRepository.delete(assignmentId);
  }

  async getAssignedLocations(staffId: string): Promise<StaffAssignment[]> {
    return this.staffRepository.find({
      where: { staff: { id: staffId as any } },
      relations: ['location'],
    });
  }
}
