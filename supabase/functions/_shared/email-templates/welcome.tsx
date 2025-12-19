import React from 'npm:react@18.3.1'
import {
  Heading,
  Text,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import { BaseLayout } from './base-layout.tsx'
import { Button } from './button.tsx'

interface WelcomeEmailProps {
  userName: string
  dashboardUrl?: string
}

export const WelcomeEmail = ({
  userName,
  dashboardUrl = 'https://aifeed.app',
}: WelcomeEmailProps) => (
  <BaseLayout preview={`Welcome to AI Feed, ${userName}! 🎉`}>
    <Heading style={heading}>
      Welcome to AI Feed! 🎉
    </Heading>
    
    <Text style={paragraph}>
      Hi {userName},
    </Text>
    
    <Text style={paragraph}>
      Thank you for joining AI Feed - the ultimate platform for discovering, 
      comparing, and sharing AI tools. We're excited to have you as part of our 
      growing community of AI enthusiasts!
    </Text>

    <Section style={featureSection}>
      <Text style={featureTitle}>Here's what you can do:</Text>
      
      <Text style={featureItem}>
        🔍 <strong>Discover</strong> - Browse 1000+ curated AI tools
      </Text>
      <Text style={featureItem}>
        ⚖️ <strong>Compare</strong> - Side-by-side tool comparisons
      </Text>
      <Text style={featureItem}>
        ⭐ <strong>Review</strong> - Share your experiences with tools
      </Text>
      <Text style={featureItem}>
        🤝 <strong>Connect</strong> - Network with AI professionals
      </Text>
      <Text style={featureItem}>
        📝 <strong>Share</strong> - Post articles and insights
      </Text>
    </Section>

    <Section style={buttonContainer}>
      <Button href={dashboardUrl}>
        Explore AI Tools
      </Button>
    </Section>

    <Hr style={hr} />

    <Text style={paragraph}>
      Need help getting started? Check out our{' '}
      <a href="https://aifeed.app/guidelines" style={link}>community guidelines</a>{' '}
      or reach out to our support team.
    </Text>

    <Text style={signature}>
      Happy exploring! 🚀<br />
      The AI Feed Team
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

const featureSection = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '20px 24px',
  margin: '24px 0',
}

const featureTitle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0 0 12px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
}

const featureItem = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#3c4149',
  margin: '0 0 8px',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 0',
}

const link = {
  color: '#3b82f6',
  textDecoration: 'underline',
}

const signature = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#3c4149',
  margin: '24px 0 0',
}

export default WelcomeEmail
