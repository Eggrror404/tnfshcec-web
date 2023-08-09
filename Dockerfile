FROM node:18-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

CMD ["node", "build"]
EXPOSE 3000
