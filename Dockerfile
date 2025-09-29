# ---- Base Node image ----
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /usr/src/app

# ---- Dependencies ----
FROM base AS deps
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# ---- Build ----
FROM deps AS build
COPY . .
RUN npx prisma generate
RUN yarn build

# ---- Production ----
FROM base AS prod
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# Copy production dependencies only
COPY --from=build /usr/src/app/package.json ./package.json
COPY --from=deps /usr/src/app/node_modules ./node_modules

# Copy build artifacts
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /usr/src/app/prisma ./prisma

# Change ownership to non-root user
RUN chown -R nestjs:nodejs /usr/src/app
USER nestjs

EXPOSE 3001
CMD ["node", "dist/src/main"]
   