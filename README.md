# game-world

A Next.js portal with 50 browser games across Arcade, Puzzle, Board games, Brain training, and Kids corner.

## Included

- Searchable catalog, category filters, favorites, light/dark themes, and individual game illustrations.
- Keyboard and touch controls, game rules, restart controls, and local best scores where applicable.
- Physics powered by Matter.js, chess by chess.js, mazes by ROT.js, and generated Sudoku and word-search puzzles.
- Educational quizzes, optional browser speech, opt-in sounds, and a local captioned counting video.
- Static game pages, metadata, canonical URLs, structured data, sitemap, robots, and social preview image.
- Responsive layouts using Plus Jakarta Sans and Outfit, with accessibility and layout tests.

Multiplayer games share one device. There are no accounts, online matchmaking, cloud saves, or global leaderboards. Preferences and scores stay in the current browser's local storage. Speech availability depends on the browser and operating system.

## Local Development

Use a supported Node.js LTS release; this project was developed with Node.js 24 and npm.

```bash
npm ci
npm run dev
```

Open [http://localhost:3100](http://localhost:3100). Both development and production scripts default to port **3100**, not 3000.

For a production preview:

```bash
npm run build
npm start
```

The build downloads the Google font files through `next/font` and serves them locally at runtime. Internet access is needed during the initial build.

## Configuration

The optional settings are documented in [.env.example](.env.example). Set them in an ignored local environment file or in your deployment provider's environment settings.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Production origin, such as `https://games.example.com`, for canonical URLs and the sitemap. |
| `NEXT_PUBLIC_AD_PLACEHOLDERS` | Set to `true` to show the catalog's reserved advertisement space. Defaults to disabled. |

Without an explicit site URL, Vercel's production deployment URL is used when available; local development falls back to `http://localhost:3100`.

No database or credentials are required. MongoDB has not been integrated because the current games use local state. Future database connections must remain server-side; never use a `NEXT_PUBLIC_` variable for credentials.

## Verification

```bash
npm run lint
npm run typecheck
npm run test:logic
npm audit
```

For browser tests, keep the production preview running in a separate terminal, then run `npm run test:ui`. Run `npm test` for both rule and browser suites.

The browser suite covers all 50 game pages and the informational/error pages, gameplay interactions, light/dark themes, font loading, text clipping, automated WCAG checks, canvas rendering, and responsive widths. Automated accessibility checks do not replace a complete manual assistive-technology audit.

Local Playwright runs use installed Microsoft Edge by default. To use Chromium instead, run `npx playwright install chromium` and set `PLAYWRIGHT_CHANNEL=chromium` in your shell. CI defaults to Chromium; provision it with `npx playwright install --with-deps chromium`. Set `TEST_BASE_URL` when testing a different server.

Screenshots are written to `artifacts/`, reports to `playwright-report/`, and failure traces to `test-results/`. These generated directories are excluded from Git. `TEST_SOURCE_STYLES=1` is an optional CSS-debugging aid, not a substitute for testing the production build.

## Deploy on Vercel

1. Import this repository into Vercel using the Next.js framework preset.
2. Use the repository root as the project root and `npm run build` as the build command.
3. Configure `NEXT_PUBLIC_SITE_URL` with the final HTTPS domain before building production.
4. Deploy and verify the sitemap, canonical URLs, game controls, and local media on the deployed domain.

This repository is deployment-ready source; pushing it to GitHub does not itself configure a Vercel project or a custom domain.

## Advertising and Privacy

The ad component is a disabled-by-default placement placeholder, not a live monetization integration. No ad SDK, tracking analytics, third-party video embed, or consent platform is installed. Ad-provider approval, consent requirements, children's privacy rules, provider configuration, and any required `ads.txt` must be addressed before serving ads. Review the privacy and terms pages for your hosting and business setup.

## Project Map

- [src/lib/games.ts](src/lib/games.ts): catalog, descriptions, instructions, and site URL.
- [src/components/game-player.tsx](src/components/game-player.tsx): lazy-loaded game players.
- [src/components/games](src/components/games): playable game components and shared controls.
- [src/lib](src/lib): game rules and physics engines.
- [src/app](src/app): routes, metadata, and styles.
- [public](public): local educational media and public assets.
- [tests](tests): Playwright gameplay, rules, accessibility, and layout checks.