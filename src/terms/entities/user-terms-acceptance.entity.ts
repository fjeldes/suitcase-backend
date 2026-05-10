import { Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Terms } from './terms.entity';

@Entity('user_terms_acceptances')
@Unique(['user', 'terms'])
export class UserTermsAcceptance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.id)
  user: User;

  @ManyToOne(() => Terms, (terms) => terms.id)
  terms: Terms;
}
