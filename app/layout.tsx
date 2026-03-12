import './globals.css';
import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from '@/src/lib/site';
import { ErrorBoundary } from './components/error-boundary';

const jetbrains = JetBrains_Mono({
 subsets: ['latin'],
 variable: '--font-mono',
 display: 'swap',
});

export const metadata: Metadata = {
 metadataBase: new URL(SITE_URL),
 title: {
 default: `${SITE_NAME} — ${SITE_TAGLINE}`,
 template: `%s · ${SITE_NAME}`,
 },
 description: SITE_TAGLINE,
 openGraph: {
 title: SITE_NAME,
 description: SITE_TAGLINE,
 siteName: SITE_NAME,
 type: 'website',
 },
 twitter: {
 card: 'summary_large_image',
 title: SITE_NAME,
 description: SITE_TAGLINE,
 },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
 return (
 <html lang="en" className={jetbrains.variable}>
 <body>
 <ErrorBoundary>{children}</ErrorBoundary>
 </body>
 </html>
 );
}
