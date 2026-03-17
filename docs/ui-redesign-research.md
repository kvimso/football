# UI Redesign Research: Visual Design & UX Patterns for Football Scouting Platforms

**Research date:** March 2026
**Purpose:** Inspiration and actionable patterns for redesigning the Georgian Football Talent Platform away from its current "clinical/hospital" light/navy look.

---

## Table of Contents

1. [Real Scouting Platform Analysis](#1-real-scouting-platform-analysis)
2. [Football Apps with Personality](#2-football-apps-with-personality)
3. [Modern SaaS Dashboards That Feel Warm](#3-modern-saas-dashboards-that-feel-warm)
4. [Color Palette Recommendations](#4-color-palette-recommendations)
5. [Card Design Patterns](#5-card-design-patterns)
6. [Stat Presentation Best Practices](#6-stat-presentation-best-practices)
7. [Concrete Palette Proposals for GFP](#7-concrete-palette-proposals-for-gfp)

---

## 1. Real Scouting Platform Analysis

### Wyscout (now Hudl Wyscout)

**Theme:** Dark interface with green/teal accents (Hudl brand green).
**Color approach:** Dark gray backgrounds (#1a1a2e range), bright green accent for CTAs and active states. Data tables use alternating dark rows with subtle borders.
**Data presentation:** Dense tabular data with video thumbnails. Player profiles show key metrics in a compact header, with expandable stat sections below. Comparison features allow side-by-side with aligned stat rows.
**Key takeaway:** Professional and data-dense. Does not try to be flashy -- scouts trust it because it gets out of the way and lets data speak. The dark theme reduces eye strain during long scouting sessions.

### SciSports

**Theme:** Dark mode primary, with bright teal/cyan accent.
**Color approach:** Near-black backgrounds with teal (#00B8D4 range) highlights. Clean white text on dark surfaces.
**Data presentation:** 350,000+ player database. Uses "SciSkill" proprietary rating badges. Player comparison uses overlaid radar charts. Recommender engine UI uses card grids with skill rating badges.
**Key takeaway:** The proprietary rating system (SciSkill Index) gives data a branded, trustworthy feel. Visual badges/scores create instant scanability.

### TransferRoom

**Theme:** Light/white interface with blue-purple accent palette.
**Color approach:** Clean white backgrounds, navy/purple brand colors. More corporate/business feel than other platforms.
**Data presentation:** Focus on deal-making rather than stats. Player cards emphasize transfer value (xTV), contract length, and availability. Clean, LinkedIn-like interface for professional networking between clubs.
**Key takeaway:** Proves that scouting platforms don't all need to be dark. The business-networking angle uses a different visual language. Their xTV (Expected Transfer Value) widget is a standout -- a single metric card that tells a story.

### StatsBomb IQ (now Hudl StatsBomb)

**Theme:** Dark analytical interface inspired by Tableau's data visualization aesthetic.
**Color approach:** Dark backgrounds with multi-color data visualizations. Uses distinct colors per metric type. The visualizations themselves provide color, not the chrome.
**Data presentation:** Freeze-frame viewer overlays player positions on pitch. Shot maps use color intensity for xG values. Player radars use filled polygons on dark backgrounds. Comparison views show overlapping radar shapes with transparency.
**Key takeaway:** The "let the data be colorful, keep the interface neutral" principle. Dark backgrounds make data visualizations pop. This is the gold standard for football analytics presentation.

### InStat Scout

**Theme:** Mixed -- light sidebar navigation, dark content area for video.
**Color approach:** Blue accent color, clean whites and grays for data tables.
**Data presentation:** 70 parameters per player profile, all linked to video clips. Click any stat to see the corresponding video playlist. Uses customizable stat tables where scouts can choose which parameters to display.
**Key takeaway:** The video-linked stat model is powerful. Every number has a "watch this" action attached. Stats are never abstract -- they are evidence.

### ScoutingStats.ai (newer platform)

**Theme:** Sophisticated dual-theme (light/dark toggle).
**Color values extracted from CSS:**
- Dark backgrounds: `#0A0A0A`, `#0D0D0D`
- Accent blue: `#0099FF`
- Gold/premium accent: `#C9A227`
- Success green: `#10B981`
- Card shadows: `0 1px 2px rgba(0,0,0,0.05)` to `0 12px 32px rgba(0,0,0,0.12)`
- Border radius: 6px (small), 12px (medium), 16px (large)

**Key takeaway:** The gold accent (#C9A227) for premium features is a strong pattern. Creates a sense of exclusivity and value. The dual-theme approach with glass-morphism effects (backdrop blur) on the navbar is modern.

### Cross-Platform Patterns

| Pattern | Used by | Why it works |
|---------|---------|-------------|
| Dark theme for platform | Wyscout, SciSports, StatsBomb, ScoutingStats | Reduces eye strain, makes data visualizations pop |
| Green/teal accent | Wyscout, SciSports, ScoutingStats | Associated with "go"/positive, common in sports |
| Gold/amber for premium | ScoutingStats, TransferRoom | Communicates value, exclusivity |
| Tabular data + video links | InStat, Wyscout | Every stat is evidence-backed |
| Branded rating badges | SciSports (SciSkill), SofaScore (ratings) | Instant scanability, brand identity |

---

## 2. Football Apps with Personality

### FotMob

**What makes it feel alive:**
- **Green accent color** (#50C66F range) -- used for active nav icons, live match indicators, and score highlights
- **White background** with strategically placed color blocks for match cards
- **Team-colored accents** -- each match card subtly references team colors
- **Quick onboarding** that customizes the experience (follow teams, set alerts)
- **Shot charts + dynamic flow diagrams** for tactical visualization
- **Heatmaps** with smooth gradient fills (not blocky)
- **Physical stats** (distance covered, top speed) presented as compact stat pills

**Design tricks:**
1. Uses team logos/colors as accent colors per context -- so the interface feels different for each match
2. Live match cards have a pulsing green dot indicator
3. Metric cards are compact (3-4 stats per row) with clear labels
4. Momentum graphs show pressure swings with smooth curves

### SofaScore

**What makes it feel alive:**
- **Custom typeface** (Sofascore Sans by Hot Type) -- unique identity through typography alone
- **Dynamic player ratings** that update in real-time during matches with color-coded backgrounds:
  - Red/orange for poor (< 6.0)
  - Yellow for average (6.0-7.0)
  - Green for good (7.0-8.0)
  - Bright green/teal for excellent (8.0+)
- **Momentum graphs** illustrating pressure swings mid-match
- **Heatmaps** with color gradients revealing positional structure
- **Motion design principles** developed with Order Design studio

**Design tricks:**
1. The rating color system gives every number emotional weight
2. Clean separation of live data (animated) vs. static data (still)
3. Uses depth through layering -- cards float above backgrounds with shadows
4. Compact stat rows with visual indicators (bars, dots) not just numbers

### OneFootball

**Design tricks:**
1. Bold editorial-style typography for headlines
2. Dark mode with vibrant accent colors per content type
3. News-feed layout mixes stats, articles, and video seamlessly
4. Large hero images for featured content create emotional connection

### Cross-App Patterns for "Personality"

1. **Color-code everything** -- don't use one accent color; use contextual colors (team colors, rating colors, position colors)
2. **Numbers need emotional weight** -- a "7.2" rating means nothing without the green badge behind it
3. **Custom typography** separates you from every other "Inter/Geist" SaaS product
4. **Micro-animations** on live data (pulsing dots, sliding numbers) make the platform feel alive
5. **Visual density is OK** -- football fans want information; don't over-simplify

---

## 3. Modern SaaS Dashboards That Feel Warm

### Linear

**What they do right:**
- Monochrome foundation (near-black/white) with selective bold accent colors
- Uses LCH color space (perceptually uniform) for theme generation
- Recent trend: *less* color, not more. Confidence through restraint.
- Custom theme generator lets users personalize
- Bold, direct typefaces reduce cognitive load

**Key principle:** "Inject brand personality through typography choices and color application. Balance minimalism with deliberate, meaningful detail -- not empty space."

### Vercel Dashboard

**What they do right:**
- Pure performance focus: decreased First Meaningful Paint by 1.2s
- Screenshot previews of deployments for visual scanning
- Responsive design that works seamlessly desktop-to-mobile
- Neutral palette with selective purple/blue accents
- Information architecture: deployment logs filtered by function

### Stripe Dashboard

**What they do right:**
- Design token system ensures consistency
- Intentionally limited custom styling to maintain quality bar
- High accessibility standards baked in
- Charts and data visualizations do the visual heavy lifting
- Subtle gradients and shadows for depth without decoration

### Notion

**What they do right:**
- Warm off-white background (not #FFFFFF)
- Personalization: cover images, icons, emoji
- Content-first: the interface disappears
- Sidebar navigation with clear hierarchy

### How They Avoid the "Clinical" Trap

| Technique | Example | Why it works |
|-----------|---------|-------------|
| Warm off-white instead of pure white | Notion uses tinted whites | Reduces glare, feels softer |
| Meaningful shadows instead of flat | Stripe cards have subtle depth | Creates visual hierarchy without borders |
| Selective bold color | Linear uses 1-2 accent colors max | Draws attention without noise |
| Custom typography | All four use distinctive fonts | Prevents "generic SaaS" feeling |
| Content personalization | Notion icons, Linear custom themes | Users feel ownership |
| Micro-animations | Hover elevation, data transitions | Interface feels responsive and alive |

---

## 4. Color Palette Recommendations

### Current Problem

Your current palette (`--background: #f8fafc`, `--accent: #1e3a8a`) is:
- **#f8fafc** (Slate 50) -- very cool, blue-tinted white
- **#1e3a8a** (Blue 800) -- dark navy, authoritative but cold
- **#f1f5f9** (Slate 100) -- secondary background, still very cool
- **#e2e8f0** (Slate 200) -- borders, cool gray

This is a textbook "cold corporate" palette. Every surface has blue undertones. Combined with navy accent, the entire interface reads as a medical/banking application.

### 2026 Color Trends Relevant to GFP

**Trend 1: Warm Neutrals Replace Cool Grays**
Instead of slate/blue-gray foundations, 2026 design moves toward warm grays, stone, and sand tones. This is the single most impactful change possible.

**Trend 2: Earthy + Energetic Accent Combos**
- Burnt orange (#CC5500) + Muted mustard (#E1AD01) on warm beige
- Coral (#FF6B6B) + charcoal (#333333)
- Amber gold (#FFBF5E) + deep warm brown

**Trend 3: Less Saturation, More Subtlety**
Moving away from hyper-saturated blues/greens toward slightly muted, more natural tones.

**Trend 4: Contextual Color (not monochrome accent)**
Use different accent colors for different contexts: position colors for player cards, rating colors for stats, team colors for match cards.

### Georgian Cultural Color Connection

**Georgian flag:** Red (#DA291C) + White (#FFFFFF)
**Georgian wine tradition:** 8,000 years of winemaking. Deep ruby/burgundy tones are culturally iconic.
**Georgian architecture:** Warm stone, terracotta, earth tones from Tbilisi's historic district.
**Georgian cross (Bolnisi cross):** Can be used as a subtle decorative/brand element.

**Recommendation:** Incorporate wine-inspired warmth (burgundy/ruby accent tones) and warm stone backgrounds. This creates Georgian identity without being literal (no flag on every page).

### Specific Palette Combinations from Research

**"Royal Noir Gold" (2026 trend)**
- #000000, #1A1A1A, #D9B648, #F7EBA5
- Premium feel, luxury brands. Good for a dark platform theme.

**"Digital Amber Glow" (2026 trend)**
- #FFBF5E, #FFDA9A, #D69A3C, #8F6522
- Warm accent palette for branding and key interactive elements.

**"Royal Blue Prestige"**
- #0A1A3C, #143A75, #BFD8FF, #6AA2FF
- If you want to keep blue but make it warmer/deeper.

**"SaaS Analytics" palette**
- #fdfcfc, #e6e4e6, #f9b095, #b1b1b1, #f87941, #2f3035
- Warm orange (#f87941) accent on neutral base. Excellent for sports data.

**"Warm Professional" landing page palette**
- Primary: Earthy Taupe (#B89B82)
- Accent: Warm Navy (#2C3E50)
- Background: Soft Ivory (#FDF8F3)
- Combines approachability with credibility.

---

## 5. Card Design Patterns

### What Makes Cards Feel Engaging vs. Clinical

**Clinical (current GFP approach):**
- Flat white cards (#ffffff) on cool-gray background
- Uniform 1px solid borders (--border: #e2e8f0)
- Same card style for everything
- Hover = slightly lighter background

**Engaging (industry best practice):**

1. **Contextual top-border color**
   - Player cards: position-colored top border (GK=amber, DEF=blue, etc.)
   - You already have `card-enhanced` with this -- lean into it more

2. **Subtle gradient backgrounds**
   - Instead of flat #ffffff, use very subtle directional gradient
   - Example: `linear-gradient(135deg, #ffffff 0%, #faf8f6 100%)` (adds warmth)

3. **Layered shadows for depth**
   - Rest: `0 1px 3px rgba(0,0,0,0.08)`
   - Hover: `0 8px 24px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.06)`
   - Active/selected: accent-colored shadow `0 0 0 2px var(--accent), 0 4px 12px rgba(accent, 0.15)`

4. **"Flashlight" hover effect (Stripe-inspired)**
   - Radial gradient that follows mouse cursor on card border
   - Creates a glow effect on hover that feels premium
   - CSS: `background: radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(accent, 0.15), transparent 50%)`

5. **Accent glow on hover**
   - `box-shadow: 0 0 20px rgba(accent, 0.12)` on hover
   - Subtle but creates "this card is alive" feeling

6. **Badge/tag integration**
   - Position badge in top-right corner with colored background
   - Rating badge with color-coded background (green=good, amber=avg, red=poor)
   - "Verified" badge with camera icon for Pixellot data

7. **Image treatment**
   - Player silhouette on subtle gradient background (not flat gray)
   - Club logo watermark in card background at 5% opacity
   - Rounded corners (12px-16px) with consistent radius

### Card Hierarchy System

Create 3-4 distinct card levels:

| Level | Use case | Visual treatment |
|-------|----------|-----------------|
| **Base card** | Data tables, list items | Minimal shadow, no border-top accent |
| **Feature card** | Player cards in grid | Position-colored top border, medium shadow, hover glow |
| **Highlight card** | Featured player, top performer | Gradient background, larger shadow, subtle animation |
| **Action card** | CTA cards, "Message Academy" | Accent-colored background or border, prominent shadow |

---

## 6. Stat Presentation Best Practices

### Radar Charts

**What the best platforms do:**
- **Dark background** behind radar makes the data shape pop (StatsBomb, SciSports)
- **Filled polygon** with 15-25% opacity, strong border color
- **Percentile-based** (not raw values) so all axes are 0-100
- **6-8 axes maximum** -- more creates visual noise
- **Comparison overlay** -- two players with different colors, overlapping shapes
- Color-coding: Player A in teal, Player B in coral/orange for maximum contrast
- Grid lines at 25%, 50%, 75%, 100% with subtle styling
- Category labels outside the chart, stat values on hover/tooltip

**Recommended radar categories for GFP:**
- Attacking: Goals, Assists, Shots on Target, Key Passes
- Defensive: Tackles Won, Interceptions, Clearances, Aerial Duels
- Physical: Distance Covered, Sprints, Top Speed
- Technical: Pass Accuracy, Dribble Success, Cross Accuracy

### Stat Cards & Numbers

**Make numbers feel meaningful:**

1. **Color-coded value indicators**
   - Green background pill for above-average stats
   - Amber for average
   - Red for below-average
   - Context: "85% pass accuracy" means nothing. "85% (top 15%)" with a green badge tells a story.

2. **Progress bars / horizontal bars**
   - Thin (4-6px) horizontal bars behind numbers
   - Fill color matches performance level
   - Width = percentile rank (not raw value)
   - Works brilliantly for stat comparison tables

3. **Sparklines for trends**
   - Tiny inline line charts (40px wide) showing last 5-10 matches
   - Trend direction matters more than absolute values
   - Green upward trend, red downward trend

4. **Stat grouping**
   - Group stats into categories (Attacking, Defensive, Physical, Passing)
   - Each category gets a subtle color accent
   - Section dividers with category icon + label

5. **"At a Glance" stat row**
   - 4-5 hero stats at the top of player profile
   - Large numbers (24-32px) with small labels below
   - Each stat in its own mini-card with subtle background

### Comparison View Best Practices

**Side-by-side layout:**
- Player photo + name + team on each side
- Overlapping radar chart in the center
- Stat table below with bars growing from center outward (winner gets filled bar toward their side)
- Color difference: green highlight on the better stat, subtle gray on the worse
- "Winner" indicators per stat row (subtle, not aggressive)

**Key insight from FotMob/SofaScore:** The stat bars growing from center is more engaging than plain numbers side-by-side. It turns comparison into a visual contest.

### Heat Maps

- Use smooth gradients (not blocky cells) for position heat maps
- Color scale: transparent → yellow → orange → red
- Overlay on football pitch diagram
- These are highly engaging even for non-technical users

---

## 7. Concrete Palette Proposals for GFP

Based on all research, here are three palette directions to consider:

### Option A: "Warm Dark" (Recommended)

Inspired by: Wyscout, StatsBomb, ScoutingStats, Spotify

The platform data marketplace goes dark, landing page stays light but warm. This is the dominant pattern across professional scouting platforms.

```
Platform (dark):
  --background:           #141218    (warm off-black, slight purple undertone)
  --background-secondary: #1c1a22    (elevated surface)
  --card:                 #23212b    (card surface)
  --card-hover:           #2a2834    (card hover)
  --border:               #33313d    (subtle borders)
  --foreground:           #e8e6ef    (primary text, warm off-white)
  --foreground-muted:     #9896a3    (secondary text)

  --accent:               #c9a227    (Georgian gold -- warm, premium, culturally resonant)
  --accent-hover:         #d4b03a
  --accent-muted:         rgba(201, 162, 39, 0.15)

  --success:              #10b981    (emerald green for positive stats)
  --warning:              #f59e0b    (amber for average/caution)
  --danger:               #ef4444    (red for poor stats/alerts)

Landing page (warm light):
  --background:           #faf8f5    (warm ivory, NOT cool slate)
  --background-secondary: #f2efe9    (warm stone)
  --card:                 #ffffff
  --border:               #e8e4dd    (warm gray border)
  --foreground:           #2c2a35    (warm near-black)
  --accent:               #c9a227    (same gold)
```

**Why this works:**
- Purple-tinted dark backgrounds feel warmer than blue-tinted or pure gray
- Gold accent is distinctive, premium, and evokes Georgian cultural warmth
- The warm off-black (#141218) avoids the harsh contrast of pure #000000
- Green/amber/red stat indicators stand out beautifully on dark surfaces
- Landing page warm ivory feels welcoming vs. current cold slate

### Option B: "Georgian Wine"

Inspired by: Georgian wine tradition (8,000 years), burgundy as cultural marker

```
Platform (dark with wine accent):
  --background:           #140f14    (wine-black, warm)
  --background-secondary: #1e181e    (slightly elevated)
  --card:                 #261f26    (card with wine undertone)
  --card-hover:           #302830
  --border:               #3d333d
  --foreground:           #f0e8ef    (warm off-white)
  --foreground-muted:     #a89ba5

  --accent:               #8b2252    (deep wine/burgundy -- Georgian heritage)
  --accent-hover:         #a03068
  --accent-muted:         rgba(139, 34, 82, 0.2)

  --success:              #10b981
  --warning:              #f59e0b
  --danger:               #ef4444

Landing page (warm light):
  --background:           #fdf8f6    (warm blush white)
  --background-secondary: #f5eded    (soft rose undertone)
  --card:                 #ffffff
  --border:               #e8dfe0    (warm pink-gray)
  --foreground:           #2a1f28    (wine-dark text)
  --accent:               #8b2252
```

**Why this works:**
- Burgundy/wine is deeply Georgian (Saperavi, Khvanchkara, qvevri)
- Dark wine backgrounds feel luxurious and distinctive
- No other scouting platform uses this palette -- immediate differentiation
- Risk: might feel too "luxury brand" and less "sports data." Mitigate by keeping data visualizations in standard green/amber/red.

### Option C: "Warm Navy Evolved"

Inspired by: keeping some navy identity but warming it up significantly

```
Platform (warm dark blue):
  --background:           #111827    (Tailwind gray-900, standard dark)
  --background-secondary: #1a2235    (slightly warm navy)
  --card:                 #1f2a3d    (warm navy card)
  --card-hover:           #263347
  --border:               #334155    (slate-700)
  --foreground:           #f1f0ee    (warm off-white)
  --foreground-muted:     #94a3b8    (slate-400)

  --accent:               #f59e0b    (amber-500 -- warm, energetic)
  --accent-hover:         #d97706    (amber-600)
  --accent-muted:         rgba(245, 158, 11, 0.15)

  --success:              #10b981
  --warning:              #eab308
  --danger:               #ef4444

Landing page (warm light):
  --background:           #faf9f6    (warm white)
  --background-secondary: #f0ede6    (warm stone)
  --card:                 #ffffff
  --border:               #e5e1d8    (warm border)
  --foreground:           #1a2235    (match platform dark)
  --accent:               #f59e0b
```

**Why this works:**
- Least disruptive change from current design
- Amber accent provides warmth and energy that navy alone lacks
- Amber is the universal "gold" of football (trophies, winner medals, pitch markings)
- Works well with existing position color system
- Risk: amber on dark blue is a known pattern (many dashboards use it) -- less distinctive

---

## Implementation Priorities

### Highest Impact, Lowest Effort

1. **Change background from cool to warm** -- Replace #f8fafc with #faf8f5 or similar warm white. This single change will remove 50% of the "hospital" feeling.

2. **Add warm undertone to cards** -- Instead of pure #ffffff cards, use a barely-perceptible warm tint or subtle gradient.

3. **Replace navy accent with warmer color** -- Gold, amber, or wine. This changes the entire emotional tone.

4. **Warm up borders** -- Replace #e2e8f0 (cool slate) with #e8e4dd (warm stone).

5. **Add stat color-coding** -- Green/amber/red indicators make data feel alive rather than clinical.

### Medium Effort, High Impact

6. **Implement dark theme for platform** -- Most scouting platforms use dark mode for the data marketplace. This is the industry standard for a reason.

7. **Add card hover effects** -- Subtle glow, shadow elevation, or accent-tinted shadow on hover.

8. **Color-code player ratings** -- SofaScore-style rating badges where the background color communicates quality.

9. **Contextual accents** -- Use position colors more aggressively in player cards and filters.

### Longer Term

10. **Custom typography** -- A distinctive heading font (not Geist) would differentiate immediately.
11. **Micro-animations** -- Fade-in on data load, pulse on live indicators, smooth transitions.
12. **Stripe-style flashlight hover** -- Premium card interaction on player grid.

---

## Key Takeaways

1. **The #1 reason the platform feels clinical is the cool color temperature, not the lightness.** Warm whites and warm grays transform the feeling without changing the layout.

2. **Professional scouting platforms overwhelmingly use dark themes** for the data marketplace. Light themes work for landing pages. Consider a split approach.

3. **Color should be used for meaning, not decoration.** Position colors, rating colors, trend colors -- every color should tell the user something.

4. **Numbers alone are clinical. Numbers with visual context are engaging.** Add bars, badges, color indicators, sparklines, and trend arrows.

5. **Georgian identity through warmth, not literal symbols.** Wine-inspired color warmth and gold accents connect to Georgian culture more effectively than putting a flag or cross everywhere.

6. **One warm accent color is worth more than a whole redesign.** If you only change one thing, swap navy (#1e3a8a) for gold (#c9a227) or amber (#f59e0b).

---

## Sources

### Scouting Platforms
- [Wyscout (Hudl) Platform](https://wyscout.com/scouts/)
- [SciSports Cloud Scouting](https://www.scisports.com/scout-from-the-cloud/)
- [StatsBomb IQ Platform](https://statsbomb.com/what-we-do/iq-soccer/)
- [InStat Scout](https://instatsport.com/football/instat_scout)
- [ScoutingStats.ai](https://scoutingstats.ai/)
- [Scouting System Elite](https://www.scoutingsystem.com/)
- [360 Scouting Software Guide](https://360scouting.com/football-scouting-guide/software/)
- [Wyscout Feature Analysis (Medium)](https://medium.com/@chitreabhinav/revolutionizing-soccer-scouting-design-a-new-feature-for-wyscout-608a4d9bf454)

### Football Apps
- [FotMob Design Inspiration (DesignRush)](https://www.designrush.com/best-designs/apps/soccer-scores-pro-fotmob)
- [FotMob Figma Community File](https://www.figma.com/community/file/1503678217321983772/fotmob)
- [SofaScore Rebrand (Order Design)](https://www.orderdesign.co.uk/sofascore)
- [SofaScore Custom Typeface (Hot Type)](https://hottype.co/projects/sofascore)

### Design Systems & Dashboards
- [Linear Design Principles (LogRocket)](https://blog.logrocket.com/ux-design/linear-design/)
- [Vercel Dashboard Redesign](https://vercel.com/blog/dashboard-redesign)
- [Stripe App Design Guidelines](https://docs.stripe.com/stripe-apps/design)
- [Dashboard Design Trends 2025 (UITop)](https://uitop.design/blog/design/top-dashboard-design-trends/)
- [SaaS Design Trends 2026 (Jetbase)](https://jetbase.io/blog/saas-design-trends-best-practices)
- [SaaS Design Trends 2026 (DesignStudioUIUX)](https://www.designstudiouiux.com/blog/top-saas-design-trends/)

### Color Palettes
- [Top 20 Color Combinations 2026 (Pro Design School)](https://prodesignschool.com/design/top-20-modern-color-combinations-must-use-in-2026/)
- [SaaS UI Design Color Palettes (Octet)](https://octet.design/colors/user-interfaces/saas-ui-design/)
- [Landing Page Color Combinations (LandingPageFlow)](https://www.landingpageflow.com/post/best-color-combinations-for-better-landing-pages)
- [Web Design Color Trends 2026 (Lounge Lizard)](https://www.loungelizard.com/blog/web-design-color-trends/)
- [Balanced Web Design Palettes (Elegant Themes)](https://www.elegantthemes.com/blog/design/color-palettes-for-balanced-web-design)

### Dark Mode Design
- [Cloudflare Dark Mode Implementation](https://blog.cloudflare.com/dark-mode/)
- [Dark Mode Dashboard Palettes (ColorsWall)](https://colorswall.com/palette/57221)
- [Dark Mode Color Palette Ideas (Vev)](https://www.vev.design/blog/dark-mode-website-color-palette/)
- [Power BI Dark Mode Design (Numerro)](https://www.numerro.io/blog/designing-dashboard-in-dark-mode)
- [Dark Mode Best Practices (Graphic Eagle)](https://www.graphiceagle.com/dark-mode-ui/)

### Card & Data Design
- [Football Stats Card UI (Medium)](https://medium.com/@akanshabatham44/how-i-gave-football-stats-a-visual-upgrade-with-modular-card-ui-b705e48a495b)
- [Opta Player Radars](https://theanalyst.com/2023/06/introducing-opta-radars-compare-players)
- [CSS Glow Effects (FreeFrontEnd)](https://freefrontend.com/css-glow-effects/)
- [CSS Card Hover Effects (WPDean)](https://wpdean.com/css-card-hover-effects/)

### Georgian Cultural Colors
- [Georgia Flag Colors (FlagColorCodes)](https://www.flagcolorcodes.com/georgia)
- [Wine Burgundy Palettes (Piktochart)](https://piktochart.com/tips/wine-burgundy-color-palette)

### Spotify Dark Mode Reference
- [Spotify Color Palette (DesignPieces)](https://www.designpieces.com/palette/spotify-color-palette-hex-and-rgb/)
- [Spotify Brand Colors (USBrandColors)](https://usbrandcolors.com/spotify-colors/)
