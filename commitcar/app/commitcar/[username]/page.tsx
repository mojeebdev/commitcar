import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/app/lib/prisma';
import { Navbar } from '@/app/components/nav/Navbar';
import { renderCarSVG } from '@/app/lib/carRenderer';
import { RARITY_LABELS, type CarTraits, type StatsSnapshot } from '@/app/lib/traits';
import { MintButton } from '@/app/components/car/MintButton';
import type { Metadata } from 'next';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const car = await prisma.car.findUnique({ where: { githubUsername: username } });
  if (!car) return { title: 'CommitCar — not found' };
  const traits = car.traits as unknown as CarTraits;
  const rarity = RARITY_LABELS[traits.rarity];
  const title = `@${car.githubUsername}'s ${rarity.label} CommitCar`;
  const desc = `${traits.chassis} · ${traits.paint} · ${rarity.label}. Built from GitHub commits on commitcar.vercel.app`;
  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      images: [{ url: `/api/og/${car.githubUsername}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: [`/api/og/${car.githubUsername}`],
    },
  };
}

export default async function CarPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const car = await prisma.car.findUnique({ where: { githubUsername: username } });
  if (!car) notFound();

  const traits = car.traits as unknown as CarTraits;
  const stats = car.statsSnapshot as unknown as StatsSnapshot;
  const rarity = RARITY_LABELS[traits.rarity];
  const svg = renderCarSVG(traits, {
    username: car.githubUsername,
    width: 840,
    height: 400,
    background: 'transparent',
  });
  const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

  // Increment view count (fire & forget)
  prisma.car.update({
    where: { id: car.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {});

  return (
    <div className="bg-void-grain">
      <Navbar />
      <main className="car-page">
        <div className="car-page__card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-accent)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-tertiary)' }}>
                CommitCar
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--ink-primary)', marginTop: 4 }}>
                @{car.githubUsername}
              </h1>
              {car.name && <div style={{ color: 'var(--ink-secondary)', fontSize: 13, marginTop: 4 }}>{car.name}</div>}
            </div>
            <div
              style={{
                padding: '6px 16px',
                background: `${rarity.color}20`,
                border: `1px solid ${rarity.color}`,
                borderRadius: 999,
                color: rarity.color,
                fontFamily: 'var(--font-accent)',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
              }}
            >
              {rarity.label}
              {car.mintedAt && ' · minted'}
            </div>
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dataUri}
            alt={`CommitCar for ${car.githubUsername}`}
            style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 10, background: 'var(--void-01)' }}
          />

          <div className="car-page__stats">
            <div>
              <div className="car-page__stat__label">Commits (365d)</div>
              <div className="car-page__stat__value">{stats.commits365d.toLocaleString()}</div>
            </div>
            <div>
              <div className="car-page__stat__label">Repos</div>
              <div className="car-page__stat__value">{stats.publicRepos}</div>
            </div>
            <div>
              <div className="car-page__stat__label">Longest streak</div>
              <div className="car-page__stat__value">{stats.longestStreak}d</div>
            </div>
            <div>
              <div className="car-page__stat__label">Stars</div>
              <div className="car-page__stat__value">{stats.totalStars.toLocaleString()}</div>
            </div>
            <div>
              <div className="car-page__stat__label">Top language</div>
              <div className="car-page__stat__value">{stats.topLanguage}</div>
            </div>
            <div>
              <div className="car-page__stat__label">Peak hour UTC</div>
              <div className="car-page__stat__value">{stats.peakCommitHour}:00</div>
            </div>
          </div>

          <div style={{ marginTop: 28, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <MintButton
              username={car.githubUsername}
              traits={traits}
              alreadyMinted={!!car.mintedAt}
              tokenId={car.tokenId}
            />
            <ShareLink username={car.githubUsername} rarity={rarity.label} />
            <Link href="/commitcar" className="btn-ghost">Browse hall</Link>
          </div>

          {car.mintTxHash && (
            <div style={{ marginTop: 18, fontSize: 11, color: 'var(--ink-tertiary)', fontFamily: 'var(--font-body)' }}>
              tx:{' '}
              <a
                href={`https://basescan.org/tx/${car.mintTxHash}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--accent)' }}
              >
                {car.mintTxHash.slice(0, 10)}…{car.mintTxHash.slice(-6)}
              </a>
            </div>
          )}
        </div>
      </main>
      <footer className="footer-minimal">
        <span className="footer-minimal__mark">CC.</span>
        <div className="footer-minimal__links">
          <a href="https://twitter.com/mojeebeth" target="_blank" rel="noreferrer">@mojeebeth</a>
          <a href="https://mojeeb.xyz" target="_blank" rel="noreferrer">mojeeb.xyz</a>
          <a href="https://blindspotlab.xyz" target="_blank" rel="noreferrer">BlindspotLab</a>
        </div>
        <span className="footer-minimal__copy">Built with <span className="accent">love</span> by @mojeebeth</span>
      </footer>
    </div>
  );
}

// Inline client component for the share button (keeps this page otherwise server-rendered)
function ShareLink({ username, rarity }: { username: string; rarity: string }) {
  const caption = rarity.toLowerCase() === 'mythic'
    ? 'my commits built a mythic CommitCar. not everyone ships like this.'
    : rarity.toLowerCase() === 'legendary'
    ? 'my commits built a legendary CommitCar. I ship.'
    : rarity.toLowerCase() === 'epic'
    ? 'my commits built an epic CommitCar. we out here.'
    : rarity.toLowerCase() === 'rare'
    ? 'my commits built a rare CommitCar. steady shipper.'
    : 'my commits built a CommitCar. early days, but the car is real.';
  const url = `https://commitcar.vercel.app/commitcar/${username}`;
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}&url=${encodeURIComponent(url)}`;
  return (
    <a href={tweetUrl} target="_blank" rel="noreferrer" className="btn-ghost">Share on X</a>
  );
}
