import { app } from "./app";
import { env } from "./config/env";
import { disconnectPrisma, prisma } from "./config/prisma";

async function bootstrap(): Promise<void> {
  await prisma.$connect();

  const server = app.listen(env.PORT, () => {
    console.log(
      `[server] SaveMoney API escuchando en http://localhost:${env.PORT} (${env.NODE_ENV})`,
    );
  });

  const shutdown = (signal: string): void => {
    console.log(`[server] ${signal} recibido, cerrando...`);

    server.close(() => {
      void disconnectPrisma().finally(() => process.exit(0));
    });

    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

void bootstrap().catch((error) => {
  console.error("[server] Error al iniciar:", error);
  process.exit(1);
});
