import { cleanupEmptyCalls } from "../controllers/message.controller";

const CLEANUP_INTERVAL = 60 * 1000; // 1 minute

export function startCallCleanupService() {
  console.log("Starting call cleanup service...");

  // Initial check
  cleanupEmptyCalls().catch((error) => {
    console.error("Error in initial call cleanup check:", error);
  });

  setInterval(() => {
    cleanupEmptyCalls().catch((error) => {
      console.error("Error in call cleanup check:", error);
    });
  }, CLEANUP_INTERVAL);

  console.log(
    `Call cleanup service started (checking every ${
      CLEANUP_INTERVAL / 1000
    } seconds)`
  );
}
