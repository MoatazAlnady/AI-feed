import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/app/components/ThemeProvider'
import { AuthProvider } from '@/app/components/AuthProvider'
import { ChatDockProvider } from '@/app/components/ChatDockProvider'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'

const inter = Inter({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'AI Nexus - Discover the Best AI Tools',
  description: 'Your ultimate destination for discovering, exploring, and staying updated with the latest AI tools and technologies.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/ai-nexus-icon.svg" />
      </head>
      <body className={`${inter.className} min-h-screen bg-gray-50 dark:bg-gray-900`}>
        <ThemeProvider>
          <AuthProvider>
            <ChatDockProvider>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Header />
                <main>
                  {children}
                </main>
                <Footer />
              </div>
            </ChatDockProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}