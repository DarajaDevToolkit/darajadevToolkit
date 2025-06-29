FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfil

COPY . .

EXPOSE 3000

CMD ["bun", "run", "start"]