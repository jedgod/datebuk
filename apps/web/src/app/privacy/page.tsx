'use client';

export default function PrivacyPage() {
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
          <h1 className="text-4xl font-extrabold text-gray-900 mb-6">Privacy Policy</h1>

          <div className="text-sm text-gray-500 mb-8">
            Last updated: {new Date().toLocaleDateString()}
          </div>

          <div className="space-y-8 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Privacy You Can Trust</h2>
              <p>
                Your privacy matters. At DateBuk, we take your privacy seriously and are committed to maintaining the confidentiality and integrity of your personal information. All your information is securely stored in encrypted cloud servers, and we follow strict standards to keep your data safe.
              </p>
            </section>

            <section className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">🔒 Data Security</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>All data encrypted using industry-standard AES-256 encryption</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Secure cloud servers with redundant backups</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Regular security audits and penetration testing</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>GDPR and CCPA compliant data handling</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">What Information We Collect</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Account Information</h3>
                  <p className="text-gray-600">Email, phone number, password, username, and profile details you provide.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Profile Information</h3>
                  <p className="text-gray-600">Photos, bio, age, location, interests, and dating preferences.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Communication Data</h3>
                  <p className="text-gray-600">Messages, matches, and interactions within the platform.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Device Information</h3>
                  <p className="text-gray-600">Device type, operating system, and app usage analytics.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">How We Use Your Information</h2>
              <ul className="space-y-2 text-gray-600">
                <li>• To provide and improve our dating platform services</li>
                <li>• To match you with compatible users</li>
                <li>• To send you important notifications and updates</li>
                <li>• To ensure platform safety and prevent abuse</li>
                <li>• To analyze usage patterns and improve user experience</li>
                <li>• To comply with legal requirements</li>
              </ul>
            </section>

            <section className="bg-amber-50 rounded-xl p-6 border border-amber-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Your Privacy Rights</h2>
              <p className="mb-4">You have the right to:</p>
              <ul className="space-y-2 text-gray-600">
                <li>• Request a copy of your personal data</li>
                <li>• Correct inaccurate information</li>
                <li>• Delete your account and associated data</li>
                <li>• Opt-out of marketing communications</li>
                <li>• Export your profile and messages</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Third-Party Sharing</h2>
              <p>
                We <strong>never sell your personal data</strong> to third parties. We only share information with trusted service providers who help us operate our platform, and they are bound by strict confidentiality agreements.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Cookies & Tracking</h2>
              <p>
                We use cookies to enhance your experience, remember your preferences, and understand how you interact with DateBuk. You can control cookie settings in your browser.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Us About Privacy</h2>
              <p>
                Have privacy concerns? Contact our Privacy Team at <strong>privacy@datebuk.com</strong> and we'll respond within 30 days.
              </p>
            </section>
          </div>

          <div className="mt-10 flex gap-4">
            <a href="/contact" className="rounded-lg bg-pink-500 px-6 py-3 font-semibold text-white hover:bg-pink-600 transition-colors">
              Contact Privacy Team
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
