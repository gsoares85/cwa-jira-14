import {Hono} from "hono";
import {zValidator} from "@hono/zod-validator";
import {createWorkspaceSchema, updateWorkspaceSchema} from "@/features/workspaces/schemas";
import {sessionMiddleware} from "@/lib/session-middleware";
import {BUCKET_URL, DATABASE_ID, IMAGES_BUCKET_ID, MEMBERS_ID, PROJECT_ID, WORKSPACES_ID} from "@/config";
import {ID, Query} from "node-appwrite";
import {MemberRole} from "@/features/members/types";
import {generateInviteCode} from "@/lib/utils";
import {getMember} from "@/features/members/utils";

const app = new Hono()
    .get(
        "/",
        sessionMiddleware,
        async (c) => {
            const databases = c.get("databases");
            const user = c.get("user");

            const members = await databases.listDocuments(
                DATABASE_ID,
                MEMBERS_ID,
                [Query.equal("userId", user.$id)]
            );

            if (members.total === 0) {
                return c.json({ data: { documents: [], total: 0}})
            }

            const workspaceIds = members.documents.map((member) => member.workspaceId);

            const workspaces = await databases.listDocuments(
                DATABASE_ID,
                WORKSPACES_ID,
                [
                    Query.contains("$id", workspaceIds),
                    Query.orderDesc("$createdAt")
                ]
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

                uploadedImageUrl = `${BUCKET_URL}/${IMAGES_BUCKET_ID}/files/${file.$id}/view?project=${PROJECT_ID}`;
            }

            const workspace = await databases.createDocument(
                DATABASE_ID,
                WORKSPACES_ID,
                ID.unique(),
                {
                    name,
                    userId: user.$id,
                    imageUrl: uploadedImageUrl,
                    inviteCode: generateInviteCode(10),
                }
            );

            await databases.createDocument(
                DATABASE_ID,
                MEMBERS_ID,
                ID.unique(),
                {
                    userId: user.$id,
                    workspaceId: workspace.$id,
                    role: MemberRole.ADMIN,
                }
            )

            return c.json({ data: workspace });
        }
    )
    .patch(
        "/:workspaceId",
        sessionMiddleware,
        zValidator("form", updateWorkspaceSchema),
        async (c) => {
            const databases  = c.get("databases");
            const storage  = c.get("storage");
            const user  = c.get("user");

            const { workspaceId } = c.req.param();
            const { name, imageUrl } = c.req.valid("form");

            const member = await getMember({ databases, workspaceId, userId: user.$id});

            if (!member || member.role !== MemberRole.ADMIN) {
                return c.json({ error: "Unauthorized"}, 401);
            }

            const workspaceToUpdate = await databases.getDocument(
                DATABASE_ID,
                WORKSPACES_ID,
                workspaceId
            );

            if (!workspaceToUpdate) {
                return c.json({ error: "Workspace not found"}, 404);
            }

            let uploadedImageUrl: string | undefined;

            if (imageUrl instanceof File) {
                if (workspaceToUpdate.imageUrl) {
                    const fileId = workspaceToUpdate.imageUrl.split("/")[8];
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

            const workspace = await databases.updateDocument(
                DATABASE_ID,
                WORKSPACES_ID,
                workspaceId,
                {
                    name,
                    imageUrl: uploadedImageUrl,
                }
            );

            return c.json({ data: workspace });
        }
    );

export default app;
