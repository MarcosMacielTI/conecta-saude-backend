FROM node:20-bullseye-slim

# Install dumb-init for proper signal handling
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init && rm -rf /var/lib/apt/lists/*

# Create a non-root user
RUN groupadd -r nodejs && useradd -r -g nodejs -u 1001 nextjs

WORKDIR /usr/src/app

# Create logs directory and set permissions
RUN mkdir -p /usr/src/app/logs && chown -R nextjs:nodejs /usr/src/app

COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY . ./

USER nextjs

ENV NODE_ENV=production
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "index.js"]
