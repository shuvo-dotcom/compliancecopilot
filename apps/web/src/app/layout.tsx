import type { Metadata } from 'next'
import './globals.css'
import LockGate from '@/components/LockGate'

export const metadata: Metadata = {
  title: 'ComplianceCopilot',
  description: 'Self-hosted multi-agent compliance reviewer for GDPR & EU AI Act',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <LockGate>{children}</LockGate>
      </body>
    </html>
  )
}
