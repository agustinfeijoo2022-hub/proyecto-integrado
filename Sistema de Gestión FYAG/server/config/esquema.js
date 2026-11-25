export async function prepararEsquema(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS presupuestos (
      id SERIAL PRIMARY KEY,
      folio VARCHAR(50) NOT NULL UNIQUE,
      cliente_id VARCHAR(50) NOT NULL,
      fecha DATE NOT NULL,
      tipo VARCHAR(100) NOT NULL,
      total INTEGER NOT NULL,
      estado VARCHAR(50) NOT NULL DEFAULT 'Borrador'
    );

    CREATE TABLE IF NOT EXISTS obras (
      id SERIAL PRIMARY KEY,
      codigo VARCHAR(50) NOT NULL UNIQUE,
      nombre VARCHAR(200) NOT NULL,
      cliente_id VARCHAR(50) NOT NULL,
      presupuesto_id INTEGER,
      tipo VARCHAR(100) NOT NULL,
      tecnico_id VARCHAR(50),
      inicio DATE NOT NULL,
      avance INTEGER DEFAULT 0,
      estado VARCHAR(50) NOT NULL DEFAULT 'En proceso'
    );

    CREATE TABLE IF NOT EXISTS clientes (
      id VARCHAR(50) PRIMARY KEY,
      razon_social VARCHAR(160) NOT NULL,
      rut VARCHAR(24) UNIQUE,
      contacto VARCHAR(160) NOT NULL DEFAULT '',
      email VARCHAR(254) NOT NULL DEFAULT ''
    );

    INSERT INTO clientes (id, razon_social) VALUES
      ('c1', 'Agrovalle del Sur SpA'), ('c2', 'Frutícola Los Andes Ltda.'),
      ('c3', 'Exportadora Campo Norte'), ('c4', 'Lácteos Santa Elisa'),
      ('c5', 'Viña Cordillera SpA'), ('c6', 'Packing Central Ltda.'),
      ('c7', 'Pesquera Horizonte'), ('c8', 'Semillas del Pacífico')
    ON CONFLICT (id) DO NOTHING;

    CREATE TABLE IF NOT EXISTS facturas (
      id SERIAL PRIMARY KEY,
      obra_id INTEGER NOT NULL REFERENCES obras(id),
      folio VARCHAR(50) NOT NULL UNIQUE,
      emision DATE NOT NULL,
      vencimiento DATE NOT NULL CHECK (vencimiento >= emision),
      monto INTEGER NOT NULL CHECK (monto > 0)
    );

    CREATE TABLE IF NOT EXISTS pagos (
      id UUID PRIMARY KEY,
      factura_id INTEGER NOT NULL REFERENCES facturas(id),
      monto INTEGER NOT NULL CHECK (monto > 0),
      fecha TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS facturas_obra_idx ON facturas(obra_id);
    CREATE INDEX IF NOT EXISTS pagos_factura_idx ON pagos(factura_id);
    ALTER TABLE obras ADD COLUMN IF NOT EXISTS historial JSONB NOT NULL DEFAULT '[]'::jsonb;

    ALTER TABLE auditoria
      ADD COLUMN IF NOT EXISTS usuario TEXT,
      ADD COLUMN IF NOT EXISTS rol TEXT,
      ADD COLUMN IF NOT EXISTS recurso TEXT,
      ADD COLUMN IF NOT EXISTS http_status INTEGER;
  `);
}
