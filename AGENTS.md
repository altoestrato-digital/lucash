# Lucash — Agent Notes

Personal-finance web app (Spanish UI). Next.js App Router + TypeScript + Tailwind v4 + React Compiler. Frontend-only; backend (NestJS) is out of scope and not present here. Persistence is a local SQLite database (WASM via `sql.js`, stored in IndexedDB) — there is no remote backend.

## Stack & key facts

- Next.js 16.2.10, React 19.2.4, TypeScript 5, Tailwind 4 (via `@tailwindcss/postcss`).
- React Compiler is **on** — see `reactCompiler: true` in `next.config.ts:5`. Don't disable it.
- Package manager: **pnpm** (lockfile + `pnpm-workspace.yaml` present). `pnpm-workspace.yaml` whitelists `sharp` and `unrs-resolver` builds; do not edit that list without a reason.
- No test runner, no typecheck script, no formatter wired up yet. `package.json` only exposes `dev` / `build` / `start` / `lint` (ESLint flat config in `eslint.config.mjs`).
- `next-env.d.ts` is generated — do not edit (it's gitignored, but Next recreates it on first run).

## Project layout

- All source lives under `src/`. Import alias `@/*` → `src/*` (see `tsconfig.json:21`).
- App Router under `src/app/`. Current pages: only the default `layout.tsx` and `page.tsx` (create-next-app boilerplate). The "real" routes described in the spec do **not exist yet** — see Routes below.
- `public/` holds static SVGs (next/vercel logos + generic placeholders). `src/app/favicon.ico` is also static.

## Planned routes (spec target — not yet built)

The project spec defines these App Router pages; create them as `src/app/<route>/page.tsx`:

- `/dashboard` — KPIs, sub-budget breakdown, recent activity, test de imprevisto.
- `/presupuestos` — main budget + sub-budget editor, double-ring donut, snapshots.
- `/historial` — chronological ledger, filters by date/category/type/cuenta.
- `/cargar` — mobile-first entry: picker (Ingreso vs Egreso), form, drag-and-drop receipt image with local preview thumbnail, excedente redirect.
- `/ahorros` — savings destinations and goals (filter view over `/cuentas`).
- `/cuentas` — 5 account types, 5 currencies, metas, atomic conversion modal.
- `/perfil` — identity (name/email/avatar), preferences (5 settings instant-save), sync placeholder, about.

## Business rules

- **Budget overflow → savings redirect:** if an `ingreso` exceeds the month's configured amount, the surplus is auto-routed to savings. Must trigger an in-app interactive prompt asking the user to pick a destination ("Banco A", "Cochinito de efectivo", etc.).
- **Strict monetary typing:** all amounts, balances, and percentages must be strongly typed in TypeScript. Avoid `number` for money — use a dedicated type/alias (e.g. branded `number` or a `Money` helper) so rounding/parsing bugs are caught at compile time.
  - **Sole exception:** `Cuenta.saldo` and `MovimientoCuenta.monto` are plain `number` **in the account's own currency** because crypto (BTC/ETH/USDT) doesn't map to Bs/USD `Money`. Conversion to `Money` at display boundary in `src/lib/conversion.ts`.
- No `route.ts` / API routes under `src/app/**` — backend is local only.

## Persistence — SQLite in the browser

- Engine: `sql.js` (SQLite compiled to WebAssembly). Loaded once at startup via `initDB()` in `src/lib/db/client.ts`.
- Storage: the exported DB binary is persisted to IndexedDB (DB `lucash-sqlite`, store `files`, key `db`) so it survives page reloads. Reads come from the in-memory `Database`; writes are debounced and flushed to IndexedDB.
- Schema lives in `src/lib/db/schema.ts` (`SCHEMA_SQL`, all `CREATE … IF NOT EXISTS`). Migrations are forward-only DDL bumps; bump `SCHEMA_VERSION` and append to `SCHEMA_SQL`.
- All DB access is client-side. The `<DBProvider>` in `src/lib/db/provider.tsx` gates the app on `initDB()` resolving; the rest of the tree is not rendered until the DB is ready. `DBProvider` is mounted at the root of `ClientLayout` so every page is covered.
- Repos per domain live in `src/lib/db/queries/<domain>.ts` and expose sync CRUD methods. They call `getDB()` (throws if accessed before init) and trigger `persist()` + `notifyChange()` on writes. Hooks subscribe via `subscribe(listener)` from `@/lib/db` and re-query on notification.
- All hooks that read persisted data go through the DB. `useLocalStorage` is only used for ephemeral form drafts (e.g. `useCargarForm`).
- There are **no mocks** in `src/mocks/`. The `useBcvLookup` and `convertirAUSD` / `convertirABs` helpers read from `tasasBcvRepo` / `tasasCriptoRepo`; until the user (or a future API client) writes a rate, the conversion yields `0` and the BCV field in `/cargar` falls back to manual input.
- `useUploadOcr` is a no-op stub: the upload form in `/cargar` always falls back to manual entry. Hook a real OCR client into `src/hooks/useUploadOcr.ts` when one is available.
- `useBcvLookup` is wired via `useSyncExternalStore` against the DB so the BCV field re-reads when rates change.

## State management — Zustand

- **Engine:** `zustand` v5 (`create` + `devtools` middleware) for cross-component, non-persistent state. Each store lives in `src/stores/<domain>.ts` and re-exports through `src/stores/index.ts`.
- **Use it for:** client UI state that needs to be shared across components without prop-drilling (toasts, modals, drawers, transient flags). Example: `useUIStore` in `src/stores/ui.ts:1` for the toast queue.
- **Do NOT use it for:** data that lives in the SQLite DB. The DB hooks (`useCuentas`, …) are still the source of truth for persisted data. Zustand is for ephemeral / view-layer state.
- **When we get a real API:** the pattern for a server-state store is `{ data, loading, error, fetch, ...mutations }` with async actions that update `data` and toggle `loading`/`error`. Keep the DB hook + repo as the persistence path; the store becomes a cache / view-model on top of it. Selector subscriptions (`useStore(s => s.field)`) keep re-renders minimal.

## Data architecture

- **5 tipos de cuenta** in `/cuentas`: `efectivo, banco, prepago, crypto, inversion`. `efectivo|banco|prepago` are "líquidas" (suman al Disponible). `crypto|inversion` are NOT liquid; only `ConversionModal` can move saldo to liquid.
- **Monedas:** `Bs | USD | USDT | BTC | ETH`. Only `conversion.ts` handles cross-currency math.
- **Metas** live on accounts with `objetivo: "ahorro"` OR `tipo ∈ {crypto, inversion}`. `cumplidaAt` is a non-reversible milestone.
- **Soft-delete** for entities with history (`Cuenta`, `Subpresupuesto`) via `activo: false`.
- **Redirección de excedente**: from `/cargar` when Ingreso overshoots budget → `ExcedenteDialog` with account picker → creates `MovimientoCuenta{esRedireccionExcedente:true}`. If no ahorro account exists, offer "Crear cuenta de ahorro" shortcut.
- **Atomic conversion** in `/cuentas`: two movements sharing a `conversionId`.
- **Snapshots** for `/presupuestos` when period closes. Recurrencia of sub-budgets via `recurrente` flag.
- **Dashboard saludo** reads `getPerfil().nombre`. Fallback `Hola, Lucash` + CTA if empty.
- **Preferencias** persist instantly (moneda, fecha, semana, tema, idioma). Inglés disabled in V1.
- The app starts with an empty DB. There is no automatic seed; users create their own cuentas / transacciones / presupuesto. Any data left over from the old `localStorage` schema is ignored (browse to DevTools → Application → IndexedDB to wipe `lucash-sqlite` if a clean start is needed).

## Commands

- `pnpm dev` — Next dev server on http://localhost:3000.
- `pnpm build` / `pnpm start` — production build / serve.
- `pnpm lint` — ESLint (flat config, `next/core-web-vitals` + `next/typescript`).

## Conventions

- **Specs are the source of truth**: `/.specs/*.md` before implementing any screen. Read the spec fully, then implement every component, hook, type, mock, and edge case it defines. Do NOT deviate from the spec's model, component list, or business rules.
- Mobile-first layouts; UI should map cleanly to a future Android APK.
- Tailwind v4 syntax (`@import "tailwindcss";` + `@theme inline {}` in `src/app/globals.css`) — do not reintroduce a v3 `tailwind.config.js`.
- Geist font is loaded via `next/font/google` in `src/app/layout.tsx`; reuse the existing `--font-geist-sans` / `--font-geist-mono` CSS vars instead of importing fonts ad-hoc.
- All data is local — persistence goes through the SQLite layer in `src/lib/db/`; no network calls to a real backend.

## Obsidian Workflow

**Vault path:** `/home/hodor/Documents/projects-obsidian/projects/lucash/`

### Vault structure
```
00 - Resumen Proyecto.md    ← Estado actual del proyecto, stack, último commit
01 - Modulos/               ← Una nota por módulo (tablas, libs, relaciones, spec)
02 - Tablas SQL/            ← DDL de cada tabla extraído de schema.ts
03 - Historial/             ← Resúmenes de sesión: <titulo>-<YYYY-MM-DD>.md
```

### Flujo de inicio de sesión
1. Leer `00 - Resumen Proyecto.md` para entender el estado actual.
2. Leer el último archivo en `03 - Historial/` para saber qué se hizo la sesión anterior.
3. Si hay pendientes, continuar desde ahí.

### Flujo post-ejecución (después de cada plan completado)
1. Ejecutar `pnpm lint` y `pnpm build` para verificar.
2. Generar commit con mensaje descriptivo.
3. Actualizar en Obsidian:
   - `00 - Resumen Proyecto.md` — último commit, estado.
   - `01 - Modulos/<modulos afectados>.md` — si cambió la estructura del módulo.
   - `02 - Tablas SQL/*.sql` — si cambió el schema.
   - `03 - Historial/<titulo>-<YYYY-MM-DD>.md` — crear entrada con archivos modificados + commit.

### Convenciones del vault
- **Title Case** para nombres de archivo.
- Usar `[[wikilinks]]` para referencias entre notas.
- No crear subcarpetas innecesarias dentro de cada carpeta.
