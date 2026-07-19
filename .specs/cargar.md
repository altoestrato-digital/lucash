# Spec — `/cargar` (Carga de Transacciones)

> Frontend-only. Next.js App Router + TypeScript + Tailwind v4 + React Compiler. Sin backend real. Toda la persistencia es mock en memoria / `localStorage`.

## 1. Historia de usuario

> Como usuario de Lucash, necesito registrar mis ingresos y egresos de forma rápida desde el celular. Puedo hacerlo de dos formas: **manual** (completo los campos a mano, útil para efectivo) o **automática** (tomo una foto del recibo/factura o selecciono una imagen o PDF desde el explorador, la app analiza el adjunto con IA y me pre-rellena los datos, que puedo corregir antes de guardar). Al guardar un ingreso que supera el presupuesto mensual del mes, el excedente se redirige automáticamente a Ahorros y la app me pregunta a qué destino mandarlo.

## 2. Criterios de aceptación

### 2.1 Pantalla inicial `/cargar`

- [ ] **Dado** que el usuario entra a `/cargar`, **cuando** la pantalla termina de hidratar, **entonces** ve dos botones grandes, mobile-first, claramente diferenciados:
  - `[+ Ingreso]` (verde) a la izquierda/arriba.
  - `[- Egreso]` (rojo) a la derecha/abajo.
- [ ] Los botones ocupan al menos 60% del ancho en mobile, 240px mínimo en desktop.
- [ ] Cada botón tiene icono + texto + descripción breve ("Registrar dinero que entra" / "Registrar dinero que sale").
- [ ] La pantalla es **mobile-first**: usable con una mano, tap targets ≥ 44px.

### 2.2 Modal de método (tras elegir Ingreso o Egreso)

- [ ] **Dado** que el usuario tocó `[+ Ingreso]` o `[- Egreso]`, **cuando** se abre el modal, **entonces** ve 3 opciones:
  1. **Cámara** (icono cámara + texto "Cargar") — abre captura de cámara del dispositivo.
  2. **Explorar** (texto secundario) — abre el file picker.
  3. **Manual** (texto secundario) — salta directo al formulario sin adjunto.
- [ ] Cerrar el modal (tap fuera / botón X) vuelve a la pantalla inicial sin perder estado.
- [ ] Al seleccionar **Cámara** o **Explorar**, se acepta una imagen (jpg/png/webp) o PDF. Un solo adjunto por transacción.

### 2.3 Formulario

- [ ] Si hay adjunto: se renderiza la miniatura (imagen) o icono de PDF con el nombre del archivo + botón `Analizar` debajo.
- [ ] **Modo Automático (con adjunto):**
  - [ ] Tocar `Analizar` envía el archivo al mock OCR (`useUploadOcr`).
  - [ ] Mientras se analiza, el botón muestra spinner y el form queda disabled.
  - [ ] Al resolver, los campos se pre-rellenan y quedan **editables** siempre.
  - [ ] Si la IA falla, se muestra toast de error y el usuario puede completar a mano sin perder el adjunto.
- [ ] **Modo Manual:** el form se muestra sin miniatura ni botón `Analizar`. Todos los campos vacíos.
- [ ] Campos del form (orden visual, mobile-first):
  1. **Emisor/Receptor** — input texto (placeholder dinámico: "Quién te envía" en Ingreso / "A quién le pagás" en Egreso).
  2. **Concepto de la compra/pago** — input texto.
  3. **Sub-presupuesto** — select con las opciones del presupuesto principal activo y sus sub-presupuestos (ver §2.3.1).
  4. **Monto en Bs** — input numérico, sufijo `Bs`.
  5. **Monto en USD** — input numérico, sufijo `USD`, calculado a partir de Bs × tasa BCV.
  6. **Tasa BCV del día** — campo especial (ver §2.4).
  7. **Descripción** — textarea opcional, max 240 chars, contador visible.
  8. **Método** — select con opciones: `Efectivo`, `Banco A`, `Banco B`, etc. (cargadas de `src/mocks/bancos.ts`).
  9. **Fecha de la transacción** — date picker, default = hoy.
  10. **Botón `Guardar`** — sticky bottom en mobile.
- [ ] Validación: Guardar deshabilitado si falta `emisorReceptor`, `concepto`, `montoBs` o `metodo`. El campo `subPresupuestoId` es **opcional** (ver §2.3.1).

#### 2.3.1 Sub-presupuesto (campo opcional)

- [ ] El select muestra en su primera opción **"Presupuesto general"** (placeholder funcional, sin valor de id real), seguida de la lista de sub-presupuestos configurados (ej. Comida, Salidas, Transporte, etc.) cargados desde `src/mocks/presupuestos.ts`.
- [ ] Cada sub-presupuesto se renderiza con un **chip de color** a la izquierda del nombre (color tomado del modelo `Subpresupuesto.color`).
- [ ] Al elegir **"Presupuesto general"**, la transacción se asocia al presupuesto principal (id `null` en `subPresupuestoId`). Al elegir un sub-presupuesto, se asocia a su id.
- [ ] El campo es **opcional**: si el usuario no toca el select, se guarda contra el presupuesto general.
- [ ] El modal OCR puede sugerir un sub-presupuesto a partir del `concepto` detectado (heurística mock simple, ej. "comida" → Comida), pero el usuario puede cambiarlo a mano o dejarlo en "Presupuesto general".
- [ ] La opción seleccionada se persiste como `subPresupuestoId: SubpresupuestoId | null` en la transacción.
- [ ] Al guardar: toast de éxito, redirige a `/historial` y limpia el form.

### 2.4 Tasa BCV (campo especial)

- [ ] **Dado** que el usuario eligió una fecha de transacción, **cuando** el componente `TasaBcvField` monta, **entonces** consulta el mock `lookupBcv(fecha)`.
  - **Si encuentra** valor → campo se muestra **bloqueado** (read-only) con formato `Bs 36,50 / USD · Vigente: 2026-07-17` y un candado visible.
  - **Si NO encuentra** valor → campo se muestra **editable** con placeholder `Ingrese la tasa manualmente` y un aviso sutil `No se encontró tasa automática para esta fecha`.
- [ ] Al cambiar la **fecha** de la transacción, se vuelve a consultar el lookup.
- [ ] Al cambiar la **tasa manualmente** (caso editable), `montoUsd` se recalcula en vivo.
- [ ] Al cambiar `montoBs`, `montoUsd` se recalcula en vivo usando la tasa activa.
- [ ] Al guardar, se persiste: `tasaBcv: Money`, `montoUsd: Money`, `fechaTasaBcv: ISODate` (la fecha de la tasa, no la de la transacción).

### 2.5 Regla de excedente (solo Ingreso)

- [ ] **Dado** que el usuario guardó un **Ingreso** cuyo `montoBs` supera el presupuesto mensual configurado del mes, **entonces**:
  - [ ] Se crea la transacción normalmente.
  - [ ] Se calcula `excedente = montoBs − presupuestoMensualMes`.
  - [ ] Se muestra un **modal interactivo** `ExcedenteDialog` con:
    - Título: "¡Te pasaste del presupuesto!"
    - Subtexto: "Tenés un excedente de `{montoBs formateado}`. ¿A dónde lo mandamos?"
    - Lista de destinos de ahorro (referencia: `/.specs/ahorros.md`).
    - Botón `Confirmar` (disabled hasta elegir destino).
    - Botón `Cancelar` (el excedente queda en cuenta corriente, no se redirige).
  - [ ] Al confirmar, se crea un movimiento automático de tipo `RedireccionAhorro` por el monto del excedente, apuntando al destino elegido.

## 3. UI/UX (mobile-first)

### 3.1 Wireframe textual

```
/cargar (mobile, 375px)
┌──────────────────────────────┐
│  ← Cargar                    │  <- header
├──────────────────────────────┤
│                              │
│  ┌────────────────────────┐  │
│  │  +  Ingreso            │  │  <- btn primario verde
│  │     Registrar dinero   │  │
│  │     que entra          │  │
│  └────────────────────────┘  │
│                              │
│  ┌────────────────────────┐  │
│  │  −  Egreso             │  │  <- btn primario rojo
│  │     Registrar dinero   │  │
│  │     que sale           │  │
│  └────────────────────────┘  │
│                              │
└──────────────────────────────┘

Modal de método (tras tap)
┌──────────────────────────────┐
│  Egreso              ×       │
├──────────────────────────────┤
│                              │
│   ┌──────────────────────┐   │
│   │ 📷  Cargar           │   │  <- btn cámara
│   └──────────────────────┘   │
│                              │
│   Explorar                   │  <- link
│   Manual                     │  <- link
│                              │
└──────────────────────────────┘

Formulario (mobile, scroll)
┌──────────────────────────────┐
│  ← Egreso                    │
├──────────────────────────────┤
│  ┌──────────┐                │
│  │ thumb    │   [Analizar]   │  <- solo si hay adjunto
│  └──────────┘                │
│                              │
│  Emisor/Receptor             │
│  [_____________________]     │
│                              │
│  Concepto                    │
│  [_____________________]     │
│                              │
│  Sub-presupuesto             │
│  [ 🟢 Comida          ▾ ]    │
│                              │
│  Monto en Bs                 │
│  [_____________] Bs          │
│                              │
│  Monto en USD                │
│  [_____________] USD         │
│                              │
│  Tasa BCV (vigente 2026-07-17) 🔒
│  [________________]          │
│                              │
│  Descripción (opcional)      │
│  [_____________________]     │
│                       0/240  │
│                              │
│  Método                      │
│  [ Efectivo            ▾ ]   │
│                              │
│  Fecha                       │
│  [ 17/07/2026        📅 ]    │
│                              │
│  ┌────────────────────────┐  │
│  │     Guardar            │  │  <- sticky bottom
│  └────────────────────────┘  │
└──────────────────────────────┘
```

### 3.2 Componentes a crear

- `src/app/cargar/page.tsx` — entrypoint de la ruta.
- `src/components/cargar/CargarHome.tsx` — pantalla con los 2 botones.
- `src/components/cargar/CargarMethodModal.tsx` — modal Cámara/Explorar/Manual.
- `src/components/cargar/CargarForm.tsx` — formulario completo.
- `src/components/cargar/SubpresupuestoSelect.tsx` — select con chip de color por sub-presupuesto + opción "Presupuesto general".
- `src/components/cargar/ReceiptThumbnail.tsx` — preview de imagen / icono PDF.
- `src/components/cargar/TasaBcvField.tsx` — campo especial con lookup + candado.
- `src/components/cargar/MetodoPagoSelect.tsx` — select poblado desde mock.
- `src/components/cargar/ExcedenteDialog.tsx` — modal de redirección a ahorros.
- `src/hooks/useUploadOcr.ts` — hook que simula OCR.
- `src/hooks/useBcvLookup.ts` — hook que consulta `lookupBcv(fecha)`.

### 3.3 Estados a modelar

- `idle` — sin adjunto, form vacío.
- `adjunto-cargando` — archivo seleccionado, preview listo, sin análisis.
- `analizando` — `useUploadOcr` en curso, form disabled.
- `analizado` — campos pre-rellenados, editables.
- `error-ocr` — toast de error, adjunto conservado, form editable.
- `guardando` — submit en curso, botón disabled.
- `excedente` — solo tras guardar un Ingreso que pasó el presupuesto.

### 3.4 Accesibilidad

- Todos los inputs con `<label>` asociado.
- Modal con `role="dialog"` + `aria-modal="true"` + foco inicial en el primer botón.
- Errores con `aria-describedby`.
- Tap targets ≥ 44×44px.

## 4. Modelo de datos (TypeScript)

> Regla global del proyecto: **ningún monto puede ser `number` plano**. Usar el tipo `Money` con branding.

```ts
// src/lib/money.ts
declare const __moneyBrand: unique symbol;
export type Money = number & { readonly [__moneyBrand]: "Bs" | "USD" };

export const bs = (n: number): Money => n as Money;
export const usd = (n: number): Money => n as Money;

export const formatBs = (m: Money): string => /* "Bs 1.234,56" */;
export const formatUsd = (m: Money): string => /* "USD 34.50" */;
export const sum = (a: Money, b: Money): Money => (a + b) as Money;
export const sub = (a: Money, b: Money): Money => (a - b) as Money;
export const convert = (m: Money, tasa: Money): Money => (m / tasa) as Money;

// src/lib/dates.ts
export type ISODate = string & { readonly __brand: "ISODate" };
export const toIso = (d: Date): ISODate => d.toISOString().slice(0, 10) as ISODate;
```

```ts
// src/types/transaccion.ts
export type TipoTransaccion = "ingreso" | "egreso";

export type MetodoPago =
  | { tipo: "efectivo" }
  | { tipo: "banco"; bancoId: BancoId };

export type BancoId = string & { readonly __brand: "BancoId" };

export type SubpresupuestoId = string & { readonly __brand: "SubpresupuestoId" };

export interface Adjunto {
  id: string;
  nombreArchivo: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
  dataUrl: string; // base64, local
  tamanoBytes: number;
}

export interface TasaBcv {
  valor: Money;          // Bs por 1 USD
  fechaVigencia: ISODate; // fecha a la que aplica esta tasa
  fuente: "auto" | "manual";
}

export interface Transaccion {
  id: string;
  tipo: TipoTransaccion;
  fecha: ISODate;              // fecha de la operación
  emisorReceptor: string;
  concepto: string;
  montoBs: Money;
  montoUsd: Money;
  tasaBcv: TasaBcv;
  descripcion?: string;
  metodo: MetodoPago;
  subPresupuestoId: SubpresupuestoId | null; // null = Presupuesto general
  adjunto?: Adjunto;
  createdAt: string;           // ISO timestamp
  fuenteOcr: boolean;          // true si la IA pre-rellenó los campos
}

export interface RedireccionAhorro {
  id: string;
  transaccionOrigenId: string;
  montoBs: Money;
  destinoAhorroId: string;     // FK a Ahorro (ver /.specs/ahorros.md)
  createdAt: string;
}
```

## 5. Mocks a generar

### 5.1 `src/mocks/bcv.ts`

```ts
// Mapa estático fecha → tasa. El agente debe sembrar valores para los últimos 90 días.
import type { ISODate } from "@/lib/dates";
import type { Money } from "@/lib/money";
import { bs } from "@/lib/money";

const TASAS: Record<ISODate, Money> = {
  // sembrar: "2026-07-17": bs(36.50), ...
};

export const lookupBcv = (fecha: ISODate): Money | null =>
  TASAS[fecha] ?? null;

export const getTasaVigente = (fecha: ISODate): { valor: Money; fuente: "auto" | "manual" } => {
  const v = lookupBcv(fecha);
  return v !== null ? { valor: v, fuente: "auto" } : { valor: bs(0), fuente: "manual" };
};
```

### 5.2 `src/mocks/bancos.ts`

```ts
export const BANCOS = [
  { id: "banco-a" as BancoId, nombre: "Banco A" },
  { id: "banco-b" as BancoId, nombre: "Banco B" },
  { id: "binance" as BancoId, nombre: "Binance" },
  // extender según necesidad
];
```

### 5.3 `src/mocks/ocr.ts` + `src/hooks/useUploadOcr.ts`

```ts
// Simula latencia 1500ms y devuelve datos hardcodeados plausibles.
export const useUploadOcr = () => {
  return async (adjunto: Adjunto): Promise<Partial<Transaccion>> => {
    await new Promise((r) => setTimeout(r, 1500));
    return {
      emisorReceptor: "Mercado Libre",
      concepto: "Compra de supermercado",
      montoBs: bs(1250.00),
      fuenteOcr: true,
    };
  };
};
```

### 5.4 `src/mocks/presupuestos.ts`

```ts
// Lista de sub-presupuestos del presupuesto principal activo. El "Presupuesto general"
// se representa con id null y se renderiza como primera opción del select.
import type { SubpresupuestoId } from "@/types/transaccion";

export const SUBPRESUPUESTOS = [
  { id: "comida" as SubpresupuestoId,     nombre: "Comida",     color: "#10B981" },
  { id: "salidas" as SubpresupuestoId,    nombre: "Salidas",    color: "#3B82F6" },
  { id: "transporte" as SubpresupuestoId, nombre: "Transporte", color: "#F59E0B" },
  { id: "hogar" as SubpresupuestoId,      nombre: "Hogar",      color: "#8B5CF6" },
];
```

### 5.5 `src/mocks/transacciones.ts`

- Estado inicial vacío + helper `getTransacciones()` / `addTransaccion(t)` que persiste en `localStorage` con clave `lucash:transacciones`.

## 6. Reglas de negocio (resumen)

1. **Excedente → Ahorros** (ver §2.5). Depende de `/.specs/presupuestos.md` para conocer el límite mensual.
2. **Tasa BCV** (ver §2.4): lookup automático, fallback editable, persistir `tasaBcv` + `fechaTasaBcv`.
3. **Conversión Bs↔USD**: siempre a través de `tasaBcv`, sin redondear antes de mostrar.
4. **Strict monetary typing**: ver §4. Ningún `number` desnudo para montos.
5. **Sin red real**: todos los mocks corren en cliente.

## 7. Casos borde

- [ ] **Imagen corrupta / PDF sin texto OCR** → `useUploadOcr` rechaza → toast de error, adjunto conservado, el usuario completa a mano.
- [ ] **Fecha futura** → el date picker la permite, pero la tasa se intenta igual; si no hay, queda editable.
- [ ] **Monto = 0** → Guardar deshabilitado (validación de §2.3).
- [ ] **Excedente exactamente igual al presupuesto** → `excedente = 0` → no se dispara el modal.
- [ ] **Excedente negativo** (ingreso < presupuesto) → no se dispara el modal.
- [ ] **Editar tasa manual después del lookup** → permitido solo si la tasa original era manual o nula. Si era auto, el candado sigue activo.
- [ ] **Cerrar el modal de método con adjunto ya cargado** → el adjunto se descarta.
- [ ] **Cerrar la app con form a medio llenar** → se persiste borrador en `localStorage` con clave `lucash:form-borrador` y se restaura al volver.
- [ ] **Múltiples adjuntos** → no soportado, se rechaza el segundo con toast.

## 8. Dependencias

- **`/.specs/presupuestos.md`** — para consultar el presupuesto mensual del mes y comparar contra el Ingreso. Sin esto, la regla de excedente no se puede testear. **Aporta además el catálogo de sub-presupuestos** (modelo `Subpresupuesto`) que consume `SubpresupuestoSelect`.
- **`/.specs/ahorros.md`** — para listar los destinos en `ExcedenteDialog` y para crear el movimiento `RedireccionAhorro`. **Nota:** ver "Notas de impacto" abajo — la redirección ahora se materializa como `MovimientoCuenta` en una cuenta con `objetivo: "ahorro"`, no como una entidad aparte.
- **`/.specs/historial.md`** — destino de la navegación tras Guardar exitoso. **Consume `subPresupuestoId` (puede ser `null`) para filtrar y mostrar el chip por fila.**
- No se modela acá el shell de navegación (bottom-tabs, header global). Si se necesita, va en una spec aparte.

## 10. Notas de impacto (post-revisión de arquitectura)

> Estas notas son **posteriores** a la redacción original y reflejan la decisión de introducir la pantalla `/cuentas` como base de toda la arquitectura financiera. Al implementar `cargar.md`, hay que tenerlas en cuenta. No modifican el cuerpo de las secciones 1–7; solo aclaran cómo se conectan con la nueva pantalla.

### 10.1 `MetodoPago` se reemplaza por `cuentaId`

El campo `MetodoPago` de `Transaccion` (que era `{ tipo: "efectivo" } | { tipo: "banco"; bancoId: BancoId }`) **se elimina** y se reemplaza por:

```ts
cuentaId: CuentaId;  // referencia a /cuentas
```

Justificación: el método de pago ahora viene de las cuentas que el usuario crea en `/cuentas`, no de un array fijo de mocks. Esto incluye bancos, prepagos, efectivo y crypto. El archivo `src/mocks/bancos.ts` se elimina.

Implicaciones en la UI:
- El `MetodoPagoSelect` se reemplaza por un `CuentaSelect` poblado con `getCuentasActivas()`.
- El placeholder dinámico de "Efectivo" / "Banco A" se reemplaza por el nombre de la cuenta elegida.

### 10.2 `UsoAhorroWarning` al elegir cuenta de ahorro

Si la cuenta elegida en el `CuentaSelect` tiene `objetivo: "ahorro"`, antes de confirmar el `Guardar` se muestra un modal de advertencia:

```
⚠ Estás usando una cuenta de ahorro.
Esto reduce el progreso de tu meta "{nombreMetaPrincipal}".
¿Continuar?
[ Cancelar ]  [ Sí, continuar ]
```

No bloquea el guardado, pero registra la intención. **Opcional:** se puede agregar un campo `usoAhorroConfirmado: boolean` a `Transaccion` para trackearlo.

### 10.3 `ExcedenteDialog` ya no crea `RedireccionAhorro`

La entidad `RedireccionAhorro` (definida en §4 de este spec) **se elimina** y se reemplaza por un `MovimientoCuenta` con `esRedireccionExcedente: true`:

```ts
// Al confirmar el ExcedenteDialog, se crea:
const movimiento: MovimientoCuenta = {
  id: generarId(),
  cuentaId: destinoAhorroId,    // cuenta con objetivo: "ahorro" elegida por el usuario
  tipo: "conversion-entrada",
  monto: excedenteUsd,           // se persiste en USD; la conversión a la moneda de la cuenta se hace al mostrar
  conversionId: conversionIdGenerado,
  cuentaContraparteId: undefined,  // la plata sale lógicamente del presupuesto, no de una cuenta específica
  tasaUsdPorMoneda: 1,
  fecha: toIso(new Date()),
  esRedireccionExcedente: true,
  transaccionOrigenId: transaccion.id,
  createdAt: new Date().toISOString(),
};
```

Justificación: unificar todo movimiento de dinero en una sola entidad (`MovimientoCuenta` de `/cuentas`) en vez de tener `RedireccionAhorro`, `DestinoAhorro`, etc. como entidades separadas. Esto simplifica el modelo y permite que el historial de cada cuenta muestre las redirecciones de excedente sin código especial.

### 10.4 `ExcedenteDialog` debe ofrecer "Crear cuenta" si no hay

Si la lista de cuentas con `objetivo: "ahorro"` está vacía, el `ExcedenteDialog` muestra:

```
No tenés cuentas de ahorro todavía.
Creá una para recibir el excedente.

[ Crear cuenta de ahorro ]  [ Cancelar ]
```

El botón `Crear cuenta de ahorro` abre el `CuentaEditor` de `/cuentas` con `objetivo: "ahorro"` pre-seteado. Al confirmar, el modal de excedente se vuelve a abrir con la nueva cuenta ya en la lista.

## 9. Fuera de alcance

- Backend real (NestJS) y persistencia server-side.
- Sincronización entre dispositivos.
- Categorización automática del gasto (se asume que el usuario la setea vía `concepto` + filtros en `/historial`).
- Multi-moneda más allá de Bs/USD.
- Autenticación / multi-usuario.
