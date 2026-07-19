# Spec — `/ahorros` (Vista de cuentas de ahorro)

> Frontend-only. Next.js App Router + TypeScript + Tailwind v4 + React Compiler. Sin backend real. Toda la persistencia es mock en `localStorage`.
>
> Esta pantalla es una **vista filtrada** sobre la pantalla `/cuentas`: muestra solo las cuentas con `objetivo: "ahorro"`. La gestión completa (CRUD, metas, conversiones) ya está modelada en `/.specs/cuentas.md`. Acá solo se documenta el comportamiento específico de la vista de ahorro y el disparador de redirección de excedente desde `/cargar`.

## 1. Historia de usuario

> Como usuario de Lucash, cuando voy a `/ahorros` quiero ver de un vistazo cuánto llevo ahorrado en total y el progreso de cada cuenta de ahorro que configuré. Las metas que asigné a esas cuentas (ej. "Emergencia: Bs 5.000", "Viaje: USDT 500 para diciembre") se ven como mini-barras dentro de cada tarjeta. Si recientemente llegó una redirección de excedente desde `/cargar`, la cuenta se resalta con un badge "Excedente redirigido". Si todavía no tengo cuentas de ahorro, la pantalla me invita a crear la primera con un solo tap.

## 2. Criterios de aceptación

### 2.1 Vista principal

- [ ] Header `Ahorros` con un KPI: `Total ahorrado: Bs X (USD Y)`. Calculado como la suma de saldos (convertidos a Bs y USD) de todas las `Cuenta` activas con `objetivo: "ahorro"`. Reusa `getResumenCuentas()` de `/cuentas` filtrado por `objetivo === "ahorro"`.
- [ ] Toggle de moneda en el header: `Bs` / `USD`. Cambia la unidad principal del KPI y de cada tarjeta.
- [ ] Lista de `CuentaAhorroCard` (componente específico de esta pantalla, derivado de `CuentaCard`):
  - Nombre + chip de tipo (`Efectivo`, `Crypto`, `Inversión`).
  - Saldo en la moneda de la cuenta + conversión a la moneda activa del toggle.
  - Mini-barra de la meta principal (la primera `MetaCuenta` activa con `cumplidaAt` no seteado, o la más próxima a `fechaMeta`).
  - Si la meta está cumplida → chip verde `Cumplida · {fecha}` reemplazando la mini-barra.
  - **Badge `Excedente redirigido`** (verde, esquina superior derecha) si en los últimos 7 días la cuenta recibió un `MovimientoCuenta` con `esRedireccionExcedente: true`.
  - Tap en la card → abre `CuentaDrawer` (el mismo de `/cuentas`).
- [ ] FAB sticky `[+ Crear cuenta de ahorro]` que abre el `CuentaEditor` con `objetivo: "ahorro"` pre-seteado.
- [ ] Empty state: icono de alcancía, texto `Todavía no tenés cuentas de ahorro. Creá la primera.` y CTA grande.

### 2.2 Detalle de cuenta de ahorro

- [ ] Al tap en una `CuentaAhorroCard`, se abre el mismo `CuentaDrawer` que en `/cuentas`, con una sección adicional al inicio: `Redirecciones recientes`.
- [ ] **Sección `Redirecciones recientes`:**
  - Lista los últimos 5 `MovimientoCuenta` de la cuenta con `esRedireccionExcedente: true`, ordenados por `createdAt` desc.
  - Cada item: fecha, monto en la moneda de la cuenta + equivalente en USD/Bs, link `Ver transacción de origen` que abre el `TransaccionDrawer` correspondiente (si la tx sigue activa).
  - Si no hay redirecciones, la sección no se renderiza.

### 2.3 Crear cuenta de ahorro (atajo)

- [ ] El FAB abre `CuentaEditor` (de `/cuentas`) con los siguientes campos pre-seteados:
  - `objetivo: "ahorro"` (no editable en este flujo; el campo aparece como label).
  - `tipo: "efectivo"` (default; el usuario puede cambiarlo).
  - Resto de campos vacíos con defaults razonables (`color` aleatorio, `moneda` según el tipo, `saldoInicial` = 0, `activo` = true).
- [ ] Al guardar, se persiste en `lucash:cuentas` y se vuelve a `/ahorros` con la nueva cuenta ya en la lista.
- [ ] Botón `Cancelar` descarta y vuelve a `/ahorros`.

### 2.4 Redirección de excedente (disparador desde `/cargar`)

- [ ] La redirección se dispara desde `/cargar` cuando un Ingreso supera el presupuesto del mes. Ver `/.specs/cargar.md` §2.5 + nota de impacto §10.3.
- [ ] El `ExcedenteDialog` (de `/cargar`) lista las cuentas con `objetivo: "ahorro"`, **no** una entidad aparte `DestinoAhorro` (que ya no existe).
- [ ] Al confirmar la redirección, se crea un `MovimientoCuenta` con `esRedireccionExcedente: true` (ver nota de impacto §10.3 de `/cargar`).
- [ ] En `/ahorros`, ese movimiento aparece en la sección `Redirecciones recientes` del `CuentaDrawer` de la cuenta destino, y dispara el badge `Excedente redirigido` durante 7 días.

## 3. UI/UX (mobile-first)

### 3.1 Wireframe textual

```
/ahorros (mobile, 375px)
┌──────────────────────────────┐
│  Ahorros         [Bs | USD]  │
│  Total ahorrado              │
│  Bs 8.475,00                 │
├──────────────────────────────┤
│  ┌────────────────────────┐  │
│  │ 🐷 Cochinito    [Bs]  │  │
│  │                        │  │
│  │ Bs 0,00                │  │
│  │ ░░░░░░░░░░░░░░░░░░░░  │  │  <- mini-barra
│  │ Emergencia 0 / 5.000   │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ 🟠 Binance     [USDT]🟢│  │  <- badge excedente
│  │                        │  │
│  │ USDT 100,00            │  │
│  │ USD 100,00 · Bs 3.650  │  │
│  │ ▓▓░░░░░ Viaje          │  │
│  │ USDT 100 / USDT 500    │  │
│  └────────────────────────┘  │
│  ┌────────────────────────┐  │
│  │ 🟣 MetaMask     [ETH]  │  │
│  │                        │  │
│  │ ETH 0,5                │  │
│  │ USD 1.750,00 · Bs ...  │  │
│  │ ✓ Cumplida · 12/06/26  │  │
│  └────────────────────────┘  │
│                              │
│  [ + Crear cuenta de ahorro ]│  <- FAB
└──────────────────────────────┘

CuentaDrawer (reusado de /cuentas) - sección extra arriba
┌──────────────────────────────┐
│  ← Binance             ⋯    │
│  USDT 100,00 · USD 100,00   │
├──────────────────────────────┤
│  Metas                       │
│  ▓▓░░░ Viaje USDT 100/500   │
│                              │
│  Redirecciones recientes  🟢 │  <- NUEVO en /ahorros
│  ┌────────────────────────┐  │
│  │ 15 jul  · +USDT 50,00  │  │
│  │ Excedente de Ingreso   │  │
│  │ Ver transacción →      │  │
│  └────────────────────────┘  │
│                              │
│  Conversiones                │  <- resto del drawer
│  ...                         │
└──────────────────────────────┘
```

### 3.2 Componentes a crear

- `src/app/ahorros/page.tsx` — entrypoint.
- `src/components/ahorros/AhorrosHeader.tsx` — KPI total + toggle de moneda.
- `src/components/ahorros/CuentaAhorroCard.tsx` — tarjeta derivada de `CuentaCard` con badge de excedente.
- `src/components/ahorros/RedireccionesRecientes.tsx` — sección extra dentro del drawer.
- `src/components/ahorros/AhorrosEmptyState.tsx` — sin cuentas de ahorro.
- `src/hooks/useCuentasAhorro.ts` — `getCuentasAhorro()` + `getRedireccionesRecientes(cuentaId)`.

### 3.3 Estados a modelar

- `loading` — primera hidratación.
- `vacio` — sin cuentas de ahorro.
- `lista` — caso feliz.
- `creando` — `CuentaEditor` abierto desde el FAB.

### 3.4 Accesibilidad

- Reusa los patrones de `/cuentas` y `/cargar`. Toggle de moneda como `role="radiogroup"`.
- Badge de excedente con `aria-label="Recibió un excedente redirigido recientemente"`.

## 4. Modelo de datos

> Esta pantalla **no introduce tipos nuevos**. Todo se deriva de los tipos definidos en `/.specs/cuentas.md` (`Cuenta`, `MetaCuenta`, `MovimientoCuenta`) y `/.specs/cargar.md` (`Transaccion`).

```ts
// src/hooks/useCuentasAhorro.ts
import type { Cuenta, MovimientoCuenta, ResumenCuentas } from "@/types/cuenta";

export const getCuentasAhorro = (cuentas: Cuenta[]): Cuenta[] =>
  cuentas.filter((c) => c.activo && c.objetivo === "ahorro");

export const getRedireccionesRecientes = (
  cuentaId: CuentaId,
  movimientos: MovimientoCuenta[],
  dias: number = 7
): MovimientoCuenta[] => {
  const hoy = new Date();
  const limite = new Date(hoy.getTime() - dias * 24 * 60 * 60 * 1000);
  return movimientos
    .filter(
      (m) =>
        m.cuentaId === cuentaId &&
        m.esRedireccionExcedente === true &&
        new Date(m.createdAt) >= limite
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);
};
```

## 5. Mocks

> No se generan mocks nuevos. Esta pantalla consume `src/mocks/cuentas.ts` y `src/mocks/movimientos-cuenta.ts` de `/cuentas`.

Para que la pantalla tenga contenido al primer render, `/cuentas` ya siembra:
- 3 cuentas con `objetivo: "ahorro"`: `cochinito`, `binance`, `metamask`.
- 1 movimiento de redirección de excedente en `binance` con `esRedireccionExcedente: true` y `createdAt` reciente.
- 2 metas seed: `Emergencia` en `cochinito`, `Viaje` en `binance`.

## 6. Reglas de negocio

1. **Lista derivada.** `/ahorros` no tiene su propio almacenamiento; es un filtro en vivo sobre `cuentas` con `objetivo: "ahorro"`.
2. **CRUD delegado.** Crear, editar, eliminar cuentas de ahorro se hace en `/cuentas` (o desde el FAB de esta pantalla que abre `CuentaEditor` con pre-set).
3. **Metas viven en la cuenta.** No se gestionan desde `/ahorros`; se gestionan en el `CuentaDrawer` (que es el mismo componente).
4. **Conversiones viven en `/cuentas`.** El botón `Convertir a disponible` está en el `CuentaDrawer` de la cuenta, no en esta pantalla.
5. **Badge de excedente = ventana de 7 días.** Se calcula en vivo cada vez que se renderiza la lista, no se persiste.
6. **Strict monetary typing**: reusa `Money` de `cargar.md` / `cuentas.md`. Cero `number` desnudos para montos.
7. **Persistencia**: esta pantalla no tiene claves propias en `localStorage`. Todo se persiste vía las claves de `/cuentas` (`lucash:cuentas`, `lucash:metas-cuenta`, `lucash:movimientos-cuenta`).

## 7. Casos borde

- [ ] **Sin cuentas de ahorro** → empty state con CTA `+ Crear cuenta de ahorro`.
- [ ] **Cuenta de ahorro con saldo pero sin metas** → la tarjeta se renderiza sin mini-barra, solo el saldo.
- [ ] **Meta cumplida + saldo que baja** → la meta sigue marcada `cumplida`; la tarjeta muestra el chip `Cumplida · {fecha}`.
- [ ] **Redirección de excedente en los últimos 7 días** → badge `Excedente redirigido` visible.
- [ ] **Redirección de hace más de 7 días** → el badge desaparece, pero la redirección sigue visible en la sección `Redirecciones recientes` del drawer.
- [ ] **Cuenta de ahorro soft-deleteada** → no aparece en la lista. Si tenía redirecciones, estas siguen en `movimientos-cuenta` pero no se listan en la sección (porque la cuenta no se muestra).
- [ ] **Cambio de moneda del toggle** → recalcula el KPI y las conversiones en cada tarjeta en vivo.
- [ ] **Cuenta de ahorro con tipo `efectivo` y moneda `Bs`** → caso más simple, sin conversión. Saldo directo.

## 8. Dependencias e impacto en otras specs

- **Lee de:**
  - `/.specs/cuentas.md` — fuente de datos principal. Sin esta spec, `/ahorros` no existe.
  - `/.specs/cargar.md` — fuente del `ExcedenteDialog` que dispara la redirección.
- **Impacto sobre otras specs:**
  - **`cargar.md` §10.3 y §10.4**: ya están alineadas (la redirección se materializa como `MovimientoCuenta` con `esRedireccionExcedente: true`, y el `ExcedenteDialog` ofrece `Crear cuenta de ahorro` si la lista está vacía).
  - **`cuentas.md`**: provee todos los componentes y mocks. No requiere cambios adicionales.
  - **Futuras** (`dashboard.md`): puede consumir `getCuentasAhorro()` para un KPI de "ahorro total" en el dashboard.

## 9. Fuera de alcance

- CRUD propio de cuentas (todo se delega a `/cuentas`).
- Gestión de metas desde esta pantalla (vive en `CuentaDrawer`).
- Conversiones a disponible desde esta pantalla (vive en `CuentaDrawer`).
- Snapshots de ahorro (no hay periodicidad en los ahorros; el saldo es continuo).
- Notificaciones push.
- Proyecciones de cumplimiento de metas ("a este ritmo, llegás a la meta en N meses").
- Backend real (NestJS), autenticación, sync entre dispositivos.
