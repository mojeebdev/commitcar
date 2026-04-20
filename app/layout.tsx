import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'CommitCar — Your commits drive a car',
  description: 'Paste your GitHub. We build a car from how you ship. A BlindspotLab experiment by @mojeebeth.',
  openGraph: {
    title: 'CommitCar',
    description: 'Your commits drive a car.',
    url: 'https://commitcar.vercel.app',
    siteName: 'CommitCar',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CommitCar',
    description: 'Your commits drive a car.',
    creator: '@mojeebeth',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://api.fontshare.com/v2/css?f[]=neue-machina@400,500,700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Azeret+Mono:wght@300;400;500&family=Barlow+Condensed:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <Script
          src="https://cloud.umami.is/script.js"
          data-website-id="650f0dde-57f9-4132-a9e7-17b375765703"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
