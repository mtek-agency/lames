#!/bin/sh
set -e

# Réplication continue vers R2 (§7.3 CDCF), seulement si les credentials sont
# fournies (absentes en dev local tant que les buckets R2 n'existent pas).
if [ -n "$R2_BACKUP_BUCKET" ] && [ -n "$R2_ACCOUNT_ID" ] && [ -n "$R2_BACKUP_ACCESS_KEY_ID" ] && [ -n "$R2_BACKUP_SECRET_ACCESS_KEY" ]; then
  echo "litestream: réplication R2 activée (bucket=$R2_BACKUP_BUCKET)"
  exec litestream replicate -config /pb/litestream.yml -exec "/pb/pocketbase serve --http=0.0.0.0:8090"
fi

echo "litestream: variables R2_BACKUP_* absentes, PocketBase démarre sans réplication"
exec /pb/pocketbase serve --http=0.0.0.0:8090
