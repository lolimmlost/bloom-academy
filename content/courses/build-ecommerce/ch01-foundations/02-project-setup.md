---
id: "02-project-setup"
title: "Project Setup"
type: "code"
xp: 25
difficulty: 2
order: 2
prerequisites: ["01-welcome"]
hints:
  - "A package.json file needs a 'name' field to identify the project."
  - "The 'type' field should be set to 'module' for ES modules."
---

# Setting Up Your Project

Every Node.js project starts with a `package.json` file. This file defines your project's metadata, dependencies, and scripts. Before we dive in, let's make sure we understand the foundation we're building on.

## What is Node.js?

When JavaScript was first created in 1995, it could only run inside a web browser. That was fine for adding interactive effects to web pages, but it meant you needed a completely different language (like Python, Ruby, or Java) to write server-side code.

**Node.js** changed everything. Released in 2009, Node.js lets you run JavaScript *outside* the browser — on servers, on your laptop, anywhere. Under the hood, it uses **V8**, the same blazing-fast JavaScript engine that powers Google Chrome.

Why does this matter for us? Because Node.js is what makes **full-stack JavaScript** possible. We can write our frontend *and* our backend in the same language, share code between them, and use a single ecosystem of tools and packages. That's a massive productivity win.

When you run a command like `node server.js`, you're asking Node.js to execute that JavaScript file on your machine. And when we use tools like Vite or pnpm, those are all Node.js programs running on your computer.

## What is package.json?

The `package.json` file is the heart of any Node.js project. It tells npm (or pnpm) about your project:

- **name**: The project's identifier
- **type**: Whether to use CommonJS (`require`) or ES Modules (`import`)
- **scripts**: Commands you can run with `pnpm run <script>`
- **dependencies**: Packages your app needs at runtime
- **devDependencies**: Packages needed only during development

Think of `package.json` as your project's ID card and instruction manual rolled into one. Every Node.js tool knows to look for this file to understand what your project is and how to work with it.

## ES Modules vs CommonJS

You'll notice we're setting `"type": "module"` in our package.json. This is an important decision, so let's understand what it means.

JavaScript was originally designed for small scripts in web pages — it had no built-in way to split code across multiple files. As applications grew, the community needed a module system. Two main approaches emerged:

### CommonJS (CJS) — The Node.js Original

When Node.js launched, it adopted **CommonJS**, a module system that uses `require()` and `module.exports`:

```javascript
// Importing in CommonJS
const express = require("express")

// Exporting in CommonJS
module.exports = { myFunction }
```

CommonJS loads modules **synchronously** — the program stops and waits for each file to load before moving on. This works fine on a server (files are on the local disk), but it's a poor fit for browsers where files load over the network.

### ES Modules (ESM) — The Modern Standard

In 2015, JavaScript got an **official** module system built into the language itself: **ES Modules**. It uses `import` and `export`:

```javascript
// Importing in ES Modules
import express from "express"

// Exporting in ES Modules
export { myFunction }
```

ES Modules are **statically analyzable** — tools can look at your `import` statements and figure out exactly which code is used *before* running the program. This enables powerful optimizations like **tree-shaking** (removing unused code from your final bundle).

### Why We Use ESM

We're going with ES Modules because:

- It's the **official JavaScript standard** — it works in browsers and Node.js
- It enables **tree-shaking** for smaller bundles
- It has **better TypeScript support** with cleaner syntax
- It's the direction the entire ecosystem is moving — most new libraries are ESM-first

When you set `"type": "module"` in package.json, you're telling Node.js: "Treat all `.js` files in this project as ES Modules." Without this setting, Node.js defaults to CommonJS for backward compatibility.

## Package Managers: npm vs yarn vs pnpm

A **package manager** is the tool that downloads and manages your project's dependencies (third-party libraries). The JavaScript ecosystem has three main options:

**npm** comes bundled with Node.js, so it's the default. It works fine, but it can be slow on large projects and its `node_modules` structure can lead to duplicated packages.

**yarn** was created by Facebook to address npm's early shortcomings — faster installs, a lockfile for reproducible builds, and offline caching. It pushed the ecosystem forward, but npm has since caught up on many of these features.

**pnpm** is what we'll use in this course, and it's the best option for several reasons:

- **Speed** — pnpm is significantly faster than npm and yarn for most operations. It uses a content-addressable store and hard links to avoid redundant downloads.
- **Disk efficiency** — If ten projects on your machine all use React 19, pnpm stores only one copy on disk and links to it from each project. npm and yarn would store ten separate copies.
- **Strict dependency resolution** — pnpm creates a strict `node_modules` structure that prevents you from accidentally importing packages you haven't explicitly declared as dependencies. This catches a whole category of bugs that slip through with npm and yarn.

You can install pnpm globally with:

```bash
npm install -g pnpm
```

Then use `pnpm install` instead of `npm install`, and `pnpm run dev` instead of `npm run dev`. The commands mirror npm's, so it's easy to switch.

## What Does the Dev Script Actually Do?

In our package.json, we define a `"dev"` script:

```json
"scripts": {
  "dev": "vite dev --port 3000"
}
```

When you run `pnpm run dev`, here's what happens behind the scenes:

1. **pnpm** looks up the `"dev"` key in your `scripts` object and executes the command.
2. **Vite** starts a local development server. Vite (French for "fast") is a modern build tool that serves your code using native ES Modules in the browser. Unlike older tools like Webpack that bundle your entire app before serving it, Vite serves files on-demand — so startup is nearly instant, even on large projects.
3. **`--port 3000`** tells Vite to listen on port 3000. A **port** is like an apartment number for your computer's network — it lets multiple servers run simultaneously without conflicting. Port 3000 is a common convention for development servers, but the number itself is arbitrary.
4. **HMR (Hot Module Replacement)** kicks in automatically. When you save a file, Vite detects the change and updates *just that module* in your browser — without a full page reload. You'll see your changes appear almost instantly, and your application state (like form inputs or scroll position) is preserved.

So when you open `http://localhost:3000` in your browser, you're connecting to the Vite dev server running on your own machine. `localhost` is a special hostname that always points to your own computer.

## Your Task

Create a basic `package.json` configuration for the Indigo Sun Florals project.

The JSON should include:
- A `name` field set to `"indigo-sun-florals"`
- A `type` field set to `"module"`
- A `scripts` object with a `"dev"` script set to `"vite dev --port 3000"`
