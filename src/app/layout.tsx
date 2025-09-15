import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'OMAMORI - Traditional Savings Charm',
  description: 'ElizaOS Certified Cultural Preservation DeFi Agent',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>{children}</body>
    </html>
  );
}