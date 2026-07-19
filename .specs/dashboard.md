# Spec — `/dashboard` (Resumen general)

> Frontend-only. Next.js App Router + TypeScript + Tailwind v4 + React Compiler. Sin backend real. Toda la persistencia es mock en `localStorage`.
>
> Pantalla de inicio. Compone información de las otras pantallas (cuentas, presupuesto, historial) en una vista única mobile-first con scroll vertical. Es **derivada**: no introduce tipos nuevos, solo lee de los stores existentes.

## 1. Historia de usuario

> Como usuario de Lucash, al abrir la app quiero que me salude por mi nombre (configurable en /perfil) y ver de un vistazo cómo estoy este mes: cuánto tengo disponible en mis cuentas, cuánto del presupuesto ya cubrí con mis ingresos reales, en qué sub-presupuesto se me está yendo más plata, los últimos movimientos, y un test rápido "¿puedo cubrir un imprevisto de Bs X?" que me dice si el disponible me alcanza o tengo que tocar ahorro o inversión, y si no me alcanza, me sugiere qué cuentas tocar.

## 2. Criterios de aceptación

### 2.1 KPIs top (sticky)

- [ ] Tres KPIs en una fila horizontal (scroll horizontal en mobile si no entran):
  1. **Disponible** — `Bs X (USD Y)` de `getResumenCuentas().disponibleBs`. Color verde si > 0, rojo si ≤ 0. Clickable → `/cuentas`.
  2. **Presupuesto del mes** — `cubierto al Z%` calculado como `min(100, (ingresoRealBs / ingresoEsperadoBs) * 100)`. Color dinámico: rojo si < 50%, amarillo si 50-80%, verde si > 80%. Clickable → `/presupuestos`.
  3. **Gastado este mes** — `Bs X` de la suma de `montoBs` de egresos del mes en curso. Clickable → `/historial` con filtro `tipo=egreso`.
- [ ] Si no hay presupuesto configurado, el KPI central muestra `Sin presupuesto` con CTA `Configurar →`.

### 2.2 Gráfico de gastos por sub-presupuesto

- [ ] Dona (mismo componente visual que la dona exterior de `/presupuestos`) con un segmento por sub-presupuesto, proporcional a su `gastadoBs` del mes en curso.
- [ ] Si no hay gastos → empty state inline `Este mes todavía no registraste gastos.`.
- [ ] Clickable en un segmento → `/historial` con filtro por ese sub-presupuesto.

### 2.3 Lista de últimos movimientos

- [ ] Título `Últimos movimientos` + link `Ver todos →` que va a `/historial`.
- [ ] Lista de las últimas 5 `Transaccion` (sin filtro de periodo: las 5 más recientes de cualquier fecha).
- [ ] Cada item: misma `TransaccionRow` que `/historial` (reutilizable).
- [ ] Tap en una fila → drawer de detalle (el mismo de `/historial`).

### 2.4 Test de imprevisto

- [ ] Card al final del scroll con título `¿Podés cubrir un imprevisto?`.
- [ ] Input numérico con sufijo `Bs` y placeholder `Ej: 500`.
- [ ] Al escribir o perder foco, se calcula en vivo:
  - Si `monto <= disponibleBs` → mensaje verde `Sí, te alcanza. Te quedarían Bs X.`
  - Si `monto > disponibleBs` pero `monto <= totalBs` → mensaje amarillo `No te alcanza con lo líquido. Tendrías que tocar ahorro o inversión. Te faltarían Bs X.` + lista de cuentas no líquidas sugeridas: `Tus cuentas de ahorro e inversión disponibles: {nombre} ({saldo} {moneda}), ...`. Se lee de `getCuentasAhorro()` y `getCuentasInversion()`.
  - Si `monto > totalBs` → mensaje rojo `Ni aun tocando todos tus ahorros alcanza. Te faltarían Bs X.` + misma lista de cuentas.
- [ ] El cálculo es derivado puro: `getResumenCuentas()` + el input del usuario. No se persiste.

### 2.5 CTA inferior

- [ ] FAB sticky `[+ Cargar transacción]` que navega a `/cargar`. Visible en toda la pantalla (mobile-first).

## 3. UI/UX (mobile-first)

### 3.1 Wireframe textual

```
/dashboard (mobile, 375px)
┌──────────────────────────────┐
│  Hola, Lucas 👋              │
│  Resumen del mes             │
├──────────────────────────────┤
│  ┌──────────┐ ┌──────────┐  │
│  │Disponible│ │Presup.   │  │  <- KPIs scroll horiz
│  │Bs 1.820  │ │Cubierto  │  │
│  │USD 49,86 │ │al 62%    │  │
│  └──────────┘ └──────────┘  │
│  ┌──────────┐                │
│  │Gastado   │                │
│  │Bs 1.180  │                │
│  └──────────┘                │
├──────────────────────────────┤
│  Gastos por sub-presupuesto  │
│                              │
│         ╭─────────╮          │
│       ╱   🟢🔵🟡   ╲         │  <- dona
│      │    Bs 1.180  │        │
│       ╲           ╱          │
│         ╰───────╯            │
│                              │
│  🟢 Comida    Bs 320  27%   │
│  🔴 Servicios Bs 280  24%   │
│  🔵 Salidas   Bs 500  42%   │
│  ⚪ Otros     Bs  80   7%   │
├──────────────────────────────┤
│  Últimos movimientos  →     │
│  ┌────────────────────────┐  │
│  │ 🟢 Comida   −Bs 320   │  │
│  │ 17 jul · Mercado Libre │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ ⚪ Gral.    +Bs 1500   │  │
│  │ 16 jul · Pago cliente  │  │
│  └────────────────────────┘  │
│  ...                        │
├──────────────────────────────┤
│  ¿Podés cubrir un imprevisto?│
│  [ 500,00        ] Bs        │
│  ✓ Sí, te alcanza.          │
│  Te quedarían Bs 1.320.     │
├──────────────────────────────┤
│                              │
│  [ + Cargar transacción  ]   │  <- FAB
└──────────────────────────────┘
```

### 3.2 Componentes a crear

- `src/app/dashboard/page.tsx` — entrypoint.
- `src/components/dashboard/DashboardHeader.tsx` — saludo + título. El saludo lee `getPerfil().nombre`. Si está vacío, muestra `Hola, Lucash` con CTA `Configurá tu perfil →` que navega a `/perfil`.
- `src/components/dashboard/KpiStrip.tsx` — los 3 KPIs en fila scrollable.
- `src/components/dashboard/KpiCard.tsx` — KPI individual.
- `src/components/dashboard/GastosPorSub.tsx` — dona + lista.
- `src/components/dashboard/UltimosMovimientos.tsx` — top 5.
- `src/components/dashboard/TestImprevisto.tsx` — card con input y cálculo.
- `src/hooks/useDashboardData.ts` — composición: lee cuentas, presupuesto, transacciones, calcula KPIs.

### 3.3 Estados a modelar

- `loading` — primera hidratación.
- `vacio` — sin cuentas, sin presupuesto y sin transacciones (caso primera vez). CTA grande `Configurá tus cuentas →`.
- `parcial` — alguna de las 3 fuentes está vacía. KPIs faltantes muestran placeholders con CTA.
- `cargado` — caso feliz.

### 3.4 Accesibilidad

- KPIs como `<dl>` con `<dt>` (label) y `<dd>` (valor).
- Dona con `<svg role="img" aria-label="Distribución de gastos del mes">`.
- Input de imprevisto con `<label>` asociado, mensajes con `aria-live="polite"`.
- FAB con `aria-label="Cargar transacción"`.

## 4. Modelo de datos

> Esta spec **no introduce tipos nuevos**. Reutiliza los stores de las otras pantallas.

```ts
// src/hooks/useDashboardData.ts
import type { Cuenta, MovimientoCuenta } from "@/types/cuenta";
import type { Transaccion } from "@/types/transaccion";
import type { Presupuesto } from "@/types/presupuesto";
import { getResumenCuentas } from "@/hooks/useResumenCuentas";
import { calcularCobertura } from "@/lib/cobertura";
import { toIso } from "@/lib/dates";

export interface DashboardData {
  disponible: { bs: Money; usd: Money };
  presupuestoCubiertoPct: number;   // 0-100, puede pasar 100
  gastadoMesBs: Money;
  gastosPorSub: { subpresupuestoId: SubpresupuestoId | "otros"; nombre: string; color: string; gastadoBs: Money; porcentaje: number }[];
  ultimasTransacciones: Transaccion[];   // top 5
}

export const getDashboardData = (
  cuentas: Cuenta[],
  movimientosCuenta: MovimientoCuenta[],
  presupuesto: Presupuesto | null,
  transacciones: Transaccion[]
): DashboardData => {
  const hoy = toIso(new Date());
  const inicioMes = hoy.slice(0, 8) + "01";

  const resumenCuentas = getResumenCuentas(cuentas, movimientosCuenta);
  const txsDelMes = transacciones.filter((t) => t.fecha >= inicioMes && t.fecha <= hoy);
  const ingresosMes = txsDelMes.filter((t) => t.tipo === "ingreso").reduce((a, t) => sum(a, t.montoBs), bs(0));
  const gastosMes = txsDelMes.filter((t) => t.tipo === "egreso").reduce((a, t) => sum(a, t.montoBs), bs(0));

  const cobertura = presupuesto
    ? calcularCobertura(presupuesto, txsDelMes, resumenCuentas.disponibleBs)
    : null;

  const totalGastos = Number(gastosMes) || 1;   // evitar /0
  const gastosPorSub = Object.entries(
    txsDelMes.filter((t) => t.tipo === "egreso").reduce<Record<string, number>>((acc, t) => {
      const key = t.subPresupuestoId ?? "otros";
      acc[key] = (acc[key] ?? 0) + Number(t.montoBs);
      return acc;
    }, {})
  ).map(([id, gastadoBs]) => ({ subpresupuestoId: id, gastadoBs: bs(gastadoBs), porcentaje: (gastadoBs / totalGastos) * 100 }));

  const ultimasTransacciones = [...transacciones]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return {
    disponible: { bs: resumenCuentas.disponibleBs, usd: resumenCuentas.disponibleUsd },
    presupuestoCubiertoPct: presupuesto ? Math.min(100, (Number(ingresosMes) / Number(presupuesto.ingresoEsperadoBs)) * 100) : 0,
    gastadoMesBs: gastosMes,
    gastosPorSub,
    ultimasTransacciones,
  };
};
```

## 5. Mocks

> No se generan mocks nuevos. La pantalla consume los seeds de:
> - `/.specs/cuentas.md` §5.1 → 6 cuentas seed, 2 metas, varios `MovimientoCuenta`.
> - `/.specs/presupuestos.md` §5.1 → presupuesto mensual seed con 4 sub-presupuestos.
> - `/.specs/cargar.md` §5.5 (extendido por `historial.md` §5.3) → ~12 transacciones del mes.

## 6. Reglas de negocio

1. **Pantalla derivada.** No escribe en `localStorage`. Es read-only sobre los stores existentes.
2. **KPIs se calculan en vivo** cada vez que cambia cualquier input (cuentas, presupuesto, transacciones). Usa `useMemo` o similar para evitar recálculos innecesarios.
3. **Test de imprevisto es puro.** No se persiste. Se recalcula en cada keystroke (con debounce opcional de 200ms para no jankear).
4. **Navegación cruzada.** Cada KPI es un link a la pantalla que lo explica. Cada segmento de la dona es un link a `/historial` filtrado.
5. **Strict monetary typing**: reusa `Money` de `lib/money.ts`. Cero `number` desnudos para montos (excepto en los denominadores de porcentaje, que se convierten a `number` solo al dividir).
6. **Saludo personalizado.** El header lee `getPerfil().nombre`. Si está vacío o no hay perfil, muestra `Hola, Lucash` con CTA `Configurá tu perfil →` que navega a `/perfil`.
7. **Defaults amigables para primera vez.** Si el usuario abre la app sin haber configurado nada, no se muestra una pantalla de error: cada KPI tiene un placeholder con su CTA correspondiente.

## 7. Casos borde

- [ ] **Sin cuentas creadas** → KPI Disponible muestra `Sin cuentas` con CTA → `/cuentas`.
- [ ] **Sin presupuesto creado** → KPI central muestra `Sin presupuesto` con CTA → `/presupuestos`.
- [ ] **Sin transacciones en el mes** → dona vacía con empty state, KPI Gastado en `Bs 0,00`.
- [ ] **Últimas 5 transacciones son todas del mismo día** → se muestran las 5 sin agrupar (la agrupación por día es responsabilidad de `/historial`, no del dashboard).
- [ ] **Test de imprevisto con monto = 0** → mensaje neutro `Ingresá un monto para ver si te alcanza.`
- [ ] **Test de imprevisto con monto negativo** → se trata como 0.
- [ ] **Saldo de cuenta en negativo** → KPI Disponible puede ser ≤ 0, se muestra en rojo.
- [ ] **Perfil sin nombre** → saludo genérico `Hola, Lucash` con CTA `Configurá tu perfil →`.
- [ ] **Cambio de mes a mitad de sesión** → los KPIs se recalculan al volver a la pantalla (no se hace refresh automático, pero el hook debe recalcular cuando cambian los inputs).
- [ ] **Cuentas con monedas distintas al calcular disponible** → la conversión ya está normalizada a Bs en `getResumenCuentas()`. El dashboard la consume en Bs sin hacer nada extra.

## 8. Dependencias e impacto en otras specs

- **Lee de:**
  - `/.specs/cuentas.md` — `getResumenCuentas()` para Disponible y Test de imprevisto.
  - `/.specs/presupuestos.md` — `calcularCobertura()` para KPI central.
  - `/.specs/cargar.md` + `/.specs/historial.md` — `Transaccion[]` para Gastado del mes y Últimos movimientos.
  - `/.specs/perfil.md` — `getPerfil().nombre` para el saludo del header.
- **Impacto sobre otras specs:** ninguno. Esta spec es de solo lectura.
- **No modela acá:** shell de navegación, autenticación, backend real.

## 9. Fuera de alcance

- Widgets reordenables.
- Comparación con meses anteriores (eso podría ir en una iteración posterior de esta misma pantalla).
- Notificaciones push.
- Modo "invitado" sin persistencia.
- Backend real (NestJS), autenticación, sync entre dispositivos.
- Gráficos adicionales (evolución temporal, comparativa entre sub-presupuestos). Quedan para una v2 del dashboard.
