import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div id="landing-screen">
      <nav className="land-nav">
        <div className="logo">Quote<span>Flow</span></div>
        <div className="land-nav-links">
          <a onClick={() => navigate('/pricing')}>Pricing</a>
          <a onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>Features</a>
          <a>For Freelancers</a>
          <button className="btn-land-ghost" onClick={() => navigate('/login')}>Log in</button>
          <button className="btn btn-primary" onClick={() => navigate('/login')}>Get Started Free</button>
        </div>
      </nav>
      <div className="land-hero">
        <div className="land-badge">
          <div className="land-badge-dot" /> Built for the Caribbean. Works worldwide.
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
            { num: 'Multi-currency', label: 'JMD, USD, TTD, GBP & more' },
            { num: 'GCT ready', label: 'Local tax support' },
          ].map(s => (
            <div className="stat-item" key={s.label}>
              <div className="stat-num">{s.num}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <section className="social-proof-bar">
        <p>Trusted by freelancers and small businesses across</p>
        <div className="flags">
          🇯🇲 Jamaica &nbsp;·&nbsp; 🇹🇹 Trinidad &nbsp;·&nbsp; 🇧🇧 Barbados &nbsp;·&nbsp; 🇬🇾 Guyana
        </div>
      </section>

      <section className="how-it-works">
        <div className="section-label">HOW IT WORKS</div>
        <h2>From enquiry to payment<br />in three steps</h2>
        <div className="steps">
          <div className="step">
            <div className="step-number">01</div>
            <h3>Create your quote</h3>
            <p>Add your services, set your price, apply your branding. Done in minutes — not hours.</p>
          </div>
          <div className="step">
            <div className="step-number">02</div>
            <h3>Send via WhatsApp or email</h3>
            <p>Your client receives a professional link they can view, accept, and sign from any device.</p>
          </div>
          <div className="step">
            <div className="step-number">03</div>
            <h3>Get paid instantly</h3>
            <p>Accept WiPay, Stripe, and PayPal. Collect deposits or full payments directly through your quote.</p>
          </div>
        </div>
      </section>

      <section className="features" id="features">
        <div className="section-label">FEATURES</div>
        <h2>Everything you need.<br />Nothing you don&apos;t.</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>WhatsApp Sharing</h3>
            <p>Send quotes directly via WhatsApp with one tap. Meet your clients where they already are.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💳</div>
            <h3>Local Payments</h3>
            <p>Accept JMD, TTD, and BBD via WiPay — plus Stripe and PayPal for international clients. Get paid in your currency, wherever your client is.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">✍️</div>
            <h3>Digital Signatures</h3>
            <p>Clients accept and sign quotes online. No printing, scanning, or back-and-forth.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📄</div>
            <h3>PDF Download</h3>
            <p>Download any quote as a professional PDF — perfect for records and invoicing.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💰</div>
            <h3>Deposit Collection</h3>
            <p>Request a deposit upfront and collect the balance on completion. Protect your work.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🧾</div>
            <h3>GCT Ready</h3>
            <p>Built for Jamaica&apos;s tax system. Add GCT to any quote with a single toggle.</p>
          </div>
        </div>
      </section>

      <section className="testimonials">
        <div className="section-label">TESTIMONIALS</div>
        <h2>Freelancers love QuoteFlow</h2>
        <div className="testimonials-grid">
          <div className="testimonial-card">
            <div className="stars">★★★★★</div>
            <p>&quot;I used to spend an hour putting together quotes in Word. Now I do it in 5 minutes and my clients actually respond faster.&quot;</p>
            <div className="testimonial-author">
              <div className="author-avatar">JM</div>
              <div>
                <strong>Jason Mitchell</strong>
                <span>Electrician, Kingston</span>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <div className="stars">★★★★★</div>
            <p>&quot;The WiPay integration is exactly what we needed. Clients can pay in JMD and the money hits my account the same day.&quot;</p>
            <div className="testimonial-author">
              <div className="author-avatar">SR</div>
              <div>
                <strong>Simone Richards</strong>
                <span>Interior Designer, Trinidad</span>
              </div>
            </div>
          </div>
          <div className="testimonial-card">
            <div className="stars">★★★★★</div>
            <p>&quot;My clients think I have a whole team behind me. QuoteFlow makes my one-person business look completely professional.&quot;</p>
            <div className="testimonial-author">
              <div className="author-avatar">DK</div>
              <div>
                <strong>Danielle King</strong>
                <span>Graphic Designer, Barbados</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pricing-preview">
        <div className="section-label">PRICING</div>
        <h2>Start free.<br />Upgrade when you&apos;re ready.</h2>
        <p className="pricing-sub">No credit card required. Cancel anytime.</p>
        <div className="pricing-cards">
          <div className="pricing-card">
            <div className="plan-name">Free</div>
            <div className="plan-price">$0</div>
            <ul>
              <li>✓ 3 quotes per month</li>
              <li>✓ WhatsApp &amp; email sharing</li>
              <li>✓ PDF download</li>
              <li>✓ WiPay &amp; Stripe payments</li>
            </ul>
            <button type="button" className="btn-outline" onClick={() => navigate('/login')}>Get Started Free</button>
          </div>
          <div className="pricing-card featured">
            <div className="plan-badge">Most Popular</div>
            <div className="plan-name">Pro</div>
            <div className="plan-price">$15<span>/month</span></div>
            <ul>
              <li>✓ Unlimited quotes</li>
              <li>✓ Custom branding</li>
              <li>✓ Deposit collection</li>
              <li>✓ Payment receipts</li>
              <li>✓ Priority support</li>
            </ul>
            <button type="button" className="btn-primary" onClick={() => navigate('/login')}>Get Pro</button>
          </div>
          <div className="pricing-card">
            <div className="plan-name">Business</div>
            <div className="plan-price">$39<span>/month</span></div>
            <ul>
              <li>✓ Everything in Pro</li>
              <li>✓ Team members (5)</li>
              <li>✓ White-label quotes</li>
              <li>✓ Priority support</li>
            </ul>
            <button type="button" className="btn-outline" onClick={() => navigate('/login')}>Get Business</button>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <h2>Ready to win more clients?</h2>
        <p>Join freelancers and small businesses across the Caribbean and beyond. Start sending professional quotes today — it&apos;s free.</p>
        <button type="button" className="btn-primary large" onClick={() => navigate('/login')}>
          Create your first quote — free
        </button>
        <p className="no-card">No credit card required</p>
      </section>

      <footer>
        <div className="footer-top">
          <div className="footer-brand">
            <div className="logo">Quote<span>Flow</span></div>
            <p>Professional quotes for Caribbean freelancers and small businesses.</p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h4>Product</h4>
              <a href="#features" onClick={e => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}>Features</a>
              <a onClick={() => navigate('/pricing')}>Pricing</a>
              <a onClick={() => navigate('/login')}>Get Started</a>
            </div>
            <div className="footer-col">
              <h4>Company</h4>
              <a href="#" onClick={e => e.preventDefault()}>About</a>
              <a href="#" onClick={e => e.preventDefault()}>Contact</a>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <a href="#" onClick={e => e.preventDefault()}>Privacy Policy</a>
              <a href="#" onClick={e => e.preventDefault()}>Terms of Service</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 QuoteFlow. All rights reserved.</p>
          <p className="footer-caribbean">Built in the Caribbean. Used worldwide. 🌴</p>
        </div>
      </footer>
    </div>
  );
}
