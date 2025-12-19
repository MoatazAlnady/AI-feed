import React from 'npm:react@18.3.1'
import {
  Heading,
  Text,
  Section,
  Img,
  Hr,
  Link,
} from 'npm:@react-email/components@0.0.22'
import { BaseLayout } from './base-layout.tsx'
import { Button } from './button.tsx'

interface NewsletterItem {
  title: string
  description: string
  url: string
  imageUrl?: string
  category: string
}

interface NewsletterDigestEmailProps {
  recipientName?: string
  subject: string
  introText: string
  items: NewsletterItem[]
  unsubscribeUrl: string
}

export const NewsletterDigestEmail = ({
  recipientName,
  subject,
  introText,
  items,
  unsubscribeUrl,
}: NewsletterDigestEmailProps) => (
  <BaseLayout preview={subject}>
    <Section style={headerSection}>
      <Text style={dateBadge}>
        📰 Weekly Digest • {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
      </Text>
    </Section>

    <Heading style={heading}>{subject}</Heading>
    
    {recipientName && (
      <Text style={greeting}>Hi {recipientName},</Text>
    )}
    
    <Text style={paragraph}>{introText}</Text>

    <Hr style={hr} />

    {items.map((item, index) => (
      <Section key={index} style={itemCard}>
        {item.imageUrl && (
          <Img
            src={item.imageUrl}
            width="100%"
            height="160"
            alt={item.title}
            style={itemImage}
          />
        )}
        <Text style={itemCategory}>{item.category}</Text>
        <Link href={item.url} style={itemTitleLink}>
          <Text style={itemTitle}>{item.title}</Text>
        </Link>
        <Text style={itemDescription}>{item.description}</Text>
        <Link href={item.url} style={readMore}>
          Read more →
        </Link>
      </Section>
    ))}

    <Hr style={hr} />

    <Section style={buttonContainer}>
      <Button href="https://aifeed.app/tools">
        Explore All Tools
      </Button>
    </Section>

    <Section style={unsubscribeSection}>
      <Text style={unsubscribeText}>
        You're receiving this email because you subscribed to AI Feed updates.{' '}
        <Link href={unsubscribeUrl} style={unsubscribeLink}>
          Unsubscribe
        </Link>
      </Text>
    </Section>
  </BaseLayout>
)

const headerSection = {
  textAlign: 'center' as const,
  margin: '0 0 16px',
}

const dateBadge = {
  display: 'inline-block',
  backgroundColor: '#f3f4f6',
  color: '#4b5563',
  fontSize: '13px',
  fontWeight: '500',
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

const greeting = {
  fontSize: '16px',
  color: '#3c4149',
  margin: '0 0 8px',
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#3c4149',
  margin: '0 0 16px',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 0',
}

const itemCard = {
  marginBottom: '24px',
}

const itemImage = {
  borderRadius: '12px',
  objectFit: 'cover' as const,
  marginBottom: '12px',
}

const itemCategory = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#3b82f6',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 8px',
}

const itemTitleLink = {
  textDecoration: 'none',
}

const itemTitle = {
  fontSize: '18px',
  fontWeight: '700',
  color: '#1a1a1a',
  margin: '0 0 8px',
  lineHeight: '26px',
}

const itemDescription = {
  fontSize: '14px',
  lineHeight: '22px',
  color: '#6b7280',
  margin: '0 0 12px',
}

const readMore = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#3b82f6',
  textDecoration: 'none',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const unsubscribeSection = {
  textAlign: 'center' as const,
  marginTop: '24px',
}

const unsubscribeText = {
  fontSize: '13px',
  color: '#8898aa',
  margin: '0',
}

const unsubscribeLink = {
  color: '#3b82f6',
  textDecoration: 'underline',
}

export default NewsletterDigestEmail
