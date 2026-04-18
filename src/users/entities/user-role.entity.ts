import { Entity, ManyToOne, Unique } from 'typeorm'
import { BaseEntity } from 'src/common/entities/base.entity'
import { User } from './user.entity'
import { Role } from './role.entity'

@Entity()
@Unique(['user', 'role'])
export class UserRole extends BaseEntity {
  @ManyToOne(() => User, (user) => user.roles)
  user: User

  @ManyToOne(() => Role, (role) => role.users)
  role: Role
}