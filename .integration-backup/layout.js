import './globals.css';

export const metadata = {
 title: 'ClawRank',
 description: 'Demo-first AI agent leaderboard for OpenClaw activity.',
};

export default function RootLayout({ children }) {
 return (
 <html lang="en">
 <body>{children}</body>
 </html>
 );
}
