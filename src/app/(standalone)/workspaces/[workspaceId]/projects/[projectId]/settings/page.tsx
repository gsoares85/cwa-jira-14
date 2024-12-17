import {getCurrent} from "@/features/auth/queries";
import {redirect} from "next/navigation";
import {getProject} from "@/features/projects/queries";
import {EditProjectForm} from "@/features/projects/components/edit-project-form";

interface ProjectIdSettingsProps {
    params: {
        projectId: string;
    }
}

const ProjectIdSettingsPage = async ({params}: ProjectIdSettingsProps) => {
    const user = await getCurrent();
    if (!user) redirect("/sign-in");

    const initialValues = await getProject({
        projectId: params.projectId,
    })

    return (
        <div className="w-full lg:max-w-xl">
            <EditProjectForm initialValues={initialValues} />
        </div>
    )
}

export default ProjectIdSettingsPage
