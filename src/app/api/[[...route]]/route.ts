import {Hono} from "hono";
import {handle} from "hono/vercel";
import authRoutes from "@/features/auth/server/route";
import workspacesRoutes from "@/features/workspaces/server/route";
import membersRoutes from "@/features/members/server/route";
import projectsRoutes from "@/features/projects/server/route";

const app = new Hono().basePath("/api");

const routes = app
    .route("/auth", authRoutes)
    .route("/workspaces", workspacesRoutes)
    .route("/members", membersRoutes)
    .route("/projects", projectsRoutes);

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);

export type AppType = typeof routes;
