import Link from 'next/link'
import { PlayerSlider, type SliderPlayer } from './PlayerSlider'

export function Hero({ players }: { players: SliderPlayer[] }) {
  return (
    <section className="landing-hero">
      <div className="landing-container landing-hero-inner">
        <div>
          <div className="landing-hero-eyebrow">The Scouting Platform</div>
          <h1 className="landing-hero-headline">
            Where Georgian football&apos;s <em>next chapter</em> begins.
          </h1>
          <p className="landing-hero-sub">
            A platform built for the country quietly producing some of Europe&apos;s most thrilling
            young talent. Verified data, real footage, direct contact with academies — all in one
            place.
          </p>
          <div className="landing-hero-cta-row">
            <Link href="/register" className="landing-btn-primary">
              Request Access →
            </Link>
            <Link href="#what-we-offer" className="landing-btn-ghost">
              How it works
            </Link>
          </div>
        </div>
        <div className="landing-slider-wrap">
          <PlayerSlider players={players} />
        </div>
      </div>
    </section>
  )
}
