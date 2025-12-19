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

interface ConnectionRequestEmailProps {
  recipientName: string
  senderName: string
  senderTitle?: string
  senderPhoto?: string
  profileUrl: string
  message?: string
}

export const ConnectionRequestEmail = ({
  recipientName,
  senderName,
  senderTitle,
  senderPhoto,
  profileUrl,
  message,
}: ConnectionRequestEmailProps) => (
  <BaseLayout preview={`${senderName} wants to connect with you on AI Feed`}>
    <Heading style={heading}>
      New Connection Request 🤝
    </Heading>
    
    <Text style={paragraph}>
      Hi {recipientName || 'there'},
    </Text>
    
    <Text style={paragraph}>
      <strong>{senderName}</strong>{senderTitle ? `, ${senderTitle}` : ''} wants to connect 
      with you on AI Feed.
    </Text>

    <Section style={profileCard}>
      {senderPhoto ? (
        <Img
          src={senderPhoto}
          width="80"
          height="80"
          alt={senderName}
          style={avatar}
        />
      ) : (
        <div style={avatarPlaceholder}>
          {senderName.charAt(0).toUpperCase()}
        </div>
      )}
      <Text style={profileName}>{senderName}</Text>
      {senderTitle && <Text style={profileTitle}>{senderTitle}</Text>}
    </Section>

    {message && (
      <Section style={messageSection}>
        <Text style={messageLabel}>Message:</Text>
        <Text style={messageText}>"{message}"</Text>
      </Section>
    )}

    <Section style={buttonContainer}>
      <Button href={profileUrl} variant="success">
        Accept Request
      </Button>
      <span style={{ display: 'inline-block', width: '12px' }}></span>
      <Button href={profileUrl} variant="outline">
        View Profile
      </Button>
    </Section>

    <Hr style={hr} />

    <Text style={footerNote}>
      If you don't know this person, you can safely ignore this request.
    </Text>
  </BaseLayout>
)

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
}

const profileCard = {
  backgroundColor: '#f8fafc',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
}

const avatar = {
  borderRadius: '50%',
  margin: '0 auto 12px',
  display: 'block',
  objectFit: 'cover' as const,
}

const avatarPlaceholder = {
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #3b82f6, #a855f7)',
  margin: '0 auto 12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontSize: '32px',
  fontWeight: '700',
}

const profileName = {
  fontSize: '20px',
  fontWeight: '700',
  color: '#1a1a1a',
  margin: '0 0 4px',
}

const profileTitle = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0',
}

const messageSection = {
  backgroundColor: '#fff7ed',
  borderLeft: '4px solid #f59e0b',
  borderRadius: '0 8px 8px 0',
  padding: '16px 20px',
  margin: '24px 0',
}

const messageLabel = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#92400e',
  margin: '0 0 8px',
  textTransform: 'uppercase' as const,
}

const messageText = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#78350f',
  margin: '0',
  fontStyle: 'italic',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 0',
}

const footerNote = {
  fontSize: '14px',
  color: '#8898aa',
  textAlign: 'center' as const,
  margin: '0',
}

export default ConnectionRequestEmail
