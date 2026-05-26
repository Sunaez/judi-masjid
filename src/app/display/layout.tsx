import './display.css';
import { ThemeProvider } from './ThemeProvider';
import { PrayerTimesProvider } from './context/PrayerTimesContext';
import { DebugProvider } from './context/DebugContext';
import AutoReloadOnNewVersion from './Components/AutoReloadOnNewVersion';
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

const getDeploymentVersion = () =>
  process.env.VERCEL_GIT_COMMIT_SHA ??
  process.env.VERCEL_DEPLOYMENT_ID ??
  'development';

export default function DisplayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const deploymentVersion = getDeploymentVersion();

  return (
    <PrayerTimesProvider>
      <DebugProvider>
        <ThemeProvider>
          <AutoReloadOnNewVersion currentVersion={deploymentVersion} />
          <main
            className={`display-root ${poppins.variable}`}
          >
            {children}
          </main>
        </ThemeProvider>
      </DebugProvider>
    </PrayerTimesProvider>
  );
}
