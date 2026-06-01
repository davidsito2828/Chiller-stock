import './globals.css';

export const metadata = {
  title: 'Chiller System — Control de Stock',
  description: 'Sistema interno de control de stock y pedidos',
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#0000DE',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/logo-chillersystem.jpeg" />
      </head>
      <body>{children}</body>
    </html>
  );
}
