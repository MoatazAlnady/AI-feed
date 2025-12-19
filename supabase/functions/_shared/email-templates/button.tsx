import React from 'npm:react@18.3.1'
import { Button as EmailButton } from 'npm:@react-email/components@0.0.22'

interface ButtonProps {
  href: string
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'outline'
}

export const Button = ({ href, children, variant = 'primary' }: ButtonProps) => {
  const getStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          ...baseButton,
          backgroundColor: '#6366f1',
        }
      case 'success':
        return {
          ...baseButton,
          backgroundColor: '#10b981',
        }
      case 'outline':
        return {
          ...baseButton,
          backgroundColor: '#ffffff',
          color: '#3b82f6',
          border: '2px solid #3b82f6',
        }
      default:
        return {
          ...baseButton,
          background: 'linear-gradient(135deg, #3b82f6 0%, #a855f7 100%)',
          backgroundColor: '#3b82f6',
        }
    }
  }

  return (
    <EmailButton href={href} style={getStyles()}>
      {children}
    </EmailButton>
  )
}

const baseButton = {
  display: 'inline-block',
  padding: '14px 28px',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.25)',
}

export default Button
