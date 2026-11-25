export default function ComplianceCenter() {
  return (
    <main className="page-shell">
      <section className="hero-card">
        <p className="eyebrow">Trust & Privacy</p>
        <h1>DateBuk Compliance Center</h1>
        <p>Manage consent, privacy requests, account deletion, data export, safety policies, and legal notices from one secure place.</p>
      </section>
      <section className="grid-3">
        {['Privacy Consent', 'Download My Data', 'Delete Account', 'Cookie Settings', 'Community Rules', 'Safety Policy'].map(item => (
          <article className="action-card" key={item}>
            <h3>{item}</h3>
            <p>Industrial workflow with audit trail and status tracking.</p>
            <button>Open</button>
          </article>
        ))}
      </section>
    </main>
  );
}
