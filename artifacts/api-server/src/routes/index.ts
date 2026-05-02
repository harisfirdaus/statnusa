import { Router, type IRouter } from "express";
import healthRouter from "./health";
import bpsRouter from "./bps";
import datawrapperRouter from "./datawrapper";

const router: IRouter = Router();

router.use(healthRouter);
router.use(bpsRouter);
router.use(datawrapperRouter);

export default router;
