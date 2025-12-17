import { expireFeaturedRooms } from "../controllers/featured-room.controller";

const EXPIRATION_CHECK_INTERVAL = 60 * 60 * 1000;

export function startFeaturedRoomExpirationService() {
  console.log("Starting featured room expiration service...");
  
  expireFeaturedRooms().catch((error) => {
    console.error("Error in initial featured room expiration check:", error);
  });

  setInterval(() => {
    expireFeaturedRooms().catch((error) => {
      console.error("Error in featured room expiration check:", error);
    });
  }, EXPIRATION_CHECK_INTERVAL);

  console.log(`Featured room expiration service started (checking every ${EXPIRATION_CHECK_INTERVAL / 1000 / 60} minutes)`);
}
