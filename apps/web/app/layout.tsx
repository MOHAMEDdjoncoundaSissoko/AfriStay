import type { Metadata } from 'next';
import '@/styles/globals.css';
import { ThemeProvider } from '@/providers/theme-provider';
import { CurrencyProvider } from '@/lib/currency/currency-context';

export const metadata: Metadata = {
  title: "AfriStay — Découvrez l'Afrique, chez vous",
  description:
    "Réservez des logements uniques dans les plus belles villes d'Afrique de l'Ouest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#D4522A" />
      </head>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <ThemeProvider>
          <CurrencyProvider>
            {children}
          </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}