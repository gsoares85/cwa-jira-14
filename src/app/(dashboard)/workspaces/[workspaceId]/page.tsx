import {getCurrent} from "@/features/auth/queries";
import {redirect} from "next/navigation";

interface WorkspaceIdpageProps {
    params: {
        workspaceId: string;
    }
}

const WorkspaceIdPage = async ({params}: WorkspaceIdpageProps) => {
    const user = await getCurrent();
    if (!user) redirect("/sign-in");

    return (
        <div>
            Workspace ID: { params.workspaceId }
        </div>
    )
}

export default WorkspaceIdPage;

