import { Router } from "express";
import roadtripRouter from "./routes/roadtrip.routes";
import sessionRouter from "./routes/session.routes";

const apiRouter = Router();

apiRouter.use("/roadtrips", roadtripRouter);
apiRouter.use("/sessions", sessionRouter);

export default apiRouter;
