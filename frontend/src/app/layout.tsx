import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '../components/Navbar';
import { ConfettiProvider } from '@/contexts/ConfettiContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'WikiFix',
  description: 'Verify claims on Wikipedia and contribute to improving online information.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white min-h-screen`}>
        <ConfettiProvider>
          <Navbar />
          <main className="bg-white">{children}</main>
        </ConfettiProvider>
      </body>
    </html>
  );
}
