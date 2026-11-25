import React, { useEffect, useMemo, useState } from 'react';
import { featureSignals, featureStats, featuredPeople, matchScorePayload, trend } from '../data/features';
import { PageFrame } from '../components/PageFrame';
import { api } from '../lib/api';

function Avatar({ name, online = false }) {
  return (
    <div className="avatar">
      {name.slice(0, 1).toUpperCase()}
      <span className={`status ${online ? 'live' : ''}`} />
    </div>
  );
}

export default function DashboardPage({ selectedItem }) {
  const title = selectedItem?.name || 'Dashboard';
  const description = selectedItem?.description || 'Command center for profile activity, matches, messages, safety and subscriptions.';
  const peak = Math.max(...trend.map((point) => point.v));
  const [matchSnapshot, setMatchSnapshot] = useState(null);
  const [moderationSnapshot, setModerationSnapshot] = useState(null);
  const [supportTicketsSnapshot, setSupportTicketsSnapshot] = useState([]);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;

    Promise.all([
      api.post('/api/match/score', matchScorePayload),
      api.get('/api/admin/moderation'),
      api.get('/api/tickets'),
    ])
      .then(([matchData, moderationData, ticketData]) => {
        if (!active) return;
        setMatchSnapshot(matchData);
        setModerationSnapshot(moderationData);
        setSupportTicketsSnapshot(Array.isArray(ticketData?.items) ? ticketData.items : []);
        setLoadError('');
      })
      .catch((err) => {
        if (!active) return;
        setLoadError(err.message || 'Failed to load operational data');
      });

    return () => {
      active = false;
    };
  }, []);

  const moderationSummary = useMemo(() => {
    if (!moderationSnapshot || !moderationSnapshot.stats) {
      return 'Moderation queue loading...';
    }
    return `Moderation queue: ${moderationSnapshot.stats.pending} pending, ${moderationSnapshot.stats.actioned} actioned`;
  }, [moderationSnapshot]);

  return (
    <PageFrame
      variant="dashboard"
      eyebrow="DateBuk Experience Layer"
      title={`${title} Landing Page`}
      summary="Designed for scalable dating, social discovery, communication, safety, analytics and premium membership workflows."
      asideTitle="Feature health"
      asideSubtitle="Weekly engagement and conversion trend"
      asideChildren={(
        <div className="miniChart">
          {trend.map((point) => (
            <div className="miniChartItem" key={point.d}>
              <span style={{ height: `${(point.v / peak) * 100}%` }} />
              <label>{point.d}</label>
            </div>
          ))}
        </div>
      )}
    >
      <section className="metricGrid">
        {featureStats.map((stat, index) => (
          <div className="metricCard" key={stat.label}>
            <div className="metricIcon">{['❤️', '👀', '💬', '🛡️'][index]}</div>
            <div className="metricValue">{stat.value}</div>
            <div className="metricLabel">{stat.label}</div>
          </div>
        ))}
      </section>

      <section className="signalRow">
        {featureSignals.map((signal) => (
          <div className="signalChip" key={signal}>{signal}</div>
        ))}
      </section>

      <section className="listGrid">
        <div className="listRow">{description}</div>
        <div className="listRow">{matchSnapshot ? `AI score: ${matchSnapshot.score}% · ${matchSnapshot.label}` : 'AI score loading...'}</div>
        <div className="listRow">{moderationSummary}</div>
      </section>
      {loadError ? <div className="errorCard">{loadError}</div> : null}

      <section className="opsGrid">
        <article className="panel">
          <div className="panelHead">
            <div>
              <h3>AI Match explainability</h3>
              <p>Reasoning from the scoring service</p>
            </div>
          </div>
          <div className="panelBody">
            <div className="listGrid">
              {(matchSnapshot?.reasons || []).map((reason) => (
                <div className="listRow" key={reason}>{reason}</div>
              ))}
              {!matchSnapshot ? <div className="listRow">Waiting for AI match explainability...</div> : null}
            </div>
          </div>
        </article>

        <article className="panel">
          <div className="panelHead">
            <div>
              <h3>Support desk snapshot</h3>
              <p>Open and active requests</p>
            </div>
          </div>
          <div className="panelBody">
            <div className="listGrid">
              {supportTicketsSnapshot.map((ticket) => (
                <div className="listRow" key={ticket.id}>{ticket.id} · {ticket.priority} · {ticket.status}</div>
              ))}
              {supportTicketsSnapshot.length === 0 ? <div className="listRow">No active support tickets.</div> : null}
            </div>
          </div>
        </article>
      </section>

      <section className="profileGrid">
        {featuredPeople.map((person) => (
          <article className="profileCard" key={person.name}>
            <Avatar name={person.name} online={person.online} />
            <h3>{person.name}</h3>
            <p>{person.city}</p>
            <strong>{person.score}% Match</strong>
            <button>Connect</button>
          </article>
        ))}
      </section>
    </PageFrame>
  );
}
