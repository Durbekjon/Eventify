# Stage 1: Base image with Node.js and yarn
FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g yarn
COPY package.json yarn.lock ./
# Copy package-lock.json as well, in case it's used, though yarn.lock should take precedence with yarn.
COPY package-lock.json ./


# Stage 2: Builder image with development dependencies and build artifacts
FROM base AS builder
# Copy the rest of the application source code
COPY . .
# Install all dependencies (including devDependencies)
RUN yarn install --frozen-lockfile
# Generate Prisma client
RUN npx prisma generate
# Build the application
RUN yarn build


# Stage 3: Production image with only necessary files
FROM node:20-alpine AS production
WORKDIR /app
# Install yarn
RUN npm install -g yarn
# Copy dependency manifests from the builder stage
COPY --from=builder /app/package.json /app/yarn.lock ./
COPY --from=builder /app/package-lock.json ./
# Install only production dependencies
RUN yarn install --prod --frozen-lockfile
# Copy built application from builder stage
COPY --from=builder /app/dist ./dist
# Copy Prisma client and schema
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
# Copy public assets
COPY --from=builder /app/public ./public

# Expose the port the app runs on
EXPOSE 4000

# Command to run the application
CMD ["node", "dist/src/main"]
