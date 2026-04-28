# ReqScope Demo

A self-contained demo of [ReqScope](https://github.com/Abdiev003/reqscope) that runs in the browser via StackBlitz.

## Run on StackBlitz

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/Abdiev003/reqscope/tree/main/demo)

When the sandbox boots, the dashboard appears at the preview URL. Use the **Try it** panel at the top to send sample requests, then watch traces appear live.

## Run locally

```bash
cd demo
npm install
npm start
```

Open <http://localhost:3000>.

## What's inside

- `server.js` — Express app that loads the `@abdiev003/reqscope` middleware, exposes `/slow`, `/error`, `/login`, and serves the prebuilt dashboard from `public/`.
- `public/` — production build of the dashboard (`packages/dashboard/dist`).
- `package.json` — depends on `@abdiev003/reqscope` from npm only, so the sandbox boots without building any workspace packages.

## Sample requests

```bash
curl http://localhost:3000/slow
curl http://localhost:3000/error
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ali@example.com","password":"secret123"}'
```
