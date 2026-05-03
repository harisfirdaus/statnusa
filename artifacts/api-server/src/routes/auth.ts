import { Router, type IRouter } from "express";

const router: IRouter = Router();

router.get("/auth/status", (_req, res) => {
  res.json({ required: Boolean(process.env["APP_PASSWORD"]) });
});

router.post("/auth/verify", (req, res) => {
  const appPassword = process.env["APP_PASSWORD"];
  if (!appPassword) {
    res.json({ ok: true });
    return;
  }
  const { password } = req.body as { password?: string };
  if (password === appPassword) {
    res.json({ ok: true });
  } else {
    res.status(401).json({ ok: false });
  }
});

export default router;
