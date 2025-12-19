-- ============================================
-- ESQUEMA SUPABASE PARA PLANIFICADOR FESTIVOS
-- ============================================
-- Este archivo contiene las sentencias SQL para crear las tablas necesarias
-- Ejecutar en el SQL Editor de Supabase

-- ============================================
-- TABLA: festivos
-- ============================================
CREATE TABLE IF NOT EXISTS festivos (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  fecha DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_festivos_fecha ON festivos(fecha);

COMMENT ON TABLE festivos IS 'Días festivos individuales (Navidad, Año Nuevo, etc.)';
COMMENT ON COLUMN festivos.nombre IS 'Nombre del festivo';
COMMENT ON COLUMN festivos.fecha IS 'Fecha del festivo';

-- ============================================
-- TABLA: planes_festivos
-- ============================================
CREATE TABLE IF NOT EXISTS planes_festivos (
  id BIGSERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_planes_fechas ON planes_festivos(fecha_inicio, fecha_fin);

COMMENT ON TABLE planes_festivos IS 'Planes de festivos (puentes, rangos de planificación)';
COMMENT ON COLUMN planes_festivos.nombre IS 'Nombre del plan (ej: Puente Navidad)';
COMMENT ON COLUMN planes_festivos.fecha_inicio IS 'Fecha de inicio del rango';
COMMENT ON COLUMN planes_festivos.fecha_fin IS 'Fecha de fin del rango';

-- ============================================
-- TABLA: entregas
-- ============================================
CREATE TABLE IF NOT EXISTS entregas (
  id BIGSERIAL PRIMARY KEY,
  plataforma_id BIGINT NOT NULL REFERENCES plataformas(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  entrega BOOLEAN NOT NULL DEFAULT true,
  fecha_recepcion DATE,
  hora_recepcion TIME,
  empresa_transporte TEXT,
  fecha_fabricacion DATE,
  notas_fabricacion TEXT,
  fecha_carga DATE,
  comentarios_transporte TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entregas_plataforma ON entregas(plataforma_id);
CREATE INDEX IF NOT EXISTS idx_entregas_fecha ON entregas(fecha);
CREATE INDEX IF NOT EXISTS idx_entregas_plataforma_fecha ON entregas(plataforma_id, fecha);

COMMENT ON TABLE entregas IS 'Registro de entregas por plataforma y fecha';
COMMENT ON COLUMN entregas.plataforma_id IS 'Referencia a la plataforma/cliente';
COMMENT ON COLUMN entregas.fecha IS 'Fecha de la entrega';
COMMENT ON COLUMN entregas.entrega IS 'true = entrega, false = NO ENTREGA';
COMMENT ON COLUMN entregas.fecha_recepcion IS 'Fecha de recepción';
COMMENT ON COLUMN entregas.hora_recepcion IS 'Hora de recepción';
COMMENT ON COLUMN entregas.empresa_transporte IS 'Empresa de transporte';
COMMENT ON COLUMN entregas.fecha_fabricacion IS 'Fecha de fabricación';
COMMENT ON COLUMN entregas.notas_fabricacion IS 'Notas de fabricación';
COMMENT ON COLUMN entregas.fecha_carga IS 'Fecha de carga';
COMMENT ON COLUMN entregas.comentarios_transporte IS 'Comentarios de transporte';

-- ============================================
-- POLÍTICAS RLS (Row Level Security) - OPCIONAL
-- ============================================
-- Si necesitas control de acceso, descomenta y ajusta estas políticas

-- ALTER TABLE festivos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE planes_festivos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE entregas ENABLE ROW LEVEL SECURITY;

-- Ejemplo: Permitir lectura pública, escritura solo a usuarios autenticados
-- CREATE POLICY "Public can read festivos" ON festivos FOR SELECT USING (true);
-- CREATE POLICY "Authenticated can write festivos" ON festivos FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- TRIGGER: Actualizar updated_at en entregas
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_entregas_updated_at
  BEFORE UPDATE ON entregas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DATOS DE PRUEBA (OPCIONAL)
-- ============================================
-- Descomenta para insertar datos de ejemplo

-- INSERT INTO festivos (nombre, fecha) VALUES
--   ('Navidad', '2024-12-25'),
--   ('Año Nuevo', '2025-01-01'),
--   ('Reyes', '2025-01-06');

-- INSERT INTO planes_festivos (nombre, fecha_inicio, fecha_fin) VALUES
--   ('Puente Navidad', '2024-12-24', '2024-12-26'),
--   ('Puente Año Nuevo', '2024-12-31', '2025-01-02');

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public'
-- AND table_name IN ('festivos', 'planes_festivos', 'entregas');
