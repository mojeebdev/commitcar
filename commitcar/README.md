# CommitCar

> Your commits drive a car.

A BlindspotLab experiment by [@mojeebeth](https://twitter.com/mojeebeth).

Paste any GitHub username → CommitCar reads public commits, repos, streaks, and stars → generates a composable SVG car with 7 visual traits and a rarity tier. Cars are saved to the Hall of Commit. Users can optionally mint their car as an ERC-721 on Base Mainnet.

---

## Stack

- Next.js 15 (App Router, React 19)
- TypeScript
- Prisma + Supabase (Postgres)
- Wagmi v2 + Viem + Coinbase Smart Wallet (Base Mainnet)
- `@vercel/og` for dynamic share images
- Fully composable SVG car renderer (`app/lib/carRenderer.ts`)

---

## Trait system

Every car has 7 visible traits derived from public GitHub data:

| Trait | Source | Values |
|---|---|---|
| Chassis | Top language | coupe · muscle · hatchback · armored · sedan · roadster · classic |
| Paint | Peak commit hour (UTC) | midnight · dawn · sunset · neon |
| Wheels | Public repos | stock · spoke · mag · chrome |
| Aero | Longest streak | none · lip · wing · full |
| Headlights | Total stars | dim · bright · laser |
| Finish | Account age | matte · gloss · chrome · patina |
| **Rarity** | **Commits in last 365d** | common · rare · epic · legendary · mythic |

---

## Local setup

```bash
pnpm install              # or npm / yarn
cp .env.example .env      # fill in GITHUB_PAT and DATABASE_URL
pnpm db:push              # push Prisma schema to Supabase
pnpm dev                  # localhost:3000
```

### Required env vars

- `GITHUB_PAT` — a server-side GitHub Personal Access Token (read-only, `public_repo` scope). Bumps rate limits from 60/hr → 5000/hr.
- `DATABASE_URL` / `DIRECT_URL` — Supabase Postgres connection strings.
- `NEXT_PUBLIC_COMMITCAR_CONTRACT` — address of the deployed `CommitCar.sol` on Base (leave as zero address pre-deploy; mint button auto-disables).
- `NEXT_PUBLIC_APP_URL` — public URL for share links + token metadata.

---

## Deploy

```bash
# 1. Push to GitHub
git init && git add . && git commit -m "init: commitcar" && git push

# 2. Vercel: import the repo, add env vars, deploy.
#    No build config needed — `next build` runs `prisma generate` automatically.

# 3. Deploy contract:
#    - Copy contracts/CommitCar.sol into Remix (or Foundry/Hardhat)
#    - Constructor arg: "https://commitcar.vercel.app/api/metadata/"
#    - Deploy to Base Mainnet
#    - Paste the address into NEXT_PUBLIC_COMMITCAR_CONTRACT on Vercel
#    - Redeploy. Mint button activates automatically.
```

---

## Routes

- `/` — homepage with paste-to-build terminal interaction
- `/commitcar` — Hall of Commit (grid of every car built, filter by rarity)
- `/commitcar/[username]` — individual car permalink with stats, mint, and X share
- `/api/build` — POST `{ username }` → car data
- `/api/og/[username]` — 1200×630 dynamic share image
- `/api/metadata/[username]` — ERC-721 token metadata JSON
- `/api/finalize-mint` — POST after tx confirms → updates DB with tokenId + owner

---

## Credits

Built with love by [@mojeebeth](https://twitter.com/mojeebeth) · [mojeeb.xyz](https://mojeeb.xyz) · [BlindspotLab](https://blindspotlab.xyz) · Claude · GitHub · Vercel.
