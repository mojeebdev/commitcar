import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const COMMITCAR_ABI = [
  {
    type: 'function',
    name: 'totalSupply',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
] as const;

const client = createPublicClient({ chain: base, transport: http() });

export async function getTotalMinted(): Promise<number> {
  const contract = process.env.NEXT_PUBLIC_COMMITCAR_CONTRACT as `0x${string}` | undefined;
  if (!contract || contract === '0x0000000000000000000000000000000000000000') return 0;
  try {
    const total = await client.readContract({
      address: contract,
      abi: COMMITCAR_ABI,
      functionName: 'totalSupply',
    });
    return Number(total);
  } catch (e) {
    console.error('[contract] totalSupply read failed:', e);
    return 0;
  }
}
