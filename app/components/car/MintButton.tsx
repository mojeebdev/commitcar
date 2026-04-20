'use client';

import { useEffect, useRef, useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
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
  {
    type: 'function',
    name: 'tokenIdByUsername',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'string' }],
    outputs: [{ name: '', type: 'uint256' }],
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
  const [pendingConnect, setPendingConnect] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const finalizedHash = useRef<string | null>(null);

  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { writeContract, data: txHash, isPending: signing, error: writeError, reset } =
    useWriteContract();
  const { isLoading: waiting, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  // Already minted — show link to Basescan token page
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
    return (
      <button className="btn-ghost" disabled title="Contract not deployed yet">
        Mint (coming soon)
      </button>
    );
  }

  function triggerMint() {
    if (!contract) return;
    setErrorMsg(null);
    reset();
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

  // Auto-mint after wallet connects — closes the gap between "connect" and "sign"
  useEffect(() => {
    if (pendingConnect && isConnected) {
      setPendingConnect(false);
      triggerMint();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingConnect, isConnected]);

  // After tx confirms, finalize in DB (idempotent — only runs once per txHash)
  useEffect(() => {
    if (isSuccess && txHash && address && finalizedHash.current !== txHash) {
      finalizedHash.current = txHash;
      setFinalizing(true);
      fetch('/api/finalize-mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, txHash, ownerAddress: address }),
      })
        .then((r) => r.json())
        .then(() => {
          if (typeof window !== 'undefined' && (window as any).umami) {
            (window as any).umami.track('car-minted', { username });
          }
          window.location.reload();
        })
        .catch((e) => {
          setFinalizing(false);
          setErrorMsg(e?.message ?? 'Failed to finalize');
        });
    }
  }, [isSuccess, txHash, address, username]);

  async function handleClick() {
    setErrorMsg(null);
    if (!isConnected) {
      // Queue a mint to fire as soon as the wallet connects
      setPendingConnect(true);
      openConnectModal?.();
      return;
    }
    triggerMint();
  }

  // Humanize common errors
  const humanError = (() => {
    if (errorMsg) return errorMsg;
    if (!writeError) return null;
    const msg = writeError.message.toLowerCase();
    if (msg.includes('user rejected') || msg.includes('user denied')) {
      return 'Transaction cancelled in wallet.';
    }
    if (msg.includes('usernamealreadyminted')) {
      return 'This username has already been minted.';
    }
    if (msg.includes('insufficient funds')) {
      return 'Not enough ETH on Base for gas (~$0.05 needed).';
    }
    if (msg.includes('chain') || msg.includes('network')) {
      return 'Please switch your wallet to Base Mainnet.';
    }
    return writeError.message.split('\n')[0].slice(0, 140);
  })();

  const label = pendingConnect
    ? 'Opening wallet…'
    : !isConnected
    ? 'Connect & mint'
    : signing
    ? 'Sign in wallet…'
    : waiting
    ? 'Confirming on Base…'
    : finalizing
    ? 'Finalizing…'
    : 'Mint on Base · Free';

  const busy = pendingConnect || signing || waiting || finalizing;

  return (
    <>
      <button onClick={handleClick} disabled={busy} className="btn-primary">
        {label}
      </button>
      {humanError && (
        <div
          style={{
            width: '100%',
            marginTop: 8,
            fontSize: 11,
            color: '#E63B2E',
            fontFamily: 'var(--font-body)',
          }}
        >
          × {humanError}
        </div>
      )}
    </>
  );
}
