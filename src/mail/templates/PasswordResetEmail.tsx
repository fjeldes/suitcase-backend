import { Html, Head, Body, Container, Section, Text, Img } from '@react-email/components'

interface Props { code: string; baseUrl: string }

export const PasswordResetEmail = ({ code, baseUrl }: Props) => (
  <Html>
    <Head />
    <Body style={bodyStyle}>
      <Container style={containerStyle}>
        <Section style={headerStyle}>
          <Img src={`${baseUrl}/assets/logo.png`} alt="KipGo" width="120" height="48" />
        </Section>
        <Section style={contentStyle}>
          <Text style={titleStyle}>Reset your KipGo Password</Text>
          <Text style={textStyle}>Use the code below to reset your password. This code will expire in 10 minutes.</Text>
          <Section style={codeContainerStyle}>
            <Text style={codeStyle}>{code}</Text>
            <Text style={codeLabelStyle}>Reset code</Text>
          </Section>
          <Text style={hintStyle}>Enter this code in the app to set a new password.</Text>
          <Section style={infoBoxStyle}>
            <Text style={infoTextStyle}>If you didn't request a password reset, you can safely ignore this email. Your account remains secure.</Text>
          </Section>
        </Section>
      </Container>
    </Body>
  </Html>
)

const bodyStyle = { fontFamily: 'Inter, sans-serif', backgroundColor: '#f9f9f9', margin: 0, padding: 0 }
const containerStyle = { maxWidth: 480, margin: '40px auto', backgroundColor: '#ffffff', borderRadius: 24, overflow: 'hidden' as const, boxShadow: '0 20px 40px rgba(26,35,126,0.06)' }
const headerStyle = { backgroundColor: '#f3f3f3', padding: 32, textAlign: 'center' as const }
const contentStyle = { padding: 40, textAlign: 'center' as const }
const titleStyle = { fontSize: 28, fontWeight: 700, color: '#1a237e', margin: '0 0 16px' }
const textStyle = { fontSize: 15, color: '#454652', margin: '0 0 32px' }
const codeContainerStyle = { backgroundColor: '#f3f3f3', borderRadius: 12, padding: 24, marginBottom: 8 }
const codeStyle = { fontSize: 40, fontWeight: 800, letterSpacing: 8, color: '#1a237e', textAlign: 'center' as const, margin: 0 }
const codeLabelStyle = { fontSize: 11, color: '#767683', textTransform: 'uppercase' as const, letterSpacing: 1, textAlign: 'center' as const, marginTop: 8 }
const hintStyle = { fontSize: 12, color: '#767683', margin: '32px 0' }
const infoBoxStyle = { backgroundColor: '#f3f3f3', borderRadius: 12, padding: 20, border: '1px solid rgba(198,197,212,0.15)' }
const infoTextStyle = { fontSize: 12, color: '#454652', margin: 0, lineHeight: '18px' }
