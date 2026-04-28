import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  reqscope,
  reqscopeErrorHandler,
  traceStep,
} from "@abdiev003/reqscope";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(express.json());

app.use(
  reqscope({
    enabled: true,
    slowRequestThreshold: 300,
    slowStepThreshold: 100,
    endpointPrefix: "/__reqscope",
    sensitiveFields: ["email"],
    maxPreviewSize: 5000,
    maxTraces: 200,
  }),
);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

app.get("/slow", async (_req, res) => {
  const user = await traceStep("findUserFromDatabase", async () => {
    await wait(260);
    return { id: 1, name: "Ali" };
  });

  const permissions = await traceStep("loadUserPermissions", async () => {
    await wait(80);
    return ["read", "write"];
  });

  res.json({ message: "This endpoint is slow", user, permissions });
});

app.get("/error", async (_req, res, next) => {
  try {
    await traceStep("dangerousOperation", async () => {
      await wait(30);
      throw new Error("Database connection failed");
    });
  } catch (error) {
    next(error);
  }
});

app.post("/login", async (req, res, next) => {
  try {
    const payload = traceStep("validatePayload", () => {
      if (!req.body?.email) {
        throw new Error("Email is required");
      }
      return { email: req.body.email };
    });

    const user = await traceStep("findUserByEmail", async () => {
      await wait(140);
      return { id: 1, email: payload.email };
    });

    const token = await traceStep("createAccessToken", async () => {
      await wait(40);
      return "mock_token";
    });

    res.setHeader("x-request-id", "demo-request-id");
    res.setHeader("set-cookie", "session=super-secret-cookie");

    res.json({ user, token });
  } catch (error) {
    next(error);
  }
});

app.use(reqscopeErrorHandler());

app.use(express.static(path.join(__dirname, "public")));

app.use((error, _req, res, _next) => {
  res.status(500).json({
    message: error instanceof Error ? error.message : "Unknown error",
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`ReqScope demo running on http://localhost:${PORT}`);
});
