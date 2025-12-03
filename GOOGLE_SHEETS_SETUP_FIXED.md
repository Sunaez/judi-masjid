# Google Sheets Auto-Sync - FIXED VERSION

## 🔧 Fixed Apps Script Code

Copy and paste this **improved version** with better error handling:

```javascript
// ========================================
// AUTO-SYNC PRAYER TIMES TO FIREBASE
// ========================================

// 🔥 FIREBASE CONFIGURATION
// Replace these with your actual Firebase credentials
const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",           // From NEXT_PUBLIC_FIREBASE_API_KEY
  projectId: "YOUR_PROJECT_ID"      // From NEXT_PUBLIC_FIREBASE_PROJECT_ID
};

/**
 * Convert value to date string DD/MM/YYYY
 * Handles both string and Date object inputs
 */
function toDateString(value) {
  if (!value) return null;

  // If it's already a string in DD/MM/YYYY format
  if (typeof value === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    return value;
  }

  // If it's a Date object (Google Sheets stores dates as Date objects)
  if (value instanceof Date) {
    const day = String(value.getDate()).padStart(2, '0');
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const year = value.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Try converting to string and parsing
  const str = String(value).trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    // Pad single digits
    const parts = str.split('/');
    return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
  }

  return null;
}

/**
 * Parse date string DD/MM/YYYY into components
 */
function parseDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    throw new Error('Invalid date string');
  }

  const parts = dateStr.split('/');
  if (parts.length !== 3) {
    throw new Error(`Invalid date format: ${dateStr}`);
  }

  return {
    day: parts[0],
    month: parts[1],
    year: parts[2]
  };
}

/**
 * Check if a date is Friday
 */
function isFriday(dateStr) {
  try {
    const parts = dateStr.split('/');
    const date = new Date(parts[2], parts[1] - 1, parts[0]);
    return date.getDay() === 5; // 5 = Friday
  } catch (e) {
    return false;
  }
}

/**
 * Get day of week name
 */
function getDayOfWeek(dateStr) {
  try {
    const parts = dateStr.split('/');
    const date = new Date(parts[2], parts[1] - 1, parts[0]);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  } catch (e) {
    return 'Unknown';
  }
}

/**
 * Save a single prayer time document to Firestore
 */
function savePrayerTimeToFirestore(dateStr, prayerTimes) {
  try {
    // Validate inputs
    if (!dateStr) {
      Logger.log('❌ Empty date string');
      return false;
    }

    const { year, month, day } = parseDate(dateStr);

    // Firestore REST API endpoint
    const docPath = `prayerTimes/${year}/${month}/${day}`;
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/${docPath}?key=${FIREBASE_CONFIG.apiKey}`;

    // Prepare document data
    const document = {
      fields: {
        date: { stringValue: dateStr },
        fajrStart: { stringValue: String(prayerTimes.fajrStart || '') },
        fajrJamaat: { stringValue: String(prayerTimes.fajrJamaat || '') },
        sunrise: { stringValue: String(prayerTimes.sunrise || '') },
        dhuhrStart: { stringValue: String(prayerTimes.dhuhrStart || '') },
        dhuhrJamaat: { stringValue: String(prayerTimes.dhuhrJamaat || '') },
        asrStart: { stringValue: String(prayerTimes.asrStart || '') },
        asrJamaat: { stringValue: String(prayerTimes.asrJamaat || '') },
        maghrib: { stringValue: String(prayerTimes.maghrib || '') },
        ishaStart: { stringValue: String(prayerTimes.ishaStart || '') },
        ishaJamaat: { stringValue: String(prayerTimes.ishaJamaat || '') },
        dayOfWeek: { stringValue: getDayOfWeek(dateStr) },
        isFriday: { booleanValue: isFriday(dateStr) },
        lastUpdated: { timestampValue: new Date().toISOString() }
      }
    };

    // Make PATCH request to create/update document
    const options = {
      method: 'patch',
      contentType: 'application/json',
      payload: JSON.stringify(document),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const statusCode = response.getResponseCode();

    if (statusCode === 200) {
      Logger.log(`✅ Saved prayer times for ${dateStr}`);
      return true;
    } else {
      Logger.log(`❌ Failed to save ${dateStr}: ${response.getContentText()}`);
      return false;
    }

  } catch (error) {
    Logger.log(`❌ Error saving ${dateStr}: ${error.message}`);
    Logger.log(`Error stack: ${error.stack}`);
    return false;
  }
}

/**
 * Sync all prayer times from the sheet to Firebase
 * This function can be run manually or triggered on edit
 */
function syncAllPrayerTimes() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();

  Logger.log(`📋 Found ${data.length - 1} rows (excluding header)`);

  // Skip header row (row 0)
  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    // Skip completely empty rows
    if (!row || row.every(cell => !cell)) {
      skippedCount++;
      continue;
    }

    // Convert first column to date string
    const dateStr = toDateString(row[0]);

    if (!dateStr) {
      Logger.log(`⚠️ Row ${i + 1}: Invalid or empty date - ${row[0]}`);
      failCount++;
      continue;
    }

    // Validate date format
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      Logger.log(`⚠️ Row ${i + 1}: Invalid date format - ${dateStr}`);
      failCount++;
      continue;
    }

    // Build prayer times object
    const prayerTimes = {
      fajrStart: row[1],
      fajrJamaat: row[2],
      sunrise: row[3],
      dhuhrStart: row[4],
      dhuhrJamaat: row[5],
      asrStart: row[6],
      asrJamaat: row[7],
      maghrib: row[8],
      ishaStart: row[9],
      ishaJamaat: row[10]
    };

    const success = savePrayerTimeToFirestore(dateStr, prayerTimes);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }

    // Add small delay to avoid rate limiting
    Utilities.sleep(100);
  }

  const summary = `\n📊 Sync Complete:\n✅ Succeeded: ${successCount}\n❌ Failed: ${failCount}\n⏭️ Skipped: ${skippedCount}`;
  Logger.log(summary);

  // Show success message
  SpreadsheetApp.getUi().alert(
    'Sync Complete',
    `Successfully synced ${successCount} prayer times to Firebase!\n${failCount > 0 ? `Failed: ${failCount}` : ''}\n${skippedCount > 0 ? `Skipped empty rows: ${skippedCount}` : ''}`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * AUTO-TRIGGER: Runs when the sheet is edited
 * Only syncs the edited row(s) for efficiency
 */
function onEdit(e) {
  try {
    // Don't sync if editing the header row
    if (e.range.getRow() === 1) return;

    const sheet = e.source.getActiveSheet();
    const editedRow = e.range.getRow();
    const data = sheet.getRange(editedRow, 1, 1, 11).getValues()[0];

    // Convert date to string
    const dateStr = toDateString(data[0]);

    if (!dateStr) {
      Logger.log(`⚠️ Cannot sync row ${editedRow}: Invalid date`);
      return;
    }

    // Validate date format
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      Logger.log(`⚠️ Invalid date format in row ${editedRow}: ${dateStr}`);
      return;
    }

    const prayerTimes = {
      fajrStart: data[1],
      fajrJamaat: data[2],
      sunrise: data[3],
      dhuhrStart: data[4],
      dhuhrJamaat: data[5],
      asrStart: data[6],
      asrJamaat: data[7],
      maghrib: data[8],
      ishaStart: data[9],
      ishaJamaat: data[10]
    };

    savePrayerTimeToFirestore(dateStr, prayerTimes);
  } catch (error) {
    Logger.log(`❌ onEdit error: ${error.message}`);
  }
}

/**
 * MENU: Add custom menu to Google Sheets
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🕌 Prayer Times Sync')
    .addItem('🔄 Sync All to Firebase', 'syncAllPrayerTimes')
    .addItem('📖 View Sync Logs', 'showLogs')
    .addItem('🧪 Test Date Format', 'testDateFormat')
    .addToUi();
}

/**
 * Show sync logs
 */
function showLogs() {
  const logs = Logger.getLog();
  SpreadsheetApp.getUi().alert(
    'Sync Logs',
    logs || 'No logs available',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Test date format in first data row
 */
function testDateFormat() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const firstDataRow = sheet.getRange(2, 1, 1, 11).getValues()[0];

  const rawDate = firstDataRow[0];
  const convertedDate = toDateString(rawDate);

  const message = `First row date test:\n\n` +
    `Raw value: ${rawDate}\n` +
    `Type: ${typeof rawDate}\n` +
    `Is Date object: ${rawDate instanceof Date}\n` +
    `Converted to: ${convertedDate}\n\n` +
    `${convertedDate ? '✅ Valid format' : '❌ Invalid format'}`;

  SpreadsheetApp.getUi().alert('Date Format Test', message, SpreadsheetApp.getUi().ButtonSet.OK);
  Logger.log(message);
}
```

## 🎯 What's Fixed:

1. **Better Date Handling:**
   - Added `toDateString()` function that handles both strings and Date objects
   - Google Sheets sometimes stores dates as Date objects, not strings
   - Automatically converts Date objects to DD/MM/YYYY format

2. **Improved Error Handling:**
   - Validates date before calling `parseDate()`
   - Checks for null/undefined values
   - Better error messages with row numbers

3. **New Test Function:**
   - Added "Test Date Format" menu item
   - Shows you exactly what type your date cell is
   - Helps diagnose format issues

4. **Better Logging:**
   - Shows row numbers in error messages
   - Counts skipped, succeeded, and failed rows
   - More detailed error stack traces

## 🔧 How to Use:

1. **Replace the old script** with this new version
2. **Save** the script (💾 icon)
3. **Run "Test Date Format"** first:
   - Click: 🕌 Prayer Times Sync → 🧪 Test Date Format
   - This will show you how your dates are stored
4. **Then run "Sync All to Firebase"**:
   - Click: 🕌 Prayer Times Sync → 🔄 Sync All to Firebase

## 📊 Understanding Your Date Format:

Run the test and you'll see output like:
```
First row date test:

Raw value: 28/10/2025
Type: object
Is Date object: true
Converted to: 28/10/2025

✅ Valid format
```

This tells you if Google Sheets stored your date as a Date object (common) or as a string.

---

**Try this fixed version and let me know what the "Test Date Format" shows!**
