import "./dns-prefs"; // Força IPv4 antes de qualquer conexão de rede
import { app } from "./app";
import { env } from "./config/env";

const port = env.port;

app.listen(port, "0.0.0.0", () => {
  console.log(`Backend App da Pesca rodando na porta ${port}`);
});