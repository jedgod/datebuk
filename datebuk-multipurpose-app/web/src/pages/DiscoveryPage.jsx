import React, { useEffect, useState } from 'react';
import { PageFrame, ContentCard } from '../components/PageFrame';
import { matchScorePayload } from '../data/features';
import { api } from '../lib/api';

const nearbyPeople = [
  { name: 'Adele', distance: '1.2 mi', score: 97 },
  { name: 'Nia', distance: '4.8 mi', score: 95 },
  { name: 'Tomi', distance: '8.3 mi', score: 93 },
  { name: 'Sade', distance: '12 mi', score: 90 },
];

export default function DiscoveryPage({ group, selectedItem }) {
  const [matchSnapshot, setMatchSnapshot] = useState(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    api.post('/api/match/score', matchScorePayload)
      .then((data) => {
        if (!active) return;
        setMatchSnapshot(data);
        setLoadError('');
      })
      .catch((err) => {
        if (!active) return;
        setLoadError(err.message || 'Failed to load AI match insights');
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <PageFrame
      variant="discovery"
      eyebrow={group.title}
      title={selectedItem?.name || 'Discovery'}
      summary={selectedItem?.description || 'Nearby singles, AI matching and events with location-aware discovery cues.'}
      asideTitle="Discovery intelligence"
      asideSubtitle={matchSnapshot ? `AI score ${matchSnapshot.score}% · ${matchSnapshot.label}` : 'Loading AI score...'}
      asideChildren={(
        <div className="listGrid">
          {(matchSnapshot?.reasons || []).map((reason) => (
            <div className="listRow" key={reason}>{reason}</div>
          ))}
          {!matchSnapshot ? <div className="listRow">Calculating compatibility reasons...</div> : null}
        </div>
      )}
    >
      {loadError ? <div className="errorCard">{loadError}</div> : null}
      <section className="compassBand">
        {['Downtown', 'Waterfront', 'Arts District', 'University Loop'].map((zone) => (
          <div key={zone} className="signalChip">{zone}</div>
        ))}
      </section>
      <section className="profileGrid">
        {nearbyPeople.map((person) => (
          <article className="profileCard" key={person.name}>
            <div className="avatar">{person.name.slice(0, 1)}</div>
            <h3>{person.name}</h3>
            <p>{person.distance} away</p>
            <strong>{person.score}% Match</strong>
            <button>View Profile</button>
          </article>
        ))}
      </section>
      <section className="featureStrip">
        {group.items.map((item) => (
          <ContentCard key={item.slug} title={item.name} description={item.description} tone="discovery" actionLabel={item.slug === selectedItem?.slug ? 'Selected' : 'Open module'} />
        ))}
      </section>
    </PageFrame>
  );
}
