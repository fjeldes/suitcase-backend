import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Location } from '../../locations/entities/location.entity';

@Index(['email'])
@Index(['status'])
@Entity('staff_invitations')
export class StaffInvitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  name: string;

  @Column({ unique: true })
  token: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'accepted' | 'expired';

  @ManyToOne(() => Location, (location) => location.id)
  location: Location;

  @ManyToOne(() => User, (user) => user.id)
  invitedBy: User;

  @Column({ type: 'timestamp', default: () => "CURRENT_TIMESTAMP + INTERVAL '7 days'" })
  expiresAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
