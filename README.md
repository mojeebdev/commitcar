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
