# Cold Chain Monitor — Design System

## Concept

**"Clinical Airiness"** — the feeling of a well-lit pharmaceutical lab. Clean, trustworthy, precise. Not sterile-cold, not startup-flashy. Every surface breathes. Data is legible at a glance. Alerts are impossible to miss. Translucency is used once, where it matters most — the detail panel.

Three reference zones map to three different areas of the app:

| Reference | Area | Why |
|---|---|---|
| Image 1 (red/white logistics) | Shipment Tracking, Alert Console | Card grid + right-side detail panel with map |
| Image 2 (white/minimal trucks) | Sensor Management, Temperature Timeline | Data-dense top-nav layout, timeline/Gantt strip |
| Image 3 (dark sidebar + pastel) | Overview Dashboard, Customer Portal | Dark rail nav + pastel metric cards |

---

## Color palette

```css
/* Base */
--bg-page:        #F4F6F9;   /* page background — cool off-white */
--bg-surface:     #FFFFFF;   /* card / panel base */
--bg-muted:       #EEF0F4;   /* input backgrounds, table zebra */

/* Frosted glass — used ONLY on detail panels and overlapping drawers */
--glass-bg:       rgba(255, 255, 255, 0.72);
--glass-border:   rgba(255, 255, 255, 0.55);
--glass-blur:     backdrop-filter: blur(18px) saturate(160%);

/* Sidebar */
--sidebar-bg:     #0C1929;   /* deep navy, not pure black */
--sidebar-active: rgba(14, 165, 176, 0.18);  /* teal wash on active item */
--sidebar-text:   #8FA3B8;
--sidebar-icon:   #FFFFFF;

/* Accent — cold chain teal */
--accent:         #0EA5B0;
--accent-light:   #E0F5F7;
--accent-dark:    #0A7D86;

/* Semantic */
--ok:             #22C55E;
--ok-light:       #DCFCE7;
--warn:           #F59E0B;
--warn-light:     #FEF3C7;
--danger:         #E84444;
--danger-light:   #FEE2E2;
--info:           #3B82F6;
--info-light:     #DBEAFE;

/* Text */
--text-primary:   #141820;
--text-secondary: #5C6470;
--text-muted:     #9EA8B5;

/* Borders */
--border:         rgba(0, 0, 0, 0.07);
--border-strong:  rgba(0, 0, 0, 0.13);
```

---

## Typography

```css
/* Import */
@import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');

--font-ui:   'Figtree', sans-serif;   /* all labels, nav, body */
--font-data: 'DM Mono', monospace;    /* temperature readings, tracking IDs, timestamps */

/* Scale */
--text-xs:   11px;   /* tags, badge labels */
--text-sm:   13px;   /* table rows, secondary labels */
--text-base: 14px;   /* body, sidebar items */
--text-md:   16px;   /* card titles, form fields */
--text-lg:   20px;   /* page headings */
--text-xl:   28px;   /* live temperature readout */
--text-2xl:  40px;   /* hero metric (e.g. active shipment count) */

/* Weight: 400 regular, 500 medium (labels), 600 semibold (headings only) */
```

---

## Radii and shadows

```css
--radius-sm:  6px;    /* badges, chips, inputs */
--radius-md:  10px;   /* buttons, table rows */
--radius-lg:  14px;   /* cards */
--radius-xl:  20px;   /* detail panel, drawers */
--radius-pill: 999px; /* status pills */

/* Shadows — barely-there, single layer */
--shadow-card:   0 1px 2px rgba(0,0,0,0.04), 0 4px 14px rgba(0,0,0,0.05);
--shadow-panel:  0 8px 32px rgba(0,0,0,0.10);
--shadow-float:  0 2px 8px rgba(0,0,0,0.08);  /* dropdowns, tooltips */
```

---

## Layout

```
┌──────────────────────────────────────────────────────┐
│  Sidebar (60px collapsed / 220px expanded)           │
│  Dark navy — icon rail like Image 3                  │
├──────────────────────────────────────────────────────┤
│  Topbar (56px)                                       │
│  Page title + breadcrumb + search + user avatar      │
├─────────────────────────┬────────────────────────────┤
│  Main content area      │  Detail panel (400px)      │
│  Card grid or table     │  Frosted glass, slides in  │
│                         │  on row/card select        │
└─────────────────────────┴────────────────────────────┘
```

- **Sidebar**: 60px icon-only by default (Image 3 style). Hover/click expands to 220px with labels sliding in. Active state: teal left border + subtle teal wash background.
- **Topbar**: white, `border-bottom: 1px solid var(--border)`. No shadow.
- **Main area**: `background: var(--bg-page)`. 24px padding. Cards in responsive grid.
- **Detail panel**: slides in from right on selection. `background: var(--glass-bg)` + blur. `border-left: 1px solid var(--glass-border)`. This is the **only** place translucency is used.

---

## Components

### Status pill
```
background: var(--ok-light)   color: #15803D   border-radius: var(--radius-pill)
padding: 3px 10px   font-size: var(--text-xs)   font-weight: 500

Variants: ok (green), warn (amber), danger (red), transit (teal), waiting (gray)
```

### Shipment card (Image 1 reference)
```
background: white
border: 1px solid var(--border)
border-radius: var(--radius-lg)
padding: 16px
shadow: var(--shadow-card)

Selected state: border-color: var(--accent)   box-shadow: 0 0 0 2px var(--accent-light)

Contents:
  - Tracking ID   font: DM Mono, text-sm, text-muted
  - Status pill   top-right
  - Current temp  font: DM Mono, text-xl, color: dynamic (ok/warn/danger)
  - Min time left font: Figtree, text-sm
  - Route string  text-muted, text-xs, truncated
```

### Temperature reading (live)
```
font-family: var(--font-data)
font-size: var(--text-xl) or --text-2xl for hero
color: dynamic —
  within range:  var(--text-primary)
  soft breach:   var(--warn)
  hard breach:   var(--danger)   + subtle pulse animation on the digit

Never background-colored. Color on the number only.
```

### Alert badge
```
Soft breach:  background: var(--warn-light)   icon: ⚠  color: #92400E
Hard breach:  background: var(--danger-light) icon: ●  color: #991B1B

Animate: 1s ease-in-out opacity pulse on danger only. Nothing else animates.
```

### Metric card (Image 3 reference — for Overview page)
```
Pastel tinted cards. Each metric type gets one tint:
  Active shipments  → --accent-light (teal)
  Excursions today  → --danger-light (red)
  Sensors online    → --ok-light (green)
  Awaiting dispatch → --warn-light (amber)

background: <tint>
border: none
border-radius: var(--radius-lg)
padding: 20px 24px
No shadow.

Large number: font-data, text-2xl, color: dark shade of that tint family
Label: font-ui, text-sm, text-secondary
Trend delta: small pill — green up, red down
```

### Table (Sensor list, Audit log)
```
White background card wrapping the table.
Header: bg-muted, text-xs, text-muted, uppercase, letter-spacing: 0.05em
Rows: 48px height, border-bottom: 1px solid var(--border)
Zebra: odd rows bg-surface, even rows bg-muted (very subtle)
Hover: bg: var(--accent-light) transition 120ms
No outer border on individual cells.
```

### Temperature timeline (Image 2 reference)
```
Gantt-style horizontal strip per sensor.
Background: white card.
X-axis: time (DM Mono, text-xs)
Bar: continuous colored strip —
  In-range:     var(--ok)     opacity 0.7
  Soft excursion: var(--warn)
  Hard excursion: var(--danger)
  No data:      var(--bg-muted) dashed

Excursion markers: vertical dotted line + tooltip card on hover.
Tooltip: white, shadow-float, border-radius: var(--radius-md)
```

---

## Motion

Minimal. One rule: **only transitions that carry meaning**.

```css
/* Panel slide-in */
.detail-panel { transition: transform 220ms cubic-bezier(0.4, 0, 0.2, 1); }

/* Card selection ring */
.shipment-card { transition: border-color 120ms, box-shadow 120ms; }

/* Status pill color swap */
.status-pill { transition: background 200ms, color 200ms; }

/* Danger temp pulse — only on active breach */
@keyframes breach-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.6; }
}
.temp-danger { animation: breach-pulse 1.4s ease-in-out infinite; }

/* Sidebar expand */
.sidebar { transition: width 200ms cubic-bezier(0.4, 0, 0.2, 1); }
```

No page transitions. No skeleton shimmer (use spinner). No floating particles. No gradient animations.

---

## Page-by-page layout notes

| Page | Layout | Reference |
|---|---|---|
| Overview Dashboard | Dark sidebar + pastel metric cards + small chart per card | Image 3 |
| Shipment Tracking | Card grid (left 55%) + frosted detail panel (right 45%) + embedded map | Image 1 |
| Temperature Timeline | Top-nav page + sensor row per shipment + Gantt strip | Image 2 |
| Alert Console | Table view + right panel for escalation detail | Image 1 |
| Excursion Analysis | Split: chart top, detail table bottom | Image 2 |
| Sensor Management | Table + inline calibration status + battery bar | Image 2 |
| Audit Log | Full-width table, filters as pills above | Image 3 |
| Regulatory Report Generator | Form wizard, clean centered layout | neutral |
| Customer Portal | Simplified Image 3 style — fewer nav items, read-only cards | Image 3 |
| Alert Rule Configurator | Stepped form, accordion, toggle switches | neutral |

---

## What not to do

- No mesh gradients, aurora gradients, or gradient text
- No glassmorphism everywhere — frosted glass only on the sliding detail panel
- No neumorphism
- No dark mode (this is a logistics ops tool, always light)
- No decorative blobs or abstract shapes in the background
- No card hover lift animations (translateY -4px is a cliché)
- No colored sidebars — sidebar is always dark navy
- No rainbow status colors — stick to the four: green / amber / red / teal
- Temperature numbers never inside colored boxes — color the digit, not the container
