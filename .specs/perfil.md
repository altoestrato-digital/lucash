# Spec — `/perfil` (Identidad, preferencias y sincronización)

> Frontend-only. Next.js App Router + TypeScript + Tailwind v4 + React Compiler. Sin backend real. Toda la persistencia es mock en `localStorage`.
>
> Pantalla de configuración personal. Reune identidad del usuario, preferencias de la app y placeholders para la futura sincronización con la APK Android. Es **fuente del saludo** del header de `/dashboard`.

## 1. Historia de usuario

> Como usuario de Lucash, quiero gestionar mi identidad y mis preferencias en una sola pantalla para que la app me salude por mi nombre, muestre los datos en mi formato preferido y esté lista para sincronizar con la futura APK Android. Quiero poder editar mi nombre, email y foto, configurar moneda/idioma/tema, ver un placeholder de sincronización y consultar la versión de la app.

## 2. Criterios de aceptación

### 2.1 Vista principal

- [ ] Header `Perfil` con tabs internas: `Cuenta` (default) · `Preferencias` · `Sincronización` · `Acerca de`. Mismo patrón de segmented control que `/presupuestos` y `/historial`.
- [ ] El header NO muestra saludo (eso vive en `/dashboard`).
- [ ] La tab activa persiste en memoria de sesión, no en `localStorage`.

### 2.2 Tab `Cuenta`

- [ ] Avatar arriba (foto subida o iniciales con color aleatorio si no hay).
- [ ] Input `Nombre` (texto, requerido, max 60 chars, trim de espacios).
- [ ] Input `Email` (texto, opcional, validación con regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`).
- [ ] Botón `Cambiar foto` (file picker, acepta jpg/png/webp, max 1MB, preview circular).
- [ ] Si hay foto, botón secundario `Quitar foto` (vuelve a iniciales).
- [ ] Botón `Cerrar sesión` deshabilitado con tooltip `Próximamente`.
- [ ] Botón sticky `Guardar` abajo, deshabilitado hasta que haya cambios válidos.

### 2.3 Tab `Preferencias`

Cinco controles, cada uno con su default y se persisten al instante (sin botón Guardar):

- [ ] **Moneda preferida** — segmented `Bs` / `USD`. Default: `Bs`. Afecta la unidad por defecto del toggle de moneda en `/ahorros` y del KPI principal en `/dashboard`.
- [ ] **Formato de fecha** — segmented `DD/MM/YYYY` / `MM/DD/YYYY`. Default: `DD/MM/YYYY`.
- [ ] **Inicio de semana** — segmented `Lunes` / `Domingo`. Default: `Lunes`. Afecta la agrupación por día en `/historial` y `/dashboard`.
- [ ] **Tema** — segmented `Claro` / `Oscuro` / `Auto`. Default: `Auto` (sigue `prefers-color-scheme`).
- [ ] **Idioma** — segmented `Español` / `Inglés`. Default: `Español`. **Inglés deshabilitado** con tooltip `Próximamente`.

Cambio persistido → toast breve `Guardado` + el control vuelve a estado neutro.

### 2.4 Tab `Sincronización`

- [ ] Card explicativa con icono de móvil + texto `Sincronizá con tu próxima app móvil`.
- [ ] **QR placeholder** (SVG estático con un patrón de QR falso, 200×200px) + texto debajo: `lucash://sync?code=DEMO123`. No escaneable de verdad.
- [ ] Toggle `Sincronización automática` deshabilitado con tooltip `Próximamente`.

### 2.5 Tab `Acerca de`

Lista vertical con separadores:

- [ ] Logo de Lucash centrado arriba (80px, color del tema actual).
- [ ] `Versión {version}` (leída de `package.json`).
- [ ] Link `Términos y condiciones` → modal placeholder con texto genérico.
- [ ] Link `Política de privacidad` → modal placeholder.
- [ ] Link `Documentación` → abre en nueva pestaña `https://github.com/.../AGENTS.md` (placeholder; ajustar al URL real del repo).
- [ ] Texto centrado al final: `Hecho con ❤️ en Venezuela`.

## 3. UI/UX (mobile-first)

### 3.1 Wireframe textual

```
/perfil (mobile, 375px) - Tab Cuenta
┌──────────────────────────────┐
│  Perfil                      │
│  [Cuenta|Prefer|Sincr|Acerca]│
├──────────────────────────────┤
│         ╭───────╮            │
│        │   LC   │  <- avatar │  <- iniciales o foto
│         ╰───────╯            │
│       [ Cambiar foto ]       │
│       [ Quitar foto  ]       │  <- solo si hay foto
│                              │
│  Nombre *                    │
│  [ Lucas Castillo      ]     │
│                              │
│  Email                       │
│  [ lucas@mail.com      ]     │
│                              │
│                              │
│  [   Cerrar sesión   ]       │  <- disabled
│                              │
│  [    Guardar         ]      │  <- sticky
└──────────────────────────────┘

Tab Preferencias
┌──────────────────────────────┐
│  Moneda preferida            │
│  [ Bs | USD ]                │
│                              │
│  Formato de fecha            │
│  [ DD/MM/YYYY | MM/DD/YYYY ] │
│                              │
│  Inicio de semana            │
│  [ Lunes | Domingo ]         │
│                              │
│  Tema                        │
│  [ Claro | Oscuro | Auto ]   │
│                              │
│  Idioma                      │
│  [ Español | Inglés ]        │  <- Inglés disabled
└──────────────────────────────┘

Tab Sincronización
┌──────────────────────────────┐
│  Sincronizá con tu próxima   │
│  app móvil                   │
│                              │
│      ┌──────────┐            │
│      │ ▒▒▒ ▒▒▒▒ │  <- QR     │
│      │ ▒ ▒▒ ▒ ▒ │            │
│      │ ▒▒▒ ▒▒ ▒ │            │
│      └──────────┘            │
│  lucash://sync?code=DEMO123  │
│                              │
│  Sincronización automática   │
│  [    off    ]   Próximamente│
└──────────────────────────────┘

Tab Acerca de
┌──────────────────────────────┐
│        ◆ Lucash              │  <- logo
│        Versión 0.1.0         │
│  ────────────────────────    │
│  Términos y condiciones   ›  │
│  Política de privacidad   ›  │
│  Documentación            ›  │
│  ────────────────────────    │
│     Hecho con ❤️ en Venezuela│
└──────────────────────────────┘
```

### 3.2 Componentes a crear

- `src/app/perfil/page.tsx` — entrypoint.
- `src/components/perfil/PerfilTabs.tsx` — segmented control de 4 tabs.
- `src/components/perfil/PerfilHeader.tsx` — header con tabs.
- `src/components/perfil/CuentaTab.tsx` — tab Cuenta.
- `src/components/perfil/PreferenciasTab.tsx` — tab Preferencias.
- `src/components/perfil/SincronizacionTab.tsx` — tab Sincronización.
- `src/components/perfil/AcercaDeTab.tsx` — tab Acerca de.
- `src/components/perfil/AvatarUploader.tsx` — foto con preview circular + fallback de iniciales.
- `src/components/perfil/QrPlaceholder.tsx` — QR estático SVG.
- `src/hooks/usePerfil.ts` — CRUD + persistencia en `localStorage` (`lucash:perfil`).
- `src/hooks/usePreferencias.ts` — lee/escribe las 5 preferencias y aplica el tema al `<html>`.

### 3.3 Estados a modelar

- `loading` — primera hidratación.
- `vacio` — sin perfil creado (raro, pero el form debe soportarlo con foco en Nombre).
- `cuenta-viendo` · `cuenta-editando` · `cuenta-guardando`.
- `preferencias-cambiando` (toast breve).
- `modal-legal` (Términos o Privacidad abierto).

### 3.4 Accesibilidad

- Tabs con `role="tablist"`, opciones como `role="tab"` con `aria-selected`.
- Avatar con `role="img"`, `aria-label="Foto de perfil de {nombre}"`.
- Inputs con `<label>` asociado.
- Errores con `aria-describedby`.
- Controles deshabilitados con `aria-disabled="true"` + `aria-describedby` apuntando al tooltip.
- Modal de legales con `role="dialog"`, `aria-modal="true"`, foco trap.

## 4. Modelo de datos (TypeScript)

```ts
// src/types/perfil.ts
import type { ISODate } from "@/lib/dates";

export type PerfilId = string & { readonly __brand: "PerfilId" };
export type AvatarDataUrl = string & { readonly __brand: "AvatarDataUrl" };

export type MonedaPreferida = "Bs" | "USD";
export type FormatoFecha = "DD/MM/YYYY" | "MM/DD/YYYY";
export type InicioSemana = "lunes" | "domingo";
export type Tema = "claro" | "oscuro" | "auto";
export type Idioma = "es" | "en";

export interface Preferencias {
  moneda: MonedaPreferida;
  formatoFecha: FormatoFecha;
  inicioSemana: InicioSemana;
  tema: Tema;
  idioma: Idioma;
}

export interface Perfil {
  id: PerfilId;
  nombre: string;                   // puede ser "" si el usuario aún no lo seteó
  email?: string;
  avatar?: AvatarDataUrl;           // base64, max 1MB
  preferencias: Preferencias;
  createdAt: string;
  updatedAt: string;
}

export const PREFERENCIAS_DEFAULT: Preferencias = {
  moneda: "Bs",
  formatoFecha: "DD/MM/YYYY",
  inicioSemana: "lunes",
  tema: "auto",
  idioma: "es",
};

export const PERFIL_SEED: Perfil = {
  id: "perfil-local" as PerfilId,
  nombre: "",                       // el usuario lo setea al primer ingreso al dashboard
  preferencias: PREFERENCIAS_DEFAULT,
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString(),
};
```

## 5. Mocks a generar

### 5.1 `src/mocks/perfil.ts`

```ts
import { PERFIL_SEED } from "@/types/perfil";

// El seed arranca con nombre vacío para forzar al usuario a setearlo
// la primera vez que entra al dashboard.
export const PERFIL_INICIAL = PERFIL_SEED;
```

### 5.2 Persistencia

- Clave en `localStorage`: `lucash:perfil`.
- Migración silenciosa con `__schemaVersion` (campo en la raíz del objeto, igual que en `/cuentas` y `/presupuestos`).

## 6. Reglas de negocio

1. **Nombre es lo único requerido** para que `/dashboard` salude con nombre real. El resto tiene defaults.
2. **Avatar ≤ 1MB**, jpg/png/webp. Se rechaza con toast si excede.
3. **Email validado** con regex simple, no se envía mail.
4. **Tema `auto`** sigue `prefers-color-scheme` del sistema y se re-evalúa al montar.
5. **Preferencias se persisten al instante** (sin botón Guardar). Cambios en Cuenta (nombre/email/avatar) sí requieren Guardar.
6. **Inglés deshabilitado en V1** — la app es 100% español.
7. **Migración silenciosa** con `__schemaVersion`.
8. **Persistencia**: `lucash:perfil`.

## 7. Casos borde

- [ ] **Sin perfil creado** → form de Cuenta con foco en input Nombre, todo lo demás con defaults.
- [ ] **Avatar > 1MB** → toast `La imagen no puede pesar más de 1MB`, se descarta.
- [ ] **Email con formato inválido** → Guardar deshabilitado, mensaje inline bajo el input.
- [ ] **Tema `auto` + cambio manual del sistema** → se re-evalúa al montar `usePreferencias`.
- [ ] **Nombre con solo espacios** → trim; si queda `""`, Guardar deshabilitado.
- [ ] **Quitar foto** → vuelve a iniciales con color aleatorio estable (basado en el id del perfil).
- [ ] **QR placeholder nunca cambia** — es fijo en V1.
- [ ] **Migración de schema** → banner discreto `Actualizamos el formato de tus datos`.

## 8. Dependencias e impacto en otras specs

- **Lee de:** nada (es standalone).
- **Impacto sobre otras specs:**
  - **`dashboard.md`**: el saludo del header lee `getPerfil().nombre`. Si está vacío o no hay perfil, usa fallback genérico (`Hola, Lucash`) + CTA. Esto ya está documentado en los cambios pendientes de `/dashboard.md` (ver Paso 2).
  - **Futuras** (`cargar.md`, `historial.md`, `presupuestos.md`, `ahorros.md`, `cuentas.md`): pueden consumir `getPreferencias()` para respetar la moneda preferida, el formato de fecha, el inicio de semana, el tema y el idioma.
- **No modela acá:** shell de navegación, autenticación real, backend real.

## 9. Fuera de alcance

- Backend real (NestJS), autenticación, sync real con la APK Android.
- Cambio de contraseña (no hay password en V1).
- Eliminación de cuenta.
- Verificación de email (se valida formato pero no se envía mail).
- Notificaciones push.
- Internacionalización real (strings hardcoded en español; el campo `idioma` queda listo para i18n futura).
- OAuth con Google/Apple/etc.
- Multi-perfil por dispositivo (1 perfil por `localStorage`).
