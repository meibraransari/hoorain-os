import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { SettingsProvider } from '@/components/providers/SettingsProvider';
import { PrivacyProvider } from '@/components/providers/PrivacyProvider';

export const metadata: Metadata = {
  title: 'Hoorain — Self-Hosted Finance Platform',
  description: 'A production-grade personal finance management platform',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <QueryProvider>
            <AuthProvider>
              <SettingsProvider>
                <PrivacyProvider>
                  {children}
                </PrivacyProvider>
              </SettingsProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
