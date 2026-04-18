import { Entity, Column, OneToMany } from 'typeorm'
import { BaseEntity } from 'src/common/entities/base.entity'
import { Booking } from 'src/bookings/entities/booking.entity'
import { LocationOwner } from './location-owner.entity'

@Entity()
export class Location extends BaseEntity {
  @Column()
  name: string

  @Column({ nullable: true })
  description: string

  @Column()
  address: string

  @Column('decimal', { precision: 10, scale: 6 })
  lat: number

  @Column('decimal', { precision: 10, scale: 6 })
  lng: number

  @Column()
  city: string

  @Column()
  country: string

  @Column('json')
  capacity: {
    small: number
    medium: number
    large: number
  }

  @Column('json')
  pricePerDay: {
    small: number
    medium: number
    large: number
  }

  @Column({ default: true })
  isActive: boolean

  @OneToMany(() => LocationOwner, (owner) => owner.location)
  owners: LocationOwner[]

  @OneToMany(() => Booking, (booking) => booking.location)
  bookings: Booking[]
}