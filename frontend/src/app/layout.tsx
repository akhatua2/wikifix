"use client";
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '../components/Navbar';
import { ConfettiProvider } from '@/contexts/ConfettiContext';
import { ProgressProvider } from '@/contexts/ProgressContext';
import { usePathname } from 'next/navigation';
import { Analytics } from '@vercel/analytics/next';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>WikiFix</title>
        <link rel="icon" href="/wikifix.png" />
      </head>
      <body className={`${inter.className} bg-white min-h-screen`}>
        <ConfettiProvider>
          <ProgressProvider>
            <NavbarWrapper>
              {children}
            </NavbarWrapper>
          </ProgressProvider>
        </ConfettiProvider>
        <Analytics />
      </body>
    </html>
  );
}

function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isTaskPage = pathname?.startsWith('/tasks/') || pathname === '/tasks';
  const isOnboardingPage = pathname?.startsWith('/onboarding/');

  return (
    <>
      {!isTaskPage && !isOnboardingPage && <Navbar />}
      <main className="bg-white">{children}</main>
    </>
  );
}
