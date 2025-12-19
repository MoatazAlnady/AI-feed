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

type NotificationType = 'announcement' | 'invite' | 'mention' | 'new_member' | 'post'

interface GroupNotificationEmailProps {
  recipientName: string
  recipientEmail: string
  groupName: string
  groupImageUrl?: string
  notificationType: NotificationType
  actionUrl: string
  content?: string
  senderName?: string
  senderPhoto?: string
}

export const GroupNotificationEmail = ({
  recipientName,
  groupName,
  groupImageUrl,
  notificationType,
  actionUrl,
  content,
  senderName,
  senderPhoto,
}: GroupNotificationEmailProps) => {
  const getConfig = () => {
    switch (notificationType) {
      case 'announcement':
        return {
          icon: '📢',
          title: 'New Announcement',
          description: `There's a new announcement in ${groupName}`,
          buttonText: 'View Announcement',
        }
      case 'invite':
        return {
          icon: '🎉',
          title: 'Group Invitation',
          description: `You've been invited to join ${groupName}`,
          buttonText: 'Accept Invitation',
        }
      case 'mention':
        return {
          icon: '@',
          title: 'You Were Mentioned',
          description: `${senderName || 'Someone'} mentioned you in ${groupName}`,
          buttonText: 'View Mention',
        }
      case 'new_member':
        return {
          icon: '👋',
          title: 'New Member Joined',
          description: `${senderName || 'Someone'} joined ${groupName}`,
          buttonText: 'View Group',
        }
      case 'post':
        return {
          icon: '📝',
          title: 'New Post',
          description: `${senderName || 'Someone'} posted in ${groupName}`,
          buttonText: 'View Post',
        }
      default:
        return {
          icon: '🔔',
          title: 'Group Update',
          description: `New activity in ${groupName}`,
          buttonText: 'View Group',
        }
    }
  }

  const config = getConfig()

  return (
    <BaseLayout preview={`${config.icon} ${config.title} - ${groupName}`}>
      <Section style={headerSection}>
        <Text style={typeBadge}>{config.icon} {config.title}</Text>
      </Section>

      <Section style={groupHeader}>
        {groupImageUrl ? (
          <Img
            src={groupImageUrl}
            width="60"
            height="60"
            alt={groupName}
            style={groupImage}
          />
        ) : (
          <div style={groupImagePlaceholder}>
            {groupName.charAt(0).toUpperCase()}
          </div>
        )}
        <Text style={groupNameStyle}>{groupName}</Text>
      </Section>

      <Text style={paragraph}>
        Hi {recipientName || 'there'},
      </Text>
      
      <Text style={paragraph}>{config.description}</Text>

      {senderName && (
        <Section style={senderCard}>
          {senderPhoto ? (
            <Img
              src={senderPhoto}
              width="40"
              height="40"
              alt={senderName}
              style={senderAvatar}
            />
          ) : (
            <div style={senderAvatarPlaceholder}>
              {senderName.charAt(0).toUpperCase()}
            </div>
          )}
          <Text style={senderNameStyle}>{senderName}</Text>
        </Section>
      )}

      {content && (
        <Section style={contentSection}>
          <Text style={contentText}>"{content}"</Text>
        </Section>
      )}

      <Section style={buttonContainer}>
        <Button href={actionUrl}>
          {config.buttonText}
        </Button>
      </Section>

      <Hr style={hr} />

      <Text style={footerNote}>
        You're receiving this because you're a member of {groupName}. 
        Manage your notification preferences in your account settings.
      </Text>
    </BaseLayout>
  )
}

const headerSection = {
  textAlign: 'center' as const,
  margin: '0 0 16px',
}

const typeBadge = {
  display: 'inline-block',
  backgroundColor: '#dbeafe',
  color: '#1e40af',
  fontSize: '14px',
  fontWeight: '600',
  padding: '8px 16px',
  borderRadius: '20px',
  margin: '0',
}

const groupHeader = {
  textAlign: 'center' as const,
  margin: '24px 0',
}

const groupImage = {
  borderRadius: '12px',
  objectFit: 'cover' as const,
  margin: '0 auto 12px',
  display: 'block',
}

const groupImagePlaceholder = {
  width: '60px',
  height: '60px',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, #3b82f6, #a855f7)',
  margin: '0 auto 12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontSize: '24px',
  fontWeight: '700',
}

const groupNameStyle = {
  fontSize: '20px',
  fontWeight: '700',
  color: '#1a1a1a',
  margin: '0',
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#3c4149',
  margin: '0 0 16px',
}

const senderCard = {
  display: 'flex',
  alignItems: 'center',
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '12px 16px',
  margin: '16px 0',
}

const senderAvatar = {
  borderRadius: '50%',
  marginRight: '12px',
}

const senderAvatarPlaceholder = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #3b82f6, #a855f7)',
  marginRight: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontSize: '16px',
  fontWeight: '700',
}

const senderNameStyle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0',
}

const contentSection = {
  backgroundColor: '#f8fafc',
  borderLeft: '4px solid #3b82f6',
  borderRadius: '0 8px 8px 0',
  padding: '16px 20px',
  margin: '16px 0',
}

const contentText = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#3c4149',
  fontStyle: 'italic',
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

const footerNote = {
  fontSize: '13px',
  color: '#8898aa',
  textAlign: 'center' as const,
  margin: '0',
}

export default GroupNotificationEmail
