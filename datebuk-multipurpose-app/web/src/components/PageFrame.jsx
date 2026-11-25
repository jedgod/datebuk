import React from 'react';

export function PageFrame({ variant, eyebrow, title, summary, primaryAction = 'Launch Feature', secondaryAction = 'View Details', asideTitle, asideSubtitle, asideChildren, children }) {
  return (
    <div className={`pageFrame ${variant ? `theme-${variant}` : ''}`}>
      <section className="hero">
        <div className="heroText">
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <p>{summary}</p>
          <div className="actions">
            <button className="primary">{primaryAction}</button>
            <button className="secondary">{secondaryAction}</button>
          </div>
        </div>
        <section className="panel">
          <div className="panelHead">
            <div>
              <h3>{asideTitle}</h3>
              {asideSubtitle ? <p>{asideSubtitle}</p> : null}
            </div>
          </div>
          <div className="panelBody">{asideChildren}</div>
        </section>
      </section>
      {children}
    </div>
  );
}

export function ContentCard({ title, description, children, actionLabel = 'Open module', tone = 'default' }) {
  return (
    <article className={`featureCard featureCardStatic tone-${tone}`}>
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
      <span>{actionLabel}</span>
    </article>
  );
}
