import { app } from "./app";
import { env } from "./config/env";

const port = env.port;

app.listen(port, () => {
  console.log(`Backend App da Pesca rodando na porta ${port}`);
});

