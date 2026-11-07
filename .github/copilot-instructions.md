# Game Shelves

## Scope and sources of truth

This app tracks a household's board games and their physical shelf/box locations. It uses
one global collection shared by authenticated accounts, not per-user libraries or a social network.
Keep existing workflows and appearance unless the task explicitly changes them.

Read `README.md` for setup, authentication, deployment, and import behavior. Read `package.json`,
`.nvmrc`, and the relevant configuration files for current scripts, dependencies, and runtime requirements.
Use Yarn Classic and the existing lockfile.

## React and TypeScript

- Use functional React components, hooks, and named exports.
- Prefer `type` for new object shapes and component props. Keep local types beside their consumers;
  reuse domain definitions in `src/types` rather than duplicating them.
- Keep strict typing. Narrow external values from `unknown`; use specific types instead of `any`
  or assertions that bypass validation.
- Use the existing source-root imports (`components`, `hooks`, `pages`, `services`, `utils`, `assets`),
  not the `@...` aliases from the reference apps. Prefer direct imports for new modules.
- Let Biome organize imports and formatting. Use type-only imports where appropriate.
- Keep state near its owner. Firebase owns authentication persistence, TanStack Query owns remote
  data, and React state owns temporary UI state.
- Reuse existing helpers and installed utilities; choose native operations for simple work.
  Add dependencies only when existing code and tooling cannot reasonably satisfy the task.
- Document non-obvious contracts and complex logic with focused JSDoc or comments, rather than
  repeating TypeScript declarations.

## UI and routing

- Use Ant Design for controls and Tailwind for app-owned styling. Preserve the existing theme
  and CSS layer ordering; Tailwind Preflight is intentionally omitted to avoid reset conflicts.
- Use contextual Ant Design feedback through `App.useApp()` when needed.
- Keep user-facing text in English and match existing terminology.
- Give controls accessible names, use semantic HTML and explicit button types, and preserve
  keyboard interaction for clickable shelf SVG paths.
- Preserve hash routing and the `/gameshelves/` deployment base. Keep production output in `build/`.
  For public HTML assets, use root-relative inputs and let Vite add the base; `%BASE_URL%`
  asset links previously produced a duplicated `/gameshelves/gameshelves/` prefix.

## Authentication and Firebase

- Follow `src/services/AuthProvider.tsx` and `src/components/AuthWrapper.tsx`: wait for restored
  auth state, then show the signed-out login gate or mount the authenticated app.
- Mount library queries, navigation, and query devtools only inside the authenticated subtree.
  Keep query/mutation caches isolated across sign-out and account switches, including late reads.
- Any authenticated account can access the same global data. Introduce owner checks, signup,
  or per-user collections only when explicitly requested.
- Keep SDK persistence operations in `src/services/firebase.ts` and remote-data orchestration
  in TanStack Query hooks. Reuse keys from `src/hooks/queryKeys.ts` and invalidate affected keys
  after successful mutations.
- Preserve the current document paths and merge/replacement semantics. Partial saves merge;
  full shelf replacement must still support deletion. Create fresh write batches for retries.
- Validate Firestore/import data at entry points using the existing guards. Preserve immutable
  normalization of legacy numeric IDs; reads must not rewrite stored data.
- Surface permission, network, parsing, and mutation errors. Missing aggregate documents may
  intentionally return empty dictionaries; other failures must not look like successful empty results.
- Avoid unnecessary reads and listeners. When changing storage, account for Firestore's
  1 MiB document limit, including overhead; JSON stringification is neither compression nor a
  document-read discount.
- Follow `.env.example` and the existing `VITE_FIREBASE_*` configuration. Client environment values
  are public; split API-key assembly is a compatibility convention, not access control.
- `firestore.rules` is supplied for manual publication in Firebase Console. Frontend gating does
  not enforce database permissions or hide the global dump in public assets.

## Validation and delivery

- For code changes, run `yarn lint`, relevant tests with `yarn test <files>`, and type checking.
  For runtime, routing, asset, or configuration changes, run `yarn build`, which includes type checking;
  otherwise use `yarn typecheck`. Documentation-only changes need no runtime checks.
- Use `yarn lint` or `yarn run check` for Biome: bare `yarn check` invokes Yarn Classic's built-in command.
- Add focused regression cases for changed behavior in the existing Vitest/Testing Library suite.
  Mock Firebase in tests; use local demo emulators when checking real SDK/rules behavior.
- Validate development and built-preview behavior under `/gameshelves/` when changing routes or assets.
  HTTP 200 alone is insufficient: Vite's HTML fallback can masquerade as a missing static asset.
- Keep production writes and deployments behind explicit user authorization. Report exactly what was
  verified and any manual Firebase setup or rule publication still required.
- Preserve unrelated working-tree changes and local collection exports. Stage task files explicitly
  when committing so untracked dumps such as `collection.csv` are not included accidentally.
- Commit only when explicitly requested in the current turn. Omit Copilot co-author trailers.
- Use Conventional Commit subjects: `type(scope): summary`, with a lowercase type and scope
  and a concise imperative summary. Choose `feat`, `fix`, `docs`, `chore`, `refactor`, `perf`,
  `test`, `build`, or `ci` as appropriate; scope names the affected area.
  Example: `feat(auth): gate app with Firebase authentication`.
