import Link from 'next/link';
import { prisma } from '@/app/lib/prisma';
import { Navbar } from '@/app/components/nav/Navbar';
import { renderCarSVG } from '@/app/lib/carRenderer';
import { RARITY_LABELS, type CarTraits, type RarityTier } from '@/app/lib/traits';

export const revalidate = 60;

const TIERS: Array<RarityTier | 'all'> = ['all', 'mythic', 'legendary', 'epic', 'rare', 'common'];

export default async function HallPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string }>;
}) {
  const { tier } = await searchParams;
  const where = tier && tier !== 'all' ? { rarityTier: tier } : {};

  const cars = await prisma.car.findMany({
    where,
    orderBy: [{ rarityScore: 'desc' }, { createdAt: 'desc' }],
    take: 120,
  });

  const totalCount = await prisma.car.count();
  const mintedCount = await prisma.car.count({ where: { mintedAt: { not: null } } });

  return (
    <div className="bg-void-grain">
      <Navbar />
      <main className="hall">
        <header className="hall__header">
          <div className="hall__eyebrow">/ Hall of Commit</div>
          <h1 className="hall__title">Every car. Every shipper.</h1>
          <p className="hall__sub">
            A public garage of every CommitCar ever built. {totalCount.toLocaleString()} cars ·{' '}
            {mintedCount.toLocaleString()} minted on Base.
          </p>
          <div className="hall__filters">
            {TIERS.map((t) => {
              const active = (tier ?? 'all') === t;
              const href = t === 'all' ? '/commitcar' : `/commitcar?tier=${t}`;
              return (
                <Link
                  key={t}
                  href={href}
                  className={`hall__filter ${active ? 'active' : ''}`}
                >
                  {t}
                </Link>
              );
            })}
          </div>
        </header>

        {cars.length === 0 ? (
          <div className="hall__empty">
            No cars yet in this tier. <Link href="/" style={{ color: 'var(--accent)' }}>Build one →</Link>
          </div>
        ) : (
          <div className="hall__grid">
            {cars.map((car) => {
              const traits = car.traits as unknown as CarTraits;
              const rarity = RARITY_LABELS[traits.rarity];
              const svg = renderCarSVG(traits, {
                username: car.githubUsername,
                width: 360,
                height: 180,
                showRarityBadge: false,
              });
              const dataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
              return (
                <Link key={car.id} href={`/commitcar/${car.githubUsername}`} className="hall__card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={dataUri}
                    alt={`${car.githubUsername}'s car`}
                    style={{ width: '100%', height: 'auto', display: 'block' }}
                  />
                  <div className="hall__card__meta">
                    <span className="hall__card__username">@{car.githubUsername}</span>
                    <span
                      className="hall__card__rarity"
                      style={{
                        color: rarity.color,
                        background: `${rarity.color}22`,
                      }}
                    >
                      {rarity.label}
                      {car.mintedAt && ' · minted'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
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
