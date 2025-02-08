import { NextFunction, Request, Response } from "express";
import { SessionService } from "../services/session.service";
import { prisma } from "../prisma";
import { HttpException } from "../utils/errors.utils";

export class SessionController {
  private service: SessionService;

  constructor() {
    this.service = new SessionService();
  }

  createSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { roadTripId } = req.params;
      const userId = req.user!.id;

      // Verify user has access to the road trip
      const roadTrip = await prisma.roadTrip.findUnique({
        where: { id: roadTripId },
        include: { members: true },
      });

      if (
        !roadTrip ||
        (roadTrip.ownerId !== userId &&
          !roadTrip.members.some((member) => member.id === userId))
      ) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      const session = await this.service.createSession(roadTripId);
      res.status(201).json(session);
    } catch (error) {
      next(new HttpException(500, "Failed to create session"));
    }
  };

  getActiveSession = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { roadTripId } = req.params;
      const userId = req.user!.id;

      // Verify user has access to the road trip
      const roadTrip = await prisma.roadTrip.findUnique({
        where: { id: roadTripId },
        include: { members: true },
      });

      if (
        !roadTrip ||
        (roadTrip.ownerId !== userId &&
          !roadTrip.members.some((member) => member.id === userId))
      ) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      const session = await this.service.getActiveSession(roadTripId);

      if (!session) {
        res.status(404).json({ error: "No active session found" });
        return;
      }

      res.json(session);
    } catch (error) {
      next(new HttpException(500, "Failed to get active session"));
    }
  };

  endSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user!.id;

      const session = await this.service.getSession(sessionId);

      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      // Verify user has access to the associated road trip
      const roadTrip = await prisma.roadTrip.findUnique({
        where: { id: session.roadTripId },
        include: { members: true },
      });

      if (
        !roadTrip ||
        (roadTrip.ownerId !== userId &&
          !roadTrip.members.some((member) => member.id === userId))
      ) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      await this.service.endSession(sessionId);
      res.status(204).send();
    } catch (error) {
      next(new HttpException(500, "Failed to end session"));
    }
  };

  getSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user!.id;

      const session = await this.service.getSession(sessionId);

      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      // Verify user has access to the associated road trip
      if (
        session.roadTrip.ownerId !== userId &&
        !session.roadTrip.members.some((member) => member.id === userId)
      ) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      res.json(session);
    } catch (error) {
      next(new HttpException(500, "Failed to get session"));
    }
  };

  extendSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const { hours } = req.body;
      const userId = req.user!.id;

      const session = await this.service.getSession(sessionId);

      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      // Verify user has access to the associated road trip
      if (
        session.roadTrip.ownerId !== userId &&
        !session.roadTrip.members.some((member) => member.id === userId)
      ) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      const updatedSession = await this.service.extendSession(sessionId, hours);
      res.json(updatedSession);
    } catch (error) {
      next(new HttpException(500, "Failed to extend session"));
    }
  };

  getUserActiveSessions = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = req.user!.id;
      const sessions = await this.service.getUserActiveSessions(userId);
      res.json(sessions);
    } catch (error) {
      next(new HttpException(500, "Failed to get user's active sessions"));
    }
  };

  cleanupExpiredSessions = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      await this.service.cleanupExpiredSessions();
      res.status(204).send();
    } catch (error) {
      next(new HttpException(500, "Failed to cleanup expired sessions"));
    }
  };
}
