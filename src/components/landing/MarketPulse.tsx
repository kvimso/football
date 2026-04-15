const PULSE_ITEMS = [
  { num: '37,600', label: 'Registered youth players', growth: '↑ 12% year over year' },
  { num: '180+', label: 'Academies nationwide', growth: '↑ 8 new this year' },
  { num: '€100M', label: 'In tracked transfer value', growth: 'Past 5 seasons' },
  { num: '12', label: 'Active leagues', growth: 'U-15 through U-21' },
] as const

export function MarketPulse() {
  return (
    <section className="landing-pulse">
      <div className="landing-container">
        <div className="landing-pulse-label">The Georgian football market, by numbers</div>
        <div className="landing-pulse-grid">
          {PULSE_ITEMS.map((item) => (
            <div key={item.label} className="landing-pulse-item">
              <div className="landing-pulse-num">{item.num}</div>
              <div className="landing-pulse-label-sm">{item.label}</div>
              <div className="landing-pulse-growth">{item.growth}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
