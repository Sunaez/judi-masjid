// src/app/(themed)/admin/dashboard/DashBoardComponents/Footer.tsx

'use client';

export default function Footer() {
  return (
    <footer className="bg-[var(--background-end)] py-8 px-4">
      {/* Address and tagline */}
      <div className="text-center mb-6">
        <p className="text-base text-[var(--text-color)]">
          298 Dudley Rd, Birmingham B18 4HL
        </p>
        <p className="text-base text-[var(--text-color)] mt-2">
          Feel free to visit us or reach out with any questions.
        </p>
      </div>

      {/* Two-column contact info */}
      <div className="content grid grid-cols-1 md:grid-cols-2 gap-8 text-base text-[var(--text-color)]">
        <h2 className="col-span-full text-xl font-semibold mb-4">
          Please do not hesitate to call or email us about anything
        </h2>

        <div>
          <h3 className="text-lg font-medium mb-2">Phone</h3>
          <ul>
            <li>Sharia inquiries: 07734 155 096</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Email</h3>
          <ul>
            <li>Mosque: judi@muslim.com</li>
            <li>Website/TV screen: alanddazad4@gmail.com</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
