import { NextFunction, Request, Response } from "express";
import { RoadTripService } from "../services/roadtrip.service";
import { HttpException } from "../utils/errors.utils";

export class RoadTripController {
  private service: RoadTripService;

  constructor() {
    this.service = new RoadTripService();
  }

  createRoadTrip = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { name } = req.body;

      const roadTrip = await this.service.createRoadTrip({
        name,
        ownerId: userId,
      });

      res.status(201).json(roadTrip);
    } catch (error) {
      next(new HttpException(500, "Failed to create road trip"));
    }
  };

  getUserRoadTrips = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user!.id;
      const roadTrips = await this.service.getUserRoadTrips(userId);
      res.json(roadTrips);
    } catch (error) {
      next(new HttpException(500, "Failed to fetch road trips"));
    }
  };

  getRoadTrip = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const roadTrip = await this.service.getRoadTrip(id);

      if (!roadTrip) {
        res.status(404).json({ error: "Road trip not found" });
        return;
      }

      // Check if user has access
      const canAccess =
        roadTrip.ownerId === userId ||
        roadTrip.members.some((member) => member.id === userId);

      if (!canAccess) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      res.json(roadTrip);
    } catch (error) {
      next(new HttpException(500, "Failed to fetch road trip"));
    }
  };

  updateRoadTrip = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const updates = req.body;

      // Check ownership
      const roadTrip = await this.service.getRoadTrip(id);
      if (!roadTrip || roadTrip.ownerId !== userId) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      const updated = await this.service.updateRoadTrip(id, updates);
      res.json(updated);
    } catch (error) {
      next(new HttpException(500, "Failed to update road trip"));
    }
  };

  deleteRoadTrip = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Check ownership
      const roadTrip = await this.service.getRoadTrip(id);
      if (!roadTrip || roadTrip.ownerId !== userId) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      await this.service.deleteRoadTrip(id);
      res.status(204).send();
    } catch (error) {
      next(new HttpException(500, "Failed to delete road trip"));
    }
  };

  addMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { email } = req.body;
      const userId = req.user!.id;

      // Check ownership
      const roadTrip = await this.service.getRoadTrip(id);
      if (!roadTrip || roadTrip.ownerId !== userId) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      const updated = await this.service.addMember(id, email);
      res.json(updated);
    } catch (error) {
      next(new HttpException(500, "Failed to add member"));
    }
  };

  removeMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, userId: memberIdToRemove } = req.params;
      const userId = req.user!.id;

      // Check ownership
      const roadTrip = await this.service.getRoadTrip(id);
      if (!roadTrip || roadTrip.ownerId !== userId) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      const updated = await this.service.removeMember(id, memberIdToRemove);
      res.json(updated);
    } catch (error) {
      next(new HttpException(500, "Failed to remove member"));
      res.status(500).json({ error: "Failed to remove member" });
    }
  };

  addWaypoint = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { name, latitude, longitude } = req.body;
      const userId = req.user!.id;

      // Check access
      const roadTrip = await this.service.getRoadTrip(id);
      if (
        !roadTrip ||
        (roadTrip.ownerId !== userId &&
          !roadTrip.members.some((member) => member.id === userId))
      ) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      const waypoint = await this.service.addWaypoint(id, {
        name,
        latitude,
        longitude,
      });

      res.status(201).json(waypoint);
    } catch (error) {
      next(new HttpException(500, "Failed to add waypoint"));
    }
  };

  updateWaypoint = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, waypointId } = req.params;
      const updates = req.body;
      const userId = req.user!.id;

      // Check access
      const roadTrip = await this.service.getRoadTrip(id);
      if (
        !roadTrip ||
        (roadTrip.ownerId !== userId &&
          !roadTrip.members.some((member) => member.id === userId))
      ) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      const waypoint = await this.service.updateWaypoint(waypointId, updates);
      res.json(waypoint);
    } catch (error) {
      next(new HttpException(500, "Failed to update waypoint"));
    }
  };

  deleteWaypoint = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id, waypointId } = req.params;
      const userId = req.user!.id;

      // Check access
      const roadTrip = await this.service.getRoadTrip(id);
      if (
        !roadTrip ||
        (roadTrip.ownerId !== userId &&
          !roadTrip.members.some((member) => member.id === userId))
      ) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      await this.service.deleteWaypoint(waypointId);
      res.status(204).send();
    } catch (error) {
      next(new HttpException(500, "Failed to delete waypoint"));
    }
  };
}
