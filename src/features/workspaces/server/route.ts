import {Hono} from "hono";
import {zValidator} from "@hono/zod-validator";
import {createWorkspaceSchema} from "@/features/workspaces/schemas";
import {sessionMiddleware} from "@/lib/session-middleware";
import {BUCKET_URL, DATABASE_ID, IMAGES_BUCKET_ID, WORKSPACES_ID} from "@/config";
import { ID } from "node-appwrite";

const app = new Hono()
    .get(
        "/",
        sessionMiddleware,
        async (c) => {
            const databases = c.get("databases");

            const workspaces = await databases.listDocuments(
                DATABASE_ID,
                WORKSPACES_ID
            );

            return c.json({ data: workspaces });
        }
    )
    .post(
        "/",
        zValidator("form", createWorkspaceSchema),
        sessionMiddleware,
        async (c) => {
            const databases = c.get("databases");
            const storage = c.get("storage");
            const user = c.get("user");

            const { name, image } = c.req.valid("form");

            let uploadedImageUrl: string | undefined;

            if (image instanceof File) {
                const file = await storage.createFile(
                    IMAGES_BUCKET_ID,
                    ID.unique(),
                    image,
                );

                uploadedImageUrl = `${BUCKET_URL}/${IMAGES_BUCKET_ID}/files/${file.$id}`;
            }

            const workspace = await databases.createDocument(
                DATABASE_ID,
                WORKSPACES_ID,
                ID.unique(),
                {
                    name,
                    userId: user.$id,
                    imageUrl: uploadedImageUrl,
                }
            );

            return c.json({ data: workspace });
        }
    );

export default app;
