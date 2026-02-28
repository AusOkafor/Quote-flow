import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div id="landing-screen">
      <nav className="land-nav">
        <div className="logo">Quote<span>Flow</span></div>
        <div className="land-nav-links">
          <a onClick={() => navigate('/pricing')}>Pricing</a>
          <a>Features</a>
          <a>For Freelancers</a>
          <button className="btn-land-ghost" onClick={() => navigate('/login')}>Log in</button>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>Get Started Free</button>
        </div>
      </nav>
      <div className="land-hero">
        <div className="land-badge">
          <div className="land-badge-dot" /> Now live across Caribbean &amp; Latin America
        </div>
        <h1 className="land-h1">
          Win more clients with<br />
          <em>professional quotes</em><br />
          in 5 minutes flat
        </h1>
        <p className="land-sub">
          Stop losing jobs to competitors who look more polished. QuoteFlow turns your services into stunning,
          branded proposals — ready to send via WhatsApp or email instantly.
        </p>
        <div className="land-cta">
          <button className="btn btn-primary" style={{ padding: '14px 34px', fontSize: 15 }} onClick={() => navigate('/login')}>
            Create your first quote — free
          </button>
          <button className="btn-land-ghost" style={{ padding: '14px 26px', fontSize: 15 }} onClick={() => navigate('/q/demo')}>
            See a sample quote ↗
          </button>
        </div>
        <div className="land-stats">
          {[
            { num: '5 min',     label: 'Avg. quote time' },
            { num: '3×',        label: 'More client responses' },
            { num: 'JMD / USD', label: 'Multi-currency' },
            { num: 'GCT ready', label: 'Local tax support' },
          ].map(s => (
            <div className="stat-item" key={s.label}>
              <div className="stat-num">{s.num}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
