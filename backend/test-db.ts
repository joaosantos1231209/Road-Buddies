import { db } from "./src/db/index.js";
import { users } from "./src/db/schema.js";

async function run() {
  try {
    const newUser = await db
      .insert(users)
      .values({
        id: "fake-uid-123",
        email: "test@example.com",
        username: "test" + Math.floor(Math.random() * 1000),
        avatarUrl: "http://example.com/pic.png",
        isVerified: false,
      })
      .returning();
    console.log("INSERT SUCCESS:", newUser);
    
    // cleanup
    import { eq } from "drizzle-orm";
    await db.delete(users).where(eq(users.id, "fake-uid-123"));
  } catch (error) {
    console.error("INSERT ERROR:", error);
  }
}
run();
