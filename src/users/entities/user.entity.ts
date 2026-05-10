import { Entity, Column, OneToOne, OneToMany } from 'typeorm'
import { BaseEntity } from 'src/common/entities/base.entity'
import { LocationOwner } from 'src/locations/entities/location-owner.entity'
import { UserRole } from './user-role.entity'
import { Profile } from './profile.entity'
import { Booking } from 'src/bookings/entities/booking.entity'
import { DeviceToken } from 'src/notifications/entities/device-token.entity'
import { Review } from 'src/reviews/entities/review.entity'

@Entity({ name: 'users' })
export class User extends BaseEntity {
    @Column({ unique: true })
    email: string

    @Column({
        type: 'varchar',
        nullable: true
    })
    password?: string | null;

    @Column({ default: true })
    isActive: boolean

    @Column({ default: false })
    isEmailVerified: boolean

    @Column({ type: 'varchar', nullable: true })
    otpCode?: string | null

    @Column({ type: 'timestamp', nullable: true })
    otpExpiresAt?: Date | null

    @OneToOne(() => Profile, (profile) => profile.user)
    profile: Profile

    @OneToMany(() => UserRole, (userRole) => userRole.user)
    roles: UserRole[]


    @OneToMany(() => Booking, (booking) => booking.user)
    bookings: Booking[]

    @OneToMany(() => LocationOwner, (owner) => owner.user)
    locationOwners: LocationOwner[]

    @OneToMany(() => DeviceToken, (deviceToken) => deviceToken.user)
    deviceTokens: DeviceToken[];

    @OneToMany(() => Review, (review) => review.user)
    reviews: Review[];

    @Column({ type: 'varchar', nullable: true })
    stripeCustomerId?: string | null;
}