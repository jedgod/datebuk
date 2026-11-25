import React from 'react';
import { PageFrame, ContentCard } from '../components/PageFrame';

export default function ConnectionsPage({ group, selectedItem }) {
  return (
    <PageFrame
      variant="connections"
      eyebrow={group.title}
      title={selectedItem?.name || 'Connections'}
      summary={selectedItem?.description || 'Saved profiles, likes, and visitor activity in one professional area.'}
      asideTitle="Connection strategy"
      asideSubtitle="Turn intent into conversations"
      asideChildren={(
        <div className="listGrid">
          <div className="listRow">Prioritize verified profiles</div>
          <div className="listRow">Reply to incoming likes quickly</div>
          <div className="listRow">Keep favorites ready for follow-up</div>
        </div>
      )}
    >
      <section className="laneBoard">
        <article>
          <h3>Incoming intent</h3>
          <p>27 new likes in the last 24h</p>
        </article>
        <article>
          <h3>Warm follow-ups</h3>
          <p>11 conversations need response</p>
        </article>
        <article>
          <h3>Priority reconnect</h3>
          <p>6 high-compatibility profiles pending</p>
        </article>
      </section>
      <section className="featureStrip">
        {group.items.map((item) => (
          <ContentCard key={item.slug} title={item.name} description={item.description} tone="connections" actionLabel={item.slug === selectedItem?.slug ? 'Selected' : 'Open module'} />
        ))}
      </section>
    </PageFrame>
  );
}
