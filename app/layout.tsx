import type { Metadata } from 'next';
import { Assistant } from 'next/font/google';
import './globals.css';

const assistant = Assistant({
  subsets: ['latin', 'hebrew'],
  variable: '--font-assistant',
});

export const metadata: Metadata = {
  title: 'Whispr - הודעה לעתיד שלך',
  description: 'תקשורת רגשית עם עצמך בזמן - כתיבת הודעות לעתיד, פתיחתן בתאריך יעד, וניהול תאריכים רגשיים',
  manifest: '/manifest.json',
  themeColor: '#FAF7F0',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Whispr',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${assistant.variable} font-sans antialiased bg-cream text-deep-blue`}>
        {children}
      </body>
    </html>
  );
}
