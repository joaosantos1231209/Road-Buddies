import { db } from "./src/db/index.js";
import { users } from "./src/db/schema.js";
import { eq } from "drizzle-orm";

async function run() {
  try {
    const testId = "fake-uid-123";
    await db
      .insert(users)
      .values({
        id: testId,
        email: "test@example.com",
        username: "test" + Math.floor(Math.random() * 1000),
        avatarUrl: "http://example.com/pic.png",
        isVerified: false,
      });
    
    const newUser = await db.query.users.findFirst({ where: eq(users.id, testId) });
    console.log("INSERT SUCCESS:", newUser);
    
    // cleanup
    await db.delete(users).where(eq(users.id, testId));
  } catch (error) {
    console.error("INSERT ERROR:", error);
  }
}
run();
