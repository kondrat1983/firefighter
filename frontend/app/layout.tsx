import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import PasswordGate from '@/components/PasswordGate';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Firefighter - Bug Radar for Live Games',
  description: 'QA Intelligence tool that monitors community sources and detects early signs of live issues',
  keywords: ['QA', 'gaming', 'bug tracking', 'live monitoring', 'community intelligence'],
  authors: [{ name: 'Firefighter Team' }],
  icons: {
    icon: '/firefighter/favicon.ico',
    shortcut: '/firefighter/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-background text-foreground`}>
        <div className="relative flex min-h-screen">
          {/* Mission Control Background */}
          <div className="fixed inset-0 bg-gradient-to-br from-background via-background-secondary to-background opacity-80" />
          <div className="fixed inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(14,165,233,0.1)_0%,transparent_50%)]" />
          <div className="fixed inset-0 bg-[radial-gradient(circle_at_75%_75%,rgba(139,92,246,0.05)_0%,transparent_50%)]" />
          
          {/* Main Content */}
          <main className="relative z-10 w-full">
            <PasswordGate>
              {children}
            </PasswordGate>
          </main>
        </div>
      </body>
    </html>
  );
}