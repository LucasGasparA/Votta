FROM node:20-alpine

WORKDIR /app

# Instala openssl, que é necessário para o Prisma no Alpine
RUN apk update && apk add openssl

# Copia arquivos de dependência
COPY package*.json ./
COPY prisma ./prisma/

# Instala dependências
RUN npm install

# Copia o restante do código
COPY . .

# Expõe a porta do backend
EXPOSE 4000

# Executa o prisma generate, db push e depois sobe o servidor dev
CMD ["sh", "-c", "npx prisma generate && npx prisma db push && npm run dev"]
