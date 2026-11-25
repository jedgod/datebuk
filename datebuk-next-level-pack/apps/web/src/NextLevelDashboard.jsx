import React from 'react';

const cards = [
  ['AI Match Intelligence', 'Compatibility scoring, reasons, and smart recommendations'],
  ['Safety Center', 'Verification, reports, blocks, privacy, and emergency controls'],
  ['Admin Moderation', 'Review reports, photo checks, suspicious activity, and audit trails'],
  ['Rewards Engine', 'Referral points, badges, loyalty tiers, and daily check-ins'],
  ['Premium Growth', 'Boosts, spotlight, super likes, and plan management'],
  ['Support Desk', 'Tickets, attachments, status, and support notifications']
];

export default function NextLevelDashboard() {
  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <section className="max-w-7xl mx-auto">
        <p className="text-pink-300 font-semibold">DateBuk Enterprise Layer</p>
        <h1 className="text-4xl font-bold mt-2">Multipurpose Dating, Safety, Support, and Growth Platform</h1>
        <p className="text-slate-300 mt-4 max-w-3xl">A production-oriented page system for user engagement, trust, monetization, and operational management.</p>
        <div className="grid md:grid-cols-3 gap-5 mt-10">
          {cards.map(([title, desc]) => (
            <article key={title} className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="text-slate-300 mt-3">{desc}</p>
              <button className="mt-5 rounded-xl bg-pink-500 px-4 py-2 font-semibold">Open Module</button>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
