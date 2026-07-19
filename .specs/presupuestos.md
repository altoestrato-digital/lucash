# Spec — `/presupuestos` (Presupuesto y Sub-presupuestos)

> Frontend-only. Next.js App Router + TypeScript + Tailwind v4 + React Compiler. Sin backend real. Toda la persistencia es mock en `localStorage`.

## 1. Historia de usuario

> Como usuario de Lucash, necesito configurar mi presupuesto general para entender qué puedo gastar y en qué, sin pasarme de lo que entra. Mi presupuesto se compone de lo que **espero ingresar** y lo que **espero gastar**, y mis gastos esperados se dividen en sub-presupuestos con prioridad (Comida, Servicios, Salidas, Ropa, etc.) más un cajón "Otros" para gastos no presupuestados. Cada sub-presupuesto tiene una prioridad (1 = alta, 2 = media, 3 = baja) y puedo marcarlo como recurrente para que se arrastre al periodo siguiente. En la pantalla de Resumen veo, de un vistazo, qué partes del presupuesto ya están cubiertas con mis ingresos reales y cuáles todavía no, mediante una gráfica de doble anillo y tarjetas individuales. Al cerrarse cada periodo, el sistema toma un snapshot automático del presupuesto cerrado y me ayuda a empezar el siguiente.

## 2. Criterios de aceptación

### 2.1 Estructura del presupuesto

- [ ] El presupuesto principal activo tiene los campos:
  - `ingresoEsperadoBs: Money` — lo que el usuario espera recibir en el periodo.
  - `otrosGastosBs: Money` — cajón "Otros" para gastos no categorizados.
  - `periodicidad: "diaria" | "semanal" | "quincenal" | "mensual" | "trimestral"`. Default: `mensual`.
  - `subpresupuestos: Subpresupuesto[]` — catálogo editable (ver §2.3).
  - `fechaInicio: ISODate`, `fechaFin: ISODate` — rango del periodo en curso, recalculado al cambiar la periodicidad.
  - `quincenaCorteDia?: 1 | 16` — solo si `periodicidad === "quincenal"`.
- [ ] En cualquier momento hay **un único** presupuesto principal activo. Los periodos cerrados viven en `PresupuestoSnapshot[]` y son inmutables.

### 2.2 Pantalla `Resumen` (default al entrar)

- [ ] Header con título `Presupuesto` y nombre del periodo, ej. `Julio 2026`.
- [ ] Subtexto con la regla de cobertura: `Con Bs 1.250 ya podés cubrir 2 de 4 sub-presupuestos`.
- [ ] **Gráfica de doble anillo (SVG):**
  - **Anillo interior = cobertura de ingresos.** Color azul `#3B82F6` para el tramo `min(ingresoReal, ingresoEsperado)`. Si `ingresoReal > ingresoEsperado` se cierra completo y aparece un **aro rojo** envolvente con etiqueta `Sobregiro +Bs X`.
  - **Anillo exterior = desglose de gastos por sub-presupuesto.** Un segmento por sub con su color, con tamaño proporcional a su `gastadoBs`. Al final, un segmento gris `Otros` con tamaño `otrosGastosBs`. Si sobran ingresos sin gastar, un segmento azul claro `Libre` cierra el anillo.
  - **Centro:** número grande con el `balanceBs` (verde si positivo, rojo si negativo) y debajo `Ingresos Bs X · Gastos Bs Y`.
  - **Tooltip al tap de un segmento** (mobile): nombre del sub + gastado/límite + estado de cobertura.
- [ ] **Banner de estado de cobertura** debajo de la dona. Mensaje dinámico:
  - Si hay sobregiro → rojo: `Estás gastando más de lo que entra. Te pasaste por Bs X.`
  - Si no alcanza para la prioridad 1 → amarillo: `Te faltan Bs X para cubrir los básicos (Comida, Servicios).`
  - Si alcanza para prioridad 1 pero no para 2 → neutro: `Prioridad 1 cubierta. Faltan Bs X para Salidas.`
  - Si todo está cubierto → verde: `Presupuesto cubierto. Sobran Bs X.`
- [ ] **Lista de tarjetas de sub-presupuestos** debajo de la dona. Cada `SubpresupuestoCard` muestra:
  - Chip con color y nombre.
  - Chip de prioridad (`P1` rojo, `P2` amarillo, `P3` verde).
  - Mini-barra de progreso `gastado / limite`.
  - Texto `Bs X / Bs Y (Z%)` formateado.
  - Estado a la derecha: `Cubierto` (verde), `Parcial` (amarillo), `No cubierto` (gris), `Excedido` (rojo, cuando `gastado > limite`).
- [ ] Al final de la lista, una tarjeta `Otros` con el mismo formato pero color gris.
- [ ] Botón sticky bottom `Ir a Editar` (mobile) que cambia a la pestaña `Editar`.

### 2.3 Pantalla `Editar` (segunda pestaña)

- [ ] Formulario con:
  - `Ingreso esperado` (input numérico con sufijo `Bs`).
  - `Otros gastos` (input numérico con sufijo `Bs`).
  - `Periodicidad` (select con las 5 opciones).
  - Si periodicidad = `quincenal`, aparece `Día de corte` (select `1` o `16`).
  - Sección colapsable `Sub-presupuestos` con la lista y un botón `[+ Nuevo sub]`.
- [ ] **Sub-presupuesto (modal de crear/editar):**
  - `Nombre` (input texto, requerido).
  - `Color` (color picker con paleta fija de 8 colores, default aleatorio).
  - `Límite` (input numérico con sufijo `Bs`, requerido).
  - `Prioridad` (segmented control `1` / `2` / `3` con label `Alta` / `Media` / `Baja`).
  - `Recurrente` (toggle, default `true`).
  - `Orden` (input numérico, default = siguiente del último).
  - Botones `Cancelar` y `Guardar`.
- [ ] **Acciones por sub en la lista:** tap en la fila abre el modal de edición. Botón `Eliminar` (con confirmación) a la derecha. Si el sub tiene transacciones históricas, el confirmar avisa: `Este sub tiene N transacciones. Se desactiva pero no se borra del historial.`
- [ ] Botón sticky bottom `Guardar cambios` (aplica al principal + sub-presupuestos). Disabled si no hay cambios. Toast de éxito al guardar.

### 2.4 Algoritmo de cobertura

- [ ] **Inputs:** el `Presupuesto` activo + todas las `Transaccion` con `fecha` dentro de `[fechaInicio, fechaFin]` del presupuesto.
- [ ] **Cálculos:**
  - `ingresoRealBs` = suma de `montoBs` de las tx tipo `ingreso` del periodo.
  - `gastoTotalBs` = suma de `montoBs` de las tx tipo `egreso` del periodo.
  - `balanceBs` = `ingresoRealBs − gastoTotalBs`.
  - Por cada sub, `gastadoBs` = suma de `montoBs` de las tx del periodo con `subPresupuestoId === sub.id`.
  - `otrosGastosBsReal` = suma de las tx del periodo con `subPresupuestoId === null`.
- [ ] **Estado de cobertura por sub (independiente del orden, solo informativo):**
  - `cubierto` si `gastadoBs <= limiteBs` **y** `ingresoRealBs >= limiteBs`.
  - `parcial` si solo una de las dos condiciones se cumple.
  - `no-cubierto` si ninguna se cumple.
  - `excedido` si `gastadoBs > limiteBs` (tiene precedencia sobre los otros).
- [ ] **Banner de cobertura** (§2.2) se calcula a partir del primer sub, en orden `(prioridad ASC, orden ASC)`, que aún no esté cubierto. No es restrictivo: el algoritmo NO "consume" ingresos al pasar de un sub al siguiente, es solo una guía.
- [ ] Todo el cálculo vive en `src/lib/cobertura.ts` como función pura `calcularCobertura(p, txs)`.

### 2.5 Snapshots al cerrar el periodo

- [ ] Al detectar que `hoy > fechaFin` del presupuesto principal (vía `usePeriodoCerrado()` montado en el layout o en el entry de la pantalla), se dispara un `SnapshotBanner`:
  - Título: `Se cerró {nombre periodo} {fechaInicio} – {fechaFin}`.
  - Resumen rápido: `Ingresos Bs X · Gastos Bs Y · Balance Bs Z`.
  - Botón `Ver detalle` (link a una futura ruta de snapshots, fuera de alcance en esta spec).
  - Botón principal `Empezar nuevo periodo` que:
    1. Crea un `PresupuestoSnapshot` inmutable con todo lo del periodo cerrado.
    2. Genera un nuevo `Presupuesto` principal con la misma periodicidad y los sub marcados `recurrente: true` (duplicando `nombre`, `color`, `prioridad`, `orden` y proponiendo el mismo `limiteBs`).
    3. Resetea `fechaInicio`/`fechaFin` al rango del nuevo periodo.
- [ ] Los `PresupuestoSnapshot` son read-only en la UI. Persistidos en `localStorage` con clave `lucash:presupuesto-snapshots`.
- [ ] El principal activo se persiste en `lucash:presupuesto-principal`.

### 2.6 Recurrencia de sub-presupuestos

- [ ] `recurrente: true` → el sub se duplica automáticamente al iniciar un nuevo periodo con el mismo `limiteBs` como propuesta (editable).
- [ ] `recurrente: false` → el sub **no** se arrastra; las tx históricas siguen mostrando el chip con su color/nombre denormalizados o un chip genérico `Sub-presupuesto eliminado` si el agente implementa denormalización parcial.
- [ ] Cambiar `recurrente` después de creado surte efecto a partir del **siguiente** cierre de periodo, no del actual.

### 2.7 Selector de pestañas

- [ ] Dos pestañas: `Resumen` (default) / `Editar`. Implementadas como segmented control en el header, mismo patrón que `PeriodoSelector` de `/historial`.
- [ ] Al volver a `/presupuestos`, la pestaña seleccionada se mantiene en memoria de sesión (no se persiste entre recargas).

## 3. UI/UX (mobile-first)

### 3.1 Wireframe textual

```
/presupuestos (mobile, 375px) - Resumen
┌──────────────────────────────┐
│  Presupuesto      [Resu|Edit]│
│  Julio 2026                  │
│  Con Bs 1.250 ya cubrís 2/4  │
├──────────────────────────────┤
│                              │
│         ╭─────────╮          │
│       ╱           ╲          │  <- dona doble
│      │   +430,00  │          │     interior = cobertura ingresos
│      │   Bs       │          │     exterior = desglose gastos
│       ╲   75%    ╱           │
│         ╰───────╯            │
│                              │
│  ⚠ Te faltan Bs 800 para    │  <- banner
│  cubrir Transporte (P2)     │
│                              │
│  Sub-presupuestos            │
│  ┌────────────────────────┐  │
│  │ 🟢 Comida      P1      │  │
│  │ ▓▓▓▓▓░░░░░ Bs 320/600 │  │
│  │ Cubierto          ✓   │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ 🔴 Servicios   P1      │  │
│  │ ▓▓▓▓▓▓▓▓▓▓ Bs 280/300 │  │
│  │ Cubierto          ✓   │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ 🔵 Salidas     P2      │  │
│  │ ░░░░░░░░░░ Bs  0/400  │  │
│  │ No cubierto       ·   │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ Otros                  │  │
│  │ ▓▓░░░░░░░░ Bs 100/500 │  │
│  │ Cubierto          ✓   │  │
│  └────────────────────────┘  │
│                              │
│  [    Ir a Editar       ]    │  <- sticky
└──────────────────────────────┘

/presupuestos - Editar
┌──────────────────────────────┐
│  Presupuesto      [Resu|Edit]│
├──────────────────────────────┤
│  Ingreso esperado            │
│  [ 2000,00        ] Bs       │
│                              │
│  Otros gastos                │
│  [ 500,00         ] Bs       │
│                              │
│  Periodicidad                │
│  [ Mensual           ▾ ]     │
│                              │
│  Sub-presupuestos      [+]   │
│  ┌────────────────────────┐  │
│  │ 🟢 Comida       ⋯      │  │  <- tap edita, ⋯ menú
│  │ P1 · Bs 600 · Recurr.  │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ 🔴 Servicios    ⋯      │  │
│  │ P1 · Bs 300 · Recurr.  │  │
│  └────────────────────────┘  │
│  ...                        │
│                              │
│  [    Guardar cambios   ]    │  <- sticky
└──────────────────────────────┘

SnapshotBanner (modal o top)
┌──────────────────────────────┐
│  ℹ Se cerró Junio 2026      │
│  Ingresos 1800 · Gastos 1950 │
│  Balance −150                │
│  [ Ver detalle ]  [ Empezar ]│
└──────────────────────────────┘
```

### 3.2 Componentes a crear

- `src/app/presupuestos/page.tsx` — entrypoint.
- `src/components/presupuestos/PresupuestosTabs.tsx` — segmented control Resumen / Editar.
- `src/components/presupuestos/PresupuestoResumen.tsx` — contenedor de la pestaña Resumen.
- `src/components/presupuestos/PresupuestoDona.tsx` — SVG de doble anillo.
- `src/components/presupuestos/CoberturaBanner.tsx` — banner dinámico de estado.
- `src/components/presupuestos/SubpresupuestoCard.tsx` — tarjeta con mini-barra.
- `src/components/presupuestos/PresupuestoEditor.tsx` — form de la pestaña Editar.
- `src/components/presupuestos/SubpresupuestoEditor.tsx` — modal de crear/editar un sub.
- `src/components/presupuestos/SubpresupuestoRow.tsx` — fila en la lista de Editar.
- `src/components/presupuestos/PeriodicidadSelect.tsx` — select con 5 opciones.
- `src/components/presupuestos/ColorPicker.tsx` — paleta fija de 8 colores.
- `src/components/presupuestos/PrioridadControl.tsx` — segmented 1/2/3.
- `src/components/presupuestos/SnapshotBanner.tsx` — modal/banner de periodo cerrado.
- `src/hooks/usePresupuesto.ts` — lectura/escritura de `lucash:presupuesto-principal` y `lucash:presupuesto-snapshots`.
- `src/hooks/useCobertura.ts` — wrapper de `calcularCobertura()` con memo.
- `src/hooks/usePeriodoCerrado.ts` — detecta `hoy > fechaFin` y dispara el snapshot.
- `src/lib/cobertura.ts` — función pura `calcularCobertura(p, txs)`.

### 3.3 Estados a modelar

- `loading` — primera hidratación.
- `sin-presupuesto` — primera vez: mostrar wizard.
- `resumen-vacio` — periodo en curso sin sub-presupuestos.
- `resumen-normal` — caso feliz.
- `editando` — usuario tocó algo sin guardar.
- `guardando` — submit en curso.
- `periodo-cerrado` — banner visible, esperando acción del usuario.
- `migrando-schema` — versión vieja detectada, banner discreto.

### 3.4 Accesibilidad

- Dona con `<svg role="img" aria-label="Cobertura del presupuesto">` y un `<title>` que describa el estado global para lectores de pantalla. Cada segmento accesible por separado con `aria-label="Comida, 320 de 600, cubierto"`.
- Tabs con `role="tablist"`, opciones como `role="tab"` con `aria-selected`.
- Color picker como `role="radiogroup"` con swatches como `role="radio"`.
- Banner de cobertura con `role="status"` (info) o `role="alert"` (sobregiro).

## 4. Modelo de datos (TypeScript)

> **Decisión de arquitectura:** el tipo `Subpresupuesto` se define **una sola vez** en `src/types/presupuesto.ts` y se reexporta desde `historial.md` (que antes lo redeclaraba). Esto evita drift entre specs.

```ts
// src/types/presupuesto.ts
import type { Money } from "@/lib/money";
import type { ISODate } from "@/lib/dates";
import type { SubpresupuestoId } from "@/types/transaccion";

export type Periodicidad = "diaria" | "semanal" | "quincenal" | "mensual" | "trimestral";
export type Prioridad = 1 | 2 | 3;
export type EstadoCobertura = "cubierto" | "parcial" | "no-cubierto" | "excedido";

export interface Subpresupuesto {
  id: SubpresupuestoId;
  nombre: string;
  color: string;          // hex, ej. "#10B981"
  limiteBs: Money;
  prioridad: Prioridad;   // 1 = alta, 2 = media, 3 = baja
  recurrente: boolean;
  orden: number;          // desempate dentro de la misma prioridad
  activo: boolean;        // soft-delete
}

export interface Presupuesto {
  id: string;
  nombre: "Presupuesto general";
  periodicidad: Periodicidad;
  ingresoEsperadoBs: Money;
  otrosGastosBs: Money;
  fechaInicio: ISODate;
  fechaFin: ISODate;
  quincenaCorteDia?: 1 | 16;
  subpresupuestos: Subpresupuesto[];
  createdAt: string;      // ISO timestamp
  cerradoAt?: string;
}

export interface PresupuestoSnapshot {
  id: string;
  presupuestoIdOrigen: string;
  periodicidad: Periodicidad;
  fechaInicio: ISODate;
  fechaFin: ISODate;
  ingresoEsperadoBs: Money;
  ingresoRealBs: Money;
  otrosGastosBs: Money;
  otrosGastosRealBs: Money;
  subpresupuestos: Subpresupuesto[];   // congelados al cierre
  transaccionesIds: string[];
  balanceBs: Money;
  createdAt: string;
}

export interface CoberturaSub {
  subpresupuestoId: SubpresupuestoId | "otros";
  nombre: string;
  color: string;
  limiteBs: Money;
  gastadoBs: Money;
  estado: EstadoCobertura;
  faltanBs: Money;
  prioridad?: Prioridad;  // omitido para "otros"
}

export interface ResumenCobertura {
  ingresoEsperadoBs: Money;
  ingresoRealBs: Money;
  gastoTotalBs: Money;
  balanceBs: Money;
  subCubiertos: number;
  totalSubs: number;
  porSub: CoberturaSub[];
  estadoGlobal: "sobregiro" | "falta-p1" | "falta-p2" | "falta-p3" | "todo-cubierto";
  mensaje: string;        // texto del banner ya formateado
}
```

## 5. Mocks a generar

### 5.1 `src/mocks/presupuestos.ts`

```ts
import type { Presupuesto } from "@/types/presupuesto";
import { bs } from "@/lib/money";
import { toIso } from "@/lib/dates";

export const PRESUPUESTO_SEED: Presupuesto = {
  id: "pres-principal",
  nombre: "Presupuesto general",
  periodicidad: "mensual",
  ingresoEsperadoBs: bs(2000),
  otrosGastosBs: bs(500),
  fechaInicio: toIso(new Date("2026-07-01")),
  fechaFin: toIso(new Date("2026-07-31")),
  subpresupuestos: [
    { id: "comida" as SubpresupuestoId,     nombre: "Comida",     color: "#10B981", limiteBs: bs(600),  prioridad: 1, recurrente: true,  orden: 1, activo: true },
    { id: "servicios" as SubpresupuestoId,  nombre: "Servicios",  color: "#EF4444", limiteBs: bs(300),  prioridad: 1, recurrente: true,  orden: 2, activo: true },
    { id: "salidas" as SubpresupuestoId,    nombre: "Salidas",    color: "#3B82F6", limiteBs: bs(400),  prioridad: 2, recurrente: true,  orden: 1, activo: true },
    { id: "ropa" as SubpresupuestoId,       nombre: "Ropa",       color: "#F59E0B", limiteBs: bs(200),  prioridad: 3, recurrente: false, orden: 1, activo: true },
  ],
  createdAt: new Date().toISOString(),
};
```

### 5.2 `src/lib/cobertura.ts`

```ts
import type { Presupuesto, ResumenCobertura, CoberturaSub } from "@/types/presupuesto";
import type { Transaccion } from "@/types/transaccion";
import { sum, sub, bs } from "@/lib/money";

export const calcularCobertura = (
  p: Presupuesto,
  txs: Transaccion[]
): ResumenCobertura => {
  // 1. Filtrar txs del periodo.
  // 2. Sumar ingresoRealBs, gastoTotalBs, otrosGastosRealBs.
  // 3. Por cada sub activo, sumar gastadoBs.
  // 4. Calcular estado por sub (ver §2.4).
  // 5. Determinar estadoGlobal recorriendo subs ordenados por (prioridad ASC, orden ASC)
  //    y devolviendo el primero no "cubierto" / "excedido".
  // 6. Formatear mensaje.
};
```

### 5.3 `src/mocks/transacciones.ts` (extender)

- Sembrar ~12 tx en el mes en curso con `subPresupuestoId` distribuidos: 5 con `comida`, 3 con `servicios`, 1 con `salidas`, 3 con `subPresupuestoId = null` (caen en Otros).
- Al menos 2 ingresos que sumen `>= 1500` para que la dona interior se vea razonable.

### 5.4 `src/lib/presupuesto-fechas.ts`

```ts
// Helpers puros para calcular fechaInicio/fechaFin según periodicidad.
export const calcularRangoPeriodo = (
  desde: Date,
  periodicidad: Periodicidad,
  quincenaCorteDia?: 1 | 16
): { fechaInicio: ISODate; fechaFin: ISODate };
```

## 6. Reglas de negocio

1. **Un único presupuesto principal activo** + N snapshots históricos inmutables.
2. **Cobertura informativa, no restrictiva** (ver §2.4): el algoritmo NO "consume" ingresos entre sub-presupuestos. Solo ordena para el mensaje del banner.
3. **Prioridad 1/2/3 + chip de color**: orden visual de cobertura en el banner. No restringe la creación de tx contra un sub.
4. **Recurrencia**: arrastra al siguiente periodo, no al actual. Cambio de `recurrente` aplica desde el siguiente cierre.
5. **Soft-delete de sub con tx**: se desactiva (`activo: false`), no se borra. Las tx históricas siguen mostrando el chip con color/nombre del snapshot.
6. **Validación de suma**: la suma de `limiteBs` de sub activos + `otrosGastosBs` puede superar `ingresoEsperadoBs`. Se permite, pero el Editor muestra un aviso inline.
7. **Cambio de periodicidad**: crea un snapshot del actual antes de mutar.
8. **Cierre de periodo**: hook global `usePeriodoCerrado()` que se monta en el layout. Solo dispara el banner una vez por sesión.
9. **Strict monetary typing**: reusa `Money`. Cero `number` desnudos para montos.
10. **Persistencia**:
    - `lucash:presupuesto-principal` — único objeto `Presupuesto`.
    - `lucash:presupuesto-snapshots` — array de `PresupuestoSnapshot`.
    - Migración silenciosa si la versión de schema cambia (campo `__schemaVersion` en el objeto raíz).

## 7. Casos borde

- [ ] **Sin presupuesto creado** → wizard de 3 pasos: `Ingreso esperado` → `Otros gastos` → `Crear tu primer sub-presupuesto`. Botón `Saltar` permite CrearPresupuesto mínimo sin sub.
- [ ] **`gastadoBs > limiteBs`** → estado `excedido`, indicador rojo `+Bs X sobre el límite`.
- [ ] **Todos los sub excedidos** → balance negativo → banner rojo `Estás gastando más de lo que entra`.
- [ ] **Cierre con `ingresoRealBs = 0`** → snapshot igual se crea, con sello `Sin ingresos registrados`.
- [ ] **Cambio de periodicidad en Editar** → recalcula rango, ofrece `¿Cerrar el periodo actual y empezar uno nuevo?`.
- [ ] **Eliminar el último sub** → permitido, la dona exterior queda solo con `Otros` y `Libre`.
- [ ] **Reordenar sub** → no hay drag-and-drop en V1; se hace con campo `orden` numérico editable en el modal.
- [ ] **Migración de schema** → al leer de localStorage, si `__schemaVersion` no coincide, se aplica migrador y se muestra toast `Actualizamos el formato de tus datos`.
- [ ] **Sub recurrente eliminado antes del cierre** → no se arrastra. Soft-delete gana sobre recurrente.
- [ ] **Tx registrada con sub eliminado** → se sigue mostrando con el chip denormalizado (color + nombre del último estado activo) o chip genérico si el agente decide no denormalizar.
- [ ] **Sobrepaso del presupuesto general** (suma de gastos > ingresos) → aro rojo en la dona interior + banner rojo.
- [ ] **Periodo con periodicidad `quincenal` y día de corte** → la primera quincena es `[1, 15]` o `[16, último]`. Si el usuario cambia el día de corte, se recalcula y se ofrece snapshot del actual.

## 8. Dependencias e impacto en otras specs

- **Lee de:**
  - `/.specs/historial.md` — usa `Transaccion` y `Money`/`ISODate` ya definidos.
  - `/.specs/cargar.md` — usa `SubpresupuestoId` y el catálogo de sub (`subPresupuestoId` ya está en `Transaccion`).
- **Impacto sobre otras specs:**
  - **`historial.md`**: el tipo `Subpresupuesto` debe **dejar de redeclararse** y pasar a importarse desde `src/types/presupuesto.ts`. Agregar campos `prioridad`, `recurrente`, `orden`, `activo` (los 3 últimos no afectan la UI de `/historial` pero deben existir en el modelo). Sin cambios de UX. Ver nota al final de `historial.md`.
  - **`cargar.md`**: el dropdown consume el catálogo desde `src/mocks/presupuestos.ts`. Si el catálogo cambia (sub eliminado), el select se actualiza. Sin cambios de UX adicionales.
  - **Futuras** (`dashboard.md`, `ahorros.md`): van a leer del mismo modelo centralizado.
- **No modela acá:** shell de navegación, autenticación, backend real.

## 9. Fuera de alcance

- Backend real (NestJS), persistencia server-side, sync entre dispositivos.
- Sugerencias automáticas de cuánto asignar a cada sub basadas en gastos históricos (queda para spec de analytics).
- Multi-presupuesto por usuario.
- Importar / presets de sub-presupuestos ("Plantilla venezolana", "Plantilla freelancer", etc.).
- Comparación entre periodos en el Resumen (eso va en `/dashboard`).
- Notificaciones push (la "notificación" de cobertura es inline en la pantalla, no push real).
- Vista dedicada de snapshots (`/presupuestos/historico` queda como ruta futura; el botón `Ver detalle` del banner muestra un alert informativo en V1).
- Drag-and-drop para reordenar sub.
- Wizard multi-paso animado (se puede hacer con steps simples, sin librería).

---

## 10. Notas de impacto (post-revisión de arquitectura)

> Estas notas son **posteriores** a la redacción original y reflejan la decisión de introducir la pantalla `/cuentas` como base de toda la arquitectura financiera. Al implementar `presupuestos.md`, hay que tenerlas en cuenta. No modifican el cuerpo de las secciones 1–9; solo aclaran cómo se conectan con la nueva pantalla.

### 10.1 `disponibleCuentas` como input adicional de la cobertura

Antes de la introducción de `/cuentas`, el "disponible" del usuario se infería de la suma de ingresos menos gastos del presupuesto. Con la nueva pantalla, el disponible **real** viene de la suma de saldos de cuentas líquidas (efectivo + banco + prepago) en `/cuentas`.

La función `calcularCobertura()` ahora recibe un input adicional:

```ts
export const calcularCobertura = (
  p: Presupuesto,
  txs: Transaccion[],
  disponibleCuentas: Money   // <- NUEVO: viene de /cuentas via getResumen()
): ResumenCobertura => {
  // La lógica de cobertura por sub no cambia; el cambio es que el "disponible real"
  // ahora viene de las cuentas, no de la resta simple de ingresos - gastos del periodo.
};
```

Implicaciones:
- La cobertura ya no se calcula en abstracto solo con el presupuesto: requiere que el usuario tenga al menos una cuenta líquida creada en `/cuentas`. Si no hay cuentas, el dashboard de presupuestos muestra un banner `Configurá tus cuentas en /cuentas para ver tu cobertura real`.
- El campo `disponibleCuentas: Money` se muestra en el header de la pestaña Resumen, al lado de `ingresoEsperadoBs` y `gastoTotalBs`, para que el usuario vea las 3 cifras juntas.
- El mensaje del banner de cobertura (§2.2) ahora puede comparar contra `disponibleCuentas` además de contra `ingresoRealBs` del periodo.

### 10.2 Sin cambios en el modelo `Subpresupuesto`

Esta spec sigue siendo la fuente canónica de `Subpresupuesto` (en `src/types/presupuesto.ts`). La spec de `cuentas.md` lo lee desde acá. No hay cambios en el modelo.

### 10.3 Sin cambios en la dona ni en la UX

La dona doble, las tarjetas, el banner, el editor, los snapshots, la recurrencia, los casos borde: todo queda igual. Lo único que cambia es el input `disponibleCuentas` que se le pasa a `calcularCobertura`.
