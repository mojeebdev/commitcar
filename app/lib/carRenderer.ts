// CommitCar — SVG car renderer
// Composable layers: chassis, paint, wheels, aero, headlights, finish
// Returns a raw SVG string so it can be embedded anywhere (OG images, pages, DB).

import {
  type CarTraits,
  type ChassisShape,
  type WheelStyle,
  type AeroKit,
  type Headlights,
  type Finish,
  PAINT_HEX,
  RARITY_LABELS,
} from './traits';

const CHASSIS_PATHS: Record<ChassisShape, { body: string; window: string; height: number }> = {
  coupe: {
    body: 'M40 130 L70 95 L140 80 L240 75 L320 85 L365 105 L380 130 L380 155 L40 155 Z',
    window: 'M90 95 L110 82 L225 80 L300 90 L335 105 L90 105 Z',
    height: 80,
  },
  muscle: {
    body: 'M40 135 L50 100 L120 88 L250 82 L340 95 L380 120 L380 160 L40 160 Z',
    window: 'M95 100 L120 85 L235 84 L310 98 L335 115 L95 115 Z',
    height: 85,
  },
  hatchback: {
    body: 'M50 130 L75 88 L200 80 L280 82 L350 120 L370 130 L370 155 L50 155 Z',
    window: 'M95 100 L115 86 L200 84 L270 88 L325 118 L95 118 Z',
    height: 75,
  },
  armored: {
    body: 'M35 140 L45 110 L90 90 L290 85 L340 100 L385 130 L385 165 L35 165 Z',
    window: 'M100 108 L120 92 L280 90 L320 102 L340 118 L100 118 Z',
    height: 85,
  },
  sedan: {
    body: 'M40 132 L70 100 L150 85 L260 82 L330 95 L375 118 L380 155 L40 155 Z',
    window: 'M100 100 L125 88 L250 85 L310 98 L340 115 L100 115 Z',
    height: 78,
  },
  roadster: {
    body: 'M50 130 L80 105 L150 95 L240 92 L310 100 L360 120 L370 150 L50 150 Z',
    window: 'M110 108 L130 98 L240 97 L290 102 L310 115 L110 115 Z',
    height: 60,
  },
  classic: {
    body: 'M45 135 L65 110 L130 92 L260 90 L330 105 L375 125 L380 158 L45 158 Z',
    window: 'M100 108 L125 94 L240 93 L300 102 L335 117 L100 117 Z',
    height: 75,
  },
};

function renderWheel(cx: number, cy: number, style: WheelStyle, finishColor: string): string {
  const r = 22;
  const inner = r - 8;
  const hub = 4;
  const baseTire = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#0a0a0f" stroke="#1a1a20" stroke-width="2"/>`;
  const baseRim = `<circle cx="${cx}" cy="${cy}" r="${inner}" fill="${finishColor}" opacity="0.9"/>`;
  const center = `<circle cx="${cx}" cy="${cy}" r="${hub}" fill="#1a1a20"/>`;

  let pattern = '';
  if (style === 'spoke') {
    for (let i = 0; i < 5; i++) {
      const angle = (i * 72 * Math.PI) / 180;
      const x2 = cx + Math.cos(angle) * inner;
      const y2 = cy + Math.sin(angle) * inner;
      pattern += `<line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="#1a1a20" stroke-width="2.5"/>`;
    }
  } else if (style === 'mag') {
    for (let i = 0; i < 6; i++) {
      const angle = (i * 60 * Math.PI) / 180;
      const x1 = cx + Math.cos(angle) * (hub + 2);
      const y1 = cy + Math.sin(angle) * (hub + 2);
      const x2 = cx + Math.cos(angle) * inner;
      const y2 = cy + Math.sin(angle) * inner;
      pattern += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#1a1a20" stroke-width="3" stroke-linecap="round"/>`;
    }
  } else if (style === 'chrome') {
    for (let i = 0; i < 8; i++) {
      const angle = (i * 45 * Math.PI) / 180;
      const x2 = cx + Math.cos(angle) * inner;
      const y2 = cy + Math.sin(angle) * inner;
      pattern += `<line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="#f0f0f8" stroke-width="2" opacity="0.6"/>`;
    }
    pattern += `<circle cx="${cx}" cy="${cy}" r="${inner - 4}" fill="none" stroke="#f0f0f8" stroke-width="1" opacity="0.4"/>`;
  }

  return baseTire + baseRim + pattern + center;
}

function renderAero(aero: AeroKit, accentColor: string): string {
  if (aero === 'none') return '';
  if (aero === 'lip') {
    return `<rect x="55" y="152" width="310" height="4" rx="2" fill="${accentColor}" opacity="0.7"/>`;
  }
  if (aero === 'wing') {
    return `
      <rect x="55" y="152" width="310" height="4" rx="2" fill="${accentColor}" opacity="0.8"/>
      <path d="M330 100 L370 92 L378 96 L370 108 L330 110 Z" fill="${accentColor}" opacity="0.85"/>
    `;
  }
  // full
  return `
    <rect x="55" y="152" width="310" height="5" rx="2" fill="${accentColor}"/>
    <path d="M325 95 L378 85 L385 92 L378 112 L325 112 Z" fill="${accentColor}"/>
    <rect x="48" y="148" width="12" height="12" rx="2" fill="${accentColor}" opacity="0.8"/>
    <rect x="360" y="148" width="12" height="12" rx="2" fill="${accentColor}" opacity="0.8"/>
  `;
}

function renderHeadlights(headlights: Headlights, chassis: ChassisShape): string {
  const x = chassis === 'armored' ? 48 : chassis === 'muscle' ? 52 : 50;
  const y = chassis === 'armored' ? 115 : 110;
  if (headlights === 'dim') {
    return `<circle cx="${x}" cy="${y}" r="4" fill="#FFE4A1" opacity="0.6"/>`;
  }
  if (headlights === 'bright') {
    return `
      <circle cx="${x}" cy="${y}" r="5" fill="#FFE4A1"/>
      <circle cx="${x}" cy="${y}" r="8" fill="#FFE4A1" opacity="0.3"/>
    `;
  }
  // laser
  return `
    <circle cx="${x}" cy="${y}" r="5" fill="#F5A623"/>
    <circle cx="${x}" cy="${y}" r="10" fill="#F5A623" opacity="0.35"/>
    <circle cx="${x}" cy="${y}" r="16" fill="#F5A623" opacity="0.15"/>
    <rect x="${x}" y="${y - 1}" width="40" height="2" fill="#F5A623" opacity="0.5"/>
  `;
}

function finishToStroke(finish: Finish): { stroke: string; strokeWidth: number; opacity: number } {
  switch (finish) {
    case 'matte':  return { stroke: '#2C2C3A', strokeWidth: 1.5, opacity: 0.95 };
    case 'gloss':  return { stroke: '#f0f0f8', strokeWidth: 1.5, opacity: 1 };
    case 'chrome': return { stroke: '#f0f0f8', strokeWidth: 2, opacity: 1 };
    case 'patina': return { stroke: '#6b6550', strokeWidth: 1.8, opacity: 0.9 };
  }
}

function finishRimColor(finish: Finish): string {
  switch (finish) {
    case 'matte':  return '#3a3a45';
    case 'gloss':  return '#d0d0d8';
    case 'chrome': return '#f0f0f8';
    case 'patina': return '#8a7a55';
  }
}

export interface RenderOptions {
  username: string;
  width?: number;
  height?: number;
  showPlate?: boolean;
  showRarityBadge?: boolean;
  background?: 'transparent' | 'void';
}

export function renderCarSVG(traits: CarTraits, opts: RenderOptions): string {
  const { width = 420, height = 240, showPlate = true, showRarityBadge = true, background = 'transparent' } = opts;
  const chassisData = CHASSIS_PATHS[traits.chassis];
  const paint = PAINT_HEX[traits.paint];
  const finishStyle = finishToStroke(traits.finish);
  const rimColor = finishRimColor(traits.finish);
  const rarityData = RARITY_LABELS[traits.rarity];

  // Shadow gradient below car
  const shadow = `<ellipse cx="210" cy="180" rx="175" ry="6" fill="#000" opacity="0.35"/>`;

  // Glow for legendary+ cars
  const glow =
    traits.rarity === 'legendary' || traits.rarity === 'mythic'
      ? `<ellipse cx="210" cy="120" rx="200" ry="70" fill="${rarityData.color}" opacity="0.08"/>`
      : '';

  // Body (main paint)
  const body = `
    <path d="${chassisData.body}"
      fill="${paint.primary}"
      stroke="${finishStyle.stroke}"
      stroke-width="${finishStyle.strokeWidth}"
      stroke-linejoin="round"
      opacity="${finishStyle.opacity}"/>
  `;

  // Roof (darker shade of paint)
  const roof = `
    <path d="${chassisData.window}"
      fill="${paint.secondary}"
      stroke="${finishStyle.stroke}"
      stroke-width="${finishStyle.strokeWidth * 0.6}"
      opacity="0.95"/>
  `;

  // Windows (glass shine)
  const windows = `
    <path d="${chassisData.window}"
      fill="#0a0a0f"
      opacity="0.55"/>
    <path d="${chassisData.window}"
      fill="#f0f0f8"
      opacity="0.08"/>
  `;

  // Accent stripe (uses paint accent color)
  const stripe = traits.aero !== 'none'
    ? `<rect x="70" y="130" width="280" height="2" fill="${paint.accent}" opacity="0.6"/>`
    : '';

  // Wheels
  const frontWheel = renderWheel(310, 158, traits.wheels, rimColor);
  const rearWheel = renderWheel(100, 158, traits.wheels, rimColor);

  // Aero kit
  const aeroEl = renderAero(traits.aero, paint.accent);

  // Headlights
  const headlightsEl = renderHeadlights(traits.headlights, traits.chassis);

  // Plate with username
  const plate = showPlate
    ? `
      <rect x="175" y="163" width="70" height="14" rx="2"
        fill="#f0f0f8" stroke="#1a1a20" stroke-width="0.5"/>
      <text x="210" y="173"
        text-anchor="middle"
        font-family="'Azeret Mono', monospace"
        font-size="8"
        font-weight="600"
        fill="#0a0a0f">
        ${opts.username.slice(0, 10).toUpperCase()}
      </text>
    `
    : '';

  // Rarity badge (top right)
  const badge = showRarityBadge
    ? `
      <g transform="translate(310, 28)">
        <rect x="0" y="0" width="80" height="20" rx="10"
          fill="${rarityData.color}" opacity="0.15"
          stroke="${rarityData.color}" stroke-width="0.5"/>
        <text x="40" y="13"
          text-anchor="middle"
          font-family="'Barlow Condensed', sans-serif"
          font-size="10"
          font-weight="700"
          letter-spacing="0.12em"
          fill="${rarityData.color}">
          ${rarityData.label.toUpperCase()}
        </text>
      </g>
    `
    : '';

  const bg = background === 'void'
    ? `<rect width="${width}" height="${height}" fill="#050508"/>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 420 200" role="img" aria-label="CommitCar for ${opts.username}">
    ${bg}
    ${glow}
    ${badge}
    ${shadow}
    ${body}
    ${roof}
    ${windows}
    ${stripe}
    ${aeroEl}
    ${headlightsEl}
    ${frontWheel}
    ${rearWheel}
    ${plate}
  </svg>`;
}
