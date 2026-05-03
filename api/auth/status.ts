export default function handler(
  req: { method?: string },
  res: { status: (c: number) => any; json: (d: unknown) => void },
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  return res.json({ required: Boolean(process.env.APP_PASSWORD) });
}
