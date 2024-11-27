import {InferRequestType, InferResponseType} from "hono";
import {client} from "@/lib/rpc";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {useRouter} from "next/navigation";
import {toast} from "sonner";
import {Simulate} from "react-dom/test-utils";
import error = Simulate.error;

type ResponseType = InferResponseType<typeof client.api.auth.register["$post"]>;
type RequestType = InferRequestType<typeof client.api.auth.register["$post"]>;

export const useSignUp = () => {
    const router = useRouter();
    const queryClient = useQueryClient();

    const mutation = useMutation<
        ResponseType,
        Error,
        RequestType
    >({
        mutationFn: async ({json}) => {
            const response = await client.api.auth.register["$post"]({json});

            if (!response.ok) {
                throw new Error("Failed to register");
            }

            return await response.json();
        },
        onSuccess: async () => {
            toast.success("Registered successfully!");
            router.refresh();
            queryClient.invalidateQueries({ queryKey: ["current"] });
        },
        onError: (error) => {
            console.log(error);
            toast.error("Unable to register");
        }
    });

    return mutation;
}
