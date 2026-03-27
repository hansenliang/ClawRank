import './globals.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';
import '@fontsource/jetbrains-mono/700.css';
import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from '@/src/lib/site';
import { ErrorBoundary } from './components/error-boundary';

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
 icons: {
 icon: '/icon.svg',
 shortcut: '/icon.svg',
 apple: '/icon.svg',
 },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
 return (
 <html lang="en">
 <body>
 <ErrorBoundary>{children}</ErrorBoundary>
 <Analytics />
 </body>
 </html>
 );
}
