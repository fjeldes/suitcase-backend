-- Seed terms for Client, Owner, and Staff
INSERT INTO terms (id, type, version, content, "isActive", "createdAt") VALUES
(
  gen_random_uuid()::text,
  'client',
  '1.0',
  E'TERMS & CONDITIONS — CLIENT\n\n1. Acceptance of Terms\nBy using SecureCustodian services, you agree to be bound by these terms. If you do not agree, do not use the service.\n\n2. Service Description\nSecureCustodian connects travelers with local stores for temporary luggage storage. We facilitate bookings, payments, and communication between users and store owners.\n\n3. User Obligations\n- You must provide accurate personal information\n- You are responsible for your items during the storage period\n- You must not store illegal, hazardous, or perishable items\n- Maximum liability per booking is $2,500 USD\n\n4. Booking & Payment\n- Payment is processed at the time of booking\n- Cancellations made before check-in are fully refunded\n- Late cancellations may incur a fee\n- Extensions are subject to availability and additional charges\n\n5. Prohibited Items\n- Weapons, explosives, or flammable materials\n- Illegal substances or contraband\n- Perishable food or live animals\n- Valuables exceeding $2,500 in declared value\n\n6. Limitation of Liability\nSecureCustodian acts as a marketplace facilitator. Each store owner is responsible for the safekeeping of items. Our maximum liability is limited to the total booking amount paid.\n\n7. Privacy\nWe collect and process personal data in accordance with our Privacy Policy. Your data is encrypted and never shared with third parties without your consent.\n\n8. Changes to Terms\nWe reserve the right to modify these terms. Users will be notified of material changes via email or in-app notification.',
  true,
  NOW()
),
(
  gen_random_uuid()::text,
  'owner',
  '1.0',
  E'TERMS & CONDITIONS — STORE OWNER\n\n1. Host Obligations\nAs a store owner, you agree to:\n- Provide accurate information about your location, capacity, and hours\n- Maintain a safe and secure storage area\n- Accept valid bookings made through the platform\n- Be available during stated business hours for check-in and check-out\n\n2. Commission & Payouts\n- SecureCustodian charges a 15% service fee on each booking\n- Payouts are processed within 2 business days after check-out\n- Payouts are sent via Stripe to your connected account\n- You are responsible for any applicable taxes on your earnings\n\n3. Insurance & Liability\n- Each booking is covered by our protection policy up to $2,500\n- You must have appropriate business insurance for your location\n- You are liable for items stored in your care\n- Any damage or loss must be reported within 24 hours\n\n4. Store Operations\n- You must honor all confirmed bookings\n- Same-day cancellations by guests are eligible for a fee\n- You may cancel bookings only in exceptional circumstances\n- Regular updates to availability are expected\n\n5. Termination\nSecureCustodian may suspend or terminate your account for:\n- Repeated violations of these terms\n- Fraudulent activity\n- Poor service ratings below a certain threshold\n- Providing false information\n\n6. Exclusive Use\nDuring the term of this agreement, you agree not to list your storage space on competing platforms without prior written consent.',
  true,
  NOW()
),
(
  gen_random_uuid()::text,
  'staff',
  '1.0',
  E'TERMS & CONDITIONS — STAFF MEMBER\n\n1. Scope of Access\nAs a staff member, you are granted limited access to:\n- View bookings for your assigned store location\n- Perform check-in and check-out of luggage\n- Communicate with customers regarding their bookings\n\n2. Responsibilities\nYou agree to:\n- Use the app only for authorized purposes\n- Verify customer identity before releasing items\n- Accurately record check-in and check-out times\n- Report any issues to the store owner immediately\n\n3. Restrictions\nYou may NOT:\n- Access or modify store settings or pricing\n- View financial or revenue data\n- Create, cancel, or modify bookings\n- Invite or manage other staff members\n- Share your login credentials with anyone\n\n4. Accountability\n- The store owner is responsible for your actions\n- Violations may result in immediate termination of access\n- SecureCustodian is not liable for actions taken by staff\n- Your access can be revoked at any time by the store owner\n\n5. Privacy\n- You may access customer data only as needed for your duties\n- Customer information must be kept confidential\n- Do not use customer data for any purpose outside of your role',
  true,
  NOW()
);
