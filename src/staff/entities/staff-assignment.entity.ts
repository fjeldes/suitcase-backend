import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Location } from '../../locations/entities/location.entity';

@Entity('staff_assignments')
@Unique(['staff', 'location'])
export class StaffAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.id)
  staff: User;

  @ManyToOne(() => Location, (location) => location.id)
  location: Location;

  @Column('simple-array', { default: 'check_in,check_out' })
  permissions: string[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
