import type { Metadata } from 'next';
import { DM_Serif_Display, DM_Sans } from 'next/font/google';
import './globals.css';
import { RestaurantProvider } from '@/context/RestaurantContext';
import { ToastProvider } from '@/context/ToastContext';

const dmSerifDisplay = DM_Serif_Display({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const dmSans = DM_Sans({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TableFlow — Restaurant & Café Ordering SaaS',
  description: 'Complete restaurant management: QR ordering, kitchen display, floor plan, reservations, and loyalty.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSerifDisplay.variable} ${dmSans.variable}`}>
      <body className="font-body bg-background text-primary antialiased">
        <RestaurantProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </RestaurantProvider>
      </body>
    </html>
  );
}
