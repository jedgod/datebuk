import React from 'react';
import { createRoot } from 'react-dom/client';
import { Globe2, MapPin, Shield, SlidersHorizontal } from 'lucide-react';
import './style.css';

const cards = [
  ['Same Continent Matching', 'Prioritize members from the same continent using privacy-safe IP region detection.', Globe2],
  ['Location Preferences', 'Users control country-only, nearby-only, continent-only, global mode, and travel mode.', SlidersHorizontal],
  ['Regional Matches', 'Rank profiles by city, country, continent, then global compatibility score.', MapPin],
  ['Privacy Protection', 'Approximate location, hashed IP, country-only display, and opt-out controls.', Shield]
];

function App(){
  return <main className="shell">
    <section className="hero">
      <span className="badge">DateBuk Geo-Matching</span>
      <h1>Regional dating intelligence for Web and Mobile</h1>
      <p>Industrial pages for continent-aware matches, travel mode, global mode, privacy-safe region detection, and admin regional access controls.</p>
      <div className="actions"><button>Open Location Settings</button><button className="ghost">View Regional Matches</button></div>
    </section>
    <section className="grid">{cards.map(([t,d,Icon]) => <article className="card" key={t}><Icon/><h3>{t}</h3><p>{d}</p></article>)}</section>
    <section className="panel"><h2>Matching Priority</h2><div className="steps"><b>Same City</b><span/> <b>Same Country</b><span/> <b>Same Continent</b><span/> <b>Global</b></div></section>
  </main>
}

createRoot(document.getElementById('root')).render(<App/>);
