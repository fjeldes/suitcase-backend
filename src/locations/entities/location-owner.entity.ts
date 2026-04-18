import { Entity, ManyToOne, Column, Unique } from 'typeorm'
import { BaseEntity } from 'src/common/entities/base.entity'
import { User } from 'src/users/entities/user.entity'
import { Location } from './location.entity'

@Entity()
@Unique(['user', 'location']) // evita duplicados
export class LocationOwner extends BaseEntity {
  @ManyToOne(() => User, (user) => user.locationOwners, {
    onDelete: 'CASCADE',
  })
  user: User

  @ManyToOne(() => Location, (location) => location.owners, {
    onDelete: 'CASCADE',
  })
  location: Location

  @Column({ default: false })
  isPrimary: boolean // opcional pero MUY útil
}