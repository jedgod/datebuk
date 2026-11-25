export default function AdminRiskDashboard() {
  const queue = [
    ['Fake profile cluster', 'High', '24 accounts'],
    ['Harassment report', 'Critical', 'Needs review'],
    ['Payment dispute', 'Medium', 'Awaiting user response'],
    ['Unverified ID spike', 'Medium', 'Region review']
  ];
  return (
    <main className="page-shell">
      <section className="hero-card danger">
        <p className="eyebrow">Admin Operations</p>
        <h1>Risk & Moderation Command Center</h1>
        <p>Review reports, trust score alerts, fraud signals, verification issues, and escalations.</p>
      </section>
      <table className="industrial-table"><thead><tr><th>Case</th><th>Risk</th><th>Detail</th><th>Action</th></tr></thead>
        <tbody>{queue.map(row => <tr key={row[0]}><td>{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td><td><button>Review</button></td></tr>)}</tbody>
      </table>
    </main>
  );
}
