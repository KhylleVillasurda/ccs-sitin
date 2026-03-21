import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import './Landing.css'

export default function Landing() {
  const { user } = useAuth()

  return (
    <div className="landing">
      {/* Navbar */}
      <nav className="nav">
        <div className="nav-brand">
          <img src="/uc-logo.png" alt="University of Cebu" className="nav-uc-logo" />
          <div className="nav-divider" />
          <img src="/ccs-logo.jpg" alt="CCS Logo" className="nav-ccs-logo" />
          <div className="nav-brand-text">
            <span className="nav-title">CCS Sit-in Monitor</span>
            <span className="nav-subtitle">University of Cebu</span>
          </div>
        </div>
        <div className="nav-links">
          <a href="#about" className="nav-link">About</a>
          <a href="#features" className="nav-link">Features</a>
          {user ? (
            <Link to={user.role === 'admin' ? '/admin' : '/student'} className="btn btn-primary">
              Dashboard →
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Login</Link>
              <Link to="/register" className="btn btn-primary">Register</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-orb orb1" />
          <div className="hero-orb orb2" />
          <div className="hero-orb orb3" />
        </div>

        <div className="hero-content">
          {/* School identity strip */}
          <div className="hero-school-strip">
            <img src="/uc-logo.png" alt="UC" className="hero-uc-logo" />
            <div className="hero-school-info">
              <span className="hero-school-name">University of Cebu</span>
              <span className="hero-dept-name">College of Information &amp; Computer Science</span>
            </div>
            <img src="/ccs-logo.jpg" alt="CCS" className="hero-ccs-logo" />
          </div>

          <h1 className="hero-title">
            Sit-in Monitoring<br />
            <span className="hero-accent">System</span>
          </h1>
          <p className="hero-desc">
            A streamlined platform for managing student lab sit-ins at the College of
            Information &amp; Computer Science. Track sessions, monitor usage, and manage
            student records — all in one place.
          </p>
          <div className="hero-actions">
            {user ? (
              <Link to={user.role === 'admin' ? '/admin' : '/student'} className="btn btn-primary hero-cta">
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary hero-cta">Get Started →</Link>
                <Link to="/login" className="btn btn-ghost hero-cta">Sign In</Link>
              </>
            )}
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-num">30</span>
              <span className="hero-stat-lbl">Sessions / Student</span>
            </div>
            <div className="hero-stat-sep" />
            <div className="hero-stat">
              <span className="hero-stat-num">5</span>
              <span className="hero-stat-lbl">Lab Rooms</span>
            </div>
            <div className="hero-stat-sep" />
            <div className="hero-stat">
              <span className="hero-stat-num">Real-time</span>
              <span className="hero-stat-lbl">Tracking</span>
            </div>
            <div className="hero-stat-sep" />
            <div className="hero-stat">
              <span className="hero-stat-num">Est. 1983</span>
              <span className="hero-stat-lbl">Qualitas Erudio</span>
            </div>
          </div>
        </div>

        {/* Right: Mock Dashboard */}
        <div className="hero-visual">
          <div className="mock-dashboard">
            <div className="mock-bar">
              <div className="mock-dot r" /><div className="mock-dot y" /><div className="mock-dot g" />
              <span className="mock-url">CCS Admin Dashboard</span>
            </div>
            <div className="mock-body">
              <div className="mock-sidebar">
                <div className="mock-sb-logo">
                  <img src="/ccs-logo.jpg" alt="CCS" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                  <span style={{ fontSize: '0.6rem', color: 'var(--fg-dim)', lineHeight: 1.2 }}>CICS<br/>Admin</span>
                </div>
                <div className="mock-nav-item active"><i className="bi bi-house-fill" /> Home</div>
                <div className="mock-nav-item"><i className="bi bi-people-fill" /> Students</div>
                <div className="mock-nav-item"><i className="bi bi-laptop-fill" /> Sit-in</div>
                <div className="mock-nav-item"><i className="bi bi-clipboard-data-fill" /> Records</div>
                <div className="mock-nav-item"><i className="bi bi-bar-chart-fill" /> Reports</div>
              </div>
              <div className="mock-main">
                <div className="mock-stats">
                  <div className="mock-stat-card">
                    <div className="mock-stat-icon" style={{background:'rgba(230,152,117,0.15)'}}><i className="bi bi-people-fill" /></div>
                    <div><div className="mock-stat-val">38</div><div className="mock-stat-lbl">Students</div></div>
                  </div>
                  <div className="mock-stat-card">
                    <div className="mock-stat-icon" style={{background:'rgba(167,192,128,0.15)'}}><i className="bi bi-check-circle-fill" /></div>
                    <div><div className="mock-stat-val">12</div><div className="mock-stat-lbl">Sitting In</div></div>
                  </div>
                </div>
                <div className="mock-chart-area">
                  <div className="mock-chart-title">Session Activity by Purpose</div>
                  <div className="mock-bars">
                    {[40,65,55,80,70,90,60].map((h,i)=>(
                      <div key={i} className="mock-bar-col" style={{height: h+'%'}} />
                    ))}
                  </div>
                </div>
                <div className="mock-table">
                  <div className="mock-table-row header">
                    <span>ID</span><span>Name</span><span>Status</span>
                  </div>
                  {['3677937','123456','2000'].map((id,i)=>(
                    <div key={i} className="mock-table-row">
                      <span className="mock-id">{id}</span>
                      <span className="mock-name">Student {i+1}</span>
                      <span className={`mock-badge ${i===0?'active':''}`}>{i===0?'Active':'Done'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Floating logo badge */}
          <div className="hero-logo-badge">
            <img src="/ccs-logo.jpg" alt="CICS" className="badge-logo" />
            <div>
              <div className="badge-title">CICS</div>
              <div className="badge-sub">Since 1983</div>
            </div>
          </div>
        </div>
      </section>

      {/* About / School Section */}
      <section id="about" className="about-section">
        <div className="about-inner">
          <div className="about-logos">
            <div className="about-logo-card">
              <img src="/uc-logo.png" alt="University of Cebu" className="about-logo-img uc" />
              <div>
                <div className="about-logo-title">University of Cebu</div>
                <div className="about-logo-sub">Main Campus · Since 1964</div>
              </div>
            </div>
            <div className="about-logo-sep">×</div>
            <div className="about-logo-card">
              <img src="/ccs-logo.jpg" alt="CICS" className="about-logo-img ccs" />
              <div>
                <div className="about-logo-title">College of Information<br />&amp; Computer Science</div>
                <div className="about-logo-sub">Qualitas Erudio Pro Discipulis · 1983</div>
              </div>
            </div>
          </div>
          <div className="about-text">
            <h2>Built for CICS Students &amp; Faculty</h2>
            <p>
              The CCS Sit-in Monitoring System was developed to streamline how the College of
              Information &amp; Computer Science manages student access to its computer laboratories.
              Students can track their remaining lab sessions, while administrators get a
              comprehensive view of lab utilization across all rooms.
            </p>
            <p>
              Each student starts with <strong style={{color:'var(--accent)'}}>30 sessions</strong> per
              semester. Sessions are logged with timestamps, purpose, and lab room — giving faculty
              accurate records for evaluation and resource planning.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="features">
        <div className="features-inner">
          <div className="features-header">
            <h2>Everything you need to manage lab sit-ins</h2>
            <p>Designed for the College of Information &amp; Computer Science administration</p>
          </div>
          <div className="features-grid">
            {[
              { icon:'bi-shield-lock-fill', title:'Secure Auth', desc:'Role-based access for admins and students with JWT token authentication.' },
              { icon:'bi-bar-chart-fill', title:'Live Statistics', desc:'Real-time dashboard showing current sit-ins, totals, and session counts.' },
              { icon:'bi-folder-fill', title:'Student Registry', desc:'Add, edit, and manage all registered students with full CRUD operations.' },
              { icon:'bi-clipboard-data-fill', title:'Sit-in Records', desc:'Track every session with timestamps, purpose (C++, Java, PHP…), and lab room.' },
              { icon:'bi-megaphone-fill', title:'Announcements', desc:'Admin can post announcements visible to all students on their dashboard.' },
              { icon:'bi-graph-up-arrow', title:'Reports', desc:'Visual breakdowns of lab activity by programming purpose and room number.' },
            ].map(f => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon"><i className={`bi ${f.icon}`} /></div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-inner">
          <div className="cta-logos">
            <img src="/ccs-logo.jpg" alt="CICS" style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} />
          </div>
          <h2>Ready to get started?</h2>
          <p>Register your student account or contact the admin to begin tracking your lab sessions.</p>
          <div className="cta-actions">
            <Link to="/register" className="btn btn-primary hero-cta">Create Account</Link>
            <Link to="/login" className="btn btn-ghost hero-cta">Login</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <img src="/ccs-logo.jpg" alt="CICS" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
            <img src="/uc-logo.png" alt="UC" style={{ width: 40, height: 28, objectFit: 'contain' }} />
            <span>CCS Sit-in Monitoring System</span>
          </div>
          <p style={{ color: 'var(--bg5)', fontSize: '0.78rem' }}>
            © 2026 University of Cebu · College of Information &amp; Computer Science
          </p>
        </div>
      </footer>
    </div>
  )
}
