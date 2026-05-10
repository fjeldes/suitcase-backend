import { Entity, Column, ManyToOne, BeforeInsert, OneToMany } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';
import { User } from 'src/users/entities/user.entity';
import { Location } from 'src/locations/entities/location.entity';
import { Review } from 'src/reviews/entities/review.entity';
import { Transaction } from 'src/transactions/entities/transaction.entity';
import { randomBytes } from 'crypto';

@Entity('bookings')
export class Booking extends BaseEntity {
  @ManyToOne(() => User, (user) => user.bookings)
  user: User;

  @ManyToOne(() => Location, (location) => location.bookings)
  location: Location;

  @Column()
  startDate: Date;

  @Column()
  endDate: Date;

  @Column('json')
  items: {
    small: number;
    medium: number;
    large: number;
  };

  @Column({
    type: 'varchar',
    default: 'pending_payment', // Cambiamos el default para el flujo de dinero
  })
  status:
    | 'pending_payment' // Nuevo: Esperando que Stripe/Usuario confirme el pago
    | 'confirmed'       // Pagada y lista para recibir maletas
    | 'in_storage'      // Maletas entregadas (Check-in)
    | 'completed'       // Maletas retiradas (Check-out)
    | 'cancelled'
    | 'no_show';

  // Usamos un transformer o Number() porque PostgreSQL devuelve los decimales como strings
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  totalPrice: number;

  @Column({ type: 'int', default: 1 })
  days: number; // 👈 Importante guardar cuántos días se cobraron

  @Column({ unique: true, nullable: true })
  qrCode: string;

  @BeforeInsert()
  generateQrCode() {
    this.qrCode = `STC-${randomBytes(6).toString('hex').toUpperCase()}`;
  }

  @Column({ type: 'timestamp', nullable: true })
  checkedInAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  checkedOutAt: Date;

  @OneToMany(() => Review, (review) => review.booking)
  review: Review[];

  @OneToMany(() => Transaction, (transaction) => transaction.booking)
  transactions: Transaction[];
}