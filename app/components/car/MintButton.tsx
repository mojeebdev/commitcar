'use client';

import { useState } from 'react';
import { useAccount, useConnect, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { keccak256, stringToBytes } from 'viem';
import { base } from 'wagmi/chains';
import type { CarTraits } from '@/app/lib/traits';

const COMMITCAR_ABI = [
  {
    type: 'function',
    name: 'mint',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'username', type: 'string' },
      { name: 'traitsHash', type: 'bytes32' },
      { name: 'tokenURI', type: 'string' },
    ],
    outputs: [{ name: 'tokenId', type: 'uint256' }],
  },
] as const;

interface MintButtonProps {
  username: string;
  traits: CarTraits;
  alreadyMinted: boolean;
  tokenId: number | null;
}

export function MintButton({ username, traits, alreadyMinted, tokenId }: MintButtonProps) {
  const [finalizing, setFinalizing] = useState(false);
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending: connecting } = useConnect();
  const { writeContract, data: txHash, isPending: signing, error: writeError } = useWriteContract();
  const { isLoading: waiting, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  if (alreadyMinted && tokenId != null) {
    return (
      <a
        href={`https://basescan.org/token/${process.env.NEXT_PUBLIC_COMMITCAR_CONTRACT}?a=${tokenId}`}
        target="_blank"
        rel="noreferrer"
        className="btn-ghost"
      >
        ✓ Minted · token #{tokenId}
      </a>
    );
  }

  const contract = process.env.NEXT_PUBLIC_COMMITCAR_CONTRACT as `0x${string}` | undefined;
  const contractReady = contract && contract !== '0x0000000000000000000000000000000000000000';

  if (!contractReady) {
    return <button className="btn-ghost" disabled title="Contract not deployed yet">Mint (coming soon)</button>;
  }

  async function handleMint() {
    if (!contract) return;
    if (!isConnected) {
      const cb = connectors.find((c) => c.id === 'coinbaseWalletSDK') ?? connectors[0];
      if (cb) connect({ connector: cb });
      return;
    }
    const traitsHash = keccak256(stringToBytes(JSON.stringify(traits)));
    const tokenURI = `${process.env.NEXT_PUBLIC_APP_URL || 'https://commitcar.vercel.app'}/api/metadata/${username}`;
    writeContract({
      address: contract,
      abi: COMMITCAR_ABI,
      functionName: 'mint',
      args: [username, traitsHash, tokenURI],
      chainId: base.id,
    });
  }

  // After tx confirms, tell the API so the DB is updated.
  if (isSuccess && txHash && !finalizing && address) {
    setFinalizing(true);
    fetch('/api/finalize-mint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, txHash, ownerAddress: address }),
    }).then(() => window.location.reload()).catch(() => setFinalizing(false));
  }

  const label = !isConnected
    ? (connecting ? 'Connecting…' : 'Connect & mint')
    : signing ? 'Sign in wallet…'
    : waiting ? 'Confirming on Base…'
    : finalizing ? 'Finalizing…'
    : 'Mint on Base · Free';

  const busy = connecting || signing || waiting || finalizing;

  return (
    <>
      <button onClick={handleMint} disabled={busy} className="btn-primary">
        {label}
      </button>
      {writeError && (
        <div style={{ width: '100%', marginTop: 8, fontSize: 11, color: '#E63B2E', fontFamily: 'var(--font-body)' }}>
          × {writeError.message.split('\n')[0]}
        </div>
      )}
    </>
  );
}
