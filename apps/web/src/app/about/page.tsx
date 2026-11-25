'use client';

export default function AboutPage() {
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
          <h1 className="text-4xl font-extrabold text-gray-900 mb-6">About DateBuk</h1>
          
          <div className="space-y-6 text-gray-700 leading-relaxed text-lg">
            <p>
              At DateBuk, we believe dating should be flexible, fun, and meaningful. That's why we've created a platform designed to make connections effortless, helping you build long-lasting friendships and relationships no matter where you are.
            </p>

            <p>
              With our innovative features, meeting new people has never been clearer, smarter, or more exciting. We've built DateBuk for everyone—whether you're looking for your next serious relationship, new friends, or just want to expand your social circle.
            </p>

            <div className="my-8 bg-gradient-to-r from-pink-100 to-purple-100 rounded-2xl p-6 border border-pink-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
              <p>
                To create a safe, inclusive, and innovative dating platform that empowers people to make genuine connections based on shared values, interests, and real intent.
              </p>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8">Why Choose DateBuk?</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-pink-500 font-bold text-lg">✓</span>
                <span><strong>Verified Profiles:</strong> All users are verified to reduce fake accounts and ensure your safety.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-pink-500 font-bold text-lg">✓</span>
                <span><strong>Smart Matching:</strong> Our algorithm helps you find compatible matches based on shared values and interests.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-pink-500 font-bold text-lg">✓</span>
                <span><strong>Secure Messaging:</strong> Privacy-first chat with end-to-end encryption for your conversations.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-pink-500 font-bold text-lg">✓</span>
                <span><strong>Video Date Ready:</strong> Meet safely with optional video/voice chat before deciding on a real date.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-pink-500 font-bold text-lg">✓</span>
                <span><strong>Flexible Plans:</strong> Start free and upgrade only if you want advanced features.</span>
              </li>
            </ul>

            <div className="my-8 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-2xl p-6 border border-indigo-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Values</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Authenticity</h3>
                  <p className="text-gray-700">Real people, real profiles, real connections.</p>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Safety First</h3>
                  <p className="text-gray-700">Your security and privacy are always our priority.</p>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Inclusivity</h3>
                  <p className="text-gray-700">A welcoming space for all ages, orientations, and backgrounds.</p>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-2">Innovation</h3>
                  <p className="text-gray-700">Continuously improving our platform with cutting-edge features.</p>
                </div>
              </div>
            </div>

            <p className="text-gray-600 text-sm leading-relaxed">
              Founded in 2025, DateBuk is committed to transforming the dating landscape by prioritizing genuine human connection over superficial swiping. We're constantly evolving and adding new features to help you find your perfect match.
            </p>
          </div>

          <div className="mt-10 flex gap-4">
            <a href="/signup" className="rounded-lg bg-pink-500 px-6 py-3 font-semibold text-white hover:bg-pink-600 transition-colors">
              Start Free Today
            </a>
            <a href="/contact" className="rounded-lg border-2 border-gray-900 px-6 py-3 font-semibold text-gray-900 hover:bg-gray-50 transition-colors">
              Get in Touch
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
