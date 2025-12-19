import React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Img,
  Text,
  Link,
} from 'npm:@react-email/components@0.0.22'

interface BaseLayoutProps {
  preview: string
  children: React.ReactNode
}

export const BaseLayout = ({ preview, children }: BaseLayoutProps) => (
  <Html>
    <Head />
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header with Logo */}
        <Section style={header}>
          <Img
            src="https://aifeed.app/favicon.png"
            width="40"
            height="40"
            alt="AI Feed"
            style={logo}
          />
          <Text style={brandName}>AI Feed</Text>
        </Section>

        {/* Main Content */}
        <Section style={content}>
          {children}
        </Section>

        {/* Footer */}
        <Section style={footer}>
          <Text style={footerText}>
            © {new Date().getFullYear()} AI Feed. All rights reserved.
          </Text>
          <Text style={footerLinks}>
            <Link href="https://aifeed.app" style={footerLink}>Visit AI Feed</Link>
            {' • '}
            <Link href="https://aifeed.app/settings" style={footerLink}>Manage Preferences</Link>
            {' • '}
            <Link href="https://aifeed.app/unsubscribe" style={footerLink}>Unsubscribe</Link>
          </Text>
          <Text style={footerAddress}>
            AI Feed - The Ultimate AI Tools Platform
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0',
  marginBottom: '64px',
  borderRadius: '12px',
  maxWidth: '600px',
}

const header = {
  padding: '24px 32px',
  borderBottom: '1px solid #e6ebf1',
  textAlign: 'center' as const,
}

const logo = {
  display: 'inline-block',
  verticalAlign: 'middle',
}

const brandName = {
  display: 'inline-block',
  verticalAlign: 'middle',
  marginLeft: '12px',
  fontSize: '24px',
  fontWeight: '700',
  background: 'linear-gradient(135deg, #3b82f6, #a855f7)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  color: '#3b82f6',
}

const content = {
  padding: '32px',
}

const footer = {
  padding: '24px 32px',
  borderTop: '1px solid #e6ebf1',
  textAlign: 'center' as const,
}

const footerText = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '0 0 8px',
}

const footerLinks = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '0 0 8px',
}

const footerLink = {
  color: '#3b82f6',
  textDecoration: 'underline',
}

const footerAddress = {
  color: '#8898aa',
  fontSize: '11px',
  lineHeight: '14px',
  margin: '0',
}

export default BaseLayout
