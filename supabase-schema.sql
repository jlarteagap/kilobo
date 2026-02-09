-- Tabla de cuentas
CREATE TABLE accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('BANK', 'WALLET', 'CASH', 'CRYPTO', 'OTHER')),
  balance DECIMAL(15, 2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas por tipo
CREATE INDEX idx_accounts_type ON accounts(type);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Políticas RLS (Row Level Security)
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Por ahora, permitir todas las operaciones (ajustar cuando se implemente auth)
CREATE POLICY "Allow all operations for now" ON accounts
  FOR ALL USING (true) WITH CHECK (true);
