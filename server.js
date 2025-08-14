import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import { v4 as uuid } from "uuid";
import cors from "cors";

dotenv.config();
const PORT = process.env.PORT || 3000;
const API_TOKEN = process.env.API_TOKEN || "dev-token";

const store = new Map(); // userId -> [{id,title,message,ts}]

const app = express();
app.use(helmet());
app.use(morgan("tiny"));
app.use(express.json());
app.use(cors());

function auth(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : "";
  if (token !== API_TOKEN) return res.status(401).json({ error: "Unauthorized" });
  next();
}

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/api/send", auth, (req, res) => {
  const { userId, title, message } = req.body || {};
  if (!userId || !title || !message) return res.status(400).json({ error: "userId, title, message required" });
  const arr = store.get(userId) || [];
  const item = { id: uuid(), title, message, ts: Date.now() };
  arr.push(item);
  store.set(userId, arr);
  res.json({ success: true, id: item.id });
});

app.get("/api/poll", auth, (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "userId required" });
  const arr = store.get(userId) || [];
  store.set(userId, []);
  res.json({ items: arr });
});

app.listen(PORT, () => console.log(`Cloud API listening on :${PORT}`));
