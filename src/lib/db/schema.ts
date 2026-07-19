export const SCHEMA_VERSION = 7;

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS usuario (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT,
  contrasena_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS perfil (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL DEFAULT 'default',
  nombre TEXT NOT NULL DEFAULT '',
  email TEXT,
  avatar TEXT,
  preferencias TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cuenta (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL DEFAULT 'default',
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL,
  moneda TEXT NOT NULL,
  saldo REAL NOT NULL,
  objetivo TEXT NOT NULL,
  color TEXT NOT NULL,
  activo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS meta_cuenta (
  id TEXT PRIMARY KEY,
  cuenta_id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  monto_objetivo REAL NOT NULL,
  fecha_meta TEXT,
  notas TEXT,
  cumplida_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (cuenta_id) REFERENCES cuenta(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS movimiento_cuenta (
  id TEXT PRIMARY KEY,
  cuenta_id TEXT NOT NULL,
  tipo TEXT NOT NULL,
  monto REAL NOT NULL,
  moneda_cuenta TEXT NOT NULL DEFAULT 'Bs',
  saldo_previo REAL NOT NULL DEFAULT 0,
  saldo_posterior REAL NOT NULL DEFAULT 0,
  conversion_id TEXT,
  cuenta_contraparte_id TEXT,
  tasa_usd_por_moneda REAL,
  fecha TEXT NOT NULL,
  descripcion TEXT,
  es_redireccion_excedente INTEGER,
  transaccion_origen_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (cuenta_id) REFERENCES cuenta(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS presupuesto (
  id TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL DEFAULT 'default',
  nombre TEXT NOT NULL DEFAULT 'Presupuesto general',
  periodicidad TEXT NOT NULL DEFAULT 'mensual',
  ingreso_esperado REAL NOT NULL,
  ingreso_esperado_moneda TEXT NOT NULL DEFAULT 'Bs',
  gasto_maximo_esperado REAL NOT NULL DEFAULT 0,
  gasto_maximo_esperado_moneda TEXT NOT NULL DEFAULT 'Bs',
  fecha_inicio TEXT NOT NULL,
  fecha_fin TEXT NOT NULL,
  quincena_corte_dia INTEGER,
  cerrado INTEGER NOT NULL DEFAULT 0,
  cerrado_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subpresupuesto (
  id TEXT PRIMARY KEY,
  presupuesto_id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  color TEXT NOT NULL,
  limite REAL NOT NULL,
  limite_moneda TEXT NOT NULL DEFAULT 'Bs',
  prioridad INTEGER NOT NULL,
  recurrente INTEGER NOT NULL,
  orden INTEGER NOT NULL DEFAULT 0,
  activo INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (presupuesto_id) REFERENCES presupuesto(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS snapshot_presupuesto (
  id TEXT PRIMARY KEY,
  presupuesto_id TEXT NOT NULL,
  periodo_inicio TEXT NOT NULL,
  periodo_fin TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (presupuesto_id) REFERENCES presupuesto(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transaccion (
  id TEXT PRIMARY KEY,
  tipo TEXT NOT NULL,
  fecha TEXT NOT NULL,
  emisor_receptor TEXT NOT NULL,
  concepto TEXT NOT NULL DEFAULT '',
  monto_original REAL NOT NULL,
  moneda_original TEXT NOT NULL,
  monto_bs REAL NOT NULL,
  monto_usd REAL NOT NULL DEFAULT 0,
  tasa_oficial REAL NOT NULL DEFAULT 0,
  tasa_paralelo REAL NOT NULL DEFAULT 0,
  cuenta_id TEXT NOT NULL,
  saldo_previo REAL NOT NULL DEFAULT 0,
  saldo_posterior REAL NOT NULL DEFAULT 0,
  descripcion TEXT,
  sub_presupuesto_id TEXT,
  adjunto TEXT,
  fuente_ocr INTEGER NOT NULL DEFAULT 0,
  uso_ahorro_confirmado INTEGER,
  es_redireccion_excedente INTEGER,
  activa INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (cuenta_id) REFERENCES cuenta(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tasa_bcv (
  fecha TEXT PRIMARY KEY,
  tasa REAL NOT NULL,
  fuente TEXT,
  fetched_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasa_cripto (
  moneda TEXT NOT NULL,
  fecha TEXT NOT NULL,
  precio_usd REAL NOT NULL,
  fuente TEXT,
  fetched_at TEXT NOT NULL,
  PRIMARY KEY (moneda, fecha)
);

CREATE TABLE IF NOT EXISTS tasa_dolarapi (
  fecha TEXT NOT NULL,
  fuente TEXT NOT NULL,
  valor REAL NOT NULL,
  fetched_at TEXT NOT NULL,
  PRIMARY KEY (fecha, fuente)
);

CREATE INDEX IF NOT EXISTS idx_cuenta_activo ON cuenta(activo);
CREATE INDEX IF NOT EXISTS idx_movimiento_cuenta ON movimiento_cuenta(cuenta_id);
CREATE INDEX IF NOT EXISTS idx_meta_cuenta_cuenta ON meta_cuenta(cuenta_id);
CREATE INDEX IF NOT EXISTS idx_subpresupuesto_presupuesto ON subpresupuesto(presupuesto_id);
CREATE INDEX IF NOT EXISTS idx_transaccion_fecha ON transaccion(fecha);
CREATE INDEX IF NOT EXISTS idx_transaccion_cuenta ON transaccion(cuenta_id);
CREATE INDEX IF NOT EXISTS idx_tasa_dolarapi_fecha ON tasa_dolarapi(fecha);
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuario_email ON usuario(email) WHERE email IS NOT NULL;
`;
