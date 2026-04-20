import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { RARITY_LABELS, type CarTraits, type StatsSnapshot } from '@/app/lib/traits';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const car = await prisma.car.findUnique({ where: { githubUsername: username } });
  if (!car) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const traits = car.traits as unknown as CarTraits;
  const stats = car.statsSnapshot as unknown as StatsSnapshot;
  const rarity = RARITY_LABELS[traits.rarity];
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://commitcar.vercel.app';

  const metadata = {
    name: `CommitCar · @${car.githubUsername}`,
    description: `A ${rarity.label} CommitCar built from @${car.githubUsername}'s GitHub. ${stats.commits365d.toLocaleString()} commits in the last year. Built on commitcar.vercel.app.`,
    image: `${base}/api/og/${car.githubUsername}`,
    external_url: `${base}/commitcar/${car.githubUsername}`,
    attributes: [
      { trait_type: 'Rarity', value: rarity.label },
      { trait_type: 'Chassis', value: traits.chassis },
      { trait_type: 'Paint', value: traits.paint },
      { trait_type: 'Wheels', value: traits.wheels },
      { trait_type: 'Aero', value: traits.aero },
      { trait_type: 'Headlights', value: traits.headlights },
      { trait_type: 'Finish', value: traits.finish },
      { trait_type: 'Top Language', value: stats.topLanguage },
      { display_type: 'number', trait_type: 'Commits (365d)', value: stats.commits365d },
      { display_type: 'number', trait_type: 'Public Repos', value: stats.publicRepos },
      { display_type: 'number', trait_type: 'Longest Streak (days)', value: stats.longestStreak },
      { display_type: 'number', trait_type: 'Total Stars', value: stats.totalStars },
      { display_type: 'number', trait_type: 'Account Age (years)', value: Math.floor(stats.accountAgeYears) },
      { display_type: 'number', trait_type: 'Rarity Score', value: car.rarityScore },
    ],
  };

  return NextResponse.json(metadata, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' },
  });
}
