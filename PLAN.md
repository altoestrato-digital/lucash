# Plan de construcción — Lucash

> Plan paso a paso para implementar el frontend completo de Lucash (personal-finance webapp, Spanish UI). Siete pantallas, tipos compartidos, mocks en `localStorage`. Sigue estrictamente `/.specs/*.md` como source of truth.

---

## Fase 0 — Fundación

### 0.1  Estructura de proyecto
- Crear directorios vacíos bajo `src/`:
  - `src/lib/` — helpers puros
  - `src/types/` — tipos compartidos
  - `src/mocks/` — datos semilla
  - `src/hooks/` — lógica de estado + persistencia
  - `src/components/cuentas/`
  - `src/components/presupuestos/`
  - `src/components/cargar/`
  - `src/components/historial/`
  - `src/components/ahorros/`
  - `src/components/dashboard/`
  - `src/components/perfil/`
  - `src/components/shared/` — componentes reutilizables (SubpresupuestoChip, MoneyDisplay, etc.)

### 0.2  Tipos y helpers fundamentales (sin dependencias)
| Archivo | ¿Qué implementa? | Spec |
|---|---|---|
| `src/lib/money.ts` | `Money` branded type, `bs()`, `usd()`, `formatBs()`, `formatUsd()`, `sum()`, `sub()` | cargar.md §4 |
| `src/lib/dates.ts` | `ISODate` branded type, `toIso()`, helpers de fecha | cargar.md §4 |
| `src/types/transaccion.ts` | `TipoTransaccion`, `SubpresupuestoId`, `Adjunto`, `TasaBcv`, `Transaccion` | cargar.md §4 |
| `src/types/presupuesto.ts` | `Periodicidad`, `Prioridad`, `EstadoCobertura`, `Subpresupuesto`, `Presupuesto`, `PresupuestoSnapshot`, `CoberturaSub`, `ResumenCobertura` | presupuestos.md §4 |
| `src/types/cuenta.ts` | `CuentaId`, `MetaCuentaId`, `MovimientoCuentaId`, `TipoCuenta`, `Moneda`, `ObjetivoCuenta`, `TipoMovimientoCuenta`, `Cuenta`, `MetaCuenta`, `MovimientoCuenta`, `ResumenCuentas`, `esLiquida()`, `MONEDAS_POR_TIPO` | cuentas.md §4 |
| `src/types/perfil.ts` | `PerfilId`, `AvatarDataUrl`, `MonedaPreferida`, `FormatoFecha`, `InicioSemana`, `Tema`, `Idioma`, `Preferencias`, `Perfil`, `PREFERENCIAS_DEFAULT`, `PERFIL_SEED` | perfil.md §4 |
| `src/types/historial.ts` | `Periodo`, `FiltroHistorial`, `ResumenHistorial` | historial.md §4 |
| `src/types/dashboard.ts` | `DashboardData` (opcional, puede ser inline en el hook) | dashboard.md §4 |

### 0.3  Mocks base
- `src/mocks/bcv.ts` — `lookupBcv(fecha)`, `getTasaVigente(fecha)` con ~90 días sembrados
- `src/mocks/tasas.ts` — `lookupCripto(moneda, fecha)`, `getTasaCriptoHoy(moneda)` (USDT=1, BTC≈67000, ETH≈3500)
- `src/mocks/transacciones.ts` — array vacío exportable + `getTransacciones()`, `addTransaccion(t)` con persistencia `lucash:transacciones`

### 0.4  Hooks de infraestructura
- `src/hooks/useLocalStorage.ts` — generic hook para leer/escribir + `__schemaVersion`
- `src/lib/saldo.ts` — `calcularSaldoCuenta(cuentaId, movimientos): number`
- `src/lib/conversion.ts` — `convertirAUSD(monto, moneda, fecha)`, `convertirABs(usd)`

---

## Fase 1 — `/cuentas` (base de la arquitectura financiera)

> Dependencias: Fase 0 completa. Primera pantalla en implementarse porque provee las cuentas que todas las demás consumen.

### 1.1  Mocks
- `src/mocks/cuentas.ts` — `CUENTAS_SEED` (6 cuentas), `METAS_SEED` (2 metas), `MOVIMIENTOS_SEED` (vacío)
- Claves `localStorage`: `lucash:cuentas`, `lucash:metas-cuenta`, `lucash:movimientos-cuenta`

### 1.2  Hooks
- `src/hooks/useCuentas.ts` — CRUD + soft-delete + persistencia
- `src/hooks/useSaldoCuenta.ts` — saldo en vivo (saldo base + movimientos)
- `src/hooks/useResumenCuentas.ts` — `getResumen(cuentas, movimientos) → ResumenCuentas`
- `src/hooks/useConversion.ts` — orquesta dos `MovimientoCuenta` atómicos con `conversionId` compartido

### 1.3  Componentes
| Componente | Archivo | Notas |
|---|---|---|
| Entrypoint | `src/app/cuentas/page.tsx` | Orchestrador |
| KPIs header | `src/components/cuentas/CuentasHeader.tsx` | Total + Disponible lado a lado |
| Tabs | `src/components/cuentas/CuentasTabs.tsx` | Todas / Disponibles / Ahorro |
| Tarjeta | `src/components/cuentas/CuentaCard.tsx` | Nombre, tipo chip, moneda chip, saldo, meta bar |
| Modal CRUD | `src/components/cuentas/CuentaEditor.tsx` | Validación, tipo→moneda reset con confirmación |
| Drawer | `src/components/cuentas/CuentaDrawer.tsx` | Sheet con metas, conversiones, historial |
| Meta modal | `src/components/cuentas/MetaEditor.tsx` | Crear/editar meta, validación |
| Conversion modal | `src/components/cuentas/ConversionModal.tsx` | Input monto, destino, tasa editable, preview |
| Tasa field | `src/components/cuentas/TasaConversionField.tsx` | Input editable con valor sugerido |
| Movimiento list | `src/components/cuentas/MovimientoCuentaList.tsx` | Cronológico, paginación |
| Empty state | `src/components/cuentas/CuentasEmptyState.tsx` | CTA [+ Crear primera cuenta] |

### 1.4  Verificar
- `pnpm dev` y navegar a `/cuentas` — ver las 6 cuentas seed, KPIs, filtros por tab
- Crear/editar/soft-delete cuenta
- Crear/editar/cumplir meta
- Conversion modal → dos movimientos con mismo `conversionId`

---

## Fase 2 — `/presupuestos`

> Dependencias: Fase 0 (tipos, mocks base). No depende de `/cuentas` para lógica core.

### 2.1  Mocks
- `src/mocks/presupuestos.ts` — `PRESUPUESTO_SEED` (4 sub-presupuestos, límites, prioridades)
- Extender `src/mocks/transacciones.ts` — ~12 tx del mes con `subPresupuestoId` distribuidos
- Claves `localStorage`: `lucash:presupuesto-principal`, `lucash:presupuesto-snapshots`

### 2.2  Hooks
- `src/hooks/usePresupuesto.ts` — CRUD + persistencia, creación de snapshots
- `src/hooks/useCobertura.ts` — wrapper memoizado de `calcularCobertura()`
- `src/hooks/usePeriodoCerrado.ts` — detecta `hoy > fechaFin`, dispara banner
- `src/lib/cobertura.ts` — `calcularCobertura(p, txs, disponibleCuentas?) → ResumenCobertura`
- `src/lib/presupuesto-fechas.ts` — `calcularRangoPeriodo(desde, periodicidad, quincenaCorteDia?)`

### 2.3  Componentes
| Componente | Archivo | Notas |
|---|---|---|
| Entrypoint | `src/app/presupuestos/page.tsx` | Tabs Resumen/Editar |
| Tabs | `src/components/presupuestos/PresupuestosTabs.tsx` | Segmented control |
| Resumen | `src/components/presupuestos/PresupuestoResumen.tsx` | Layout de la pestaña |
| Dona doble | `src/components/presupuestos/PresupuestoDona.tsx` | SVG doble anillo |
| Banner | `src/components/presupuestos/CoberturaBanner.tsx` | Mensaje dinámico (4 estados) |
| Sub card | `src/components/presupuestos/SubpresupuestoCard.tsx` | Mini-barra + estado |
| Editor | `src/components/presupuestos/PresupuestoEditor.tsx` | Form de la pestaña Editar |
| Sub editor | `src/components/presupuestos/SubpresupuestoEditor.tsx` | Modal crear/editar sub |
| Sub row | `src/components/presupuestos/SubpresupuestoRow.tsx` | Fila en lista Editar |
| Periodicidad | `src/components/presupuestos/PeriodicidadSelect.tsx` | 5 opciones |
| Color picker | `src/components/presupuestos/ColorPicker.tsx` | Paleta 8 colores (reutilizable en /cuentas) |
| Prioridad | `src/components/presupuestos/PrioridadControl.tsx` | Segmented 1/2/3 |
| Snapshot | `src/components/presupuestos/SnapshotBanner.tsx` | Banner de periodo cerrado, acción "Empezar nuevo" |
| Color picker | `src/components/shared/ColorPicker.tsx` | Versión compartida (mover si ya se creó en Fase 1) |

### 2.4  Verificar
- Resumen con dona doble (cobertura interior, gastos exterior)
- Banner dinámico y cobertura por sub
- Editar presupuesto, crear/editar/eliminar sub (soft-delete)
- Recurrencia al cerrar periodo
- Sub con prioridad + orden

---

## Fase 3 — `/perfil`

> Dependencias: Fase 0 (tipos). Independiente de otras pantallas.

### 3.1  Mocks
- `src/mocks/perfil.ts` — `PERFIL_INICIAL` (seed con nombre vacío)
- Clave `localStorage`: `lucash:perfil`

### 3.2  Hooks
- `src/hooks/usePerfil.ts` — CRUD + persistencia, validación email/avatar
- `src/hooks/usePreferencias.ts` — lee/escribe las 5 preferencias, aplica tema al `<html>`

### 3.3  Componentes
| Componente | Archivo | Notas |
|---|---|---|
| Entrypoint | `src/app/perfil/page.tsx` | 4 tabs |
| Tabs | `src/components/perfil/PerfilTabs.tsx` | Cuenta / Preferencias / Sincronización / Acerca de |
| Header | `src/components/perfil/PerfilHeader.tsx` | Título + tabs |
| Tab Cuenta | `src/components/perfil/CuentaTab.tsx` | Nombre, email, avatar, Cerrar sesión (disabled) |
| Tab Preferencias | `src/components/perfil/PreferenciasTab.tsx` | 5 controles instant-save |
| Tab Sincronización | `src/components/perfil/SincronizacionTab.tsx` | QR placeholder + toggle disabled |
| Tab Acerca de | `src/components/perfil/AcercaDeTab.tsx` | Logo, versión, 3 links legales |
| Avatar uploader | `src/components/perfil/AvatarUploader.tsx` | Preview circular + iniciales fallback |
| QR placeholder | `src/components/perfil/QrPlaceholder.tsx` | SVG estático 200×200 |
| Modal legal | `src/components/perfil/LegalModal.tsx` | Modal placeholder Términos/Privacidad |

### 3.4  Verificar
- Perfil con nombre vacío → saludo genérico en dashboard
- Avatar upload ≤ 1MB, jpg/png/webp
- Preferencias persisten al instante
- Inglés deshabilitado
- Tema `auto` sigue `prefers-color-scheme`

---

## Fase 4 — `/cargar`

> Dependencias: Fase 1 (cuentas → cuentaId), Fase 2 (presupuesto → sub-presupuestos, límite mensual), Fase 0 (tipos, mocks).

### 4.1  Mocks
- `src/mocks/ocr.ts` — `useUploadOcr()` simula 1500ms, devuelve `emitente: "Mercado Libre"`, `concepto: "Compra de supermercado"`, `montoBs: bs(1250)`
- Clave local: `lucash:form-borrador`

### 4.2  Hooks
- `src/hooks/useUploadOcr.ts` — mock OCR
- `src/hooks/useBcvLookup.ts` — consulta `lookupBcv(fecha)` en vivo
- `src/hooks/useCargarForm.ts` — estado del formulario, validación, persistencia de borrador

### 4.3  Componentes
| Componente | Archivo | Notas |
|---|---|---|
| Entrypoint | `src/app/cargar/page.tsx` | Home con 2 botones |
| Home | `src/components/cargar/CargarHome.tsx` | [+ Ingreso] verde / [- Egreso] rojo |
| Method modal | `src/components/cargar/CargarMethodModal.tsx` | Cámara / Explorar / Manual |
| Form | `src/components/cargar/CargarForm.tsx` | Todos los campos, sticky Guardar |
| Sub select | `src/components/cargar/SubpresupuestoSelect.tsx` | Chip de color + "Presupuesto general" |
| Receipt | `src/components/cargar/ReceiptThumbnail.tsx` | Preview imagen / icono PDF |
| Tasa field | `src/components/cargar/TasaBcvField.tsx` | Auto candado / editable |
| Cuenta select | `src/components/cargar/CuentaSelect.tsx` | Reemplaza MetodoPagoSelect, poblado de getCuentasActivas() |
| Excedente dialog | `src/components/cargar/ExcedenteDialog.tsx` | Lista destinos ahorro + "Crear cuenta" shortcut |
| Ahorro warning | `src/components/cargar/UsoAhorroWarning.tsx` | Alerta si cuenta destino es objetivo:"ahorro" |

### 4.4  Verificar
- Elegir Ingreso/Egreso → form con placeholder dinámico
- OCR simulado pre-rellena campos
- Tasa BCV auto para fecha, editable si no hay
- Sub-presupuesto select con chips de color
- Cuenta select poblado de cuentas activas
- ExcedenteDialog al guardar Ingreso que supera límite
- Si no hay cuentas de ahorro → "Crear cuenta de ahorro" shortcut

---

## Fase 5 — `/historial`

> Dependencias: Fase 4 (transacciones), Fase 1 (cuentas → cuentaId en filtro), Fase 2 (presupuesto → rango, periodicidad), Fase 0 (tipos).

### 5.1  Hooks
- `src/hooks/useHistorial.ts` — filtra txs por periodo + tipo + sub + cuenta, devuelve `Transaccion[]` + `ResumenHistorial`
- `src/lib/periodo.ts` — `getRangoPorPresupuesto(p)`, `etiquetaRango(p)`
- Persiste filtros en `lucash:filtros-historial`

### 5.2  Componentes
| Componente | Archivo | Notas |
|---|---|---|
| Entrypoint | `src/app/historial/page.tsx` | Orchestrador |
| Header | `src/components/historial/HistorialHeader.tsx` | Título + contador + rango |
| Periodo selector | `src/components/historial/PeriodoSelector.tsx` | 3 segmentos + date pickers en Rango libre |
| Resumen | `src/components/historial/HistorialResumen.tsx` | Ingresos/Egresos/Balance del subconjunto |
| Filters sheet | `src/components/historial/HistorialFilters.tsx` | Bottom sheet: tipo, sub, cuenta |
| Active chips | `src/components/historial/ActiveFilterChips.tsx` | Chips removibles |
| Tx list | `src/components/historial/TransaccionList.tsx` | Agrupada por día |
| Tx row | `src/components/historial/TransaccionRow.tsx` | Fecha, emisor/concepto, chip sub, monto, cuenta |
| Sub chip | `src/components/shared/SubpresupuestoChip.tsx` | Chip con color (reutilizable) |
| Tx drawer | `src/components/historial/TransaccionDrawer.tsx` | Sheet de detalle completo |
| Empty state | `src/components/historial/HistorialEmptyState.tsx` | Sin datos / con filtros |

### 5.3  Verificar
- Periodo Por presupuesto = rango del presupuesto activo
- Rango libre con validación desde ≤ hasta, hasta ≤ hoy
- Filtros combinables, chips removibles, limpiar filtros
- Resumen sobre subconjunto filtrado
- Tx row con chip sub (color) + nombre cuenta
- Sub-presupuesto eliminado → chip genérico gris

---

## Fase 6 — `/ahorros`

> Dependencias: Fase 1 (cuentas, metas, movimientos), Fase 4 (excedente → esRedireccionExcedente). Es un filtro sobre `/cuentas`.

### 6.1  Hooks
- `src/hooks/useCuentasAhorro.ts` — `getCuentasAhorro(cuentas)`, `getRedireccionesRecientes(cuentaId, movimientos, 7d)`

### 6.2  Componentes
| Componente | Archivo | Notas |
|---|---|---|
| Entrypoint | `src/app/ahorros/page.tsx` | Lista filtrada |
| Header | `src/components/ahorros/AhorrosHeader.tsx` | KPI total ahorrado + toggle Bs/USD |
| Card | `src/components/ahorros/CuentaAhorroCard.tsx` | Derivada de CuentaCard + badge excedente |
| Redirecciones | `src/components/ahorros/RedireccionesRecientes.tsx` | Sección extra en CuentaDrawer |
| Empty state | `src/components/ahorros/AhorrosEmptyState.tsx` | CTA [+ Crear cuenta de ahorro] |

### 6.3  Verificar
- Solo cuentas con `objetivo: "ahorro"`
- Badge excedente para movimientos de ≤7 días
- Toggle Bs/USD recalcula en vivo
- FAB abre CuentaEditor con objetivo pre-seteado

---

## Fase 7 — `/dashboard`

> Dependencias: Fase 1 (cuentas → disponible, getResumenCuentas), Fase 2 (presupuesto → cobertura), Fase 4+5 (transacciones → gastado mes, últimos movimientos), Fase 3 (perfil → saludo). Última pantalla porque consume de todas.

### 7.1  Hooks
- `src/hooks/useDashboardData.ts` — composición: lee cuentas, presupuesto, transacciones, perfil; calcula KPIs. Navegación cruzada (cada KPI linkea a su pantalla de origen).

### 7.2  Componentes
| Componente | Archivo | Notas |
|---|---|---|
| Entrypoint | `src/app/dashboard/page.tsx` | Scroll vertical |
| Header | `src/components/dashboard/DashboardHeader.tsx` | Saludo + "Resumen del mes" |
| KPI strip | `src/components/dashboard/KpiStrip.tsx` | 3 KPIs horizontal scroll |
| KPI card | `src/components/dashboard/KpiCard.tsx` | Clickable, color dinámico |
| Gastos por sub | `src/components/dashboard/GastosPorSub.tsx` | Dona central + lista vertical de tarjetas |
| Últimos mov | `src/components/dashboard/UltimosMovimientos.tsx` | Top 5, reusa TransaccionRow |
| Test imprevisto | `src/components/dashboard/TestImprevisto.tsx` | Input + cálculo + sugerencia de cuentas |
| FAB | `src/components/shared/FabCargar.tsx` | [+ Cargar transacción] sticky |

### 7.3  Verificar
- Saludo personalizado (perfil.nombre o "Hola, Lucash")
- 3 KPIs: Disponible (verde/rojo), Presupuesto cubierto (rojo/amarillo/verde), Gastado mes
- Dona centrada con lista de tarjetas verticales debajo
- Últimas 5 transacciones, tap abre drawer
- Test imprevisto: 3 estados + sugerencia de cuentas no líquidas
- Empty states: sin cuentas, sin presupuesto, sin transacciones
- FAB navega a `/cargar`

---

## Fase 8 — Pulido y verificación final

### 8.1  Shared components
- Subir a `src/components/shared/` todos los componentes reutilizados:
  - `SubpresupuestoChip.tsx`
  - `TransaccionRow.tsx` (usado en dashboard e historial)
  - `TransaccionDrawer.tsx` (usado en historial y dashboard)
  - `FabCargar.tsx` (usado en dashboard, historial, etc.)
  - `MoneyDisplay.tsx` — formatea Money según preferencias
  - `ColorPicker.tsx` — paleta 8 colores (usado en cuentas y presupuestos)

### 8.2  Routing
- Verificar que las 7 rutas existen en `src/app/`:
  - `src/app/page.tsx` — redirige a `/dashboard` (o landing mínima)
  - `src/app/dashboard/page.tsx`
  - `src/app/presupuestos/page.tsx`
  - `src/app/historial/page.tsx`
  - `src/app/cargar/page.tsx`
  - `src/app/ahorros/page.tsx`
  - `src/app/cuentas/page.tsx`
  - `src/app/perfil/page.tsx`

### 8.3  Navegación
- Crear shell de navegación global (bottom-tabs o top-nav) que conecte las 7 rutas
- Usar `next/link` o `useRouter`, sin librería externa
- Activar prefetch de las rutas principales

### 8.4  Verificación final
```bash
pnpm dev       # Iniciar servidor
pnpm lint      # ESLint — resolver advertencias
pnpm build     # Build production — no debe fallar
```

### 8.5  Lo que NO se hace en V1
- Backend real (NestJS)
- Autenticación / multi-usuario
- Sincronización real con APK Android
- Edición/eliminación de transacciones
- Exportación CSV/PDF
- Búsqueda full-text
- Drag-and-drop reordenar sub
- Notificaciones push
- Internacionalización real (Inglés disabled)
- Multi-perfil por dispositivo

---

## Resumen de orden

| Fase | Pantalla | Depende de | Archivos a crear |
|---|---|---|---|
| 0 | Fundación | — | ~15 archivos (types, lib, mocks base) |
| 1 | `/cuentas` | Fase 0 | ~18 archivos (hooks, componentes, mocks) |
| 2 | `/presupuestos` | Fase 0 | ~18 archivos |
| 3 | `/perfil` | Fase 0 | ~13 archivos |
| 4 | `/cargar` | Fases 1, 2 | ~14 archivos |
| 5 | `/historial` | Fases 1, 2, 4 | ~14 archivos |
| 6 | `/ahorros` | Fase 1, 4 | ~7 archivos |
| 7 | `/dashboard` | Fases 1-5 | ~9 archivos |
| 8 | Pulido | Todas | ~6 archivos compartidos + navegación |

**Total estimado:** ~110-120 archivos de código fuente nuevos.
