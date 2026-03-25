---
id: "02-docker-basics"
title: "Docker Basics"
type: "code"
xp: 30
difficulty: 3
order: 2
prerequisites: ["01-deployment-concepts"]
hints:
  - "Start the build stage with FROM node:20-slim AS build and set WORKDIR /app."
  - "Copy package.json and the lockfile first, then run pnpm install — this optimizes Docker caching."
  - "After installing dependencies, COPY the rest of the source and run pnpm build."
  - "Start the production stage with FROM node:20-slim AS production and COPY --from=build to grab the build output."
---

# Docker Basics

In the previous lesson, you learned about deployment concepts. Now let's talk about one of the most important tools in modern deployment: **Docker**. Docker ensures that your app runs the same way on every machine — your laptop, your teammate's laptop, the staging server, and the production server.

## What Is Docker?

Docker is a tool that lets you package your application and all of its dependencies into a **container** — a lightweight, isolated environment that runs consistently everywhere.

### The Problem Docker Solves

You have probably heard (or said) the phrase: "It works on my machine." This happens because your development machine has a specific version of Node.js, specific system libraries, and specific configurations that may differ from the production server.

Docker eliminates this problem by packaging everything your app needs into a single, portable unit. The container includes:
- The operating system (usually a minimal Linux distribution)
- The runtime (Node.js 20, for example)
- Your application's dependencies (`node_modules`)
- Your application's built code
- The command to start your app

If it runs in the container on your machine, it will run in the container on any machine.

### Images vs Containers

These two terms are often confused. Think of it this way:

- An **image** is a blueprint — like a recipe. It defines what goes into the container.
- A **container** is a running instance of an image — like the dish you cook from the recipe.

You can create multiple containers from the same image, just like you can cook multiple dishes from the same recipe. Each container is independent and isolated.

```bash
# Build an image from a Dockerfile
docker build -t my-app .

# Run a container from that image
docker run -p 3000:3000 my-app

# Run another container from the same image
docker run -p 3001:3000 my-app
```

## Writing a Dockerfile

A **Dockerfile** is a text file that contains the instructions for building a Docker image. Each instruction creates a **layer** in the image.

### Basic Dockerfile

Let's start with a simple Dockerfile for a Node.js app:

```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

Let's break down each instruction:

### FROM

```dockerfile
FROM node:20-slim
```

Every Dockerfile starts with `FROM`. This specifies the **base image** — the starting point for your container. `node:20-slim` is an official Node.js image based on Debian Linux, with Node.js 20 pre-installed.

The `-slim` variant is smaller than the full image because it omits development tools you do not need in production. There is also an `-alpine` variant based on Alpine Linux, which is even smaller but can cause compatibility issues with some native Node.js packages.

### WORKDIR

```dockerfile
WORKDIR /app
```

Sets the working directory for all subsequent instructions. This is like running `cd /app` — all `COPY`, `RUN`, and `CMD` commands will execute relative to this directory.

### COPY

```dockerfile
COPY package.json pnpm-lock.yaml ./
```

Copies files from your local machine into the container. The `./` at the end means "copy to the current working directory" (which is `/app` because of `WORKDIR`).

### RUN

```dockerfile
RUN corepack enable && pnpm install --frozen-lockfile
```

Executes a command during the build process. This runs `pnpm install` to install your dependencies inside the container.

The `--frozen-lockfile` flag is critical for production: it ensures the install uses the exact versions from your lockfile and fails if the lockfile is out of date. This prevents "works on my machine" issues caused by version drift.

### EXPOSE

```dockerfile
EXPOSE 3000
```

Documents which port the container will listen on. This does not actually publish the port — it is metadata. When running the container, you still need `-p 3000:3000` to map the host port to the container port.

### CMD

```dockerfile
CMD ["node", ".output/server/index.mjs"]
```

Specifies the command that runs when the container starts. This is the entry point of your application. The array syntax (called "exec form") is preferred over the string syntax because it handles signals correctly, which matters for graceful shutdown.

## Multi-Stage Builds

The basic Dockerfile above works, but it has a problem: the final image contains everything from the build process — `node_modules`, source files, TypeScript files, dev dependencies. This makes the image much larger than necessary.

A **multi-stage build** solves this by using separate stages for building and running.

### Why Multi-Stage?

Consider what your production server actually needs to run:
- The built JavaScript output (`.output/` directory)
- Node.js runtime
- That is it.

It does **not** need:
- Your source TypeScript files
- `node_modules` (the build already bundled everything)
- Development dependencies (vitest, eslint, etc.)
- The pnpm cache

A multi-stage build uses a "build" stage to compile your app and a "production" stage that only copies the final output:

```dockerfile
# Stage 1: Build
FROM node:20-slim AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Stage 2: Production
FROM node:20-slim AS production
WORKDIR /app
COPY --from=build /app/.output ./.output
EXPOSE 3000
ENV PORT=3000
CMD ["node", ".output/server/index.mjs"]
```

The `AS build` names the first stage so you can reference it later. The `COPY --from=build` in the second stage copies only the build output from the first stage. Everything else — source code, `node_modules`, dev dependencies — is discarded.

### Size Comparison

| Approach | Image Size |
|----------|-----------|
| Single stage (everything included) | ~800MB - 1.2GB |
| Multi-stage (output only) | ~150MB - 250MB |

Smaller images mean faster deployments, less storage, and faster container startup.

### Layer Caching

Docker caches each layer of the build. If a layer has not changed, Docker reuses the cached version instead of rebuilding it. This is why we copy `package.json` and the lockfile **before** copying the rest of the source code:

```dockerfile
# These layers are cached until package.json or lockfile changes
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

# This layer is rebuilt whenever any source file changes
COPY . .
RUN pnpm build
```

Since you change your source code far more often than your dependencies, this ordering means `pnpm install` runs only when your dependencies actually change. Without this optimization, every code change would trigger a full reinstall.

## .dockerignore

Just like `.gitignore` tells Git which files to skip, `.dockerignore` tells Docker which files to exclude when copying files into the container.

```
# .dockerignore
node_modules
.git
.env
.env.*
*.md
.vscode
.idea
dist
.output
coverage
```

This is important for two reasons:
1. **Security**: You do not want your `.env` file (with secrets) copied into the image.
2. **Performance**: Excluding `node_modules` and `.git` makes the build context smaller, which speeds up the build.

## Running Your Container

Once you have a Dockerfile, here is how to build and run it:

```bash
# Build the image (tag it as "indigo-sun-florals")
docker build -t indigo-sun-florals .

# Run the container
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e STRIPE_SECRET_KEY="sk_live_..." \
  indigo-sun-florals
```

The `-e` flags pass environment variables into the container. In production, you typically use a `docker-compose.yml` file or a hosting platform's UI to manage these.

### Docker Compose

For local development with multiple services (app + database), Docker Compose lets you define everything in one file:

```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/indigo_sun_florals
    depends_on:
      - db

  db:
    image: postgres:16
    environment:
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=indigo_sun_florals
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

Run everything with:

```bash
docker compose up
```

This starts both the database and your app, with the app automatically connected to the database.

## Your Task

Write a multi-stage Dockerfile for a Node.js application. Your Dockerfile should have:

1. A **build stage** that installs dependencies with `--frozen-lockfile` and runs `pnpm build`
2. A **production stage** that copies only the build output from the build stage
3. Proper `EXPOSE` and `CMD` instructions to run the application
