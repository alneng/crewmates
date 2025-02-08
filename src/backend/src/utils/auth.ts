import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "../prisma";
import { HttpException } from "./errors.utils";
import { corsOptions } from "../config";
import { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";

export const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
export const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET)
  throw new HttpException(500, "GitHub client ID and secret are required");

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: { enabled: false },
  socialProviders: {
    github: {
      clientId: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
    },
  },
  logger: { level: "error" },
  trustedOrigins: corsOptions.origin,
});

/**
 * Middleware to parse the user and session from the request headers and add it to the request.
 *
 * @param req
 * @param _res
 * @param next
 */
export const authHandler = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const data = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    req.session = data?.session;
    req.user = data?.user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to reject requests if they are unauthenticated.
 *
 * @param req
 * @param _res
 * @param next
 */
export const protectedEndpoint = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  if (!req.session || !req.user)
    next(new HttpException(401, "Unauthenticated"));
  next();
};
