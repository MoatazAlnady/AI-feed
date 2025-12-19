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

interface JobApplicationEmailProps {
  employerName: string
  employerEmail: string
  jobTitle: string
  companyName: string
  candidateName: string
  candidatePhoto?: string
  candidateTitle?: string
  candidateLocation?: string
  applicationUrl: string
  coverLetter?: string
}

export const JobApplicationEmail = ({
  employerName,
  jobTitle,
  companyName,
  candidateName,
  candidatePhoto,
  candidateTitle,
  candidateLocation,
  applicationUrl,
  coverLetter,
}: JobApplicationEmailProps) => (
  <BaseLayout preview={`New application for ${jobTitle} from ${candidateName}`}>
    <Section style={badgeSection}>
      <Text style={badge}>📋 New Application</Text>
    </Section>

    <Heading style={heading}>
      New Job Application
    </Heading>
    
    <Text style={paragraph}>
      Hi {employerName},
    </Text>
    
    <Text style={paragraph}>
      Great news! You've received a new application for the <strong>{jobTitle}</strong> position 
      at <strong>{companyName}</strong>.
    </Text>

    <Section style={candidateCard}>
      <table style={{ width: '100%' }}>
        <tr>
          <td style={{ width: '80px', verticalAlign: 'top' }}>
            {candidatePhoto ? (
              <Img
                src={candidatePhoto}
                width="60"
                height="60"
                alt={candidateName}
                style={avatar}
              />
            ) : (
              <div style={avatarPlaceholder}>
                {candidateName.charAt(0).toUpperCase()}
              </div>
            )}
          </td>
          <td style={{ verticalAlign: 'top' }}>
            <Text style={candidateNameStyle}>{candidateName}</Text>
            {candidateTitle && <Text style={candidateTitleStyle}>{candidateTitle}</Text>}
            {candidateLocation && <Text style={candidateLocationStyle}>📍 {candidateLocation}</Text>}
          </td>
        </tr>
      </table>
    </Section>

    {coverLetter && (
      <Section style={coverLetterSection}>
        <Text style={coverLetterLabel}>Cover Letter</Text>
        <Text style={coverLetterText}>{coverLetter}</Text>
      </Section>
    )}

    <Section style={buttonContainer}>
      <Button href={applicationUrl}>
        Review Application
      </Button>
    </Section>

    <Hr style={hr} />

    <Section style={tipsSection}>
      <Text style={tipsTitle}>Quick Tips:</Text>
      <Text style={tipsItem}>• Respond within 48 hours for best candidate experience</Text>
      <Text style={tipsItem}>• Use AI Feed's messaging to reach out directly</Text>
      <Text style={tipsItem}>• Save promising candidates to your projects</Text>
    </Section>
  </BaseLayout>
)

const badgeSection = {
  textAlign: 'center' as const,
  margin: '0 0 16px',
}

const badge = {
  display: 'inline-block',
  backgroundColor: '#dcfce7',
  color: '#166534',
  fontSize: '14px',
  fontWeight: '600',
  padding: '8px 16px',
  borderRadius: '20px',
  margin: '0',
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
}

const candidateCard = {
  backgroundColor: '#f8fafc',
  borderRadius: '12px',
  padding: '20px',
  margin: '24px 0',
}

const avatar = {
  borderRadius: '50%',
  objectFit: 'cover' as const,
}

const avatarPlaceholder = {
  width: '60px',
  height: '60px',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #3b82f6, #a855f7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontSize: '24px',
  fontWeight: '700',
}

const candidateNameStyle = {
  fontSize: '18px',
  fontWeight: '700',
  color: '#1a1a1a',
  margin: '0 0 4px',
}

const candidateTitleStyle = {
  fontSize: '14px',
  color: '#3b82f6',
  margin: '0 0 4px',
}

const candidateLocationStyle = {
  fontSize: '13px',
  color: '#6b7280',
  margin: '0',
}

const coverLetterSection = {
  backgroundColor: '#fffbeb',
  borderLeft: '4px solid #f59e0b',
  borderRadius: '0 8px 8px 0',
  padding: '16px 20px',
  margin: '24px 0',
}

const coverLetterLabel = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#92400e',
  margin: '0 0 8px',
  textTransform: 'uppercase' as const,
}

const coverLetterText = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#78350f',
  margin: '0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 0',
}

const tipsSection = {
  backgroundColor: '#eff6ff',
  borderRadius: '8px',
  padding: '16px 20px',
}

const tipsTitle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#1e40af',
  margin: '0 0 12px',
}

const tipsItem = {
  fontSize: '13px',
  color: '#1e3a8a',
  margin: '0 0 6px',
  lineHeight: '20px',
}

export default JobApplicationEmail
