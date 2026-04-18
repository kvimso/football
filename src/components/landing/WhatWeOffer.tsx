import Image from 'next/image'
import Link from 'next/link'

const LEAGUE_ROWS = [
  {
    rank: '01',
    club: 'Dinamo Tbilisi',
    logo: '/images/clubs/dinamo-tbilisi.jpg',
    pts: 44,
    active: true,
  },
  {
    rank: '02',
    club: 'Torpedo Kutaisi',
    logo: '/images/clubs/torpedo-kutaisi.jpg',
    pts: 39,
    active: false,
  },
  {
    rank: '03',
    club: 'Iberia 1999',
    logo: '/images/clubs/iberia-1999.jpg',
    pts: 36,
    active: false,
  },
  {
    rank: '04',
    club: 'Locomotive',
    logo: '/images/clubs/locomotive-tbilisi.avif',
    pts: 31,
    active: false,
  },
] as const

const PROFILE_STACK = [
  { name: 'Nika Kobakhidze', meta: 'DEF · 17 · Iberia', tier: 1 },
  { name: 'Aleko Basiladze', meta: 'ATT · 19 · Torpedo', tier: 2 },
  { name: 'Luka Tabatadze', meta: 'MID · 18 · Dinamo Tbilisi', tier: 3 },
] as const

export function WhatWeOffer() {
  return (
    <section className="landing-offer" id="what-we-offer">
      <div className="landing-offer-head">
        <div className="landing-section-eyebrow">What we offer</div>
        <h2 className="landing-section-title">
          A scouting platform <em>built for professionals.</em>
        </h2>
        <div className="landing-section-rule" />
      </div>

      <div className="landing-offer-grid">
        {/* Feature card — spans row 1 */}
        <div className="landing-offer-card landing-offer-feature">
          <div className="landing-offer-feature-copy">
            <div className="landing-offer-num">№ 01 · The foundation</div>
            <h3 className="landing-offer-title">Verified player profiles, top to bottom.</h3>
            <p className="landing-offer-desc">
              37,600 youth players. Every stat camera-verified by Pixellot. No inflation, no fiction
              — just the truth of what happens on the pitch.
            </p>
            <Link href="/players" className="landing-offer-link">
              Browse all players →
            </Link>
          </div>
          <div className="landing-offer-stack">
            {PROFILE_STACK.map((p) => (
              <div key={p.name} className={`landing-offer-pcard landing-offer-pcard-${p.tier}`}>
                <div className={`landing-offer-pava pava-${p.tier}`} aria-hidden="true" />
                <div>
                  <div className="landing-offer-pname">{p.name}</div>
                  <div className="landing-offer-pmeta">{p.meta}</div>
                </div>
                <div className="landing-offer-pverif">Verified</div>
              </div>
            ))}
          </div>
        </div>

        {/* League card */}
        <div className="landing-offer-card">
          <div className="landing-offer-num">№ 02 · The pulse</div>
          <h3 className="landing-offer-title">Real-time league data.</h3>
          <p className="landing-offer-desc">
            Twelve leagues. Every match. Updated the moment it happens.
          </p>
          <div className="landing-offer-vis">
            <div className="landing-offer-vis-head">
              <div className="landing-offer-vis-title">U-19 Premier · Matchday 18</div>
              <div className="landing-offer-vis-live">
                <span className="landing-offer-live" aria-hidden="true" />
                Live
              </div>
            </div>
            <div className="landing-offer-mini-table">
              <div className="landing-offer-mini-tbl-head">
                <span>#</span>
                <span>Club</span>
                <span style={{ textAlign: 'right' }}>Pts</span>
              </div>
              {LEAGUE_ROWS.map((row) => (
                <div
                  key={row.rank}
                  className={`landing-offer-mini-row${row.active ? ' is-active' : ''}`}
                >
                  <span className="landing-offer-mini-rank">{row.rank}</span>
                  <span className="landing-offer-mini-club">
                    <Image
                      src={row.logo}
                      alt={row.club}
                      width={22}
                      height={22}
                      unoptimized
                      className="landing-offer-mini-logo"
                    />
                    {row.club}
                  </span>
                  <span className="landing-offer-mini-pts">{row.pts}</span>
                </div>
              ))}
            </div>
            <div className="landing-offer-mini-foot">
              <span>Updated 14s ago</span>
              <span className="landing-offer-mini-foot-pulse">
                <span aria-hidden="true">↑ </span>Dinamo 2 – 1 Iberia
              </span>
            </div>
          </div>
          <Link href="/leagues" className="landing-offer-link">
            Explore leagues →
          </Link>
        </div>

        {/* Chat card */}
        <div className="landing-offer-card">
          <div className="landing-offer-num">№ 03 · The direct line</div>
          <h3 className="landing-offer-title">Direct academy contact.</h3>
          <p className="landing-offer-desc">No middlemen. No gatekeepers. Just conversations.</p>
          <div className="landing-offer-vis">
            <div className="landing-offer-chat">
              <div className="landing-offer-chat-head">
                <div className="landing-offer-chat-ava" aria-hidden="true">
                  TK
                </div>
                <div className="landing-offer-chat-info">
                  <div className="landing-offer-chat-name">Torpedo Kutaisi</div>
                  <div className="landing-offer-chat-status">
                    <span aria-hidden="true" />
                    Active now
                  </div>
                </div>
                <div className="landing-offer-chat-menu" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
              <div className="landing-offer-chat-body">
                <div className="landing-offer-chat-divider">Today</div>
                <div className="landing-offer-chat-msg-row is-out">
                  <div>
                    <div className="landing-offer-chat-bub is-out">
                      Interested in Basiladze — available for a trial this month?
                    </div>
                    <div className="landing-offer-chat-time is-out">14:02 ✓✓</div>
                  </div>
                  <div className="landing-offer-chat-mini-ava is-ps" aria-hidden="true">
                    P
                  </div>
                </div>
                <div className="landing-offer-chat-msg-row">
                  <div className="landing-offer-chat-mini-ava is-tk" aria-hidden="true">
                    T
                  </div>
                  <div>
                    <div className="landing-offer-chat-bub is-in">
                      Yes — sending footage + availability by EOD.
                    </div>
                    <div className="landing-offer-chat-time">14:08</div>
                  </div>
                </div>
                <div className="landing-offer-chat-msg-row">
                  <div className="landing-offer-chat-mini-ava is-tk" aria-hidden="true">
                    T
                  </div>
                  <div className="landing-offer-chat-typing-bub" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
              <div className="landing-offer-chat-input">
                <div className="landing-offer-chat-input-field">Write a message…</div>
                <div className="landing-offer-chat-send" aria-hidden="true">
                  →
                </div>
              </div>
            </div>
          </div>
          <Link href="/login" className="landing-offer-link">
            Start messaging →
          </Link>
        </div>
      </div>
    </section>
  )
}
