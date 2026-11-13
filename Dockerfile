FROM node:20-alpine
WORKDIR /app

# Install dependencies first for better Docker layer caching
COPY package*.json ./
RUN npm install --production

# Copy application source and pre-create SaveData directory
COPY . .
RUN mkdir -p /app/SaveData

EXPOSE 8080
CMD ["node", "server.js"]