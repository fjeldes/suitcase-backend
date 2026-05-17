import { Html, Head, Body, Container, Section, Text, Img, Button } from '@react-email/components'

interface Props { name: string; lang: string; baseUrl: string }

export const WelcomeEmail = ({ name, lang, baseUrl }: Props) => {
  const t = (es: string, en: string) => lang === 'es' ? es : en
  return (
    <Html>
      <Head />
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Img src={`${baseUrl}/assets/logo.png`} alt="KipGo" width="120" height="48" />
          </Section>
          <Section style={heroStyle}>
            <Text style={heroTitleStyle}>
              {t('Bienvenido a KipGo', 'Welcome to KipGo')}
            </Text>
            <Text style={heroSubStyle}>
              {t('Viaja ligero, guarda en cualquier lugar.', 'Travel light, store anywhere.')}
            </Text>
          </Section>
          <Section style={contentStyle}>
            <Section style={stepsRowStyle}>
              <Step number="1" title={t('Encuentra', 'Find')} desc={t('Descubre bóvedas KipGo cerca de ti.', 'Discover secure KipGo vaults near you.')} />
              <Step number="2" title={t('Reserva', 'Book')} desc={t('Reserva tu espacio de forma segura.', 'Reserve your space securely.')} />
              <Step number="3" title={t('Guarda', 'Store')} desc={t('Deja tus maletas y disfruta tu día.', 'Drop off your bags and enjoy your day.')} />
            </Section>
          </Section>
          <Section style={ctaStyle}>
            <Text style={ctaTitleStyle}>
              {t('¿Listo para explorar sin equipaje?', 'Ready to explore unburdened?')}
            </Text>
            <Button href={baseUrl} style={ctaButtonStyle}>
              {t('Comenzar ahora', 'Get Started Now')}
            </Button>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

function Step({ number, title, desc }: { number: string; title: string; desc: string }) {
  return (
    <Section style={stepStyle}>
      <Section style={stepNumberStyle}>
        <Text style={stepNumberTextStyle}>{number}</Text>
      </Section>
      <Text style={stepTitleStyle}>{title}</Text>
      <Text style={stepDescStyle}>{desc}</Text>
    </Section>
  )
}

const bodyStyle = { fontFamily: 'Inter, sans-serif', backgroundColor: '#f9f9f9', margin: 0, padding: 0 }
const containerStyle = { maxWidth: 480, margin: '40px auto', backgroundColor: '#ffffff', borderRadius: 24, overflow: 'hidden' as const, boxShadow: '0 20px 40px rgba(26,35,126,0.06)' }
const headerStyle = { backgroundColor: '#f3f3f3', padding: 32, textAlign: 'center' as const }
const heroStyle = { backgroundColor: '#f3f3f3', padding: '48px 32px', textAlign: 'center' as const }
const heroTitleStyle = { fontSize: 32, fontWeight: 800, color: '#1a237e', margin: '0 0 16px', lineHeight: '1.2' }
const heroSubStyle = { fontSize: 16, color: '#454652', margin: 0, lineHeight: '24px' }
const contentStyle = { padding: 32 }
const stepsRowStyle = { display: 'grid' as const, gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }
const stepStyle = { backgroundColor: '#f3f3f3', borderRadius: 12, padding: 24, textAlign: 'center' as const }
const stepNumberStyle = { width: 48, height: 48, borderRadius: '50%', backgroundColor: '#bdc2ff', display: 'flex' as const, alignItems: 'center' as const, justifyContent: 'center' as const, margin: '0 auto 12px' }
const stepNumberTextStyle = { fontSize: 18, fontWeight: 700, color: '#1a237e', margin: 0 }
const stepTitleStyle = { fontSize: 15, fontWeight: 700, color: '#1a237e', margin: '0 0 4px' }
const stepDescStyle = { fontSize: 13, color: '#454652', margin: 0 }
const ctaStyle = { textAlign: 'center' as const, padding: 32 }
const ctaTitleStyle = { fontSize: 22, fontWeight: 700, color: '#1a237e', margin: '0 0 16px' }
const ctaButtonStyle = { backgroundColor: '#1a237e', color: '#ffffff', padding: '16px 32px', borderRadius: 12, textDecoration: 'none', fontWeight: 600, fontSize: 15 }
