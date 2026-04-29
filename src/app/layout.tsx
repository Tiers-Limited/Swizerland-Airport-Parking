import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
// import "antd/dist/reset.css"; 

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ZurichPark - Airport Parking Made Easy',
  description: 'Book secure airport parking near Zurich Airport (ZRH). Compare prices, find the best spots, and book in minutes.',
  keywords: 'Zurich airport parking, ZRH parking, Switzerland parking, secure parking',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className="scroll-smooth">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
