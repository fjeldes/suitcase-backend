import { Entity, Column, OneToOne, OneToMany } from 'typeorm'
import { BaseEntity } from 'src/common/entities/base.entity'
import { LocationOwner } from 'src/locations/entities/location-owner.entity'
import { UserRole } from './user-role.entity'
import { Profile } from './profile.entity'
import { Booking } from 'src/bookings/entities/booking.entity'

@Entity({ name: 'users' })
export class User extends BaseEntity {
    @Column({ unique: true })
    email: string

    @Column({ nullable: true })
    password: string

    @Column({ default: true })
    isActive: boolean

    @OneToOne(() => Profile, (profile) => profile.user)
    profile: Profile

    @OneToMany(() => UserRole, (userRole) => userRole.user)
    roles: UserRole[]


    @OneToMany(() => Booking, (booking) => booking.user)
    bookings: Booking[]

    @OneToMany(() => LocationOwner, (owner) => owner.user)
    locationOwners: LocationOwner[]
}