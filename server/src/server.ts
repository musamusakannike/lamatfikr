import http from "http";

import { createApp } from "./app";
import { connectToMongo } from "./config/db";
import { env } from "./config/env";
import { attachSocket } from "./realtime/socket";
import { configureCloudinary } from "./services/cloudinary";
import { startFeaturedRoomExpirationService } from "./services/featured-room.service";

async function main() {
  await connectToMongo(env.MONGODB_URI);
  configureCloudinary();

  const app = createApp();
  const server = http.createServer(app);

  attachSocket(server);

  startFeaturedRoomExpirationService();

  server.listen(env.PORT, () => {
    console.log(`[server] listening on :${env.PORT}`);
  });
}

main().catch((err) => {
  console.error("[server] fatal error", err);
  process.exit(1);
});
