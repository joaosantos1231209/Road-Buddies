import { Router } from "express";
const router = Router();
router.post("/test-ping", (req, res) => {
  res.status(201).json({ message: "pong", user: (req as any).user });
});
export default router;
