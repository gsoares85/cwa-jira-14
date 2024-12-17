import {InferRequestType, InferResponseType} from "hono";
import {client} from "@/lib/rpc";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {toast} from "sonner";
import {useRouter} from "next/navigation";

type ResponseType = InferResponseType<typeof client.api.workspaces[":workspaceId"]["$patch"], 200>;
type RequestType = InferRequestType<typeof client.api.workspaces[":workspaceId"]["$patch"]>;

export const useUpdateWorkspace = () => {
    const router = useRouter();
    const queryClient = useQueryClient();

    const mutation = useMutation<
        ResponseType,
        Error,
        RequestType
    >({
        mutationFn: async ({form, param}) => {
            const response = await client.api.workspaces[":workspaceId"]["$patch"]({form, param});

            if (!response.ok) {
                throw new Error("Failed to update workspace");
            }

            return await response.json();
        },
        onSuccess: async ({ data }) => {
            toast.success("Workspace updated successfully!");
            router.refresh();
            queryClient.invalidateQueries({ queryKey: ["workspaces"] });
            queryClient.invalidateQueries({ queryKey: ["workspace", data.$id] });
        },
        onError: (error) => {
            console.log(error);
            toast.error("Failed to update workspace!");
        }
    });

    return mutation;
}
