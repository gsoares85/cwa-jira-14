import {Hono} from "hono";
import {handle} from "hono/vercel";
import authRoutes from "@/features/auth/server/route";

const app = new Hono().basePath("/api");

const routes = app
    .route("/auth", authRoutes);

export const GET = handle(app);
export const POST = handle(app);

export type AppType = typeof routes;
