import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, parseAbiItem, getAddress } from 'viem';
import { base } from 'viem/chains';
import { prisma } from '@/app/lib/prisma';

export const runtime = 'nodejs';

const client = createPublicClient({ chain: base, transport: http() });

export async function POST(req: NextRequest) {
  try {
    const { username, txHash, ownerAddress } = await req.json();
    if (!username || !txHash || !ownerAddress) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Wait briefly for the receipt if it's not indexed yet
    const receipt = await client.waitForTransactionReceipt({ hash: txHash, timeout: 20_000 });
    if (receipt.status !== 'success') {
      return NextResponse.json({ error: 'Transaction failed' }, { status: 400 });
    }

    // Parse the Transfer event from the receipt to extract tokenId
    // Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
    const transferEvent = parseAbiItem(
      'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
    );
    let tokenId: number | null = null;
    for (const log of receipt.logs) {
      if (log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef') {
        // topic[3] is the tokenId
        if (log.topics[3]) {
          tokenId = Number(BigInt(log.topics[3]));
          break;
        }
      }
    }

    const updated = await prisma.car.update({
      where: { githubUsername: username },
      data: {
        mintedAt: new Date(),
        mintTxHash: txHash,
        ownerAddress: getAddress(ownerAddress),
        tokenId,
      },
    });

    return NextResponse.json({ ok: true, tokenId: updated.tokenId });
  } catch (err: any) {
    console.error('[finalize-mint] error:', err);
    return NextResponse.json({ error: err?.message ?? 'Failed to finalize' }, { status: 500 });
  }
}
