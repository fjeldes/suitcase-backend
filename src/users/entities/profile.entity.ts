import { Entity, Column, OneToOne, JoinColumn } from 'typeorm'
import { BaseEntity } from 'src/common/entities/base.entity'
import { User } from './user.entity'

@Entity()
export class Profile extends BaseEntity {
  @Column({ nullable: true })
  firstName: string

  @Column({ nullable: true })
  lastName: string

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn()
  user: User
}