import { Entity, Column, ManyToOne, BeforeInsert } from 'typeorm'
import { BaseEntity } from 'src/common/entities/base.entity'
import { User } from 'src/users/entities/user.entity'
import { Location } from 'src/locations/entities/location.entity'
import { randomBytes } from 'crypto'

@Entity()
export class Booking extends BaseEntity {
  @ManyToOne(() => User, (user) => user.bookings)
  user: User

  @ManyToOne(() => Location, (location) => location.bookings)
  location: Location

  @Column()
  startDate: Date

  @Column()
  endDate: Date

  @Column('json')
  items: {
    small: number
    medium: number
    large: number
  }

  @Column({
    type: 'varchar',
    default: 'pending',
  })
  status: 
    | 'pending'    // El cliente reservó pero no ha pagado o el owner no ha aceptado.
    | 'confirmed'  // Reserva pagada/aceptada. El espacio está bloqueado.
    | 'in_storage' // El cliente llegó y entregó las maletas. (Check-in hecho).
    | 'completed'  // El cliente ya retiró sus maletas. (Check-out hecho).
    | 'cancelled'  // La reserva se canceló antes de empezar.
    | 'no_show'     // El cliente nunca llegó y pasó la fecha.

  @Column('decimal')
  totalPrice: number

  // Agregamos el código QR (o un identificador único para el QR)
  @Column({ unique: true, nullable: true })
  qrCode: string
  @BeforeInsert()
  generateQrCode() {
    this.qrCode = `STC-${randomBytes(6).toString('hex').toUpperCase()}`;
  }

  @Column({ type: 'timestamp', nullable: true })
  checkedInAt: Date // Para saber exactamente cuándo llegó la maleta

  @Column({ type: 'timestamp', nullable: true })
  checkedOutAt: Date // Para saber cuándo se retiró
}