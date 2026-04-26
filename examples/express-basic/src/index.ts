import express from "express";
import cors from "cors";
import { reqscope, traceStep, reqscopeErrorHandler } from "@reqscope/sdk";

const app = express();

app.use(
  cors({
    origin: "http://localhost:4545",
  }),
);

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
app.use(reqscopeErrorHandler());

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

app.get("/", async (req, res) => {
  const data = await traceStep(req, "prepareHomeResponse", async () => {
    await wait(20);

    return {
      message: "Express example is working",
    };
  });

  res.json(data);
});

app.get("/slow", async (_req, res) => {
  const user = await traceStep("findUserFromDatabase", async () => {
    await wait(260);

    return {
      id: 1,
      name: "Ali",
    };
  });

  const permissions = await traceStep("loadUserPermissions", async () => {
    await wait(80);

    return ["read", "write"];
  });

  res.json({
    message: "This endpoint is slow",
    user,
    permissions,
  });
});

app.get("/error", async (_req, res) => {
  try {
    await traceStep("dangerousOperation", async () => {
      await wait(30);
      throw new Error("Database connection failed");
    });

    res.json({
      message: "This will not run",
    });
  } catch (error) {
    res.status(500).json({
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.post("/login", async (req, res, next) => {
  try {
    const payload = traceStep("validatePayload", () => {
      if (!req.body.email) {
        throw new Error("Email is required");
      }

      return {
        email: req.body.email,
      };
    });

    const user = await traceStep("findUserByEmail", async () => {
      await wait(140);

      return {
        id: 1,
        email: payload.email,
      };
    });

    const token = await traceStep("createAccessToken", async () => {
      await wait(40);

      return "mock_token";
    });

    res.setHeader("x-request-id", "demo-request-id");
    res.setHeader("set-cookie", "session=super-secret-cookie");

    res.json({
      user,
      token,
    });
  } catch (error) {
    next(error);
  }
});

app.listen(3000, () => {
  console.log("Example server running on http://localhost:3000");
});
