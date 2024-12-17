import {Hono} from "hono";
import {sessionMiddleware} from "@/lib/session-middleware";
import {zValidator} from "@hono/zod-validator";
import {z} from "zod";
import {getMember} from "@/features/members/utils";
import {BUCKET_URL, DATABASE_ID, IMAGES_BUCKET_ID, PROJECT_ID, PROJECTS_ID, WORKSPACES_ID} from "@/config";
import {ID, Query} from "node-appwrite";
import {createProjectSchema, updateProjectSchema} from "@/features/projects/schemas";
import {MemberRole} from "@/features/members/types";
import {Project} from "@/features/projects/types";
import {Workspace} from "@/features/workspaces/types";

const app = new Hono()
    .get(
        "/",
        sessionMiddleware,
        zValidator("query", z.object({ workspaceId: z.string()})),
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");

            const { workspaceId } = c.req.valid("query");

            if (!workspaceId) {
                return c.json({ error: "Missing workspaceID"}, 400);
            }

            const member = await getMember({
                databases,
                workspaceId,
                userId: user.$id
            });

            if (!member) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const projects = await databases.listDocuments(
                DATABASE_ID,
                PROJECTS_ID,
                [
                    Query.equal("workspaceId", workspaceId),
                    Query.orderDesc("$createdAt"),
                ],
            );

            return c.json({ data: projects });
        }
    )
    .post(
        "/",
        sessionMiddleware,
        zValidator("form", createProjectSchema),
        async (c) => {
            const databases = c.get("databases");
            const storage = c.get("storage");
            const user = c.get("user");

            const { name, image, workspaceId } = c.req.valid("form");

            const member = await getMember({
                databases,
                workspaceId,
                userId: user.$id
            });

            if (!member) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            let uploadedImageUrl: string | undefined;

            if (image instanceof File) {
                const file = await storage.createFile(
                    IMAGES_BUCKET_ID,
                    ID.unique(),
                    image,
                );

                uploadedImageUrl = `${BUCKET_URL}/${IMAGES_BUCKET_ID}/files/${file.$id}/view?project=${PROJECT_ID}`;
            }

            const project = await databases.createDocument(
                DATABASE_ID,
                PROJECTS_ID,
                ID.unique(),
                {
                    name,
                    imageUrl: uploadedImageUrl,
                    workspaceId
                }
            );

            return c.json({ data: project });
        }
    )
    .patch(
        "/:projectId",
        sessionMiddleware,
        zValidator("form", updateProjectSchema),
        async (c) => {
            const databases  = c.get("databases");
            const storage  = c.get("storage");
            const user  = c.get("user");

            const { projectId } = c.req.param();
            const { name, imageUrl } = c.req.valid("form");

            const existingProject = await databases.getDocument<Project>(
                DATABASE_ID,
                PROJECTS_ID,
                projectId
            )

            const member = await getMember({ databases, workspaceId: existingProject.workspaceId, userId: user.$id});

            if (!member) {
                return c.json({ error: "Unauthorized"}, 401);
            }

            if (!existingProject) {
                return c.json({ error: "Project not found"}, 404);
            }

            let uploadedImageUrl: string | undefined;

            if (imageUrl instanceof File) {
                if (existingProject.imageUrl) {
                    const fileId = existingProject.imageUrl.split("/")[8];
                    await storage.deleteFile(
                        IMAGES_BUCKET_ID,
                        fileId
                    );
                }

                const file = await storage.createFile(
                    IMAGES_BUCKET_ID,
                    ID.unique(),
                    imageUrl,
                );

                uploadedImageUrl = `${BUCKET_URL}/${IMAGES_BUCKET_ID}/files/${file.$id}/view?project=${PROJECT_ID}`;
            }

            const project = await databases.updateDocument(
                DATABASE_ID,
                PROJECTS_ID,
                projectId,
                {
                    name,
                    imageUrl: uploadedImageUrl,
                }
            );

            return c.json({ data: project});
        }
    )
    .delete(
        "/:projectId",
        sessionMiddleware,
        async (c) => {
            const databases = c.get("databases");
            const user = c.get("user");
            const storage = c.get("storage");

            const { projectId } = c.req.param();

            const project = await databases.getDocument<Project>(DATABASE_ID, PROJECTS_ID, projectId);

            if (!project) {
                return c.json({ error: "Not found"}, 404);
            }

            const member = await getMember({
                databases,
                workspaceId: project.workspaceId,
                userId: user.$id
            });

            if (!member) {
                return c.json({ error: "Unauthorized"}, 401);
            }

            if (project.imageUrl) {
                const fileId = project.imageUrl.split("/")[8];
                await storage.deleteFile(IMAGES_BUCKET_ID, fileId);
            }

            // TODO: Delete TASKS

            await databases.deleteDocument(DATABASE_ID, PROJECTS_ID, projectId);

            return c.json({ data: { $id: project.$id }})
        }
    );

export default app;