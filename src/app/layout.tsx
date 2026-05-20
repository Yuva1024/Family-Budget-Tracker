import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ClientProviders from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FamilyFlow — Ultimate Family Task, Budget & Investment Manager',
  description: 'Manage tasks, groceries, expenses, track investments (FDs, RDs, SIPs), and family communication in one beautifully designed dashboard.',
  keywords: 'family manager, task manager, budget tracker, investment tracker, family dashboard, family app, FD tracker, SIP tracker',
  authors: [{ name: 'FamilyFlow' }],
  openGraph: {
    title: 'FamilyFlow — Family Task & Investment Manager',
    description: 'Track your family tasks, budget, and investments in real-time.',
    url: 'https://familyflow.vercel.app',
    siteName: 'FamilyFlow',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FamilyFlow — Family Task & Investment Manager',
    description: 'Track your family tasks, budget, and investments in real-time.',
  },
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'FamilyFlow' },
};

export const viewport: Viewport = {
  themeColor: '#0f1117',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
