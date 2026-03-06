-- Add numero column (nullable initially for backfill)
ALTER TABLE "oportunidades" ADD COLUMN "numero" INTEGER;

-- Create sequence for new oportunidades
CREATE SEQUENCE IF NOT EXISTS "oportunidades_numero_seq";

-- Set sequence to start after max pedido numero (to avoid conflicts)
SELECT setval(
  'oportunidades_numero_seq',
  GREATEST(
    COALESCE((SELECT MAX(numero) FROM pedidos), 0),
    COALESCE((SELECT MAX(numero) FROM oportunidades), 0)
  ) + 1
);

-- Backfill: oportunidades with pedido get pedido's numero
UPDATE oportunidades o
SET numero = p.numero
FROM pedidos p
WHERE p."oportunidadeId" = o.id;

-- Backfill: oportunidades without pedido get next numbers from sequence
WITH ranked AS (
  SELECT id, nextval('oportunidades_numero_seq') AS n
  FROM oportunidades
  WHERE numero IS NULL
  ORDER BY "createdAt"
)
UPDATE oportunidades o
SET numero = r.n
FROM ranked r
WHERE o.id = r.id;

-- Make NOT NULL and set default
ALTER TABLE "oportunidades" ALTER COLUMN "numero" SET NOT NULL;
ALTER TABLE "oportunidades" ALTER COLUMN "numero" SET DEFAULT nextval('oportunidades_numero_seq');

-- Create unique index
CREATE UNIQUE INDEX "oportunidades_numero_key" ON "oportunidades"("numero");
