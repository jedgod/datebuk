import React from 'react';
import { PageFrame, ContentCard } from '../components/PageFrame';

const chatRows = ['Sophia', 'Faith', 'Gigi', 'Yvette', 'Maria', 'Channelle', 'Empress'];

export default function CommunicationPage({ group, selectedItem }) {
  return (
    <PageFrame
      variant="communication"
      eyebrow={group.title}
      title={selectedItem?.name || 'Communication'}
      summary={selectedItem?.description || 'Messaging, voice, video and date request workflows for active conversations.'}
      asideTitle="Realtime inbox"
      asideSubtitle="A polished communication shell"
      asideChildren={(
        <div className="listGrid">
          {chatRows.map((name, index) => (
            <div className="listRow" key={name}>{name} · {index % 2 === 0 ? 'online' : 'offline'}</div>
          ))}
        </div>
      )}
    >
      <section className="chatStage">
        {chatRows.slice(0, 4).map((name, index) => (
          <article className={`chatBubble ${index % 2 === 0 ? 'right' : 'left'}`} key={`${name}-bubble`}>
            <b>{name}</b>
            <p>{index % 2 === 0 ? 'Voice note ready, want to schedule a quick date call?' : 'Great timing, let us lock this evening and share venue options.'}</p>
          </article>
        ))}
      </section>
      <section className="featureStrip">
        {group.items.map((item) => (
          <ContentCard key={item.slug} title={item.name} description={item.description} tone="communication" actionLabel={item.slug === selectedItem?.slug ? 'Selected' : 'Open module'} />
        ))}
      </section>
    </PageFrame>
  );
}
