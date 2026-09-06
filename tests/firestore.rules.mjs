import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';

let environment;
before(async () => {
  environment = await initializeTestEnvironment({
    projectId: 'demo-judi-masjid',
    firestore: { rules: await readFile(new URL('../firestore.rules', import.meta.url), 'utf8') },
  });
});
after(async () => { await environment?.cleanup(); });

for (const path of [
  'settings/donation', 'settings/slideshow', 'state/slideshow',
  'messages/example', 'messages/example/conditions/weather',
  'prayerTimes/2026/09/06', 'weather/current', 'timetables/example',
  'future/example/nested/document',
]) {
  test(`${path}: public reads, all writes require login, no admin claim required`, async () => {
    const guest = environment.unauthenticatedContext().firestore();
    const admin = environment.authenticatedContext('owner-created-user').firestore();
    const guestRef = doc(guest, path);
    const adminRef = doc(admin, path);
    await assertFails(setDoc(guestRef, { currentAmount: 100, totalAmount: 200 }));
    await assertSucceeds(setDoc(adminRef, { currentAmount: 100, totalAmount: 200 }));
    await assertSucceeds(getDoc(guestRef));
    await assertFails(updateDoc(guestRef, { currentAmount: 150 }));
    await assertFails(deleteDoc(guestRef));
    await assertSucceeds(updateDoc(adminRef, { currentAmount: 150 }));
    await assertSucceeds(deleteDoc(adminRef));
  });
}

test('signed-out batches cannot bypass document permissions', async () => {
  const db = environment.unauthenticatedContext().firestore();
  const batch = writeBatch(db);
  batch.set(doc(db, 'settings/donation'), { currentAmount: 1, totalAmount: 2 });
  batch.set(doc(db, 'messages/batch'), { text: 'Unauthorized' });
  await assertFails(batch.commit());
});
