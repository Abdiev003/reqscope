# ReqScope

ReqScope is a local API request tracing tool for Node.js and Express.

It helps you inspect:

- request duration
- slow internal steps
- failed flows
- request/response body preview
- request/response headers
- sensitive field masking
- raw trace JSON
- cURL reproduction
- endpoint summaries

## Why ReqScope?

When an API request is slow or fails, logs are often not enough.

ReqScope shows what happened inside the request:

```txt
POST /login 182ms

findUserByEmail      140ms
createAccessToken     40ms
```

So you can quickly answer:

- Which step was slow?
- Which step failed?
- What request body came in?
- What response went out?
- Can I reproduce this request as cURL?

## Installation

```bash
npm i @abdiev003/reqscope
```

## Express usage

```ts
import express from "express";
import { reqscope, reqscopeErrorHandler, traceStep } from "@abdiev003/reqscope";

const app = express();

app.use(express.json());

app.use(
  reqscope({
    enabled: process.env.NODE_ENV !== "production",
    slowRequestThreshold: 300,
    slowStepThreshold: 100,
    endpointPrefix: "/__reqscope",
    maxPreviewSize: 5000,
    maxTraces: 100,
    sensitiveFields: ["password", "token", "secret"],
  }),
);

app.post("/login", async (req, res, next) => {
  try {
    const user = await traceStep(req, "findUserByEmail", async () => {
      return db.user.findUnique({
        where: {
          email: req.body.email,
        },
      });
    });

    const token = await traceStep(req, "createAccessToken", async () => {
      return createToken(user);
    });

    res.json({
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
});

app.use(reqscopeErrorHandler());

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    res.status(500).json({
      message: error instanceof Error ? error.message : "Unknown error",
    });
  },
);

app.listen(3000);
```

## Dashboard

ReqScope exposes trace data from your app:

```txt
GET /__reqscope/traces
GET /__reqscope/clear
```

The dashboard is currently available from the repository during MVP development.

```bash
git clone https://github.com/YOUR_USERNAME/reqscope.git
cd reqscope
npm install
npm run dev:dashboard
```

By default, the dashboard connects to:

```txt
http://localhost:3000
```

You can change it with:

```env
VITE_REQSCOPE_API_URL=http://localhost:4000
```

## Options

| Option                 |       Type |                     Default | Description                                                           |
| ---------------------- | ---------: | --------------------------: | --------------------------------------------------------------------- |
| `enabled`              |  `boolean` | `NODE_ENV !== "production"` | Enables or disables ReqScope. Disabled by default in production.      |
| `slowRequestThreshold` |   `number` |                       `300` | Marks a request as slow when total duration exceeds this value in ms. |
| `slowStepThreshold`    |   `number` |                       `100` | Marks a traced step as slow when duration exceeds this value in ms.   |
| `endpointPrefix`       |   `string` |               `/__reqscope` | Prefix for internal ReqScope endpoints.                               |
| `sensitiveFields`      | `string[]` |              common secrets | Fields to redact from previews.                                       |
| `maxPreviewSize`       |   `number` |                      `5000` | Maximum serialized preview size.                                      |
| `maxTraces`            |   `number` |                       `100` | Maximum number of traces stored in memory.                            |

## Sensitive data masking

ReqScope redacts sensitive keys by default:

```txt
password
token
secret
authorization
cookie
set-cookie
api_key
access_token
refresh_token
```

Example:

```json
{
  "email": "ali@example.com",
  "password": "[REDACTED]"
}
```

You can add custom fields:

```ts
reqscope({
  sensitiveFields: ["email", "phone"],
});
```

## Development

Install dependencies:

```bash
npm install
```

Run the example API:

```bash
npm run dev:example
```

Run the dashboard:

```bash
npm run dev:dashboard
```

Build the SDK:

```bash
npm run build -w packages/sdk
```

## Test requests

```bash
curl http://localhost:3000/
```

```bash
curl http://localhost:3000/slow
```

```bash
curl http://localhost:3000/error
```

```bash
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer super-secret-token" \
  -d '{"email":"ali@example.com","password":"secret123"}'
```

## Current status

ReqScope is currently an MVP focused on local development.

Supported:

- Express
- manual step tracing with `traceStep`
- local in-memory traces
- local dashboard

Not yet supported:

- production storage
- authentication
- team sharing
- NestJS/Fastify/Django integrations
- automatic ORM tracing
