import { Router } from "express";
import { RoadTripController } from "../controllers/roadtrip.controller";
import { SessionController } from "../controllers/session.controller";
import { protectedEndpoint } from "../utils/auth";

const roadtripRouter = Router();
const roadtripController = new RoadTripController();
const sessionController = new SessionController();

roadtripRouter.use(protectedEndpoint);

// Core roadtrip endpoints
roadtripRouter.post("/", roadtripController.createRoadTrip);
roadtripRouter.get("/", roadtripController.getUserRoadTrips);
roadtripRouter.get("/:id", roadtripController.getRoadTrip);
roadtripRouter.put("/:id", roadtripController.updateRoadTrip);
roadtripRouter.delete("/:id", roadtripController.deleteRoadTrip);

// Member management
roadtripRouter.post("/:id/members", roadtripController.addMember);
roadtripRouter.delete("/:id/members/:userId", roadtripController.removeMember);

// Waypoint management
roadtripRouter.post("/:id/waypoints", roadtripController.addWaypoint);
roadtripRouter.put(
  "/:id/waypoints/:waypointId",
  roadtripController.updateWaypoint
);
roadtripRouter.delete(
  "/:id/waypoints/:waypointId",
  roadtripController.deleteWaypoint
);

// Session management for specific roadtrips
roadtripRouter.post("/:id/sessions", sessionController.createSession);
roadtripRouter.get("/:id/sessions/active", sessionController.getActiveSession);

export default roadtripRouter;
