"use client";
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '../components/Navbar';
import { ConfettiProvider } from '@/contexts/ConfettiContext';
import { ProgressProvider } from '@/contexts/ProgressContext';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-white min-h-screen`}>
        <ConfettiProvider>
          <ProgressProvider>
            <NavbarWrapper>
              {children}
            </NavbarWrapper>
          </ProgressProvider>
        </ConfettiProvider>
      </body>
    </html>
  );
}

function NavbarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isTaskPage = pathname?.startsWith('/tasks/') || pathname === '/tasks';

  return (
    <>
      {!isTaskPage && <Navbar />}
      <main className="bg-white">{children}</main>
    </>
  );
}
