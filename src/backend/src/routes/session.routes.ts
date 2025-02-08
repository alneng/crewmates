import { Router } from "express";
import { SessionController } from "../controllers/session.controller";
import { protectedEndpoint } from "../utils/auth";

const sessionRouter = Router();
const controller = new SessionController();

sessionRouter.use(protectedEndpoint);

// Session management not tied to specific roadtrips
sessionRouter.get("/user/active", controller.getUserActiveSessions);
sessionRouter.get("/:sessionId", controller.getSession);
sessionRouter.patch("/:sessionId/extend", controller.extendSession);
sessionRouter.delete("/:sessionId", controller.endSession);
sessionRouter.post("/cleanup", controller.cleanupExpiredSessions);

export default sessionRouter;
