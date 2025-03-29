import { AuthProvider } from '@/components/AuthProvider';
import './globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Fixed Income Portfolio Optimizer',
  description: 'A sophisticated tool for optimizing fixed income portfolio investments',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
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
