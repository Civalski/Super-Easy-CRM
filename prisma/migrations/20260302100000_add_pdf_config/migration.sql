CREATE TABLE "pdf_config" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nomeEmpresa" TEXT,
    "nomeVendedor" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "site" TEXT,
    "rodape" TEXT,
    "corPrimaria" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pdf_config_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "pdf_config_userId_key" ON "pdf_config"("userId");

ALTER TABLE "pdf_config" ADD CONSTRAINT "pdf_config_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
