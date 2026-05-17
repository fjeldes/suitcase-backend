import { Html, Head, Body, Container, Section, Text, Img } from '@react-email/components'

interface Booking { id?: string; qrCode?: string; startDate?: string; endDate?: string; totalPrice?: number; items?: { small?: number; medium?: number; large?: number }; location?: { name?: string; address?: string } }

interface Props { booking: Booking; baseUrl: string }

export const BookingReceiptEmail = ({ booking, baseUrl }: Props) => {
  const startDate = booking.startDate ? new Date(booking.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''
  const startTime = booking.startDate ? new Date(booking.startDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''
  const endDate = booking.endDate ? new Date(booking.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''
  const endTime = booking.endDate ? new Date(booking.endDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''
  const total = typeof booking.totalPrice === 'number' ? booking.totalPrice.toFixed(2) : booking.totalPrice
  const items = booking.items || {}
  const small = items.small || 0
  const medium = items.medium || 0
  const large = items.large || 0

  return (
    <Html>
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Img src={`${baseUrl}/assets/logo.png`} alt="KipGo" width="120" height="48" />
          </Section>
          <Section style={contentStyle}>
            <Text style={mainTitleStyle}>Booking Confirmed</Text>
            <Text style={subtitleStyle}>Your luggage is safe with us. Here is your receipt.</Text>

            <Section style={infoRowStyle}>
              <Section style={infoItemStyle}>
                <Text style={infoLabelStyle}>Booking ID</Text>
                <Text style={bookingIdStyle}>{booking.qrCode || `BK-${booking.id?.slice(0, 8)}`}</Text>
              </Section>
              <Section style={{ ...infoItemStyle, textAlign: 'right' as const }}>
                <Text style={infoLabelStyle}>Date</Text>
                <Text style={dateValueStyle}>{startDate}</Text>
              </Section>
            </Section>

            <Text style={sectionTitleStyle}>Location Details</Text>
            <Section style={locationBoxStyle}>
              <Section style={locationRowStyle}>
                <Text style={locationNameStyle}>{booking.location?.name || 'Store'}</Text>
                <Text style={locationAddressStyle}>{booking.location?.address || ''}</Text>
              </Section>
            </Section>

            <Text style={sectionTitleStyle}>Storage Summary</Text>
            <Section style={summaryBoxStyle}>
              <Section style={dateRowStyle}>
                <Section style={dateItemStyle}>
                  <Text style={dateLabelStyle}>Drop-off</Text>
                  <Text style={dateValueStyle}>{startDate}, {startTime}</Text>
                </Section>
                <Text style={arrowStyle}>→</Text>
                <Section style={{ ...dateItemStyle, textAlign: 'right' as const }}>
                  <Text style={dateLabelStyle}>Pick-up</Text>
                  <Text style={dateValueStyle}>{endDate}, {endTime}</Text>
                </Section>
              </Section>
              {small > 0 && <ItemRow icon="🎒" label="Small Items" qty={small} />}
              {medium > 0 && <ItemRow icon="🧳" label="Medium Suitcases" qty={medium} />}
              {large > 0 && <ItemRow icon="🛄" label="Large Items" qty={large} />}
            </Section>

            <Text style={sectionTitleStyle}>Payment Breakdown</Text>
            <Section style={paymentBoxStyle}>
              <TotalRow label="Subtotal" value={`$${total}`} />
              <TotalRow label="Service Fee" value="$0.00" />
              <Section style={totalRowStyle}>
                <Text style={totalLabelStyle}>Total Paid</Text>
                <Text style={totalValueStyle}>${total}</Text>
              </Section>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

function ItemRow({ icon, label, qty }: { icon: string; label: string; qty: number }) {
  return (
    <Section style={itemRowStyle}>
      <Text style={itemIconStyle}>{icon}</Text>
      <Text style={itemLabelStyle}>{label}</Text>
      <Text style={itemQtyStyle}>x {qty}</Text>
    </Section>
  )
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <Section style={subtotalRowStyle}>
      <Text style={subtotalLabelStyle}>{label}</Text>
      <Text style={subtotalValueStyle}>{value}</Text>
    </Section>
  )
}

const bodyStyle = { fontFamily: 'Inter, sans-serif', backgroundColor: '#f9f9f9', margin: 0, padding: 0 }
const containerStyle = { maxWidth: 480, margin: '40px auto', backgroundColor: '#ffffff', borderRadius: 24, overflow: 'hidden' as const, boxShadow: '0 20px 40px rgba(26,35,126,0.06)' }
const headerStyle = { backgroundColor: '#f3f3f3', padding: 32, textAlign: 'center' as const }
const contentStyle = { padding: 40 }
const mainTitleStyle = { fontSize: 28, fontWeight: 700, color: '#1a237e', margin: '0 0 4px', textAlign: 'center' as const }
const subtitleStyle = { fontSize: 14, color: '#454652', margin: '0 0 24px', textAlign: 'center' as const }
const infoRowStyle = { display: 'flex' as const, justifyContent: 'space-between' as const, backgroundColor: '#f9f9f9', padding: 16, borderRadius: 12, marginBottom: 24 }
const infoItemStyle = { flex: 1 }
const infoLabelStyle = { fontSize: 11, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 1, color: '#454652', margin: '0 0 4px' }
const bookingIdStyle = { fontSize: 18, fontWeight: 700, color: '#1a237e', margin: 0 }
const dateValueStyle = { fontSize: 14, color: '#1a1c1c', fontWeight: 500, margin: 0 }
const sectionTitleStyle = { fontSize: 20, fontWeight: 700, color: '#1a237e', borderBottom: '1px solid #eee', paddingBottom: 8, margin: '0 0 16px' }
const locationBoxStyle = { marginBottom: 24 }
const locationRowStyle = {}
const locationNameStyle = { fontSize: 18, fontWeight: 700, color: '#1a1c1c', margin: '0 0 4px' }
const locationAddressStyle = { fontSize: 13, color: '#454652', margin: 0 }
const summaryBoxStyle = { backgroundColor: '#f9f9f9', padding: 20, borderRadius: 12, marginBottom: 24 }
const dateRowStyle = { display: 'flex' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: 16 }
const dateItemStyle = { display: 'flexColumn' as unknown as string }
const dateLabelStyle = { fontSize: 14, fontWeight: 500, color: '#1a1c1c', margin: 0 }
const arrowStyle = { color: '#c6c5d4', margin: '0 16px' }
const itemRowStyle = { display: 'flex' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, paddingTop: 12, borderTop: '1px solid #eee' }
const itemIconStyle = { marginRight: 8 }
const itemLabelStyle = { fontSize: 14, color: '#1a1c1c', flex: 1, margin: 0 }
const itemQtyStyle = { fontWeight: 700, color: '#1a237e', margin: 0 }
const paymentBoxStyle = { marginBottom: 24 }
const subtotalRowStyle = { display: 'flex' as const, justifyContent: 'space-between' as const, padding: '8px 0', fontSize: 14, color: '#1a1c1c' }
const subtotalLabelStyle = { margin: 0 }
const subtotalValueStyle = { fontWeight: 500, margin: 0 }
const totalRowStyle = { display: 'flex' as const, justifyContent: 'space-between' as const, padding: '16px 0 0', borderTop: '1px solid #eee' }
const totalLabelStyle = { fontSize: 20, fontWeight: 700, color: '#1a237e', margin: 0 }
const totalValueStyle = { fontSize: 20, fontWeight: 700, color: '#9f4200', margin: 0 }
