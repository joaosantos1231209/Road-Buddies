import app from "./app.js";
import { processExpiredSubscriptions } from "./services/subscriptions.js";

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Road Buddies Backend a correr na porta ${PORT}`);
});

// Run expired subscriptions check every 5 minutes
const EXPIRY_INTERVAL_MS = 5 * 60 * 1000;
processExpiredSubscriptions().catch(console.error);
setInterval(() => processExpiredSubscriptions().catch(console.error), EXPIRY_INTERVAL_MS);
