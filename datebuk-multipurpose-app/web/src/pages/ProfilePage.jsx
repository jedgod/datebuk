import React from 'react';
import { PageFrame, ContentCard } from '../components/PageFrame';
import { trend } from '../data/features';

export default function ProfilePage({ group, selectedItem }) {
  const peak = Math.max(...trend.map((point) => point.v));

  return (
    <PageFrame
      variant="profile"
      eyebrow={group.title}
      title={selectedItem?.name || 'Profile'}
      summary={selectedItem?.description || 'Profile editing, verification, analytics, and planning tools.'}
      asideTitle="Profile analytics"
      asideSubtitle="Views, likes and match yield"
      asideChildren={(
        <div className="miniChart miniChartTall">
          {trend.map((point) => (
            <div className="miniChartItem" key={point.d}>
              <span style={{ height: `${(point.v / peak) * 100}%` }} />
              <label>{point.d}</label>
            </div>
          ))}
        </div>
      )}
    >
      <section className="listGrid">
        <div className="listRow">Verification center with email, phone and ID trust checks</div>
        <div className="listRow">Profile analytics with views, likes, match rate and funnel insights</div>
        <div className="listRow">Date planner with reminders and availability planning</div>
      </section>
      <section className="profileJourney">
        <article>
          <h3>Trust milestone</h3>
          <p>Selfie + ID verification complete, profile confidence up 18%.</p>
        </article>
        <article>
          <h3>Visibility lift</h3>
          <p>Photo refresh and bio rewrite improved discovery ranking.</p>
        </article>
      </section>
      <section className="featureStrip">
        {group.items.map((item) => (
          <ContentCard key={item.slug} title={item.name} description={item.description} tone="profile" actionLabel={item.slug === selectedItem?.slug ? 'Selected' : 'Open module'} />
        ))}
      </section>
    </PageFrame>
  );
}
