FROM node:18-alpine

WORKDIR /app

# Copy package files from the running service (we'll extract these)
COPY package.json package-lock.json* ./

# Install dependencies (including google-auth-library)
RUN npm install --production

# Copy application code
COPY . .

EXPOSE 3004

CMD ["node", "index.js"]
