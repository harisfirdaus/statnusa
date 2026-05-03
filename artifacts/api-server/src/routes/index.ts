import { Router, type IRouter } from "express";
import healthRouter from "./health";
import bpsRouter from "./bps";
import datawrapperRouter from "./datawrapper";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(bpsRouter);
router.use(datawrapperRouter);

export default router;
