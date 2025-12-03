# Google Sheets Auto-Sync Setup Guide

This guide will help you set up automatic synchronization from your Google Sheet to Firebase Firestore.

## 📋 Prerequisites

1. Your Google Sheet: https://docs.google.com/spreadsheets/d/1TqARmQOth6B1BEA8wx-EHGJY-bgEeCtYDHqeYTRmISc/edit
2. Firebase Project ID (from your `.env` file)
3. Firebase REST API enabled (already enabled by default)

## 🔧 Setup Instructions

### Step 1: Get Your Firebase Configuration

You'll need these values from your `.env` file:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`

### Step 2: Create Apps Script in Google Sheets

1. Open your Google Sheet
2. Click **Extensions** → **Apps Script**
3. Delete any existing code in the editor
4. Copy and paste the code below:

```javascript
// ========================================
// AUTO-SYNC PRAYER TIMES TO FIREBASE
// ========================================

// 🔥 FIREBASE CONFIGURATION
// Replace these with your actual Firebase credentials
const FIREBASE_CONFIG = {
  apiKey: "YOUR_FIREBASE_API_KEY",           // From NEXT_PUBLIC_FIREBASE_API_KEY
  projectId: "YOUR_FIREBASE_PROJECT_ID"      // From NEXT_PUBLIC_FIREBASE_PROJECT_ID
};

/**
 * Parse date string DD/MM/YYYY into components
 */
function parseDate(dateStr) {
  const parts = dateStr.split('/');
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
  const parts = dateStr.split('/');
  const date = new Date(parts[2], parts[1] - 1, parts[0]);
  return date.getDay() === 5; // 5 = Friday
}

/**
 * Get day of week name
 */
function getDayOfWeek(dateStr) {
  const parts = dateStr.split('/');
  const date = new Date(parts[2], parts[1] - 1, parts[0]);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

/**
 * Save a single prayer time document to Firestore
 */
function savePrayerTimeToFirestore(dateStr, prayerTimes) {
  try {
    const { year, month, day } = parseDate(dateStr);

    // Firestore REST API endpoint
    const docPath = `prayerTimes/${year}/${month}/${day}`;
    const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents/${docPath}?key=${FIREBASE_CONFIG.apiKey}`;

    // Prepare document data
    const document = {
      fields: {
        date: { stringValue: dateStr },
        fajrStart: { stringValue: prayerTimes.fajrStart },
        fajrJamaat: { stringValue: prayerTimes.fajrJamaat },
        sunrise: { stringValue: prayerTimes.sunrise },
        dhuhrStart: { stringValue: prayerTimes.dhuhrStart },
        dhuhrJamaat: { stringValue: prayerTimes.dhuhrJamaat },
        asrStart: { stringValue: prayerTimes.asrStart },
        asrJamaat: { stringValue: prayerTimes.asrJamaat },
        maghrib: { stringValue: prayerTimes.maghrib },
        ishaStart: { stringValue: prayerTimes.ishaStart },
        ishaJamaat: { stringValue: prayerTimes.ishaJamaat },
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

  // Skip header row (row 0)
  let successCount = 0;
  let failCount = 0;

  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    // Skip empty rows
    if (!row[0]) continue;

    const dateStr = row[0].toString();

    // Validate date format (DD/MM/YYYY)
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      Logger.log(`⚠️ Skipping invalid date: ${dateStr}`);
      failCount++;
      continue;
    }

    const prayerTimes = {
      fajrStart: row[1].toString(),
      fajrJamaat: row[2].toString(),
      sunrise: row[3].toString(),
      dhuhrStart: row[4].toString(),
      dhuhrJamaat: row[5].toString(),
      asrStart: row[6].toString(),
      asrJamaat: row[7].toString(),
      maghrib: row[8].toString(),
      ishaStart: row[9].toString(),
      ishaJamaat: row[10].toString()
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

  Logger.log(`\n📊 Sync Complete: ${successCount} succeeded, ${failCount} failed`);

  // Show success message
  SpreadsheetApp.getUi().alert(
    'Sync Complete',
    `Successfully synced ${successCount} prayer times to Firebase!\n${failCount > 0 ? `Failed: ${failCount}` : ''}`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * AUTO-TRIGGER: Runs when the sheet is edited
 * Only syncs the edited row(s) for efficiency
 */
function onEdit(e) {
  // Don't sync if editing the header row
  if (e.range.getRow() === 1) return;

  const sheet = e.source.getActiveSheet();
  const editedRow = e.range.getRow();
  const data = sheet.getRange(editedRow, 1, 1, 11).getValues()[0];

  const dateStr = data[0].toString();

  // Validate date format
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    Logger.log(`⚠️ Invalid date format: ${dateStr}`);
    return;
  }

  const prayerTimes = {
    fajrStart: data[1].toString(),
    fajrJamaat: data[2].toString(),
    sunrise: data[3].toString(),
    dhuhrStart: data[4].toString(),
    dhuhrJamaat: data[5].toString(),
    asrStart: data[6].toString(),
    asrJamaat: data[7].toString(),
    maghrib: data[8].toString(),
    ishaStart: data[9].toString(),
    ishaJamaat: data[10].toString()
  };

  savePrayerTimeToFirestore(dateStr, prayerTimes);
}

/**
 * MENU: Add custom menu to Google Sheets
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🕌 Prayer Times Sync')
    .addItem('🔄 Sync All to Firebase', 'syncAllPrayerTimes')
    .addItem('📖 View Sync Logs', 'showLogs')
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
```

### Step 3: Configure Your Firebase Credentials

**IMPORTANT:** Replace these lines in the code above with your actual values:

```javascript
const FIREBASE_CONFIG = {
  apiKey: "YOUR_FIREBASE_API_KEY",           // ← Replace with your API key
  projectId: "YOUR_FIREBASE_PROJECT_ID"      // ← Replace with your project ID
};
```

### Step 4: Save and Authorize

1. Click the **Save** icon (💾) in Apps Script
2. Name your project: "Prayer Times Auto-Sync"
3. Click **Run** → Select `syncAllPrayerTimes`
4. Click **Review permissions**
5. Choose your Google account
6. Click **Advanced** → **Go to Prayer Times Auto-Sync (unsafe)**
7. Click **Allow**

### Step 5: Set Up Auto-Trigger (Optional but Recommended)

To enable automatic sync when you edit the sheet:

1. In Apps Script, click the **⏰ Triggers** icon (clock icon on left sidebar)
2. Click **+ Add Trigger**
3. Configure:
   - Function: `onEdit`
   - Event source: **From spreadsheet**
   - Event type: **On edit**
4. Click **Save**

## 🎉 Testing

### Manual Sync Test
1. Click **🕌 Prayer Times Sync** → **🔄 Sync All to Firebase** in your sheet
2. Wait for the confirmation message
3. Check your admin dashboard to verify data is synced

### Auto-Sync Test
1. Edit any prayer time in your sheet
2. Wait 1-2 seconds
3. The row should automatically sync to Firebase
4. Check Firebase or your website to verify

## 🔍 Troubleshooting

### "Failed to save" errors
- **Check Firebase API Key**: Make sure `apiKey` is correct in Apps Script
- **Check Project ID**: Verify `projectId` matches your Firebase project
- **Check Firestore Rules**: Make sure your Firestore security rules allow writes

### "Invalid date format" warnings
- Dates must be in `DD/MM/YYYY` format
- Example: `01/11/2025` (NOT `1/11/2025` or `11/01/2025`)

### Auto-sync not working
- Make sure you set up the `onEdit` trigger in Step 5
- Check Apps Script logs: **View** → **Executions** in Apps Script editor

## 📊 How It Works

```
┌─────────────────┐
│  Google Sheets  │
│   (You edit)    │
└────────┬────────┘
         │
         │ onEdit trigger
         │ (automatic)
         ▼
┌─────────────────┐
│  Apps Script    │
│   (processes)   │
└────────┬────────┘
         │
         │ Firestore REST API
         │ (PATCH request)
         ▼
┌─────────────────┐
│   Firebase      │
│  Firestore DB   │
└────────┬────────┘
         │
         │ Real-time updates
         ▼
┌─────────────────┐
│  Your Website   │
│   (displays)    │
└─────────────────┘
```

## 🔒 Security Notes

- ✅ Apps Script runs with YOUR Google account permissions
- ✅ Firebase API key is safe to use in Apps Script (server-side)
- ✅ Firestore security rules still apply (protect your data)
- ⚠️ Keep your Firebase API key private (don't share the script publicly)

## 🎯 Next Steps

After setup is complete:
1. Test by editing a cell in your Google Sheet
2. Verify data appears in Firebase Console
3. Check your website's prayer times display
4. Enjoy automatic syncing! 🎉

---

**Questions?** Check the Firebase Console logs or your Apps Script execution logs for debugging.
