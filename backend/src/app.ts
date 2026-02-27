import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";

import { env } from "./config/env";
import { router as healthRouter } from "./routes/health.routes";
import { router as authRouter } from "./routes/auth.routes";
import { router as userRouter } from "./routes/user.routes";
import { router as categoryRouter } from "./routes/category.routes";
import { router as productRouter } from "./routes/product.routes";
import { router as cartRouter } from "./routes/cart.routes";
import { router as orderRouter } from "./routes/order.routes";
import { router as checkoutRouter } from "./routes/checkout.routes";
import { router as webhookRouter } from "./routes/webhook.routes";
import { router as adminRouter } from "./routes/admin.routes";
import swaggerUi from "swagger-ui-express";
import openapi from "./docs/openapi.json";

const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
);

app.use(
  helmet({
    contentSecurityPolicy: env.nodeEnv === "production" ? undefined : false,
  })
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
  })
);

app.use(cookieParser());
app.use(morgan("dev"));

app.use("/api/webhooks/stripe", express.raw({ type: "application/json" }), webhookRouter);

app.use(express.json({ limit: "1mb" }));

app.use("/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/products", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", orderRouter);
app.use("/api/checkout", checkoutRouter);
app.use("/api/admin", adminRouter);

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openapi as object));

app.use((req, res) => {
  res.status(404).json({ message: "Rota não encontrada" });
});

app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res
      .status(err.status || 500)
      .json({ message: err.message || "Erro interno do servidor" });
  }
);

export { app };

