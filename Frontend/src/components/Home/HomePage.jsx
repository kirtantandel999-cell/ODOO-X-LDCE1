import React, { useState, useEffect, useRef } from 'react';
import './HomePage.css';

export default function HomePage({ onNavigate }) {
  const [scrolled, setScrolled] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const carouselRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollCarousel = (amount) => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const handleNavClick = () => {
    setNavOpen(false);
  };

  return (
    <div className="home-page-wrapper">
      {/* NAV */}
      <nav className={`nav ${scrolled ? 'scrolled' : ''}`} id="nav">
        <div className="wrap">
          <a href="#top" className="logo"><span className="mark">GT</span> GlobalTrotter</a>
          <ul className={`nav-links ${navOpen ? 'open' : ''}`} id="navLinks">
            <li><a href="#regions" onClick={handleNavClick}>Explore</a></li>
            <li><a href="#trips" onClick={handleNavClick}>My Trips</a></li>
            <li>
              <a
                href="#calendar"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick();
                  onNavigate && onNavigate('calendar');
                }}
              >
                Calendar
              </a>
            </li>
            <li>
              <a
                href="#profile"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick();
                  onNavigate && onNavigate('profile');
                }}
              >
                Profile
              </a>
            </li>
            <li>
              <a
                href="#admin"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick();
                  onNavigate && onNavigate('admin');
                }}
              >
                Admin
              </a>
            </li>
            <li><a href="#about" onClick={handleNavClick}>About</a></li>
            <li>
              <a 
                href="#login" 
                onClick={(e) => { e.preventDefault(); handleNavClick(); onNavigate('login'); }}
              >
                Login
              </a>
            </li>
            <li>
              <a 
                href="#register" 
                className="btn-register"
                onClick={(e) => { e.preventDefault(); handleNavClick(); onNavigate('register'); }}
              >
                Register
              </a>
            </li>
          </ul>
          <button className="nav-toggle" id="navToggle" onClick={() => setNavOpen(!navOpen)}>☰</button>
        </div>
      </nav>

      {/* HERO */}
      <header className="hero" id="top">
        <div className="hero-bg"></div>
        <div className="hero-veil"></div>
        <div className="wrap hero-content">
          <span className="eyebrow">Personalized travel planning</span>
          <h1>Every trip, planned<br/>around <em>you</em>.</h1>
          <p>From Rajasthan's forts to the coasts of Portugal — build itineraries as unique as your passport stamps, then let GlobalTrotter handle the logistics.</p>
          <div className="hero-actions">
            <a
              href="#create-trip"
              className="btn btn-primary"
              onClick={(e) => {
                e.preventDefault();
                onNavigate && onNavigate('createTrip');
              }}
            >
              Start Planning →
            </a>
            <a 
              href="#calendar" 
              className="btn btn-ghost"
              onClick={(e) => {
                e.preventDefault();
                onNavigate && onNavigate('calendar');
              }}
            >
              📅 Trip Calendar
            </a>
          </div>
        </div>
      </header>

      <div className="wrap">
        {/* SEARCH BAR */}
        <div className="search-float" id="search">
          <div className="search-card">
            <div className="search-field">
              <label>Destination</label>
              <input type="text" placeholder="Try 'Kerala' or 'Japan'" />
            </div>
            <div className="search-field">
              <label>Group By</label>
              <select>
                <option>Region</option>
                <option>Trip length</option>
                <option>Budget</option>
                <option>Travel style</option>
              </select>
            </div>
            <div className="search-field">
              <label>Filter</label>
              <select>
                <option>All trips</option>
                <option>Domestic (India)</option>
                <option>International</option>
                <option>Under 5 days</option>
                <option>Family-friendly</option>
              </select>
            </div>
            <div className="search-field">
              <label>Sort By</label>
              <select>
                <option>Popularity</option>
                <option>Price: low to high</option>
                <option>Newest itineraries</option>
                <option>Rating</option>
              </select>
            </div>
            <button className="search-go">🔍 Search</button>
          </div>
        </div>

        {/* TOP REGIONAL SELECTIONS */}
        <section id="regions">
          <div className="section-head">
            <div>
              <h2>Top Regional Selections</h2>
              <p className="sub">Curated starting points for your next itinerary — hover a card to see what's inside.</p>
            </div>
            <a href="#all-regions" className="see-all">View all regions →</a>
          </div>

          <div className="group-label intl"><span className="dot"></span> International</div>
          <div className="grid">
            <article className="dest-card">
              <span className="stamp intl">ASIA<br/>◆</span>
              <img src="https://images.unsplash.com/photo-1480796927426-f609979314bd?auto=format&fit=crop&w=700&q=70" alt="Asia" />
              <div className="dest-veil"></div>
              <div className="dest-info">
                <div className="region">Continent</div>
                <h3>Asia</h3>
                <div className="dest-explore">Explore itineraries →</div>
              </div>
            </article>
            <article className="dest-card">
              <span className="stamp intl">EUR<br/>◆</span>
              <img src="https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=700&q=70" alt="Europe" />
              <div className="dest-veil"></div>
              <div className="dest-info">
                <div className="region">Continent</div>
                <h3>Europe</h3>
                <div className="dest-explore">Explore itineraries →</div>
              </div>
            </article>
            <article className="dest-card">
              <span className="stamp intl">AMR<br/>◆</span>
              <img src="https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=700&q=70" alt="Americas" />
              <div className="dest-veil"></div>
              <div className="dest-info">
                <div className="region">Continent</div>
                <h3>Americas</h3>
                <div className="dest-explore">Explore itineraries →</div>
              </div>
            </article>
            <article className="dest-card">
              <span className="stamp intl">AFR<br/>◆</span>
              <img src="https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=700&q=70" alt="Africa" />
              <div className="dest-veil"></div>
              <div className="dest-info">
                <div className="region">Continent</div>
                <h3>Africa</h3>
                <div className="dest-explore">Explore itineraries →</div>
              </div>
            </article>
          </div>

          <div className="group-label india"><span className="dot"></span> Indian Trips</div>
          <div className="grid india">
            <article className="dest-card">
              <span className="stamp india">RJ<br/>◆</span>
              <img src="https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=70" alt="Rajasthan" />
              <div className="dest-veil"></div>
              <div className="dest-info">
                <div className="region">India</div>
                <h3>Rajasthan</h3>
                <div className="dest-explore">Explore itineraries →</div>
              </div>
            </article>
            <article className="dest-card">
              <span className="stamp india">KL<br/>◆</span>
              <img src="https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=600&q=70" alt="Kerala" />
              <div className="dest-veil"></div>
              <div className="dest-info">
                <div className="region">India</div>
                <h3>Kerala</h3>
                <div className="dest-explore">Explore itineraries →</div>
              </div>
            </article>
            <article className="dest-card">
              <span className="stamp india">GA<br/>◆</span>
              <img src="https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=70" alt="Goa" />
              <div className="dest-veil"></div>
              <div className="dest-info">
                <div className="region">India</div>
                <h3>Goa</h3>
                <div className="dest-explore">Explore itineraries →</div>
              </div>
            </article>
            <article className="dest-card">
              <span className="stamp india">HP<br/>◆</span>
              <img src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=600&q=70" alt="Himachal Pradesh" />
              <div className="dest-veil"></div>
              <div className="dest-info">
                <div className="region">India</div>
                <h3>Himachal Pradesh</h3>
                <div className="dest-explore">Explore itineraries →</div>
              </div>
            </article>
            <article className="dest-card">
              <span className="stamp india">NE<br/>◆</span>
              <img src="https://img.veenaworld.com/wp-content/uploads/2023/06/Natures-Paradise-Discover-the-Best-Places-To-Visit-in-North-East-India.jpg" alt="North-East India" />
              <div className="dest-veil"></div>
              <div className="dest-info">
                <div className="region">India</div>
                <h3>North-East India</h3>
                <div className="dest-explore">Explore itineraries →</div>
              </div>
            </article>
          </div>
        </section>

        {/* PREVIOUS TRIPS */}
        <section id="trips">
          <div className="section-head">
            <div>
              <h2>Previous Trips</h2>
              <p className="sub">Your travel history, kept like boarding passes — tap any stub to reopen the full itinerary.</p>
            </div>
            <a href="#all-trips" className="see-all">View all trips →</a>
          </div>

          <div className="carousel-shell">
            <div className="carousel" id="carousel" ref={carouselRef}>
              <div className="ticket">
                <div className="ticket-photo">
                  <img src="https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=500&q=70" alt="Udaipur trip" />
                  <span className="ticket-status">Completed</span>
                </div>
                <div className="perforation"></div>
                <div className="ticket-body">
                  <div className="ticket-route"><span>AMD</span><span className="plane">✈</span><span>UDR</span></div>
                  <div className="ticket-dates">12 – 16 Feb 2026 · 4 nights</div>
                  <div className="ticket-foot"><span className="ticket-tag">Rajasthan · Heritage</span><a href="#view" className="ticket-view">View →</a></div>
                </div>
              </div>
              <div className="ticket">
                <div className="ticket-photo">
                  <img src="https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=500&q=70" alt="Alleppey trip" />
                  <span className="ticket-status">Completed</span>
                </div>
                <div className="perforation"></div>
                <div className="ticket-body">
                  <div className="ticket-route"><span>COK</span><span className="plane">✈</span><span>ALP</span></div>
                  <div className="ticket-dates">3 – 7 Nov 2025 · 4 nights</div>
                  <div className="ticket-foot"><span className="ticket-tag">Kerala · Backwaters</span><a href="#view" className="ticket-view">View →</a></div>
                </div>
              </div>
              <div className="ticket">
                <div className="ticket-photo">
                  <img src="https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=500&q=70" alt="Rome trip" />
                  <span className="ticket-status">Completed</span>
                </div>
                <div className="perforation"></div>
                <div className="ticket-body">
                  <div className="ticket-route"><span>DEL</span><span className="plane">✈</span><span>FCO</span></div>
                  <div className="ticket-dates">18 – 27 Jun 2025 · 9 nights</div>
                  <div className="ticket-foot"><span className="ticket-tag">Europe · City & Coast</span><a href="#view" className="ticket-view">View →</a></div>
                </div>
              </div>
              <div className="ticket">
                <div className="ticket-photo">
                  <img src="https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=500&q=70" alt="Manali trip" />
                  <span className="ticket-status">Completed</span>
                </div>
                <div className="perforation"></div>
                <div className="ticket-body">
                  <div className="ticket-route"><span>DEL</span><span className="plane">✈</span><span>KUU</span></div>
                  <div className="ticket-dates">2 – 6 Jan 2025 · 4 nights</div>
                  <div className="ticket-foot"><span className="ticket-tag">Himachal · Mountains</span><a href="#view" className="ticket-view">View →</a></div>
                </div>
              </div>
              <div className="ticket">
                <div className="ticket-photo">
                  <img src="https://images.unsplash.com/photo-1480796927426-f609979314bd?auto=format&fit=crop&w=500&q=70" alt="Bali trip" />
                  <span className="ticket-status">Completed</span>
                </div>
                <div className="perforation"></div>
                <div className="ticket-body">
                  <div className="ticket-route"><span>BLR</span><span className="plane">✈</span><span>DPS</span></div>
                  <div className="ticket-dates">14 – 20 Sep 2024 · 6 nights</div>
                  <div className="ticket-foot"><span className="ticket-tag">Asia · Island</span><a href="#view" className="ticket-view">View →</a></div>
                </div>
              </div>
            </div>
            <div className="carousel-nav">
              <button aria-label="Scroll left" onClick={() => scrollCarousel(-340)}>←</button>
              <button aria-label="Scroll right" onClick={() => scrollCarousel(340)}>→</button>
            </div>
          </div>
        </section>
      </div>

      {/* FLOATING CTA */}
      <a
        href="#create-trip"
        className="fab"
        onClick={(e) => {
          e.preventDefault();
          onNavigate && onNavigate('createTrip');
        }}
      >
        <span>+</span>
        <span className="label">Plan a Trip</span>
      </a>

      {/* FOOTER */}
      <footer id="about">
        <div className="wrap">
          <div className="foot-grid">
            <div className="foot-brand">
              <a href="#top" className="logo"><span className="mark">GT</span> GlobalTrotter</a>
              <p>Personalized itineraries across India and the world — planned around how you actually like to travel.</p>
            </div>
            <div>
              <h4>Explore</h4>
              <ul>
                <li><a href="#regions">International</a></li>
                <li><a href="#regions">Indian Trips</a></li>
                <li><a href="#trips">My Trips</a></li>
              </ul>
            </div>
            <div>
              <h4>Company</h4>
              <ul>
                <li><a href="#about">About Us</a></li>
                <li><a href="#careers">Careers</a></li>
                <li><a href="#help">Help Center</a></li>
              </ul>
            </div>
            <div>
              <h4>Contact</h4>
              <ul>
                <li><a href="mailto:hello@globaltrotter.travel">hello@globaltrotter.travel</a></li>
                <li><a href="tel:+911234567890">+91 12345 67890</a></li>
                <li>Ahmedabad, India</li>
              </ul>
            </div>
          </div>
          <div className="foot-bottom">
            <span>© 2026 GlobalTrotter. All rights reserved.</span>
            <div className="social-row">
              <a href="#ig" aria-label="Instagram">IG</a>
              <a href="#x" aria-label="Twitter">X</a>
              <a href="#fb" aria-label="Facebook">FB</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
