import Image from 'next/image'

interface TimelineStop {
  year: string
  club: string
  current?: boolean
}

interface Achievement {
  title: string
  desc: string
}

interface Story {
  name: string
  position: string
  fee: string
  photo: string
  photoPosition: string
  alt: string
  current: { label: string; club: string }
  career: TimelineStop[]
  achievements: Achievement[]
}

const KVARA: Story = {
  name: 'Khvicha Kvaratskhelia',
  position: 'Left Winger · Forward',
  fee: '€70M',
  photo: '/images/landing/kvaratskhelia.jpg',
  photoPosition: '35% 20%',
  alt: 'Khvicha Kvaratskhelia',
  current: { label: 'Currently at', club: 'Paris Saint-Germain' },
  career: [
    { year: '2017 – 2018', club: 'Dinamo Tbilisi' },
    { year: '2019', club: 'Rubin Kazan' },
    { year: '2022 – 2024', club: 'SSC Napoli' },
    { year: '2025 – Present', club: 'Paris Saint-Germain', current: true },
  ],
  achievements: [
    { title: 'Serie A Champion', desc: '2022–23 with Napoli' },
    { title: 'Serie A MVP', desc: '2022–23 Season' },
    { title: '40+ International Caps', desc: 'Georgia National Team' },
  ],
}

const MAMA: Story = {
  name: 'Giorgi Mamardashvili',
  position: 'Goalkeeper',
  fee: '€30M',
  photo: '/images/landing/mamardashvili.jpg',
  photoPosition: 'center 20%',
  alt: 'Giorgi Mamardashvili',
  current: { label: 'Currently at', club: 'Liverpool FC' },
  career: [
    { year: '2016 – 2019', club: 'Dinamo Tbilisi' },
    { year: '2019 – 2021', club: 'Locomotive Tbilisi' },
    { year: '2021 – 2025', club: 'Valencia CF' },
    { year: '2025 – Present', club: 'Liverpool FC', current: true },
  ],
  achievements: [
    { title: 'La Liga Best Goalkeeper', desc: '2023–24 Season' },
    { title: 'Most Saves at Euro 2024', desc: '29 saves — tournament leader' },
    { title: 'Record Georgian Transfer', desc: '€30M to Liverpool FC' },
  ],
}

function TextCell({ story }: { story: Story }) {
  return (
    <div className="landing-stories-cell landing-stories-text">
      <div className="landing-stories-text-header">
        <div>
          <div className="landing-stories-text-name">{story.name}</div>
          <div className="landing-stories-text-pos">{story.position}</div>
        </div>
        <div className="landing-stories-text-fee">{story.fee}</div>
      </div>
      <div className="landing-stories-text-body">
        <div>
          <div className="landing-stories-section-label">Career Path</div>
          <div className="landing-stories-timeline">
            {story.career.map((stop) => (
              <div key={stop.year} className="landing-stories-tl-item">
                <div className="landing-stories-tl-track">
                  <div className={`landing-stories-tl-dot${stop.current ? ' is-current' : ''}`} />
                  {!stop.current && <div className="landing-stories-tl-line" />}
                </div>
                <div>
                  <div className="landing-stories-tl-year">{stop.year}</div>
                  <div className={`landing-stories-tl-club${stop.current ? ' is-current' : ''}`}>
                    {stop.club}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="landing-stories-section-label">Achievements</div>
          <div className="landing-stories-achievements">
            {story.achievements.map((a) => (
              <div key={a.title} className="landing-stories-ach">
                <div className="landing-stories-ach-title">{a.title}</div>
                <div className="landing-stories-ach-desc">{a.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function PhotoCell({ story }: { story: Story }) {
  return (
    <div className="landing-stories-cell landing-stories-photo">
      <Image
        src={story.photo}
        alt={story.alt}
        fill
        sizes="(max-width: 900px) 100vw, 590px"
        style={{ objectFit: 'cover', objectPosition: story.photoPosition }}
      />
      <div className="landing-stories-photo-overlay" aria-hidden="true" />
      <div className="landing-stories-photo-info">
        <div>
          <div className="landing-stories-photo-name">{story.name}</div>
          <div className="landing-stories-photo-pos">{story.position}</div>
        </div>
        <div className="landing-stories-photo-current">
          {story.current.label}
          <strong>{story.current.club}</strong>
        </div>
      </div>
    </div>
  )
}

export function SuccessStories() {
  return (
    <section className="landing-stories">
      <div className="landing-stories-header">
        <h2 className="landing-stories-title">Georgian Talent on the World Stage</h2>
        <div className="landing-stories-rule" />
      </div>
      <div className="landing-stories-spread">
        <TextCell story={KVARA} />
        <PhotoCell story={KVARA} />
        <PhotoCell story={MAMA} />
        <TextCell story={MAMA} />
      </div>
    </section>
  )
}
