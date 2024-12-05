import "server-only"
import {Query} from "node-appwrite";
import {DATABASE_ID, MEMBERS_ID, WORKSPACES_ID} from "@/config";
import {getMember} from "@/features/members/utils";
import {Workspace} from "@/features/workspaces/types";
import {createSessionClient} from "@/lib/appwrite";

export const getWorkspaces = async () => {
    try {
        const { account, databases } = await createSessionClient();
        const user = await account.get();

        const members = await databases.listDocuments(
            DATABASE_ID,
            MEMBERS_ID,
            [Query.equal("userId", user.$id)]
        );

        if (members.total === 0) {
            return { documents: [], total: 0}
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

        return workspaces;
    } catch (error) {
        return { documents: [], total: 0};
    }
}

interface GetWorkspaceProps {
    workspaceId: string;
}

export const getWorkspace = async ({ workspaceId }: GetWorkspaceProps) => {
    try {
        const { account, databases } = await createSessionClient();

        const user = await account.get();

        const member = await getMember({ databases, userId: user.$id, workspaceId });

        if (!member) {
            return null;
        }

        return await databases.getDocument<Workspace>(
            DATABASE_ID,
            WORKSPACES_ID,
            workspaceId
        );
    } catch (error) {
        return { documents: [], total: 0 };
    }
}

interface GetWorkspaceInfoProps {
    workspaceId: string;
}

export const getWorkspaceInfo = async ({ workspaceId }: GetWorkspaceInfoProps) => {
    try {
        const { databases } = await createSessionClient();

        const workspace = await databases.getDocument<Workspace>(
            DATABASE_ID,
            WORKSPACES_ID,
            workspaceId
        );

        return {
            name: workspace.name
        }
    } catch (error) {
        return null;
    }
}
