# Game Shelves

Private project with mapping of my own board game shelves. This repository is public because I'm poor.

## Development

Use Node **24.15.0** (`nvm use`, or your version manager's `.node-version` support) and Yarn **1.22.22**.
The app uses React, strict TypeScript, Vite, Tailwind CSS, Ant Design, Biome, and TanStack Query.

```sh
yarn install --frozen-lockfile
cp .env.example .env
# Fill in this app's Firebase project configuration and your BGG username.
yarn dev
```

Open `http://localhost:3009/gameshelves/`. `yarn start` is an alias for `yarn dev`.
The development server fails if port 3009 is occupied instead of switching ports.
App-owned styles use Tailwind; Ant Design provides the UI components.
Tailwind Preflight is deliberately omitted to preserve the existing Ant Design/global reset behavior.
Ant Design styles are placed in the `antd` CSS layer, below Tailwind utilities.

### Environment migration

Local `.env` files are ignored. Never commit real configuration values.
Rename `REACT_APP_BGG_USERNAME` to `VITE_BGG_USERNAME` and Firebase variables from
`REACT_APP_FIREBASE_*` to `VITE_FIREBASE_*` (including `VITE_FIREBASE_API_ID`).
Replace `REACT_APP_FIREBASE_API_KEY` with three consecutive parts:
`VITE_FIREBASE_A`, `VITE_FIREBASE_P`, and `VITE_FIREBASE_I`. Their concatenation must
equal the original key, without extra quotes or spaces. This matches the lda service convention.
`VITE_FIREBASE_DATABASE_URL` is optional; the remaining Firebase values are required.
Restart Vite after changing environment variables.

All `VITE_*` variables are embedded in client code. Splitting the Firebase API key is
**not** a security measure; Firebase security rules and API restrictions protect the project.
The Firebase project, collections, and existing document formats are unchanged.
Legacy numeric game/shelf IDs are normalized to strings in memory; loading does not rewrite Firestore.
Dictionary reads return an empty dictionary for absent documents, but permission/network
errors and invalid stored data are reported as errors.

### Authentication

The app follows lda's authentication flow: it waits for Firebase to restore your browser
session, then shows either the app or a signed-out alert with an email/password Login modal.
Any authenticated account in this Firebase project can use the same global collection.
There is no signup, password-reset, or logout UI. Firebase remembers the session across
browser restarts; external sign-out and account changes remove the previous session's data cache.
The original hash URL is preserved through login; `/login` redirects authenticated visitors home.

In Firebase Console, enable **Authentication > Sign-in method > Email/Password**, and use
an existing account from **Authentication > Users**. Check **Authentication > Settings >
Authorized domains** for your deployment domain and `localhost` if your configuration requires it.
Do not put account passwords in environment files.

To protect Firestore, copy the complete root [`firestore.rules`](./firestore.rules) file into
**Firestore Database > Rules**, then publish it manually. No command in this change deploys rules.
The file permits authenticated reads/writes to `general/shelved-games`, `general/images`, and
`games/{gameId}`, and denies unauthenticated access and all unmatched paths.
It does not enforce an owner allowlist or introduce per-user data.

Before replacing existing rules, save them and preserve any unrelated rules needed by other
apps sharing this project. A broader overlapping `allow` rule can override these restrictions:
Firestore grants access when any matching allow condition succeeds.

Use the console's Rules Playground to check reads and writes to both general documents and
`games/test-game`: deny unauthenticated requests and allow authenticated requests. Also check
that an authenticated request to an unrelated path such as `other/test` is denied.
The supplied file has **no effect until you publish it**. The frontend gate alone does not
secure direct database requests, hide the global dump in public assets, or hide compiled JavaScript.
Public files, the existing import workflow, and stored document formats remain unchanged.

### Checks and tests

```sh
yarn lint        # Full-project, non-mutating Biome check
yarn format      # Apply formatting, import organization, and safe lint fixes
yarn typecheck   # Strict application and Vite/test configuration checks
yarn test        # Vitest + Testing Library; Firebase is mocked
yarn test:watch
yarn build       # Typecheck, then production build
yarn preview     # http://localhost:4173/gameshelves/
```

Husky runs lint-staged/Biome on supported staged files before commits.
`yarn run check` also runs Biome; use `run` explicitly because Yarn Classic reserves `yarn check`.
Tests cover Firebase writes and batch retries, TanStack cache invalidation,
collection imports, hash routing, and the sync UI without contacting production Firebase.
Large game saves use fresh batches of at most 500 writes. Multiple batches and the
separate shelf write are not one atomic transaction; failures remain visible and retrying
rewrites the same game IDs.

### Deployment

`yarn deploy` builds and publishes `build/` using `gh-pages`. Deployment is a separate,
explicit action: normal development/check commands never publish.
Vite's base is `/gameshelves/`, matching the existing GitHub Pages location.
Keep hash URLs such as `/gameshelves/#/shelves` so direct navigation and reloads work
without server-side routing configuration.

## Shelf ID Construction

`<wall>-<container>-<part_id>`

wall values:

- ew: east wall, the one with no windows
- ww: west wall, the one with the big window

container values:

- sl: shelf left
- sc: shelf center
- sr: shelf right
- cl: cabinet left
- cr: cabinet right
- dc: drawer center

part_id are numbers always starting coming from 0

## Collections:

- games/<game-id> -  each board game geek entry
- general/shelves - object with all games in shelves by <game-id> but only boxed games
- ~~general/unshelved - object with all games that are not in shelves~~
- ~~general/all-games - object with snippet information about each game (name, image, type) [I think I don't need this, if I expand the .contains field in shelves to have these 3 information]~~

## Routes

All routes use hash URLs under `/gameshelves/` and require authentication.

| Route          | Menu entry | Content                                                     |
| -------------- | ---------- | ----------------------------------------------------------- |
| `/`            | Find Game  | Home page with the existing game search and shelf overview. |
| `/game-night`  | Game Night | Placeholder for game-night planning and suggestions.        |
| `/shelves`     | Shelves    | Existing shelf overview and game-placement controls.        |
| `/shelves/:id` | Shelves    | Existing game/box details and shelf location.               |
| `/friends`     | Friends    | Placeholder for friends and their game ratings.             |
| `/settings`    | Settings   | Existing BGG collection sync workflow.                      |

Legacy `/home` and `/login` URLs redirect authenticated visitors to `/`.
Legacy `/sync` URLs redirect to `/settings`.

### Collection sync in Settings

When wanting to update the game collection, a sync is necessary. It uses the CSV data and the XML data from BGG.
After both are parsed, it verifies what entries are new by checking against all-games (auto-generated from .contains)

- If the user selects `Add New Only`:
  -- Prompt every entry to select it's type and if it's boxed nor not [check if there's any other required information to do here]
  -- Adds entries in `games/`
  -- Adds entries in shelves as `shelfId: unshelved`
- If the users selects `Resync All`:
- Saves every entry in `games` (it costs firebase writes)
- For new games it does the new game only process

## /update

Allows update information about a game, more particularly in /shelves
Rules: A non-boxed game can never contain another

- Add fields to /shelves
  -- soundtrack?: string - link to spotify suggested soundtrack
  -- metalCints?: boolean
