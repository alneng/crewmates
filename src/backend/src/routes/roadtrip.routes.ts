import { Router } from "express";
import { RoadTripController } from "../controllers/roadtrip.controller";
import { protectedEndpoint } from "../utils/auth";

const router = Router();
const controller = new RoadTripController();

router.use(protectedEndpoint);

router.post("/", controller.createRoadTrip);
router.get("/", controller.getUserRoadTrips);
router.get("/:id", controller.getRoadTrip);
router.put("/:id", controller.updateRoadTrip);
router.delete("/:id", controller.deleteRoadTrip);
router.post("/:id/members", controller.addMember);
router.delete("/:id/members/:userId", controller.removeMember);
router.post("/:id/waypoints", controller.addWaypoint);
router.put("/:id/waypoints/:waypointId", controller.updateWaypoint);
router.delete("/:id/waypoints/:waypointId", controller.deleteWaypoint);

export default router;
