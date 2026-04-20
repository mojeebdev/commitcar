import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { renderCarSVG } from '@/app/lib/carRenderer';
import { RARITY_LABELS, type CarTraits, type StatsSnapshot } from '@/app/lib/traits';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const car = await prisma.car.findUnique({ where: { githubUsername: username } });

  if (!car) {
    return new ImageResponse(
      (
        <div
          style={{
            background: '#050508',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f0f0f8',
            fontSize: 48,
          }}
        >
          Car not found
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  const traits = car.traits as unknown as CarTraits;
  const stats = car.statsSnapshot as unknown as StatsSnapshot;
  const rarity = RARITY_LABELS[traits.rarity];
  const svg = renderCarSVG(traits, { username: car.githubUsername, width: 900, height: 400 });
  const svgDataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          background: '#050508',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: 60,
          fontFamily: 'monospace',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 28, height: 28, background: '#F5A623', borderRadius: 6 }} />
            <div style={{ color: '#f0f0f8', fontSize: 22, fontWeight: 600 }}>CommitCar</div>
          </div>
          <div
            style={{
              padding: '8px 20px',
              background: `${rarity.color}20`,
              border: `1px solid ${rarity.color}`,
              borderRadius: 999,
              color: rarity.color,
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: 3,
              display: 'flex',
            }}
          >
            {rarity.label.toUpperCase()}
          </div>
        </div>

        {/* Car */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={svgDataUri} alt="car" width={900} height={400} />
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 30, color: '#8A8A9A', fontSize: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ color: '#F5A623', fontSize: 32, fontWeight: 700 }}>@{car.githubUsername}</div>
            <div style={{ marginTop: 8 }}>
              {stats.commits365d.toLocaleString()} commits · {stats.publicRepos} repos ·{' '}
              {stats.topLanguage}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <div style={{ color: '#f0f0f8', fontSize: 20 }}>commitcar.vercel.app</div>
            <div style={{ marginTop: 8, fontSize: 14 }}>built by @mojeebeth · blindspotlab</div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
