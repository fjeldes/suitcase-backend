import { Entity, Column, OneToMany } from 'typeorm'
import { BaseEntity } from 'src/common/entities/base.entity'
import { UserRole } from './user-role.entity'


@Entity()
export class Role extends BaseEntity {
    @Column({ unique: true })
    name: string

    @OneToMany(() => UserRole, (userRole) => userRole.role)
    users: UserRole[]
}