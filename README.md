This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Admin Access

Admin access is controlled by Firebase Authentication. Any user account you
manually create in Firebase Console can sign in to the admin page and perform
admin writes.

There is no `ADMIN_EMAILS` environment allowlist and no custom admin claim is
required. Keep account creation restricted to Firebase Console, disable any
users who should no longer have access, and do not add public sign-up to the
app unless you also add a stricter role system.

The checked-in `firestore.rules` file allows public reads. Every create, update
and delete, including nested collections, requires a signed-in Firebase
Authentication session. Donation settings use `settings/donation` and require
no custom role or email allowlist. The weather endpoint does not write to Firestore.

Website deployment does **not** publish Firestore rules. If login works but
saving donation settings reports insufficient permissions, deploy these rules
to the same project as `NEXT_PUBLIC_FIREBASE_PROJECT_ID`:

```bash
npx firebase login
npm run deploy:rules -- --project YOUR_FIREBASE_PROJECT_ID
```

Alternatively, paste `firestore.rules` into Firebase Console > Firestore Database
> Rules and publish. Test the rules locally with `npm run test:rules` (Java 21+
required); the tests use an isolated demo project and do not touch production.

## Weather refresh

The website, display rotator and downtime screen share one weather scheduler.
On opening, missing or expired browser weather is fetched immediately. Fresh
weather waits until its fetch timestamp plus a browser-specific random interval
between 4 and 6 minutes. The interval and weather survive reloads in local storage.
Focus, visibility and network recovery events check the same expiry time.

Requests share an in-flight promise; browsers supporting Web Locks also coordinate
across tabs. Failed refreshes retain the last weather and wait before retrying.
The server fetches current weather and forecast from OpenWeather for the configured
`OPENWEATHER_LAT` / `OPENWEATHER_LON`, using `OPENWEATHER_API_KEY`. Legacy
`NEXT_PUBLIC_OPENWEATHER_*` environment names remain supported.

Public weather refreshes use browser and server memory caches, without Firestore
writes or Firebase Admin credentials. Server request coalescing applies within
each running instance; independently started server instances can each fetch
weather. Random device intervals reduce simultaneous requests but are not a
distributed lock across devices or server instances.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
