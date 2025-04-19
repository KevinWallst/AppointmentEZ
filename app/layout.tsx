import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AppointmentEZ',
  description: 'A simple and elegant appointment booking system',
  keywords: ['appointment', 'booking', 'calendar', 'schedule', 'reservation'],
  authors: [{ name: 'Kevin Zhu' }],
  creator: 'Kevin Zhu',
  publisher: 'AppointmentEZ',
  applicationName: 'AppointmentEZ',
  formatDetection: {
    email: true,
    address: true,
    telephone: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}