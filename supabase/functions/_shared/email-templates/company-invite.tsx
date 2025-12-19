import React from 'npm:react@18.3.1'
import {
  Heading,
  Text,
  Section,
  Img,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import { BaseLayout } from './base-layout.tsx'
import { Button } from './button.tsx'

interface CompanyInviteEmailProps {
  email: string
  companyName: string
  companyLogo?: string
  role: 'admin' | 'manager' | 'employee'
  inviterName: string
  inviteLink: string
}

export const CompanyInviteEmail = ({
  email,
  companyName,
  companyLogo,
  role,
  inviterName,
  inviteLink,
}: CompanyInviteEmailProps) => {
  const roleLabels: Record<string, string> = {
    admin: 'Admin',
    manager: 'Manager',
    employee: 'Team Member',
  }

  return (
    <BaseLayout preview={`You're invited to join ${companyName} on AI Feed`}>
      <Section style={logoSection}>
        {companyLogo ? (
          <Img
            src={companyLogo}
            height="60"
            alt={companyName}
            style={companyLogoStyle}
          />
        ) : (
          <div style={logoPlaceholder}>
            {companyName.charAt(0).toUpperCase()}
          </div>
        )}
      </Section>

      <Heading style={heading}>
        You're Invited to Join {companyName}
      </Heading>
      
      <Text style={paragraph}>
        Hello,
      </Text>
      
      <Text style={paragraph}>
        <strong>{inviterName}</strong> has invited you to join <strong>{companyName}</strong> as 
        a <strong>{roleLabels[role] || role}</strong>.
      </Text>

      <Section style={detailsSection}>
        <table style={{ width: '100%' }}>
          <tr>
            <td style={detailLabel}>Company</td>
            <td style={detailValue}>{companyName}</td>
          </tr>
          <tr>
            <td style={detailLabel}>Your Role</td>
            <td style={detailValue}>{roleLabels[role] || role}</td>
          </tr>
          <tr>
            <td style={detailLabel}>Invited By</td>
            <td style={detailValue}>{inviterName}</td>
          </tr>
        </table>
      </Section>

      <Text style={paragraph}>
        Click the button below to accept the invitation and join the team.
      </Text>

      <Section style={buttonContainer}>
        <Button href={inviteLink}>
          Accept Invitation
        </Button>
      </Section>

      <Section style={linkSection}>
        <Text style={linkLabel}>Or copy and paste this link:</Text>
        <Text style={linkUrl}>{inviteLink}</Text>
      </Section>

      <Hr style={hr} />

      <Section style={warningSection}>
        <Text style={warningText}>
          ⏰ This invitation expires in 7 days.
        </Text>
        <Text style={footerNote}>
          If you didn't expect this invitation, you can safely ignore this email.
        </Text>
      </Section>
    </BaseLayout>
  )
}

const logoSection = {
  textAlign: 'center' as const,
  margin: '0 0 24px',
}

const companyLogoStyle = {
  maxWidth: '200px',
  margin: '0 auto',
}

const logoPlaceholder = {
  width: '60px',
  height: '60px',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  margin: '0 auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontSize: '24px',
  fontWeight: '700',
}

const heading = {
  fontSize: '24px',
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
}

const detailsSection = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '20px 24px',
  margin: '24px 0',
}

const detailLabel = {
  fontSize: '13px',
  color: '#6b7280',
  padding: '8px 0',
  width: '120px',
}

const detailValue = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#1a1a1a',
  padding: '8px 0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const linkSection = {
  textAlign: 'center' as const,
  margin: '24px 0',
}

const linkLabel = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0 0 8px',
}

const linkUrl = {
  fontSize: '13px',
  color: '#3b82f6',
  wordBreak: 'break-all' as const,
  margin: '0',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 0',
}

const warningSection = {
  backgroundColor: '#fafafa',
  borderRadius: '8px',
  padding: '16px 20px',
}

const warningText = {
  fontSize: '14px',
  color: '#71717a',
  textAlign: 'center' as const,
  margin: '0 0 8px',
}

const footerNote = {
  fontSize: '12px',
  color: '#a1a1aa',
  textAlign: 'center' as const,
  margin: '0',
}

export default CompanyInviteEmail
