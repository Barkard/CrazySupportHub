#!/bin/sh
set -e

echo "==> Verificando y sincronizando esquema de base de datos con Prisma..."
if [ -n "$DATABASE_URL" ]; then
  npx prisma db push --skip-generate || echo "⚠️ Advertencia: No se pudo sincronizar el esquema automáticamente en este paso."
fi

echo "==> Iniciando servidor backend..."
exec "$@"
