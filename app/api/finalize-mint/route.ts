import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, getAddress } from 'viem';
import { base } from 'viem/chains';
import { prisma } from '@/app/lib/prisma';
import { supabaseAdmin, STORAGE_BUCKET } from '@/app/lib/supabase';
import { generateCarPng } from '@/app/lib/imageGen';

export const runtime = 'nodejs';
export const maxDuration = 60;

const client = createPublicClient({ chain: base, transport: http() });

export async function POST(req: NextRequest) {
  try {
    const { username, txHash, ownerAddress } = await req.json();
    if (!username || !txHash || !ownerAddress) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const receipt = await client.waitForTransactionReceipt({ hash: txHash, timeout: 30_000 });
    if (receipt.status !== 'success') {
      return NextResponse.json({ error: 'Transaction failed' }, { status: 400 });
    }

    // Parse tokenId from Transfer event
    let tokenId: number | null = null;
    for (const log of receipt.logs) {
      if (log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef') {
        if (log.topics[3]) {
          tokenId = Number(BigInt(log.topics[3]));
          break;
        }
      }
    }

    // Fetch the car to generate PNG
    const car = await prisma.car.findUnique({ where: { githubUsername: username } });
    if (!car) {
      return NextResponse.json({ error: 'Car not found' }, { status: 404 });
    }

    // Generate PNG and upload to Supabase Storage
    let imageUrl: string | null = null;
    try {
      const png = await generateCarPng(car);
      const path = `${username}-${tokenId ?? Date.now()}.png`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .upload(path, png, {
          contentType: 'image/png',
          cacheControl: '31536000',
          upsert: true,
        });
      if (uploadError) {
        console.error('[finalize-mint] upload error:', uploadError);
      } else {
        const { data } = supabaseAdmin.storage.from(STORAGE_BUCKET).getPublicUrl(path);
        imageUrl = data.publicUrl;
      }
    } catch (e) {
      console.error('[finalize-mint] image generation error:', e);
      // Non-fatal — mint still succeeds, image will just use the dynamic endpoint
    }

    const updated = await prisma.car.update({
      where: { githubUsername: username },
      data: {
        mintedAt: new Date(),
        mintTxHash: txHash,
        ownerAddress: getAddress(ownerAddress),
        tokenId,
        imageUrl,
      },
    });

    return NextResponse.json({ ok: true, tokenId: updated.tokenId, imageUrl });
  } catch (err: any) {
    console.error('[finalize-mint] error:', err);
    return NextResponse.json({ error: err?.message ?? 'Failed to finalize' }, { status: 500 });
  }
}
