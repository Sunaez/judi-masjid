// src/lib/firebase/prayerTimes.ts
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  getDocs,
  writeBatch,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import type { RawPrayerTimes } from '@/app/FetchPrayerTimes';

/**
 * Firestore prayer time document structure
 */
export interface PrayerTimeDocument extends RawPrayerTimes {
  date: string; // DD/MM/YYYY format
  dayOfWeek?: string; // Monday, Tuesday, etc.
  isFriday?: boolean; // For purple styling
  archived?: boolean; // For archiving old prayer times
  lastUpdated: Timestamp;
}

/**
 * Parse a DD/MM/YYYY date string into year, month, day components
 */
function parseDateString(dateStr: string): { year: string; month: string; day: string } {
  const [day, month, year] = dateStr.split('/');
  return { year, month, day };
}

/**
 * Get the Firestore document path for a specific date
 * Structure: prayerTimes/{year}/{month}/{day}
 */
function getDocumentPath(dateStr: string): string {
  const { year, month, day } = parseDateString(dateStr);
  return `prayerTimes/${year}/${month}/${day}`;
}

/**
 * Get today's date in DD/MM/YYYY format
 */
export function getTodayDateString(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Check if a date string is a Friday
 */
function isFridayDate(dateStr: string): boolean {
  const [day, month, year] = dateStr.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getDay() === 5; // 5 = Friday
}

/**
 * Get day of week name from date string
 */
function getDayOfWeek(dateStr: string): string {
  const [day, month, year] = dateStr.split('/').map(Number);
  const date = new Date(year, month - 1, day);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

/**
 * Fetch prayer times for a specific date from Firestore
 * @param dateStr Date in DD/MM/YYYY format (defaults to today)
 * @returns Prayer times or null if not found
 */
export async function getPrayerTimesByDate(
  dateStr: string = getTodayDateString()
): Promise<RawPrayerTimes | null> {
  try {
    const { year, month, day } = parseDateString(dateStr);
    const docRef = doc(db, 'prayerTimes', year, month, day);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as PrayerTimeDocument;
      // Return only the prayer time fields (not metadata)
      return {
        fajrStart: data.fajrStart,
        fajrJamaat: data.fajrJamaat,
        sunrise: data.sunrise,
        dhuhrStart: data.dhuhrStart,
        dhuhrJamaat: data.dhuhrJamaat,
        asrStart: data.asrStart,
        asrJamaat: data.asrJamaat,
        maghrib: data.maghrib,
        ishaStart: data.ishaStart,
        ishaJamaat: data.ishaJamaat,
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching prayer times:', error);
    throw new Error(`Failed to fetch prayer times for ${dateStr}`);
  }
}

/**
 * Save or update prayer times for a specific date
 * @param dateStr Date in DD/MM/YYYY format
 * @param times Prayer times data
 */
export async function savePrayerTimes(
  dateStr: string,
  times: RawPrayerTimes
): Promise<void> {
  try {
    const { year, month, day } = parseDateString(dateStr);
    const docRef = doc(db, 'prayerTimes', year, month, day);

    const prayerTimeDoc: PrayerTimeDocument = {
      ...times,
      date: dateStr,
      dayOfWeek: getDayOfWeek(dateStr),
      isFriday: isFridayDate(dateStr),
      lastUpdated: serverTimestamp() as Timestamp,
    };

    await setDoc(docRef, prayerTimeDoc, { merge: true });
  } catch (error) {
    console.error('Error saving prayer times:', error);
    throw new Error(`Failed to save prayer times for ${dateStr}`);
  }
}

/**
 * Batch save multiple prayer times (useful for monthly imports)
 * @param prayerTimesArray Array of { date, times } objects
 */
export async function batchSavePrayerTimes(
  prayerTimesArray: Array<{ date: string; times: RawPrayerTimes }>
): Promise<void> {
  try {
    const batch = writeBatch(db);

    for (const { date, times } of prayerTimesArray) {
      const { year, month, day } = parseDateString(date);
      const docRef = doc(db, 'prayerTimes', year, month, day);

      const prayerTimeDoc: PrayerTimeDocument = {
        ...times,
        date,
        dayOfWeek: getDayOfWeek(date),
        isFriday: isFridayDate(date),
        lastUpdated: serverTimestamp() as Timestamp,
      };

      batch.set(docRef, prayerTimeDoc, { merge: true });
    }

    await batch.commit();
    console.log(`Successfully saved ${prayerTimesArray.length} prayer times`);
  } catch (error) {
    console.error('Error batch saving prayer times:', error);
    throw new Error('Failed to batch save prayer times');
  }
}

/**
 * Get all prayer times for a specific month
 * @param year Year (e.g., "2025")
 * @param month Month (e.g., "11" for November)
 */
export async function getPrayerTimesByMonth(
  year: string,
  month: string
): Promise<PrayerTimeDocument[]> {
  try {
    const monthRef = collection(db, 'prayerTimes', year, month);
    const querySnapshot = await getDocs(monthRef);

    return querySnapshot.docs.map(doc => doc.data() as PrayerTimeDocument);
  } catch (error) {
    console.error('Error fetching monthly prayer times:', error);
    throw new Error(`Failed to fetch prayer times for ${month}/${year}`);
  }
}

/**
 * Move old prayer times to legacy collection
 * @param beforeDate Only move times before this date (DD/MM/YYYY)
 */
export async function moveToLegacy(beforeDate: string): Promise<number> {
  try {
    const { year, month, day } = parseDateString(beforeDate);
    const cutoffDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    // Get all years
    const yearsRef = collection(db, 'prayerTimes');
    const yearsSnapshot = await getDocs(yearsRef);

    let movedCount = 0;
    const batch = writeBatch(db);

    for (const yearDoc of yearsSnapshot.docs) {
      const yearId = yearDoc.id;
      if (yearId === 'legacy') continue; // Skip legacy collection

      // Get all months in this year
      const monthsRef = collection(db, 'prayerTimes', yearId);
      const monthsSnapshot = await getDocs(query(monthsRef));

      for (const monthDoc of monthsSnapshot.docs) {
        const monthId = monthDoc.id;

        // Get all days in this month
        const daysRef = collection(db, 'prayerTimes', yearId, monthId);
        const daysSnapshot = await getDocs(query(daysRef));

        for (const dayDoc of daysSnapshot.docs) {
          const data = dayDoc.data() as PrayerTimeDocument;
          const [d, m, y] = data.date.split('/').map(Number);
          const docDate = new Date(y, m - 1, d);

          if (docDate < cutoffDate) {
            // Move to legacy
            const legacyRef = doc(db, 'prayerTimes', 'legacy', `${yearId}-${monthId}-${dayDoc.id}`);
            batch.set(legacyRef, data);

            // Delete from original location
            batch.delete(dayDoc.ref);
            movedCount++;
          }
        }
      }
    }

    if (movedCount > 0) {
      await batch.commit();
    }

    return movedCount;
  } catch (error) {
    console.error('Error moving to legacy:', error);
    throw new Error('Failed to move prayer times to legacy');
  }
}

/**
 * Sync from Google Sheets CSV to Firebase
 * Parses CSV and saves all rows to Firestore
 */
export async function syncFromCSV(csvUrl: string): Promise<{ success: number; failed: number }> {
  try {
    const res = await fetch(csvUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch CSV (status ${res.status})`);
    }

    const text = await res.text();
    const rows = text
      .trim()
      .split('\n')
      .map(row => row.split(',').map(cell => cell.trim()));

    // Skip header row
    const dataRows = rows.slice(1);

    const prayerTimesArray: Array<{ date: string; times: RawPrayerTimes }> = [];

    for (const row of dataRows) {
      if (row.length < 11) continue; // Skip incomplete rows

      const [
        date,
        fajrStart,
        fajrJamaat,
        sunrise,
        dhuhrStart,
        dhuhrJamaat,
        asrStart,
        asrJamaat,
        maghrib,
        ishaStart,
        ishaJamaat,
      ] = row;

      // Validate date format (DD/MM/YYYY)
      if (!/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
        console.warn(`Skipping invalid date: ${date}`);
        continue;
      }

      prayerTimesArray.push({
        date,
        times: {
          fajrStart,
          fajrJamaat,
          sunrise,
          dhuhrStart,
          dhuhrJamaat,
          asrStart,
          asrJamaat,
          maghrib,
          ishaStart,
          ishaJamaat,
        },
      });
    }

    await batchSavePrayerTimes(prayerTimesArray);

    return {
      success: prayerTimesArray.length,
      failed: dataRows.length - prayerTimesArray.length,
    };
  } catch (error) {
    console.error('Error syncing from CSV:', error);
    throw new Error('Failed to sync prayer times from CSV');
  }
}
