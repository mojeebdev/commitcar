'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { coinbaseWallet, injected } from 'wagmi/connectors';
import { useState } from 'react';

const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    coinbaseWallet({ appName: 'CommitCar', preference: 'smartWalletOnly' }),
    injected(),
  ],
  transports: {
    [base.id]: http(),
  },
  ssr: true,
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
