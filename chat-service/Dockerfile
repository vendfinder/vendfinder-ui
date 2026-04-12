FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install --production

COPY . .

EXPOSE 3005

# Debug: List files to ensure lib directory is included
RUN ls -la ./
RUN ls -la ./lib/ || echo "lib directory not found"

CMD ["node", "index.js"]
