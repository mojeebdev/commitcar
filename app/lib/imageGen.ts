import sharp from 'sharp';
import { renderCarSVG } from './carRenderer';
import { RARITY_LABELS, type CarTraits, type StatsSnapshot } from './traits';

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
    }
    return c;
  });
}

export async function generateCarPng(car: {
  githubUsername: string;
  traits: unknown;
  statsSnapshot: unknown;
}): Promise<Buffer> {
  const traits = car.traits as CarTraits;
  const stats = car.statsSnapshot as StatsSnapshot;
  const rarity = RARITY_LABELS[traits.rarity];
  const carSvg = renderCarSVG(traits, {
    username: car.githubUsername,
    width: 900,
    height: 420,
  });

  const shareSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#050508"/>
    <rect x="0" y="0" width="1200" height="6" fill="${rarity.color}" opacity="0.6"/>

    <g transform="translate(60, 60)">
      <rect x="0" y="0" width="32" height="32" rx="6" fill="#F5A623"/>
      <text x="48" y="22" font-family="'Azeret Mono', monospace" font-size="22" font-weight="600" fill="#F0F0F8">CommitCar</text>
    </g>

    <g transform="translate(960, 60)">
      <rect x="0" y="0" width="180" height="40" rx="20" fill="${rarity.color}" opacity="0.18" stroke="${rarity.color}" stroke-width="1.5"/>
      <text x="90" y="27" text-anchor="middle" font-family="'Barlow Condensed', sans-serif" font-size="16" font-weight="700" letter-spacing="3" fill="${rarity.color}">${rarity.label.toUpperCase()}</text>
    </g>

    <g transform="translate(150, 130)">
      ${carSvg.replace(/<\?xml[^?]*\?>/, '').replace(/<svg[^>]*>/, '<g>').replace(/<\/svg>/, '</g>')}
    </g>

    <text x="60" y="560" font-family="'Azeret Mono', monospace" font-size="42" font-weight="700" fill="#F5A623">@${escapeXml(car.githubUsername)}</text>
    <text x="60" y="590" font-family="'Azeret Mono', monospace" font-size="18" fill="#8A8A9A">${stats.commits365d.toLocaleString()} commits · ${stats.publicRepos} repos · ${escapeXml(stats.topLanguage)}</text>
    <text x="1140" y="590" text-anchor="end" font-family="'Azeret Mono', monospace" font-size="16" fill="#4A4A5A">commitcar.vercel.app</text>
  </svg>`;

  return await sharp(Buffer.from(shareSvg))
    .png({ compressionLevel: 9 })
    .toBuffer();
}