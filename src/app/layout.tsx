import { AuthProvider } from '@/components/AuthProvider';
import './globals.css';
import { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700']
});

export const metadata: Metadata = {
  title: 'Investment Portfolio',
  description: 'A sophisticated tool for optimizing fixed income portfolio investments',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full ${inter.className}`}>
      <body className="h-full transition-colors duration-200">
        <AuthProvider>
          <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
