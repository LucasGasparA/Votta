# Deploy de Produção

## Back-end

Variáveis obrigatórias:

- `DATABASE_URL`
- `JWT_SECRET` com no mínimo 32 caracteres
- `FRONTEND_URL`
- `APP_URL`

Variáveis opcionais:

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- `GCP_PROJECT_ID`, `GCP_LOCATION`, `GCP_MODEL`, `GCP_CREDENTIALS_JSON`
- `RAG_ENABLED`, `RAG_TIMEOUT_MS`, `RAG_RESULTS`, `CHROMA_DIR`, `PYTHON_BIN`

Em produção, aplique schema com:

```bash
npx prisma migrate deploy
```

Não use `prisma db push --accept-data-loss` em produção.

## Front-end

Variável obrigatória:

- `VITE_API_URL`, por exemplo `https://api.seudominio.com/api`

Build:

```bash
npm run build
```

## Docker

Use `Back/Dockerfile` e `Front/Dockerfile` para produção. Os arquivos `Dockerfile.dev` são apenas para desenvolvimento local.
