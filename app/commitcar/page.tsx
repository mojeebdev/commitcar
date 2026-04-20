'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/app/components/nav/Navbar';
import { RARITY_LABELS, type CarTraits, type StatsSnapshot } from '@/app/lib/traits';

interface BuildResult {
  id: string;
  username: string;
  avatarUrl: string | null;
  name: string | null;
  traits: CarTraits;
  stats: StatsSnapshot;
  rarityScore: number;
  permalink: string;
  mintedAt: string | null;
  tokenId: number | null;
}

interface Stats {
  totalBuilt: number;
  totalMinted: number;
  onChainMinted: number;
  contract: string;
  opensea: string;
  basescan: string;
}

export default function HomePage() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BuildResult | null>(null);

  async function handleBuild() {
    const value = input.trim();
    if (!value || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
      } else {
        setResult(data);
      }
    } catch (e: any) {
      setError(e?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleBuild();
  }

  return (
    <div className="bg-void-grain">
      <Navbar />
      <main className="hero-terminal">
        <div className="terminal">
          <div className="terminal__bar">
            <span className="dot red" />
            <span className="dot yellow" />
            <span className="dot green" />
            <span className="terminal__title">commitcar@blindspotlab ~ </span>
          </div>
          <div className="terminal__body">
            <p><span className="t-dim">$</span> <span className="t-cmd">whoami</span></p>
            <p className="t-out">A builder. A vibe coder. An AI-native shipper.</p>
            <p><span className="t-dim">$</span> <span className="t-cmd">cat ./mission</span></p>
            <p className="t-out t-accent">Your commits drive a car.</p>
            <p><span className="t-dim">$</span> <span className="t-cmd">./build-car --github</span></p>
            <p className="t-out">
              Paste your GitHub username. We read your public commits, repos, streaks, and stars —
              then generate a car from how you ship. Rarer the more you build.
            </p>

            <div className="terminal__input">
              <div className="terminal__input__prefix">github.com/</div>
              <input
                type="text"
                placeholder="mojeebdev"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                disabled={loading}
                autoComplete="off"
                spellCheck={false}
              />
              <button onClick={handleBuild} disabled={loading || !input.trim()}>
                {loading ? 'Building…' : 'Build car'}
              </button>
            </div>

            <div className={`terminal__status ${error ? 'error' : ''}`}>
              {loading && <span>↻ reading commits, repos, streaks…</span>}
              {error && <span>× {error}</span>}
              {!loading && !error && !result && <span className="t-dim">Ready. Press enter to build.</span>}
              {result && <span className="t-accent">✓ Car generated · {RARITY_LABELS[result.traits.rarity].label}</span>}
            </div>

            {result && <CarPreview result={result} />}
          </div>
        </div>
      </main>
      <LiveStats />
      <Footer />
    </div>
  );
}

function CarPreview({ result }: { result: BuildResult }) {
  const rarity = RARITY_LABELS[result.traits.rarity];
  const ogUrl = `/api/og/${result.username}`;

  return (
    <div className="car-preview">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ogUrl}
        alt={`CommitCar for ${result.username}`}
        style={{
          width: '100%',
          maxWidth: 600,
          height: 'auto',
          borderRadius: 8,
          border: '1px solid var(--void-04)',
          display: 'block',
          margin: '0 auto',
        }}
      />

      <div className="car-preview__trait-row">
        <div>
          <span className="car-preview__trait-label">Chassis</span>
          <span className="car-preview__trait-value">{result.traits.chassis} · {result.stats.topLanguage}</span>
        </div>
        <div>
          <span className="car-preview__trait-label">Paint</span>
          <span className="car-preview__trait-value">{result.traits.paint}</span>
        </div>
        <div>
          <span className="car-preview__trait-label">Wheels</span>
          <span className="car-preview__trait-value">{result.traits.wheels}</span>
        </div>
        <div>
          <span className="car-preview__trait-label">Aero</span>
          <span className="car-preview__trait-value">{result.traits.aero}</span>
        </div>
        <div>
          <span className="car-preview__trait-label">Lights</span>
          <span className="car-preview__trait-value">{result.traits.headlights}</span>
        </div>
        <div>
          <span className="car-preview__trait-label">Rarity</span>
          <span className="car-preview__trait-value" style={{ color: rarity.color }}>{rarity.label}</span>
        </div>
      </div>

      <div className="car-preview__actions">
        <Link href={result.permalink} className="btn-primary">View full car →</Link>
        <ShareButton username={result.username} rarity={rarity.label} />
      </div>
    </div>
  );
}

function ShareButton({ username, rarity }: { username: string; rarity: string }) {
  function onShare() {
    const caption = getShareCaption(rarity, username);
    const url = `${process.env.NEXT_PUBLIC_APP_URL || 'https://commitcar.vercel.app'}/commitcar/${username}`;
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)}&url=${encodeURIComponent(url)}`;
    window.open(tweetUrl, '_blank');
  }
  return (
    <button onClick={onShare} className="btn-ghost">Share on X</button>
  );
}

function getShareCaption(rarity: string, username: string): string {
  const rLower = rarity.toLowerCase();
  if (rLower === 'mythic') return `my commits built a mythic CommitCar. not everyone ships like this.`;
  if (rLower === 'legendary') return `my commits built a legendary CommitCar. I ship.`;
  if (rLower === 'epic') return `my commits built an epic CommitCar. we out here.`;
  if (rLower === 'rare') return `my commits built a rare CommitCar. steady shipper.`;
  return `my commits built a CommitCar. early days, but the car is real.`;
}

function LiveStats() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let active = true;
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        if (active) setStats(data);
      } catch {}
    }
    fetchStats();
    const interval = setInterval(fetchStats, 30_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  if (!stats) return null;

  return (
    <section className="live-stats">
      <div className="live-stats__inner">
        <a href={stats.opensea} target="_blank" rel="noreferrer" className="live-stats__stat" title="View collection on OpenSea">
          <span className="live-stats__n">{stats.onChainMinted.toLocaleString()}</span>
          <span className="live-stats__l">minted on Base</span>
        </a>
        <span className="live-stats__divider" />
        <Link href="/commitcar" className="live-stats__stat">
          <span className="live-stats__n">{stats.totalBuilt.toLocaleString()}</span>
          <span className="live-stats__l">cars built</span>
        </Link>
        <span className="live-stats__divider" />
        <a href={stats.basescan} target="_blank" rel="noreferrer" className="live-stats__stat" title="View verified contract on Basescan">
          <span className="live-stats__n live-stats__n--sm">View contract ↗</span>
          <span className="live-stats__l">verified on Base</span>
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer-minimal">
      <span className="footer-minimal__mark">CC.</span>
      <div className="footer-minimal__links">
        <a href="https://twitter.com/mojeebeth" target="_blank" rel="noreferrer">@mojeebeth</a>
        <a href="https://mojeeb.xyz" target="_blank" rel="noreferrer">mojeeb.xyz</a>
        <a href="https://blindspotlab.xyz" target="_blank" rel="noreferrer">BlindspotLab</a>
        <a href="https://opensea.io/collection/commitcar" target="_blank" rel="noreferrer">OpenSea</a>
        <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
      </div>
      <span className="footer-minimal__copy">
        Built with <span className="accent">love</span> by @mojeebeth · Claude · Vercel
      </span>
    </footer>
  );
}