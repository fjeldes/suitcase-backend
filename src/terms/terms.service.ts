import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Terms, TermsType } from './entities/terms.entity';
import { UserTermsAcceptance } from './entities/user-terms-acceptance.entity';

const DEFAULT_TERMS: Record<TermsType, string> = {
  [TermsType.CLIENT]: `TERMS & CONDITIONS — CLIENT

1. Acceptance of Terms
By using SecureCustodian services, you agree to be bound by these terms.

2. Service Description
We connect travelers with local stores for temporary luggage storage.

3. User Obligations
- Provide accurate personal information
- You are responsible for your items during storage
- Do not store illegal, hazardous, or perishable items

4. Booking & Payment
- Payment is processed at booking time
- Free cancellation before check-in

5. Limitation of Liability
Maximum liability is limited to the total booking amount paid.

6. Privacy
Your data is encrypted and never shared without consent.`,

  [TermsType.OWNER]: `TERMS & CONDITIONS — STORE OWNER

1. Host Obligations
- Provide accurate location and capacity information
- Maintain a secure storage area
- Honor all confirmed bookings

2. Commission & Payouts
- 15% service fee on each booking
- Payouts processed within 2 business days after check-out

3. Insurance & Liability
- Each booking covered up to $2,500
- You are liable for items stored in your care

4. Termination
Accounts may be suspended for policy violations.`,

  [TermsType.STAFF]: `TERMS & CONDITIONS — STAFF MEMBER

1. Scope of Access
Limited to viewing bookings, performing check-in/check-out at assigned location.

2. Restrictions
You may NOT access financial data, modify settings, create or cancel bookings.

3. Accountability
Your access can be revoked at any time by the store owner.

4. Privacy
Customer information must be kept confidential.`,

  [TermsType.PRIVACY]: `PRIVACY POLICY

1. Information We Collect
We collect personal information you provide: name, email, phone number, and payment information. We also collect booking data and device information for app functionality.

2. How We Use Your Information
- To process bookings and payments
- To send booking confirmations and receipts
- To improve our services
- To communicate with you about your account

3. Data Sharing
We do not sell your personal information. We share data only with:
- Payment processors (Stripe) for transaction processing
- Store owners to fulfill your booking
- Service providers (hosting, email delivery)

4. Data Security
We implement industry-standard encryption (AES-256) and security protocols to protect your data. All communications are encrypted via TLS.

5. Your Rights
You may request access to, correction of, or deletion of your personal data at any time by contacting us.

6. Data Retention
We retain your data for as long as your account is active and up to 3 years after last activity, as required by applicable law.

7. Contact
For privacy inquiries: privacy@securecustodian.app

8. Changes
We will notify you of material changes via email or in-app notification.`,
};

@Injectable()
export class TermsService implements OnModuleInit {
  constructor(
    @InjectRepository(Terms)
    private readonly termsRepository: Repository<Terms>,
    @InjectRepository(UserTermsAcceptance)
    private readonly acceptanceRepository: Repository<UserTermsAcceptance>,
  ) {}

  async onModuleInit() {
    for (const type of [TermsType.CLIENT, TermsType.OWNER, TermsType.STAFF, TermsType.PRIVACY]) {
      const existing = await this.termsRepository.findOne({ where: { type, isActive: true } });
      if (!existing) {
        await this.termsRepository.save({
          type,
          version: '1.0',
          content: DEFAULT_TERMS[type],
          isActive: true,
        });
        console.log(`✅ Terms "${type}" seeded`);
      }
    }
  }

  async findLatestByType(type: TermsType): Promise<Terms | null> {
    return this.termsRepository.findOne({
      where: { type, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async hasUserAccepted(userId: string, termsId: string): Promise<boolean> {
    const count = await this.acceptanceRepository.count({
      where: { user: { id: userId as any }, terms: { id: termsId } },
    });
    return count > 0;
  }

  async acceptTerms(userId: string, termsId: string): Promise<void> {
    const exists = await this.acceptanceRepository.findOne({
      where: { user: { id: userId as any }, terms: { id: termsId } },
    });
    if (!exists) {
      await this.acceptanceRepository.save({
        user: { id: userId } as any,
        terms: { id: termsId } as any,
      });
    }
  }

  async autoAcceptLatest(userId: string, type: TermsType): Promise<void> {
    const terms = await this.findLatestByType(type);
    if (terms) {
      await this.acceptTerms(userId, terms.id);
    }
  }
}
