FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

ENV PORT=3001
EXPOSE 3001

CMD ["node", "server.js"]
