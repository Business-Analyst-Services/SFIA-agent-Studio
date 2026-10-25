# Build from the repo root so the agents/ and data/ folders are included:
#   docker build -f assistant/Dockerfile -t muster .
FROM node:22-slim AS build
WORKDIR /app/assistant
COPY assistant/package*.json ./
RUN npm ci
COPY assistant/ ./
RUN npm run build && npm prune --omit=dev

FROM node:22-slim
WORKDIR /app
COPY --from=build /app/assistant /app/assistant
COPY agents /app/agents
COPY orchestrators /app/orchestrators
COPY data /app/data
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
WORKDIR /app/assistant
CMD ["node", "dist/index.js"]
