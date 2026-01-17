import React from 'npm:react@18.3.1'
import {
  Text,
  Img,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import { BaseLayout } from './base-layout.tsx'
import { PrimaryButton } from './button.tsx'

interface EventInvitationEmailProps {
  inviteeName: string
  inviterName: string
  inviterPhoto?: string
  eventTitle: string
  eventDate: string
  eventTime?: string
  eventLocation?: string
  eventUrl: string
}

export const EventInvitationEmail = ({
  inviteeName = 'there',
  inviterName = 'Someone',
  inviterPhoto,
  eventTitle = 'Event',
  eventDate = '',
  eventTime,
  eventLocation,
  eventUrl = 'https://aifeed.app',
}: EventInvitationEmailProps) => {
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  return (
    <BaseLayout preview={`You're invited to "${eventTitle}"`}>
      <Section style={inviterSection}>
        {inviterPhoto && (
          <Img
            src={inviterPhoto}
            width="60"
            height="60"
            alt={inviterName}
            style={inviterAvatar}
          />
        )}
        <Text style={inviterText}>
          <strong>{inviterName}</strong> invited you
        </Text>
      </Section>

      <Text style={greeting}>
        Hi {inviteeName},
      </Text>

      <Text style={paragraph}>
        You've been invited to an event on AI Feed! Here are the details:
      </Text>

      <Section style={eventCard}>
        <Text style={eventTitle as React.CSSProperties}>
          📅 {eventTitle}
        </Text>
        
        <Hr style={divider} />
        
        <Text style={eventDetail}>
          <strong>Date:</strong> {formatDate(eventDate)}
        </Text>
        
        {eventTime && (
          <Text style={eventDetail}>
            <strong>Time:</strong> {eventTime}
          </Text>
        )}
        
        {eventLocation && (
          <Text style={eventDetail}>
            <strong>Location:</strong> {eventLocation}
          </Text>
        )}
      </Section>

      <Section style={buttonContainer}>
        <PrimaryButton href={eventUrl}>
          View Event & RSVP
        </PrimaryButton>
      </Section>

      <Text style={footerNote}>
        Click the button above to see more details and let {inviterName} know if you're attending.
      </Text>
    </BaseLayout>
  )
}

// Styles
const inviterSection = {
  textAlign: 'center' as const,
  marginBottom: '24px',
}

const inviterAvatar = {
  borderRadius: '50%',
  margin: '0 auto 12px',
}

const inviterText = {
  fontSize: '16px',
  color: '#374151',
  margin: '0',
}

const greeting = {
  fontSize: '18px',
  lineHeight: '28px',
  color: '#1f2937',
  margin: '0 0 16px',
}

const paragraph = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#4b5563',
  margin: '0 0 24px',
}

const eventCard = {
  backgroundColor: '#f3f4f6',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '24px',
  border: '1px solid #e5e7eb',
}

const eventTitle = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#1f2937',
  margin: '0 0 16px',
}

const divider = {
  borderTop: '1px solid #d1d5db',
  margin: '16px 0',
}

const eventDetail = {
  fontSize: '14px',
  lineHeight: '24px',
  color: '#4b5563',
  margin: '0 0 8px',
}

const buttonContainer = {
  textAlign: 'center' as const,
  marginBottom: '24px',
}

const footerNote = {
  fontSize: '13px',
  lineHeight: '20px',
  color: '#6b7280',
  textAlign: 'center' as const,
  margin: '0',
}

export default EventInvitationEmail
