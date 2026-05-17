import { Html, Head, Body, Container, Section, Text, Img, Button } from '@react-email/components'

interface Props { storeName: string; baseUrl: string }

export const StoreApprovedEmail = ({ storeName, baseUrl }: Props) => (
  <Html>
    <Head />
    <Body style={bodyStyle}>
      <Container style={containerStyle}>
        <Section style={headerStyle}>
          <Img src={`${baseUrl}/assets/logo.png`} alt="KipGo" width="120" height="48" />
        </Section>
        <Section style={heroStyle}>
          <Section style={iconCircleStyle}>
            <Text style={iconTextStyle}>✅</Text>
          </Section>
          <Text style={heroTitleStyle}>¡Tu tienda ha sido aprobada!</Text>
          <Text style={heroDescStyle}>¡Felicidades! Tu ubicación de almacenamiento ha sido verificada y ahora está visible para los viajeros.</Text>
        </Section>
        <Section style={detailsStyle}>
          <Section style={detailBarStyle} />
          <Text style={detailsTitleStyle}>🏪 Detalles de tu Tienda</Text>
          <DetailRow label="Nombre de la Tienda" value={storeName} />
          <DetailRow label="Estado" value="Activa / Publicada" valueColor="#00695c" />
          <DetailRow label="Reservas" value="Lista para recibir" valueColor="#9f4200" />
        </Section>
        <Section style={ctaSectionStyle}>
          <Button href={`${baseUrl}/owner/dashboard`} style={ctaButtonStyle}>
            Ir al Dashboard →
          </Button>
          <Text style={ctaSubStyle}>Comienza a gestionar tus espacios y horarios ahora.</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

function DetailRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <Section style={detailRowStyle}>
      <Text style={detailLabelStyle}>{label}</Text>
      <Text style={{ ...detailValueStyle, color: valueColor || '#1a237e' }}>{value}</Text>
    </Section>
  )
}

const bodyStyle = { fontFamily: 'Inter, sans-serif', backgroundColor: '#f9f9f9', margin: 0, padding: 0 }
const containerStyle = { maxWidth: 480, margin: '40px auto', backgroundColor: '#ffffff', borderRadius: 24, overflow: 'hidden' as const, boxShadow: '0 20px 40px rgba(26,35,126,0.06)' }
const headerStyle = { backgroundColor: '#ffffff', padding: 32, textAlign: 'center' as const, borderBottom: '1px solid #e8e8e8' }
const heroStyle = { padding: '32px 24px', textAlign: 'center' as const, background: 'linear-gradient(180deg, #f9f9f9, #ffffff)' }
const iconCircleStyle = { width: 80, height: 80, borderRadius: '50%', backgroundColor: '#ffdbcb', display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const, margin: '0 auto 24px' }
const iconTextStyle = { fontSize: 40, margin: 0 }
const heroTitleStyle = { fontSize: 36, fontWeight: 800, color: '#1a237e', margin: '0 0 16px', lineHeight: '1.2' }
const heroDescStyle = { fontSize: 16, color: '#454652', lineHeight: '24px', maxWidth: 400, margin: '0 auto' }
const detailsStyle = { padding: 24, margin: '32px 24px', backgroundColor: '#f3f3f3', borderRadius: 12, position: 'relative' as const, overflow: 'hidden' as const }
const detailBarStyle = { position: 'absolute' as const, top: 0, left: 0, width: 4, height: '100%', backgroundColor: '#fd6c00' }
const detailsTitleStyle = { fontSize: 20, fontWeight: 700, color: '#1a237e', margin: '0 0 16px' }
const detailRowStyle = { display: 'flex' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, padding: '8px 0', borderBottom: '1px solid #e2e2e2' }
const detailLabelStyle = { fontSize: 13, color: '#454652', margin: 0 }
const detailValueStyle = { fontWeight: 600, fontSize: 14, margin: 0 }
const ctaSectionStyle = { padding: '0 24px 48px', textAlign: 'center' as const }
const ctaButtonStyle = { backgroundColor: '#fd6c00', color: '#ffffff', padding: '16px 32px', borderRadius: 12, textDecoration: 'none', fontWeight: 700, fontSize: 18 }
const ctaSubStyle = { fontSize: 14, color: '#767683', marginTop: 16 }
