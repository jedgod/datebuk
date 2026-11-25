import { PricingSection } from "@/components/PricingSection";

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-transparent text-slate-950">
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/hero-bg.png')" }}
      />
      <div aria-hidden="true" className="fixed inset-0 z-0 bg-black/5" />

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <div className="flex items-center gap-3">
            <img
              src="/datebuk_logo.png"
              alt="DateBuk logo"
              className="h-10 w-auto rounded-lg object-contain"
            />
            <span className="text-xl font-extrabold tracking-tight text-slate-950">
              DateBuk
            </span>
          </div>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">
            <a className="hover:text-black" href="#how">How it works</a>
            <a className="hover:text-black" href="#safety">Safety</a>
            <a className="hover:text-black" href="#stories">Success stories</a>
            <a className="hover:text-black" href="#pricing">Pricing</a>
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="/login"
              className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50"
            >
              Sign in
            </a>
            <a
              href="/signup"
              className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/90"
            >
              Create account
            </a>
          </div>
        </div>
      </header>

      <section className="relative isolate z-10 overflow-hidden border-b border-slate-200 bg-transparent">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-r from-white/70 via-white/15 to-transparent"
        />
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-start gap-10 px-5 pb-14 pt-4 lg:grid-cols-[1.08fr_.92fr] lg:px-8 lg:pb-20 lg:pt-5">
        <div className="relative z-10">
          <p className="inline-flex items-center gap-2 rounded-full border bg-white/95 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-gray-700">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Real people • Verified profiles • Secure chat
          </p>

          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[1.05] tracking-[-0.04em] text-slate-950 md:text-6xl">
            Find someone who actually fits your life.
          </h1>

          <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-900">
            DateBuk helps you meet people with shared values, real intent, and better
            conversation. Start free and browse in minutes.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="/signup"
              className="rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              Start matching
            </a>
            <a
              href="/login"
              className="rounded-xl border px-5 py-3 text-sm font-semibold hover:bg-gray-50"
            >
              I already have an account
            </a>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { title: "Verified profiles", desc: "Reduce fake accounts" },
              { title: "Secure messaging", desc: "Privacy-first chat" },
              { title: "Video date ready", desc: "Meet safely first" },
            ].map((b) => (
              <div
                key={b.title}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="text-sm font-bold text-gray-900">{b.title}</div>
                <div className="mt-1 text-xs text-gray-600">{b.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-start relative z-10">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-7 shadow-2xl shadow-slate-900/10 lg:p-9">
            <h2 className="text-xl font-extrabold text-gray-900">
              Start in 60 seconds
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Create your account and get your first matches today.
            </p>

            <form className="mt-6 space-y-4" action="/signup" method="GET">
              <div>
                <label className="text-sm font-semibold text-gray-700">Email</label>
                <input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  className="mt-1 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-black"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">Password</label>
                <input
                  name="password"
                  type="password"
                  placeholder="Create a strong password"
                  className="mt-1 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-black"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-black/90"
              >
                Create account
              </button>
            </form>
          </div>
        </div>
        </div>
      </section>

      <section id="how" className="relative z-10 border-b border-white/40 bg-white/65 py-12 backdrop-blur-[2px]">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <h2 className="text-3xl font-extrabold text-gray-900">How it works</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {[
              { title: "Create your profile", desc: "Add photos and your intent." },
              { title: "Browse and match", desc: "Find people that fit your life." },
              { title: "Start the conversation", desc: "Message securely or video date." },
            ].map((step) => (
              <div key={step.title} className="rounded-2xl border bg-white/95 p-5 shadow-sm">
                <div className="text-lg font-bold text-gray-900">{step.title}</div>
                <div className="mt-2 text-sm text-gray-600">{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="safety" className="relative z-10 border-y border-slate-300/60 bg-slate-200/75 py-12 backdrop-blur-[2px]">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <h2 className="text-3xl font-extrabold text-gray-900">Safety first</h2>
          <p className="mt-3 text-lg text-gray-600">
            Verified profiles, privacy-first chat, and proactive moderation.
          </p>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {[
              { title: "Verified profiles", desc: "Reduce fake accounts." },
              { title: "Private by default", desc: "Your data stays protected." },
              { title: "Report & block", desc: "Instant controls for safety." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border bg-white/90 p-5 shadow-sm">
                <div className="text-lg font-bold text-gray-900">{item.title}</div>
                <div className="mt-2 text-sm text-gray-600">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="stories" className="relative z-10 bg-white/65 py-12 backdrop-blur-[2px]">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <h2 className="text-3xl font-extrabold text-gray-900">Success stories</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {[
              { title: "Ava + Jordan", desc: "Matched for shared values and met in 3 days." },
              { title: "Riley + Sam", desc: "Moved from chat to video date safely." },
              { title: "Noah + Priya", desc: "Found a real connection after one week." },
            ].map((story) => (
              <div key={story.title} className="rounded-2xl border bg-white/95 p-5 shadow-sm">
                <div className="text-lg font-bold text-gray-900">{story.title}</div>
                <div className="mt-2 text-sm text-gray-600">{story.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PricingSection />

      <footer className="relative z-10 border-t bg-white/80 py-10 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="text-sm text-gray-600">
              Built for real connections and real intent.
            </div>
            <div className="flex flex-wrap gap-4 text-sm font-semibold text-gray-700">
              <a href="/about" className="hover:text-black">About</a>
              <a href="/privacy" className="hover:text-black">Privacy</a>
              <a href="/terms" className="hover:text-black">Terms</a>
              <a href="/contact" className="hover:text-black">Contact</a>
            </div>
          </div>

          <div className="mt-6 text-xs text-gray-500">
            © {new Date().getFullYear()} DateBuk. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
