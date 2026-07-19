# Spec — `/historial` (Historial de Transacciones)

> Frontend-only. Next.js App Router + TypeScript + Tailwind v4 + React Compiler. Sin backend real. Toda la persistencia es mock en memoria / `localStorage`.

## 1. Historia de usuario

> Como usuario de Lucash, necesito ver un historial completo de mis ingresos y egresos para entender cómo se mueve mi dinero. Por defecto veo las operaciones del presupuesto en curso (hoy / esta semana / este mes, según la periodicidad del presupuesto activo), pero también quiero poder cambiar el periodo a un rango libre de fechas o ver todas las transacciones sin filtro. Cada fila debe mostrar a qué sub-presupuesto pertenece la operación (o "Presupuesto general" si no se asignó) mediante un chip con color, junto con el resto de datos clave. Debo poder combinar filtros por tipo, sub-presupuesto y método, y limpiar todos los filtros con un solo toque.

## 2. Criterios de aceptación

### 2.1 Vista por defecto

- [ ] Al entrar a `/historial`, el selector de periodo se inicializa en `Por presupuesto` y se aplica automáticamente.
- [ ] El modo `Por presupuesto` calcula el rango a partir del presupuesto activo del momento:
  - Periodicidad `diaria` → `[hoy, hoy]`.
  - Periodicidad `semanal` → `[lunes de esta semana, domingo]`.
  - Periodicidad `quincenal` → los 15 días que contienen hoy, con el punto de corte que indique el presupuesto (día 1 y día 16 por defecto).
  - Periodicidad `mensual` → `[primer día del mes actual, último día]`.
  - Periodicidad `trimestral` → `[primer día del trimestre actual, último día]`.
- [ ] El rango activo se muestra visible como subtexto del header: ej. `1 – 31 jul 2026`.
- [ ] El total de resultados se muestra junto al título: `Historial (24)`.

### 2.2 Selector de periodo (3 segmentos minimalistas)

- [ ] Tres botones segmento: `Por presupuesto` · `Rango libre` · `Todas`. Estado activo con contraste fuerte.
- [ ] `Por presupuesto` — comportamiento descrito en §2.1.
- [ ] `Rango libre` — debajo del selector aparecen dos date pickers: `Desde` y `Hasta`. Validación: `desde ≤ hasta`, `hasta ≤ hoy`. Botón `Aplicar` deshabilitado si la validación falla.
  - Si el usuario intenta elegir un `Hasta` posterior a hoy, se **clipea a hoy** y se muestra un toast informativo.
- [ ] `Todas` — sin filtro de fecha. Muestra todas las transacciones registradas, ordenadas por fecha desc.
- [ ] Cambiar de segmento preserva los demás filtros (tipo, sub-presupuesto, método).

### 2.3 Filtros adicionales

- [ ] Filtros disponibles, todos combinables entre sí y con el periodo:
  - **Tipo** — `Todos` / `Ingreso` / `Egreso`. Default: `Todos`.
  - **Sub-presupuesto** — dropdown con la lista del presupuesto principal + sub-presupuestos. Default: `Todos`. El "Presupuesto general" aparece como opción explícita para no excluir las tx con `subPresupuestoId = null`.
  - **Método** — dropdown con `Todos` + los métodos de `src/mocks/bancos.ts` + `Efectivo`. Default: `Todos`.
- [ ] Los filtros viven en un **bottom sheet** o **panel superior colapsable** (mobile-first: sheet).
- [ ] Cada filtro activo aparece como **chip removable** debajo del header. Tap en la `×` del chip lo limpia individualmente.
- [ ] Botón `Limpiar filtros` visible solo cuando hay al menos un filtro activo (distinto de los defaults). Resetea tipo, sub-presupuesto y método a sus defaults — **no** resetea el periodo.

### 2.4 Fila de transacción

- [ ] Cada fila muestra, en este orden:
  1. **Fecha** — formato corto `dd MMM` (ej. `17 jul`) en mobile, `dd MMM yyyy` en desktop.
  2. **Emisor/Receptor** + **Concepto** en una sola línea con truncado elíptico. Si falta el receptor, se muestra el concepto como línea principal.
  3. **Chip de sub-presupuesto** con color de fondo. Si `subPresupuestoId === null`, se muestra el chip neutro `Presupuesto general`.
  4. **Monto en Bs** y **Monto en USD** apilados o lado a lado según ancho. Color verde para ingreso, rojo para egreso.
  5. **Método** — icono + nombre corto (ej. `Efectivo`, `Banco A`).
- [ ] Tap en la fila abre un `TransaccionDrawer` con el detalle completo: adjunto si existe, descripción, tasa BCV aplicada, `createdAt`, y todos los campos del modelo.
- [ ] Las filas se agrupan visualmente por **día** con un separador `Jueves 17 jul` entre grupos.

### 2.5 Resumen superior

- [ ] Sticky top, debajo del header, un `HistorialResumen` con 3 cifras del **periodo filtrado** (no del total histórico):
  - **Ingresos** — suma de `montoBs` de los ingresos que matchean el filtro.
  - **Egresos** — suma de `montoBs` de los egresos que matchean el filtro.
  - **Balance** — `ingresos − egresos`, con color verde si positivo, rojo si negativo.
- [ ] Si el filtro de tipo es `Ingreso`, el resumen muestra solo Ingresos + Balance. Si es `Egreso`, solo Egresos + Balance.
- [ ] Las sumas se calculan con `Money` y se formatean con `formatBs` / `formatUsd`.

### 2.6 Vacío y orden

- [ ] Sin transacciones en el periodo → empty state con icono, texto "No hay movimientos en este periodo" y botón `+ Cargar transacción` (link a `/cargar`).
- [ ] Filtros activos que devuelven 0 resultados → empty state específico: "Ningún resultado con esos filtros" + botón `Limpiar filtros`.
- [ ] Sort por defecto: `fecha desc`, secundario `createdAt desc`. Sin opción de cambiar el orden en esta spec.

## 3. UI/UX (mobile-first)

### 3.1 Wireframe textual

```
/historial (mobile, 375px)
┌──────────────────────────────┐
│  Historial (24)              │  <- header
│  1 – 31 jul 2026             │  <- subtexto del rango
├──────────────────────────────┤
│ [ Por presupuesto | Rango | Todas ]
├──────────────────────────────┤
│  +1.250,00 Bs  −820,00 Bs    │  <- HistorialResumen
│  Balance  +430,00 Bs         │
├──────────────────────────────┤
│  [Tipo ▾] [Sub ▾] [Método ▾] │  <- barra de filtros / abrir sheet
├──────────────────────────────┤
│  Chips activos: [Egreso ✕] [Comida ✕]
├──────────────────────────────┤
│ ── Jueves 17 jul ─────────── │
│  🟢 Comida   −Bs 320,00      │
│  Mercado Libre · Supermerc.  │
│  USD 8,77 · Efectivo         │
│                              │
│  ⚪ Gral.    −Bs 500,00      │
│  Banco X · Tarjeta crédito   │
│  USD 13,70 · Banco A         │
│                              │
│ ── Miércoles 16 jul ──────── │
│  🟢 Comida   +Bs 1.250,00    │
│  Pago cliente · Freelance    │
│  USD 34,25 · Banco B         │
│  ...                         │
└──────────────────────────────┘
```

### 3.2 Componentes a crear

- `src/app/historial/page.tsx` — entrypoint de la ruta.
- `src/components/historial/HistorialHeader.tsx` — título, contador, subtexto del rango.
- `src/components/historial/PeriodoSelector.tsx` — segmented control de 3 opciones + date pickers para `Rango libre`.
- `src/components/historial/HistorialResumen.tsx` — ingresos/egresos/balance.
- `src/components/historial/HistorialFilters.tsx` — bottom sheet con tipo / sub-presupuesto / método.
- `src/components/historial/ActiveFilterChips.tsx` — chips removibles.
- `src/components/historial/TransaccionList.tsx` — agrupación por día + virtualización básica si la lista crece (no en V1).
- `src/components/historial/TransaccionRow.tsx` — fila individual.
- `src/components/historial/SubpresupuestoChip.tsx` — chip con color (reutilizable, vive en `src/components/shared/`).
- `src/components/historial/TransaccionDrawer.tsx` — sheet de detalle.
- `src/components/historial/HistorialEmptyState.tsx` — vacío genérico + con filtros.
- `src/hooks/useHistorial.ts` — combina transacciones + filtros activos, devuelve `Transaccion[]` filtrada y helpers (`getResumen(periodo, filtros)`).

### 3.3 Estados a modelar

- `loading` — primera hidratación de `getTransacciones()`.
- `empty-sin-datos` — no hay transacciones en el periodo.
- `empty-con-filtros` — hay transacciones pero los filtros activos no matchean.
- `cargado` — hay resultados.
- `cambiando-periodo` — al cambiar entre `Por presupuesto` / `Rango libre` / `Todas`, breve skeleton.

### 3.4 Accesibilidad

- Selector de periodo con `role="tablist"`, opciones como `role="tab"` con `aria-selected`.
- Fila de transacción con `role="button"`, `tabIndex={0}`, manejo de Enter/Space para abrir el drawer.
- Bottom sheet con `role="dialog"`, `aria-modal="true"`, foco trap.
- Resumen con `<dl>` semántico (término `Ingresos`, definición con el monto formateado).

## 4. Modelo de datos (TypeScript)

> Reutiliza y extiende los tipos definidos en `/.specs/cargar.md`. Ningún monto es `number` plano.

```ts
// src/types/presupuesto.ts
import type { Money } from "@/lib/money";
import type { ISODate } from "@/lib/dates";
import type { SubpresupuestoId } from "@/types/transaccion";

export type Periodicidad = "diaria" | "semanal" | "quincenal" | "mensual" | "trimestral";

export interface Subpresupuesto {
  id: SubpresupuestoId;
  nombre: string;
  color: string;        // hex, ej. "#10B981"
  limiteBs: Money;      // límite mensual del sub-presupuesto (informativo, no se valida acá)
}

export interface Presupuesto {
  id: string;
  nombre: string;        // "Presupuesto general" si es el principal
  periodicidad: Periodicidad;
  limiteBs: Money;       // límite del periodo
  fechaInicio: ISODate;  // inicio del periodo en curso
  fechaFin: ISODate;     // fin del periodo en curso
  quincenaCorteDia?: 1 | 16; // solo si periodicidad === "quincenal"
  subpresupuestos: Subpresupuesto[];
}
```

```ts
// src/types/historial.ts
import type { ISODate } from "@/lib/dates";
import type { TipoTransaccion, SubpresupuestoId, MetodoPago } from "@/types/transaccion";

export type Periodo =
  | { tipo: "presupuesto" }
  | { tipo: "rango"; desde: ISODate; hasta: ISODate }
  | { tipo: "todas" };

export interface FiltroHistorial {
  periodo: Periodo;
  tipo: "todos" | TipoTransaccion;
  subPresupuestoId: "todos" | "general" | SubpresupuestoId; // "general" = null en la tx
  metodo: "todos" | MetodoPago;
}

export interface ResumenHistorial {
  ingresosBs: Money;
  egresosBs: Money;
  balanceBs: Money;
  ingresosUsd: Money;
  egresosUsd: Money;
  balanceUsd: Money;
  cantidad: number;
}
```

> **Cambio sobre `cargar.md`:** la transacción ahora tiene `subPresupuestoId: SubpresupuestoId | null` (campo obligatorio, pero acepta `null` para "Presupuesto general"). Esto ya está reflejado en la spec de `cargar.md` §2.3.1 y §4.

## 5. Mocks a generar

### 5.1 `src/mocks/presupuestos.ts`

```ts
// 1 presupuesto activo por defecto (mensual) con sub-presupuestos seed.
// El agente que implemente esto debe sembrar el `limiteBs` del principal con un valor
// coherente con la realidad venezolana (ej. Bs 15.000).
import type { Presupuesto } from "@/types/presupuesto";
import { bs } from "@/lib/money";
import { toIso } from "@/lib/dates";

export const PRESUPUESTO_ACTIVO: Presupuesto = {
  id: "pres-general",
  nombre: "Presupuesto general",
  periodicidad: "mensual",
  limiteBs: bs(15000),
  fechaInicio: toIso(new Date("2026-07-01")),
  fechaFin: toIso(new Date("2026-07-31")),
  subpresupuestos: [
    { id: "comida" as SubpresupuestoId,     nombre: "Comida",     color: "#10B981", limiteBs: bs(4000) },
    { id: "salidas" as SubpresupuestoId,    nombre: "Salidas",    color: "#3B82F6", limiteBs: bs(2000) },
    { id: "transporte" as SubpresupuestoId, nombre: "Transporte", color: "#F59E0B", limiteBs: bs(1500) },
    { id: "hogar" as SubpresupuestoId,      nombre: "Hogar",      color: "#8B5CF6", limiteBs: bs(3000) },
  ],
};

export const getPresupuestoActivo = (): Presupuesto => PRESUPUESTO_ACTIVO;
```

### 5.2 `src/lib/periodo.ts`

```ts
// Helpers puros para calcular el rango de fechas del periodo "Por presupuesto".
import type { ISODate } from "@/lib/dates";
import type { Presupuesto, Periodicidad } from "@/types/presupuesto";

export const getRangoPorPresupuesto = (p: Presupuesto): { desde: ISODate; hasta: ISODate } => {
  // Implementación: usa p.fechaInicio/fechaFin si periodicidad es "mensual" o "trimestral";
  // calcula desde hoy para diaria/semanal/quincenal.
};

export const etiquetaRango = (p: Presupuesto): string => {
  // "1 – 31 jul 2026", "Esta semana", "Hoy", etc.
};
```

### 5.3 `src/mocks/transacciones.ts` (extender el de `cargar.md`)

- Agregar `subPresupuestoId` a los seeds existentes.
- Sembrar ~12 transacciones distribuidas en los últimos 30 días para que la pantalla tenga contenido al primer render (mezcla de ingresos y egresos, distintos sub-presupuestos y métodos, al menos 2 con `subPresupuestoId = null` para mostrar el chip "Presupuesto general").

### 5.4 `src/hooks/useHistorial.ts`

```ts
// Lee transacciones de localStorage, aplica el FiltroHistorial, devuelve:
//   - transaccionesFiltradas: Transaccion[] (ordenadas)
//   - resumen: ResumenHistorial
//   - setFiltro / setPeriodo / limpiarFiltros: mutadores
// Persiste el FiltroHistorial en localStorage con clave "lucash:filtros-historial"
// para mantenerlo entre recargas.
```

## 6. Reglas de negocio

1. **Periodo automático por presupuesto activo** (ver §2.1). El cálculo es responsabilidad de `getRangoPorPresupuesto` y se reevalúa al montar y al cambiar la fecha del sistema.
2. **Sub-presupuesto siempre visible** (ver §2.4). Si `subPresupuestoId === null`, se renderiza el chip neutro `Presupuesto general`. El filtro "Presupuesto general" del dropdown matchea contra `null` (no contra cualquier id).
3. **Filtros combinables y acumulativos**. El `Limpiar filtros` resetea tipo/sub/método a `todos` pero **no** toca el periodo.
4. **Sort** siempre `fecha desc` + `createdAt desc`. Sin reorden manual en esta spec.
5. **Resumen** siempre sobre el subconjunto filtrado, no sobre el total histórico.
6. **Strict monetary typing**: reusa `Money` de `cargar.md`. Cero `number` desnudos para montos.
7. **Persistencia local**: `localStorage` con claves:
   - `lucash:transacciones` (escrita por `cargar.md`, leída acá).
   - `lucash:filtros-historial` (escrita/leída acá).

## 7. Casos borde

- [ ] **Sin transacciones en el periodo** → empty state `empty-sin-datos` con CTA a `/cargar`.
- [ ] **Filtros que devuelven 0 resultados** → empty state `empty-con-filtros` con `Limpiar filtros`.
- [ ] **`Rango libre` con `desde > hasta`** → botón `Aplicar` deshabilitado, mensaje inline.
- [ ] **`Rango libre` con `hasta > hoy`** → se clipea a hoy y toast informativo `Se ajustó la fecha hasta hoy`.
- [ ] **Presupuesto activo no existe** (estado corrupto de localStorage) → fallback a `Todas` con banner amarillo "No hay presupuesto configurado. Vamos a [Presupuestos]`(/presupuestos)` para crearlo."
- [ ] **Cambio de periodicidad del presupuesto** → al volver a `/historial`, recalcular `Por presupuesto` con el nuevo rango.
- [ ] **Sub-presupuesto eliminado pero con transacciones históricas** → las tx se siguen mostrando con el chip del color guardado en la tx (denormalizar `color` y `nombre` en la fila) o, si no se denormalizó, mostrar el chip genérico gris `Sub-presupuesto eliminado` con tooltip.
- [ ] **Filtros persistidos apuntan a un sub-presupuesto que ya no existe** → al hidratar, se descartan los filtros inválidos y se vuelve a defaults, con toast informativo.
- [ ] **Lista muy larga** (>200 items) → se evalúa virtualización en una iteración posterior; en V1 render plano.
- [ ] **Cambio de TZ del dispositivo** → `ISODate` no se ve afectado (trabajamos con strings `YYYY-MM-DD`), pero se documenta en el archivo de helpers.

## 8. Dependencias e impacto en otras specs

- **Lee de:**
  - `/.specs/cargar.md` — consume `Transaccion` (incluido el campo `subPresupuestoId: SubpresupuestoId | null` agregado en §2.3.1 de esa spec), `Money`, `ISODate`, `MetodoPago`, `TipoTransaccion`.
  - `/.specs/presupuestos.md` — consume el modelo `Presupuesto` + `Subpresupuesto` + `Periodicidad`. Si esa spec cambia el shape del catálogo, hay que actualizar este spec.
- **Impacto sobre otras specs:**
  - **`cargar.md`**: ya fue actualizada (§2.3.1) para incluir el campo opcional `Sub-presupuesto` con chip de color y persistir `subPresupuestoId: SubpresupuestoId | null`.
  - **`dashboard.md`** (futura): va a consumir el mismo modelo `Transaccion` + el chip de sub-presupuesto. Mantener compatibilidad.
  - **`presupuestos.md`** (escrita): define el modelo canónico `Subpresupuesto` en `src/types/presupuesto.ts`, incluyendo `prioridad`, `recurrente`, `orden` y `activo` además de `limiteBs`/`color`/`nombre`. Al implementar, este spec debe dejar de redeclarar `Subpresupuesto` en su §4 y pasar a importarlo desde `@/types/presupuesto`. La UI de `/historial` no cambia. Si se cambia el id de un sub-presupuesto, las tx históricas quedan con id huérfano (ver caso borde §7).
- **No modela acá:** shell de navegación (bottom-tabs, header global), edición/eliminación de tx, exportación, búsqueda.

## 9. Fuera de alcance

- Edición o eliminación de transacciones (swipe-to-delete, long-press → menú). Si se necesita, va en una spec aparte.
- Exportar a CSV/PDF.
- Búsqueda full-text en `concepto` / `descripcion` / `emisorReceptor`.
- Gráficos de evolución (van en `/dashboard`).
- Comparación entre periodos ("¿gasté más que el mes pasado?").
- Categorización automática por IA (la spec de `/cargar` puede sugerir un sub-presupuesto, pero no se valida acá).
- Multi-usuario / autenticación.
- Backend real (NestJS) y sincronización server-side.

---

## 10. Notas de impacto (post-revisión de arquitectura)

> Estas notas son **posteriores** a la redacción original y reflejan la decisión de introducir la pantalla `/cuentas` como base de toda la arquitectura financiera. Al implementar `historial.md`, hay que tenerlas en cuenta. No modifican el cuerpo de las secciones 1–9; solo aclaran cómo se conectan con la nueva pantalla.

### 10.1 `metodo` se reemplaza por `cuentaId`

El campo `MetodoPago` de `Transaccion` (que era `{ tipo: "efectivo" } | { tipo: "banco"; bancoId: BancoId }`) **se elimina** y se reemplaza por:

```ts
cuentaId: CuentaId;  // referencia a /cuentas
```

Justificación: el método de pago ahora viene de las cuentas que el usuario crea en `/cuentas`, no de un array fijo de mocks. Esto incluye bancos, prepagos, efectivo y crypto.

Implicaciones en la UI:
- El filtro `Metodo` del `HistorialFilters` (§2.3) pasa a poblarse desde `getCuentasActivas()` en vez de `src/mocks/bancos.ts`. El dropdown ahora muestra: `Todos` + `[nombre de cada cuenta activa]`.
- La fila `TransaccionRow` (§2.4) muestra el icono + nombre de la cuenta (en lugar de "Efectivo" / "Banco A"). Si la cuenta fue soft-deleteada después de la tx, se muestra el chip genérico `Cuenta eliminada` con tooltip del nombre original.
- El tipo `MetodoPago` deja de existir; se importa `CuentaId` desde `src/types/cuenta.ts`.
- El archivo `src/mocks/bancos.ts` se elimina (su contenido es reemplazado por el seed de cuentas en `src/mocks/cuentas.ts`).

### 10.2 Sin cambios en el resto

El selector de periodo, el chip de sub-presupuesto, el agrupamiento por día, el resumen superior, la ordenación, los casos borde: todo queda igual. Solo cambia el filtro y la visualización del método de pago.
