import { Html, Head, Body, Container, Section, Text, Img } from '@react-email/components'

interface Props { code: string; baseUrl: string }

export const VerifyEmail = ({ code, baseUrl }: Props) => (
  <Html>
    <Head />
    <Body style={bodyStyle}>
      <Container style={containerStyle}>
        <Section style={headerStyle}>
          <Img src={`${baseUrl}/assets/logo.png`} alt="KipGo" width="120" height="48" />
        </Section>
        <Section style={contentStyle}>
          <Text style={titleStyle}>Welcome to KipGo</Text>
          <Text style={textStyle}>Enter this code to verify your email:</Text>
          <Section style={codeContainerStyle}>
            <Text style={codeStyle}>{code.split('').join(' ')}</Text>
          </Section>
          <Text style={expireStyle}>Code expires in 10 minutes</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

const bodyStyle = { fontFamily: 'Inter, sans-serif', backgroundColor: '#f9f9f9', margin: 0, padding: 0 }
const containerStyle = { maxWidth: 480, margin: '40px auto', backgroundColor: '#ffffff', borderRadius: 24, overflow: 'hidden' as const, boxShadow: '0 20px 40px rgba(26,35,126,0.06)' }
const headerStyle = { backgroundColor: '#f3f3f3', padding: 32, textAlign: 'center' as const }
const contentStyle = { padding: 40, textAlign: 'center' as const }
const titleStyle = { fontSize: 24, fontWeight: 700, color: '#1a237e', margin: '0 0 16px' }
const textStyle = { fontSize: 15, color: '#454652', margin: '0 0 24px' }
const codeContainerStyle = { backgroundColor: '#f3f3f3', borderRadius: 12, padding: 24, marginBottom: 24 }
const codeStyle = { fontSize: 36, fontWeight: 'bold', letterSpacing: 8, color: '#1a237e', textAlign: 'center' as const, margin: 0 }
const expireStyle = { fontSize: 12, color: '#767683', margin: 0 }
