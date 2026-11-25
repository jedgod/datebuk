'use client';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a href="/" className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            DateBuk
          </a>
          <a href="/" className="text-sm font-semibold text-gray-700 hover:text-black">
            ← Back Home
          </a>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-20">
        <div className="bg-white rounded-3xl shadow-lg p-8 md:p-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-6">Terms and Conditions</h1>

          <div className="text-sm text-gray-500 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </div>

          <div className="space-y-8 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Terms and Conditions</h2>
              <p>
                To ensure a safe and enjoyable experience for everyone, all users are expected to follow our platform's terms and conditions. By using DateBuk, you agree to comply with these terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">1. User Eligibility</h2>
              <ul className="space-y-2 text-gray-600 ml-4">
                <li>• You must be at least 18 years old to use DateBuk</li>
                <li>• You must not have a criminal conviction for sexual offenses</li>
                <li>• You agree to use your real identity and not impersonate others</li>
                <li>• You confirm the information you provide is accurate and truthful</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">2. Account Security</h2>
              <ul className="space-y-2 text-gray-600 ml-4">
                <li>• You are responsible for maintaining your account password</li>
                <li>• You agree to log out of shared devices</li>
                <li>• You must notify us immediately of unauthorized access</li>
                <li>• We are not liable for unauthorized access due to your negligence</li>
              </ul>
            </section>

            <section className="bg-red-50 rounded-xl p-6 border border-red-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">3. Prohibited Behavior</h2>
              <p className="mb-4 font-semibold">Users are not permitted to:</p>
              <ul className="space-y-2 text-gray-600 ml-4">
                <li>• Harass, threaten, or abuse other users</li>
                <li>• Post explicit or NSFW content</li>
                <li>• Engage in scams, fraud, or misleading behavior</li>
                <li>• Share others' personal information without consent</li>
                <li>• Use the platform for commercial purposes without authorization</li>
                <li>• Violate any laws or regulations</li>
                <li>• Attempt to hack or disrupt the platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">4. Reporting & Moderation</h2>
              <p className="mb-4">
                DateBuk maintains a moderation team to enforce our community standards. We:
              </p>
              <ul className="space-y-2 text-gray-600 ml-4">
                <li>• Review reported content within 24-48 hours</li>
                <li>• Warn or suspend users who violate our policies</li>
                <li>• Permanently ban users for serious violations</li>
                <li>• Cooperate with law enforcement when necessary</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">5. Intellectual Property</h2>
              <p className="text-gray-600">
                All content on DateBuk (including algorithms, designs, and features) is owned by DateBuk. You retain ownership of photos and messages you post, but grant DateBuk a license to display them on the platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">6. Limitation of Liability</h2>
              <p className="text-gray-600 mb-4">
                DateBuk is provided "as is" without warranties. We are not liable for:
              </p>
              <ul className="space-y-2 text-gray-600 ml-4">
                <li>• Actions or behavior of other users</li>
                <li>• Losses resulting from your use of the platform</li>
                <li>• Technical issues or service interruptions</li>
                <li>• Meeting outcomes or relationship compatibility</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">7. Subscription & Payments</h2>
              <ul className="space-y-2 text-gray-600 ml-4">
                <li>• All prices are in USD</li>
                <li>• Subscriptions renew automatically unless cancelled</li>
                <li>• Refunds are available within 14 days of purchase</li>
                <li>• DateBuk reserves the right to change pricing with notice</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">8. Termination</h2>
              <p className="text-gray-600">
                You may delete your account anytime. DateBuk may suspend or terminate accounts that violate these terms. Upon termination, we may delete your data unless required to retain it by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">9. Changes to Terms</h2>
              <p className="text-gray-600">
                DateBuk may update these terms periodically. We'll notify you of material changes. Continued use of the platform constitutes acceptance of updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">10. Contact & Disputes</h2>
              <p className="text-gray-600">
                Questions about these terms? Contact us at <strong>legal@datebuk.com</strong>
              </p>
            </section>

            <section className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Safety Reminder</h2>
              <p className="text-gray-600">
                DateBuk is a meeting platform, not a dating service. Always meet safely, tell someone where you're going, and trust your instincts. Report any suspicious behavior immediately.
              </p>
            </section>
          </div>

          <div className="mt-10 flex gap-4">
            <a href="/contact" className="rounded-lg bg-pink-500 px-6 py-3 font-semibold text-white hover:bg-pink-600 transition-colors">
              Report Violation
            </a>
            <a href="/" className="rounded-lg border-2 border-gray-900 px-6 py-3 font-semibold text-gray-900 hover:bg-gray-50 transition-colors">
              Back Home
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
