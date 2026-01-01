import './globals.css';
import Providers from '../components/Providers';

export const metadata = {
  title: 'FolderTree PRO - AI-Powered File Organization',
  description: 'Transform chaos into clarity with intelligent file management powered by AI. Automatically organize, classify, and optimize your folder structure.',
  keywords: 'file organization, AI, productivity, folder management, automation',
  authors: [{ name: 'FolderTree PRO' }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2563eb',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <meta name="google" content="notranslate" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50"
        translate="no"
        suppressHydrationWarning
        data-gramm="false"
        data-gramm_editor="false"
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}