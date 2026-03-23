FROM oven/bun:1.3.8
WORKDIR /app
LABEL cyanprint.dev=true
EXPOSE 5553
COPY package.json .
RUN bun install
COPY . .
CMD [ "bun", "run", "index.ts" ]
