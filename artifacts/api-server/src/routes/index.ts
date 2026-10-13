import { Router, type IRouter } from "express";
import healthRouter from "./health";
import siteRouter from "./site";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(siteRouter);
router.use(storageRouter);

export default router;
