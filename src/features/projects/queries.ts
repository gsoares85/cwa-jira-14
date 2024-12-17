import {createSessionClient} from "@/lib/appwrite";
import {getMember} from "@/features/members/utils";
import {Workspace} from "@/features/workspaces/types";
import {DATABASE_ID, PROJECTS_ID, WORKSPACES_ID} from "@/config";
import {Project} from "@/features/projects/types";

interface GetProjectProps {
    projectId: string;
}

export const getProject = async ({projectId}: GetProjectProps) => {
    const {account, databases} = await createSessionClient();

    const user = await account.get();

    const project = await databases.getDocument<Project>(
        DATABASE_ID,
        PROJECTS_ID,
        projectId
    );

    const member = await getMember({databases, userId: user.$id, workspaceId: project.workspaceId});

    if (!member) {
        throw new Error("Unauthorized");
    }

    return project;
}