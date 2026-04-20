import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getTotalMinted } from '@/app/lib/contract';

export const runtime = 'nodejs';
export const revalidate = 30;

export async function GET() {
  const [totalBuilt, totalMinted, onChainMinted] = await Promise.all([
    prisma.car.count(),
    prisma.car.count({ where: { mintedAt: { not: null } } }),
    getTotalMinted(),
  ]);

  return NextResponse.json(
    {
      totalBuilt,
      totalMinted,
      onChainMinted,
      contract: process.env.NEXT_PUBLIC_COMMITCAR_CONTRACT,
      opensea: 'https://opensea.io/collection/commitcar',
      basescan: `https://basescan.org/address/${process.env.NEXT_PUBLIC_COMMITCAR_CONTRACT}`,
    },
    { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' } }
  );
}
