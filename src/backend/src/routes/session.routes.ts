import { Router } from "express";
import { SessionController } from "../controllers/session.controller";
import { protectedEndpoint } from "../utils/auth";

const router = Router();
const controller = new SessionController();

router.use(protectedEndpoint);

// Core session management
router.post("/roadtrips/:roadTripId/sessions", controller.createSession);
router.get(
  "/roadtrips/:roadTripId/sessions/active",
  controller.getActiveSession
);
router.delete("/sessions/:sessionId", controller.endSession);

// Additional session endpoints
router.get("/sessions/:sessionId", controller.getSession);
router.patch("/sessions/:sessionId/extend", controller.extendSession);
router.get("/sessions/user/active", controller.getUserActiveSessions);
router.post("/sessions/cleanup", controller.cleanupExpiredSessions);

export default router;
