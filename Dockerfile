FROM node:20-alpine

WORKDIR /app

# Copia arquivos de dependência
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia o restante do código
COPY . .

# Expõe a porta do Vite
EXPOSE 3000

# Executa o Vite ouvindo em todas as interfaces
CMD ["npm", "run", "dev", "--", "--host"]
