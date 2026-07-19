# Spec — `/cuentas` (Cuentas, Wallets y Fuentes de dinero)

> Frontend-only. Next.js App Router + TypeScript + Tailwind v4 + React Compiler. Sin backend real. Toda la persistencia es mock en `localStorage`.
>
> Esta pantalla es la **base de toda la arquitectura financiera** de Lucash: alimenta el método de pago de `/cargar`, el filtro de método de `/historial`, la métrica de "disponible" de `/dashboard` y la lista de cuentas de ahorro de `/ahorros`. Cualquier cambio en su modelo impacta las otras specs.

## 1. Historia de usuario

> Como usuario de Lucash, necesito ver de un vistazo cuánto dinero tengo realmente, sin importar dónde esté: efectivo, cuentas bancarias, prepagos como Zinli o PayPal, o incluso crypto e inversiones como Binance, MetaMask o Quantfury. Quiero poder crear cada fuente con su moneda (Bs, USD, USDT, BTC, ETH), ver su saldo convertido a Bs y USD con la tasa del día, y saber en todo momento cuánto es **total** (suma de todo) y cuánto es **disponible** (solo lo líquido: efectivo, bancos y prepagos). Las cuentas de ahorro, crypto e inversiones entran al total pero no al disponible, salvo que yo las "convierta a disponible" explícitamente. Cada cuenta puede tener metas (ej. "llegar a Bs 5.000 de emergencia" o "0.1 BTC para el viaje") y una alarma visual cuando uso una cuenta de ahorro para un gasto del presupuesto.

## 2. Criterios de aceptación

### 2.1 Vista principal

- [ ] Header con dos KPIs lado a lado (mobile-first apilados):
  - **Total:** `Bs X (USD Y)` — suma de saldos de **todas** las cuentas activas, convertidos a Bs y USD.
  - **Disponible:** `Bs X (USD Y)` — suma de saldos de cuentas con `tipo` ∈ `{efectivo, banco, prepago}`.
  - El color del KPI `Disponible` se atenúa si es `< 20%` del total (señal visual de baja liquidez).
- [ ] Tabs internas: `Todas` (default) · `Disponibles` · `Ahorro`. Cada tab filtra la lista sin recargar.
- [ ] Lista de `CuentaCard` con:
  - Nombre + chip de tipo (`Efectivo` verde, `Banco` azul, `Prepago` violeta, `Crypto` naranja, `Inversión` gris).
  - Chip de moneda (`Bs`, `USD`, `USDT`, `BTC`, `ETH`).
  - Saldo en la **moneda de la cuenta** (ej. `0.5 ETH`) y debajo la conversión a `Bs X · USD Y` en texto más chico y gris.
  - Chip de objetivo: `Cubrir presupuesto` o `Ahorro`.
  - Mini-barra de la meta principal (la primera `MetaCuenta` activa), si tiene.
  - Badge rojo `Saldo negativo` si `saldo < 0`.
  - Tap en la card abre `CuentaDrawer`.
- [ ] FAB sticky bottom `[+ Nueva cuenta]`.
- [ ] Empty state (sin cuentas) con icono, texto `Creá tu primera cuenta para empezar.` y CTA grande.

### 2.2 CRUD de cuentas

- [ ] Modal `CuentaEditor` con los campos:
  - `Nombre` (input texto, requerido).
  - `Tipo` (select: `Efectivo`, `Banco`, `Prepago`, `Crypto`, `Inversión`).
  - `Moneda` (select con monedas habilitadas según el tipo, ver §2.2.1).
  - `Saldo inicial` (input numérico en la moneda de la cuenta, requerido, default 0).
  - `Objetivo` (segmented: `Cubrir presupuesto` / `Ahorro`).
  - `Color` (color picker de 8 colores, default aleatorio).
  - `Activo` (toggle, default `true`).
- [ ] Botones `Cancelar` y `Guardar`. Validación inline.
- [ ] Menú `⋯` en cada `CuentaCard` con `Editar` y `Eliminar`. Confirmar antes de eliminar; si tiene movimientos o saldo != 0, mensaje `Tiene {N} movimientos y saldo {X}. ¿Eliminar de todas formas?` (soft-delete en cualquier caso: `activo = false`).

#### 2.2.1 Monedas permitidas por tipo

- [ ] `efectivo` → solo `Bs`.
- [ ] `banco` → `Bs | USD`.
- [ ] `prepago` → `Bs | USD`.
- [ ] `crypto` → `USDT | BTC | ETH`.
- [ ] `inversion` → `USDT | BTC | ETH`.
- [ ] Cambiar el `Tipo` resetea la `Moneda` al primer valor válido para el nuevo tipo, pidiendo confirmación si había un valor distinto seteado.

### 2.3 Metas (en cuentas de ahorro, crypto e inversión)

- [ ] Sección colapsable `Metas` dentro del `CuentaDrawer`. Solo visible si la cuenta tiene `objetivo: "ahorro"` **o** `tipo` ∈ `{crypto, inversion}`.
- [ ] Lista de metas con `[+ Nueva meta]`.
- [ ] Modal `MetaEditor` con: `Nombre` (requerido), `Monto objetivo` (en la moneda de la cuenta, requerido, > 0), `Fecha meta` (date picker opcional), `Notas` (textarea opcional, 240 chars).
- [ ] Cada meta muestra mini-barra `saldo / montoObjetivo` con porcentaje. Si `saldo >= montoObjetivo`, chip verde `Cumplida` + fecha de cumplimiento; la barra se queda en 100% aunque después baje.
- [ ] Long-press o menú `⋯` para editar / eliminar meta (confirmar).

### 2.4 Convertir a disponible (solo `crypto` e `inversion`)

- [ ] Botón `Convertir a disponible` visible en el `CuentaDrawer` si la cuenta es `crypto` o `inversion`. **No** aparece en cuentas líquidas.
- [ ] Abre `ConversionModal`:
  - `Monto origen` (input numérico en la moneda de la cuenta, requerido, > 0, ≤ saldo actual).
  - `Cuenta destino` (select poblado solo con cuentas activas de tipo `efectivo | banco | prepago`).
  - `Tasa de conversión` (input numérico editable, valor sugerido por el mock de tasas según el par origen→USD del día, ver §2.5).
  - `Fecha` (date picker, default hoy).
  - Resumen en vivo: `Vas a mover {monto} {monedaOrigen} a {cuentaDestino}, recibiendo aproximadamente Bs X / USD Y` (recalculado al cambiar tasa).
- [ ] Al confirmar se crean **dos `MovimientoCuenta` atómicos**:
  - Uno en la cuenta origen: `tipo: "conversion-salida"`, `monto: -{montoOrigen}`, `conversionId` compartido.
  - Uno en la cuenta destino: `tipo: "conversion-entrada"`, `monto: +{montoUSD}` (en USD; se convierte a la moneda destino al persistir), `conversionId` compartido.
- [ ] Si el monto supera el saldo origen, `Guardar` deshabilitado con mensaje `No podés convertir más de {saldo} {moneda}`.

### 2.5 Tasas de conversión

- [ ] `src/mocks/tasas.ts` expone:
  - `lookupBcv(fecha: ISODate): Money | null` — ya existe por `cargar.md`, se reusa.
  - `lookupCripto(moneda: "USDT" | "BTC" | "ETH", fecha: ISODate): { precioUsd: number } | null` — mapa estático sembrado para los últimos 30 días.
  - `getTasaCriptoHoy(moneda): number` — fallback a la última disponible si la fecha exacta no está.
- [ ] El par `USDT/USD = 1` siempre (USDT es stablecoin). Sembrar valores plausibles para BTC y ETH con volatilidad diaria.
- [ ] La conversión a Bs se hace: `monto * precioUsd * tasaBcv(fecha)`.

### 2.6 Detalle de cuenta

- [ ] `CuentaDrawer` (sheet) con:
  - **Header:** nombre + chip de tipo + chip de moneda + saldo grande en la moneda origen.
  - **Conversión:** `Bs X · USD Y` (sticky al header).
  - **Sección Metas** (si aplica, ver §2.3).
  - **Sección Conversiones:** últimos 5 `MovimientoCuenta` con `tipo: "conversion-salida" | "conversion-entrada"`, mostrando cuenta contraparte, fecha, monto y tasa usada. Tap en uno abre el detalle de la cuenta contraparte.
  - **Sección Historial completo:** lista cronológica de todos los movimientos de la cuenta, con paginación básica (cargar más).
  - **Sticky bottom:** botones `Convertir a disponible` (si aplica) y `Editar` (abre `CuentaEditor`).
- [ ] El drawer se cierra con tap fuera o gesto de swipe-down.

### 2.7 Advertencia de uso de ahorro (en `/cargar`)

- [ ] Documentado aquí para referencia, implementado en `/cargar`. Ver nota de impacto al final.
- [ ] Resumen: si en `/cargar` se elige como método de pago una cuenta con `objetivo: "ahorro"`, se muestra `UsoAhorroWarning` antes de confirmar el guardado: `Estás usando una cuenta de ahorro. Esto reduce tu meta {nombre}. ¿Continuar?`. El usuario puede cancelar o continuar.

## 3. UI/UX (mobile-first)

### 3.1 Wireframe textual

```
/cuentas (mobile, 375px)
┌──────────────────────────────┐
│  Cuentas                     │
│  Total       Bs 12.450       │
│  Disponible  Bs 1.820        │  <- atenuado si < 20% del total
├──────────────────────────────┤
│  [ Todas | Disponibles | Ahorro ]
├──────────────────────────────┤
│  ┌────────────────────────┐  │
│  │ 💵 Efectivo     [Bs]   │  │
│  │ Cubrir presupuesto     │  │
│  │ Bs 200,00              │  │
│  │ USD 5,48               │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ 🏦 Banco A      [USD]  │  │
│  │ Cubrir presupuesto     │  │
│  │ USD 50,00              │  │
│  │ Bs 1.825,00            │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ 💳 Zinli        [USD]  │  │
│  │ Prepago · Cubrir pres. │  │
│  │ USD 30,00 · Bs 1.095,00│  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ 🐷 Cochinito     [Bs]  │  │
│  │ Ahorro                 │  │
│  │ Bs 0,00                │  │
│  │ ░░░░░░░░░ Emergencia   │  │
│  │ 0 / Bs 5.000           │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ 🟠 Binance       [USDT]│  │
│  │ Ahorro · Crypto        │  │
│  │ USDT 100,00            │  │
│  │ USD 100,00 · Bs 3.650  │  │
│  │ ▓▓░░░░░ Viaje          │  │
│  │ USDT 100 / USDT 500    │  │
│  └────────────────────────┘  │
│                              │
│  [    + Nueva cuenta     ]   │  <- FAB sticky
└──────────────────────────────┘

ConversionModal
┌──────────────────────────────┐
│  ← Convertir USDT → Banco A  │
├──────────────────────────────┤
│  Monto origen                │
│  [ 50,00          ] USDT     │
│                              │
│  Cuenta destino              │
│  [ 🏦 Banco A     USD  ▾ ]   │
│                              │
│  Tasa (USDT → USD)           │
│  [ 1,00              ]       │  <- editable
│                              │
│  Recibirás aprox.            │
│  USD 50,00 · Bs 1.825,00     │
│                              │
│  Fecha                       │
│  [ 17/07/2026      📅 ]      │
│                              │
│  [    Confirmar          ]   │
└──────────────────────────────┘
```

### 3.2 Componentes a crear

- `src/app/cuentas/page.tsx` — entrypoint.
- `src/components/cuentas/CuentasHeader.tsx` — KPIs Total y Disponible.
- `src/components/cuentas/CuentasTabs.tsx` — segmented Todas / Disponibles / Ahorro.
- `src/components/cuentas/CuentaCard.tsx` — tarjeta de cuenta.
- `src/components/cuentas/CuentaEditor.tsx` — modal de crear/editar.
- `src/components/cuentas/CuentaDrawer.tsx` — sheet de detalle.
- `src/components/cuentas/MetaEditor.tsx` — modal de meta.
- `src/components/cuentas/ConversionModal.tsx` — wizard de conversión.
- `src/components/cuentas/TasaConversionField.tsx` — input de tasa con valor sugerido.
- `src/components/cuentas/MovimientoCuentaList.tsx` — historial dentro del drawer.
- `src/components/cuentas/CuentasEmptyState.tsx` — sin cuentas.
- `src/hooks/useCuentas.ts` — CRUD + persistencia en `localStorage`.
- `src/hooks/useSaldoCuenta.ts` — saldo en vivo (considera movimientos).
- `src/hooks/useResumenCuentas.ts` — `getResumen(cuentas, movimientos) -> { totalBs, totalUsd, disponibleBs, disponibleUsd }`.
- `src/hooks/useConversion.ts` — orquesta los dos `MovimientoCuenta` atómicos.
- `src/lib/conversion.ts` — helpers puros: `convertirAUSD(monto, moneda, fecha)`, `convertirABs(usd, tasaBcv)`.
- `src/lib/saldo.ts` — `calcularSaldoCuenta(cuentaId, movimientos): number` en la moneda de la cuenta.

### 3.3 Estados a modelar

- `loading` — primera hidratación.
- `vacio` — sin cuentas.
- `lista` — caso feliz.
- `editando-cuenta` — modal abierto.
- `editando-meta` — modal abierto.
- `convirtiendo` — modal de conversión abierto, calculando preview.
- `migrando-schema` — versión vieja detectada.

### 3.4 Accesibilidad

- KPIs como `<dl>` semántico.
- Tabs con `role="tablist"` y `aria-selected`.
- FAB con `aria-label="Nueva cuenta"`.
- Drawer con `role="dialog"`, `aria-modal="true"`, foco trap.
- Color picker como `role="radiogroup"`.
- Mini-barra de meta con `role="progressbar"`, `aria-valuenow`, `aria-valuemax`.

## 4. Modelo de datos (TypeScript)

> **Excepción documentada a la regla "ningún `number` para montos":** el `saldo` y el `monto` de `MovimientoCuenta` van en `number` plano **dentro de la moneda de la cuenta** (porque pueden ser BTC, ETH o USDT, y `Money` solo modela Bs/USD). La conversión a Bs/USD **sí** devuelve `Money`. Esto está centralizado acá para que el resto de las specs lo respete.

```ts
// src/types/cuenta.ts
import type { Money } from "@/lib/money";
import type { ISODate } from "@/lib/dates";

export type CuentaId = string & { readonly __brand: "CuentaId" };
export type MetaCuentaId = string & { readonly __brand: "MetaCuentaId" };
export type MovimientoCuentaId = string & { readonly __brand: "MovimientoCuentaId" };

export type TipoCuenta = "efectivo" | "banco" | "prepago" | "crypto" | "inversion";
export type Moneda = "Bs" | "USD" | "USDT" | "BTC" | "ETH";
export type ObjetivoCuenta = "cubrir-presupuesto" | "ahorro";
export type TipoMovimientoCuenta = "conversion-salida" | "conversion-entrada" | "ajuste";

export interface Cuenta {
  id: CuentaId;
  nombre: string;
  tipo: TipoCuenta;
  moneda: Moneda;
  saldo: number;              // en la `moneda` de la cuenta
  objetivo: ObjetivoCuenta;
  color: string;              // hex
  activo: boolean;
  createdAt: string;
}

export interface MetaCuenta {
  id: MetaCuentaId;
  cuentaId: CuentaId;
  nombre: string;
  montoObjetivo: number;      // en la moneda de la cuenta
  fechaMeta?: ISODate;
  notas?: string;
  cumplidaAt?: string;        // ISO timestamp, hito no reversible
}

export interface MovimientoCuenta {
  id: MovimientoCuentaId;
  cuentaId: CuentaId;
  tipo: TipoMovimientoCuenta;
  monto: number;              // en la moneda de `cuentaId`; signo depende de `tipo`
  conversionId?: string;      // agrupa salida con entrada
  cuentaContraparteId?: CuentaId;
  tasaUsdPorMoneda?: number;  // precio de la moneda origen en USD al momento
  fecha: ISODate;
  descripcion?: string;
  esRedireccionExcedente?: boolean;  // true si vino desde /cargar por excedente
  transaccionOrigenId?: string;
  createdAt: string;
}

export interface ResumenCuentas {
  totalBs: Money;
  totalUsd: Money;
  disponibleBs: Money;
  disponibleUsd: Money;
  cantidad: number;
  porTipo: Record<TipoCuenta, number>;
}

export const esLiquida = (c: Cuenta): boolean =>
  c.tipo === "efectivo" || c.tipo === "banco" || c.tipo === "prepago";

export const MONEDAS_POR_TIPO: Record<TipoCuenta, Moneda[]> = {
  efectivo: ["Bs"],
  banco: ["Bs", "USD"],
  prepago: ["Bs", "USD"],
  crypto: ["USDT", "BTC", "ETH"],
  inversion: ["USDT", "BTC", "ETH"],
};
```

## 5. Mocks a generar

### 5.1 `src/mocks/cuentas.ts`

```ts
import type { Cuenta, MetaCuenta, MovimientoCuenta } from "@/types/cuenta";
import { toIso } from "@/lib/dates";

export const CUENTAS_SEED: Cuenta[] = [
  { id: "efectivo-bs" as CuentaId,  nombre: "Efectivo",             tipo: "efectivo", moneda: "Bs",   saldo: 200,    objetivo: "cubrir-presupuesto", color: "#10B981", activo: true, createdAt: new Date().toISOString() },
  { id: "banco-a" as CuentaId,      nombre: "Banco A",              tipo: "banco",    moneda: "USD",  saldo: 50,     objetivo: "cubrir-presupuesto", color: "#3B82F6", activo: true, createdAt: new Date().toISOString() },
  { id: "zinli" as CuentaId,        nombre: "Zinli",                tipo: "prepago",  moneda: "USD",  saldo: 30,     objetivo: "cubrir-presupuesto", color: "#8B5CF6", activo: true, createdAt: new Date().toISOString() },
  { id: "cochinito" as CuentaId,    nombre: "Cochinito de efectivo",tipo: "efectivo", moneda: "Bs",   saldo: 0,      objetivo: "ahorro",             color: "#F59E0B", activo: true, createdAt: new Date().toISOString() },
  { id: "binance" as CuentaId,      nombre: "Binance",              tipo: "crypto",   moneda: "USDT", saldo: 100,    objetivo: "ahorro",             color: "#F97316", activo: true, createdAt: new Date().toISOString() },
  { id: "metamask" as CuentaId,     nombre: "MetaMask",             tipo: "crypto",   moneda: "ETH",  saldo: 0.5,    objetivo: "ahorro",             color: "#6366F1", activo: true, createdAt: new Date().toISOString() },
];

export const METAS_SEED: MetaCuenta[] = [
  { id: "m-emergencia" as MetaCuentaId,  cuentaId: "cochinito" as CuentaId, nombre: "Emergencia", montoObjetivo: 5000 },
  { id: "m-viaje" as MetaCuentaId,       cuentaId: "binance" as CuentaId,   nombre: "Viaje",      montoObjetivo: 500, fechaMeta: toIso(new Date("2026-12-31")) },
];

export const MOVIMIENTOS_SEED: MovimientoCuenta[] = [
  // vacío por ahora; los registros se generan al hacer la primera conversión o redirección de excedente
];
```

### 5.2 `src/mocks/tasas.ts`

```ts
import type { ISODate } from "@/lib/dates";

interface TasaCripto {
  precioUsd: number;  // 1 unidad de la moneda = X USD
}

const TASAS_CRIPTO: Record<string, Record<ISODate, TasaCripto>> = {
  USDT: { "2026-07-17": { precioUsd: 1.00 } },
  BTC:  { "2026-07-17": { precioUsd: 67000.00 } },
  ETH:  { "2026-07-17": { precioUsd: 3500.00 } },
  // extender con más fechas
};

export const lookupCripto = (moneda: "USDT" | "BTC" | "ETH", fecha: ISODate): TasaCripto | null => {
  return TASAS_CRIPTO[moneda]?.[fecha] ?? null;
};

export const getTasaCriptoHoy = (moneda: "USDT" | "BTC" | "ETH"): number => {
  // devuelve el último valor disponible, sin filtrar por fecha
  const mapa = TASAS_CRIPTO[moneda];
  const ultimaFecha = Object.keys(mapa).sort().pop();
  return ultimaFecha ? mapa[ultimaFecha as ISODate].precioUsd : 0;
};
```

### 5.3 `src/lib/conversion.ts`

```ts
import type { Moneda } from "@/types/cuenta";
import type { ISODate } from "@/lib/dates";
import { lookupBcv } from "@/mocks/bcv";
import { lookupCripto, getTasaCriptoHoy } from "@/mocks/tasas";
import { bs, usd, type Money } from "@/lib/money";

export const convertirAUSD = (monto: number, moneda: Moneda, fecha: ISODate): Money => {
  if (moneda === "USD" || moneda === "USDT") return usd(monto);
  if (moneda === "Bs") {
    const tasa = lookupBcv(fecha) ?? 0;
    return usd(monto / tasa);
  }
  // BTC o ETH
  const tasa = lookupCripto(moneda, fecha) ?? { precioUsd: getTasaCriptoHoy(moneda) };
  return usd(monto * tasa.precioUsd);
};

export const convertirABs = (usdValue: Money, fecha: ISODate): Money => {
  const tasa = lookupBcv(fecha) ?? 0;
  return bs(usdValue * tasa);
};
```

### 5.4 `src/lib/saldo.ts`

```ts
import type { Cuenta, MovimientoCuenta } from "@/types/cuenta";

export const calcularSaldoCuenta = (cuentaId: string, movimientos: MovimientoCuenta[]): number => {
  return movimientos
    .filter((m) => m.cuentaId === cuentaId)
    .reduce((acc, m) => acc + (m.tipo === "conversion-salida" ? -m.monto : m.monto), 0);
};
```

### 5.5 `src/hooks/useResumenCuentas.ts`

```ts
import type { Cuenta, MovimientoCuenta, ResumenCuentas } from "@/types/cuenta";
import { esLiquida } from "@/types/cuenta";
import { convertirAUSD, convertirABs } from "@/lib/conversion";
import { toIso } from "@/lib/dates";
import { sum, bs, usd, type Money } from "@/lib/money";

export const getResumen = (cuentas: Cuenta[], movimientos: MovimientoCuenta[]): ResumenCuentas => {
  const hoy = toIso(new Date());
  const activas = cuentas.filter((c) => c.activo);
  let totalBs: Money = bs(0);
  let totalUsd: Money = usd(0);
  let disponibleBs: Money = bs(0);
  let disponibleUsd: Money = usd(0);
  const porTipo: Record<TipoCuenta, number> = { efectivo: 0, banco: 0, prepago: 0, crypto: 0, inversion: 0 };

  for (const c of activas) {
    const saldoActual = c.saldo + movimientos.filter((m) => m.cuentaId === c.id).reduce((acc, m) => acc + (m.tipo === "conversion-salida" ? -m.monto : m.monto), 0);
    const usdEq = convertirAUSD(saldoActual, c.moneda, hoy);
    const bsEq = convertirABs(usdEq, hoy);
    totalBs = sum(totalBs, bsEq);
    totalUsd = sum(totalUsd, usdEq);
    if (esLiquida(c)) {
      disponibleBs = sum(disponibleBs, bsEq);
      disponibleUsd = sum(disponibleUsd, usdEq);
    }
    porTipo[c.tipo] += 1;
  }

  return { totalBs, totalUsd, disponibleBs, disponibleUsd, cantidad: activas.length, porTipo };
};
```

## 6. Reglas de negocio

1. **Total ≠ Disponible.** El `Total` siempre incluye todas las cuentas; el `Disponible` solo las líquidas. La diferencia entre ambos es lo que está "comprometido" en ahorro, crypto o inversión.
2. **Saldo de la cuenta en `number` plano en su moneda.** Solo se convierte a `Money` al mostrar en Bs/USD.
3. **Conversión atómica.** Una conversión crea dos `MovimientoCuenta` con el mismo `conversionId`. Si falla la creación del segundo, se hace rollback del primero (en mocks esto es trivial; se documenta para cuando haya backend).
4. **Crypto e inversión NO suman al disponible.** Solo aparecen en el `Total`. La única forma de mover saldo al disponible es vía `ConversionModal`.
5. **Metas: solo en cuentas de ahorro, crypto e inversión.** Las cuentas `cubrir-presupuesto` no tienen metas (su "meta" es el presupuesto general, que vive en `/presupuestos`).
6. **Advertencia al usar ahorro en `/cargar`.** Documentada en `cargar.md` (nota de impacto).
7. **Soft-delete de cuenta.** `activo = false` en vez de borrar. Las cuentas inactivas no aparecen en selects de `/cargar`, ni en tabs de `/cuentas`, pero siguen contando para snapshots.
8. **Strict monetary typing**: `Money` para Bs/USD. Excepción documentada para saldos en BTC/ETH/USDT.
9. **Persistencia local**: `lucash:cuentas`, `lucash:metas-cuenta`, `lucash:movimientos-cuenta`. Migración silenciosa con `__schemaVersion`.

## 7. Casos borde

- [ ] **Sin cuentas** → empty state con CTA `[+ Crear primera cuenta]`.
- [ ] **Saldo negativo** → badge rojo en la card. La conversión hacia/desde la cuenta se permite igual (la app no bloquea saldos negativos, pero avisa).
- [ ] **Conversión que excede el saldo origen** → Guardar deshabilitado con mensaje.
- [ ] **Tasa cripto no disponible para la fecha** → fallback a la última disponible con aviso `Usando tasa del {últimaFecha}, no se encontró tasa para {fecha}`. Mismo patrón que BCV en `/cargar`.
- [ ] **Meta con `montoObjetivo <= 0`** → Guardar deshabilitado.
- [ ] **Cumplir meta y luego el saldo baja** → la meta sigue marcada `cumplida` (histo, no reversible).
- [ ] **Cambiar el `Tipo` de una cuenta existente** → resetea `Moneda` con confirmación.
- [ ] **Cambiar la `Moneda` de una cuenta existente** → no se permite directamente (hay que crear una cuenta nueva) para evitar conversiones accidentales del saldo histórico.
- [ ] **Eliminar cuenta con movimientos** → soft-delete, historial preservado, movimientos siguen visibles.
- [ ] **Cambio de TZ** → `ISODate` no se afecta.
- [ ] **Migración de schema** → banner discreto `Actualizamos el formato de tus datos`.

## 8. Dependencias e impacto en otras specs

- **Es pre-requisito de:**
  - `/.specs/cargar.md` — el método de pago pasa a ser `cuentaId: CuentaId`. La redirección de excedente se materializa como `MovimientoCuenta` con `esRedireccionExcedente: true`.
  - `/.specs/historial.md` — el filtro de método se pobla desde `getCuentas()`. El campo `MetodoPago` de `Transaccion` se reemplaza.
  - `/.specs/presupuestos.md` — la cobertura recibe `disponibleCuentas: Money` como input adicional.
  - `/.specs/ahorros.md` — `/ahorros` se reduce a un filtro `objetivo === "ahorro"` sobre `cuentas`.
  - `/.specs/dashboard.md` — KPI `Disponible` del dashboard se calcula desde acá.
- **Impacto sobre otras specs:** ver notas de impacto separadas que se agregan al final de `cargar.md`, `historial.md` y `presupuestos.md`.
- **No modela acá:** shell de navegación, autenticación, backend real.

## 9. Fuera de alcance

- Backend real (NestJS), persistencia server-side, sync entre dispositivos.
- Consulta en tiempo real a exchanges (Binance API, etc.). Las tasas son mocks estáticos.
- Análisis de cartera, P&L, rendimiento de inversiones.
- Comprar/vender crypto dentro de la app (la conversión asume que el usuario ya hizo la operación afuera y la registra como movimiento).
- Transferencias entre cuentas sin conversión (ej. pasar USD de Banco A a Zinli). Se modela como dos `MovimientoCuenta` tipo `ajuste` en una iteración posterior.
- Multi-usuario / autenticación.
- Importación de extractos bancarios.
- Notificaciones push cuando una meta está por cumplirse.
