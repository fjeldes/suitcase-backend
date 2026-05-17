import { Html, Head, Body, Container, Section, Text, Img, Button } from '@react-email/components'

interface Props { inviterName: string; locationName: string; link: string; baseUrl: string }

export const StaffInvitationEmail = ({ inviterName, locationName, link, baseUrl }: Props) => (
  <Html>
    <Head />
    <Body style={bodyStyle}>
      <Container style={containerStyle}>
        <Section style={headerStyle}>
          <Img src={`${baseUrl}/assets/logo.png`} alt="KipGo" width="120" height="48" />
        </Section>
        <Section style={contentStyle}>
          <Section style={badgeStyle}>
            <Text style={badgeTextStyle}>STAFF INVITATION</Text>
          </Section>
          <Text style={titleStyle}>{inviterName} has invited you to manage {locationName} on KipGo</Text>
          <Text style={textStyle}>
            You have been granted staff access to manage operations at {locationName}. Join the team to help provide secure and seamless luggage storage services.
          </Text>
          <Section style={featuresRowStyle}>
            <Feature icon="📋" title="Manage Bookings" desc="View and handle daily luggage drop-offs and pick-ups efficiently." />
            <Feature icon="📷" title="Scan QR Codes" desc="Quickly process customer check-ins and check-outs using the built-in scanner." />
          </Section>
          <Section style={ctaSectionStyle}>
            <Button href={link} style={ctaButtonStyle}>
              Accept Invitation →
            </Button>
            <Text style={expireStyle}>Link expires in 48 hours. If you didn't expect this, please ignore this email.</Text>
          </Section>
        </Section>
      </Container>
    </Body>
  </Html>
)

function Feature({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <Section style={featureStyle}>
      <Text style={featureIconStyle}>{icon}</Text>
      <Text style={featureTitleStyle}>{title}</Text>
      <Text style={featureDescStyle}>{desc}</Text>
    </Section>
  )
}

const bodyStyle = { fontFamily: 'Inter, sans-serif', backgroundColor: '#f9f9f9', margin: 0, padding: 0 }
const containerStyle = { maxWidth: 480, margin: '40px auto', backgroundColor: '#ffffff', borderRadius: 24, overflow: 'hidden' as const, boxShadow: '0 20px 40px rgba(26,35,126,0.06)' }
const headerStyle = { backgroundColor: '#f3f3f3', padding: 32, textAlign: 'center' as const }
const contentStyle = { padding: 40 }
const badgeStyle = { backgroundColor: '#e0e0ff', display: 'inline-block' as const, padding: '4px 12px', borderRadius: 999, marginBottom: 16 }
const badgeTextStyle = { fontSize: 12, fontWeight: 600, color: '#000767', margin: 0, letterSpacing: 1 }
const titleStyle = { fontSize: 28, fontWeight: 700, color: '#1a237e', margin: '0 0 16px', lineHeight: '1.2' }
const textStyle = { fontSize: 15, color: '#454652', margin: '0 0 32px' }
const featuresRowStyle = { display: 'grid' as const, gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 40 }
const featureStyle = { backgroundColor: '#f3f3f3', borderRadius: 12, padding: 20 }
const featureIconStyle = { fontSize: 24, margin: '0 0 12px' }
const featureTitleStyle = { fontSize: 15, fontWeight: 600, color: '#1a1c1c', margin: '0 0 4px' }
const featureDescStyle = { fontSize: 13, color: '#454652', margin: 0 }
const ctaSectionStyle = { textAlign: 'center' as const, marginTop: 32 }
const ctaButtonStyle = { backgroundColor: '#1a237e', color: '#ffffff', padding: '16px 32px', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 16 }
const expireStyle = { fontSize: 12, color: '#767683', marginTop: 16 }
