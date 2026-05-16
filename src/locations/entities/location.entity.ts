import { Entity, Column, OneToMany } from 'typeorm'
import { BaseEntity } from 'src/common/entities/base.entity'
import { Booking } from 'src/bookings/entities/booking.entity'
import { LocationOwner } from './location-owner.entity'
import { Review } from 'src/reviews/entities/review.entity'

@Entity()
export class Location extends BaseEntity {
  @Column()
  name: string

  @Column({ nullable: true })
  description: string

  @Column({ nullable: true })
  imageUrl: string

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

  @Column({
    type: 'varchar',
    length: 3,
    default: 'CLP',
    comment: 'Código ISO de la moneda (CLP, USD, EUR, etc.)'
  })
  currency: string;

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

  @Column({ type: 'varchar', default: 'pending' })
  status: 'pending' | 'active' | 'rejected'

  @Column({ type: 'json', nullable: true })
  workingHours: any;

  @OneToMany(() => LocationOwner, (owner) => owner.location)
  owners: LocationOwner[]

  @OneToMany(() => Booking, (booking) => booking.location)
  bookings: Booking[]

  @OneToMany(() => Review, (review) => review.location)
  reviews: Review[]
}