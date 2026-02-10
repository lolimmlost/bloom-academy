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

Every Node.js project starts with a `package.json` file. This file defines your project's metadata, dependencies, and scripts.

## What is package.json?

The `package.json` file is the heart of any Node.js project. It tells npm (or pnpm) about your project:

- **name**: The project's identifier
- **type**: Whether to use CommonJS (`require`) or ES Modules (`import`)
- **scripts**: Commands you can run with `pnpm run <script>`
- **dependencies**: Packages your app needs at runtime
- **devDependencies**: Packages needed only during development

## Your Task

Create a basic `package.json` configuration for the Indigo Sun Florals project.

The JSON should include:
- A `name` field set to `"indigo-sun-florals"`
- A `type` field set to `"module"`
- A `scripts` object with a `"dev"` script set to `"vite dev --port 3000"`
