import './display.css';
import { ThemeProvider } from './ThemeProvider';
import { Poppins } from 'next/font/google';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Al-Judi Masjid - Display',
};

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-poppins',
});

export default function DisplayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <main
        className={`display-root ${poppins.variable}`}
      >
        {children}
      </main>
    </ThemeProvider>
  );
}
