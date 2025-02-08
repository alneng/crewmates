import * as express from "express";
import { Session, User } from "better-auth/types";

declare global {
  namespace Express {
    export interface Request {
      session?: Session;
      user?: User;
    }
  }
}

export {};
