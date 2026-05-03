export default function handler(
  req: { method?: string; body: { password?: unknown } },
  res: { status: (c: number) => any; json: (d: unknown) => void },
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) {
    return res.json({ ok: true });
  }

  const { password } = req.body ?? {};
  if (typeof password === "string" && password === appPassword) {
    return res.json({ ok: true });
  }

  return res.status(401).json({ ok: false });
}
