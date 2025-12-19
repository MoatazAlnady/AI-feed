import React from 'npm:react@18.3.1'
import {
  Heading,
  Text,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import { BaseLayout } from './base-layout.tsx'
import { Button } from './button.tsx'

interface MagicLinkEmailProps {
  supabaseUrl: string
  tokenHash: string
  emailActionType: string
  redirectTo: string
  token?: string
}

export const MagicLinkEmail = ({
  supabaseUrl,
  tokenHash,
  emailActionType,
  redirectTo,
  token,
}: MagicLinkEmailProps) => {
  const magicLink = `${supabaseUrl}/auth/v1/verify?token=${tokenHash}&type=${emailActionType}&redirect_to=${redirectTo}`

  return (
    <BaseLayout preview="Log in to AI Feed with this magic link">
      <Heading style={heading}>
        🔐 Login to AI Feed
      </Heading>
      
      <Text style={paragraph}>
        Click the button below to securely log in to your AI Feed account. 
        This link is valid for 1 hour.
      </Text>

      <Section style={buttonContainer}>
        <Button href={magicLink}>
          Log In to AI Feed
        </Button>
      </Section>

      {token && (
        <Section style={codeSection}>
          <Text style={codeLabel}>Or enter this one-time code:</Text>
          <Text style={codeText}>{token}</Text>
        </Section>
      )}

      <Hr style={hr} />

      <Section style={warningSection}>
        <Text style={warningTitle}>🔒 Security Notice</Text>
        <Text style={warningText}>
          If you didn't request this login link, you can safely ignore this email. 
          Never share this link with anyone.
        </Text>
      </Section>

      <Text style={footerText}>
        This link will expire in 1 hour for your security.
      </Text>
    </BaseLayout>
  )
}

const heading = {
  fontSize: '28px',
  fontWeight: '700',
  color: '#1a1a1a',
  margin: '0 0 24px',
  textAlign: 'center' as const,
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#3c4149',
  margin: '0 0 16px',
  textAlign: 'center' as const,
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const codeSection = {
  textAlign: 'center' as const,
  margin: '24px 0',
}

const codeLabel = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0 0 12px',
}

const codeText = {
  display: 'inline-block',
  backgroundColor: '#f3f4f6',
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '700',
  fontFamily: 'monospace',
  padding: '16px 32px',
  borderRadius: '8px',
  border: '1px solid #e5e7eb',
  letterSpacing: '4px',
  margin: '0',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 0',
}

const warningSection = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '16px 20px',
  margin: '24px 0',
}

const warningTitle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#92400e',
  margin: '0 0 8px',
}

const warningText = {
  fontSize: '13px',
  color: '#92400e',
  margin: '0',
  lineHeight: '20px',
}

const footerText = {
  fontSize: '13px',
  color: '#8898aa',
  textAlign: 'center' as const,
  margin: '24px 0 0',
}

export default MagicLinkEmail
