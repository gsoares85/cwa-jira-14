"use client";

import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {updateWorkspaceSchema} from "@/features/workspaces/schemas";
import {z} from "zod";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {DottedSeparator} from "@/components/dotted-separator";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {useRef} from "react";
import Image from "next/image";
import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {ArrowLeftIcon, ImageIcon} from "lucide-react";
import {useRouter} from "next/navigation";
import {cn} from "@/lib/utils";
import {Workspace} from "@/features/workspaces/types";
import {useUpdateWorkspace} from "@/features/workspaces/api/use-update-worspace";
import {useConfirm} from "@/hooks/use-confirm";
import {useDeleteWorkspace} from "@/features/workspaces/api/use-delete-worspace";

interface EditWorkspaceFormProps {
    onCancel?: () => void;
    initialValues: Workspace;
}

export const EditWorkspaceForm = ({onCancel, initialValues}: EditWorkspaceFormProps) => {
    const router = useRouter();
    const {mutate, isPending} = useUpdateWorkspace();
    const {mutate: deleteWorkspace, isPending: isDeletingworkspace} = useDeleteWorkspace();

    const [DeleteDialog, confirmDelete] = useConfirm(
        "Delete Workspace",
        "This action cannot be undone",
        "destructive"
    );

    const handleDelete = async () => {
        const ok = await confirmDelete();

        if (!ok) return;

        deleteWorkspace({
            param: { workspaceId: initialValues.$id },
        }, {
            onSuccess: () => {
                window.location.href = "/";
            }
        });
    }

    const inputRef = useRef<HTMLInputElement>(null);

    const editForm = useForm<z.infer<typeof updateWorkspaceSchema>>({
        resolver: zodResolver(updateWorkspaceSchema),
        defaultValues: {
            ...initialValues
        }
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            editForm.setValue("imageUrl", file);
        }
    }

    const onSubmit = (values: z.infer<typeof updateWorkspaceSchema>) => {
        const finalValues = {
            ...values,
            imageUrl: values.imageUrl instanceof File ? values.imageUrl : "",
        }

        mutate({form: finalValues, param: {workspaceId: initialValues.$id}}, {
            onSuccess: ({data}) => {
                editForm.reset();
                router.push(`/workspaces/${data.$id}`);
            },
        });
    }

    return (
        <div className="flex flex-col gap-y-4">
            <DeleteDialog />
            <Card className="w-full h-full border-none shadow-none">
                <CardHeader className="flex flex-row items-center gap-x-4 p-7 space-y-0">
                    <Button size="sm" variant="secondary"
                            onClick={onCancel ? onCancel : () => router.push(`/workspaces/${initialValues.$id}`)}>
                        <ArrowLeftIcon className="size-4 mr-2"/>
                        Back
                    </Button>
                    <CardTitle className="text-xl font-bold">
                        {initialValues.name}
                    </CardTitle>
                </CardHeader>
                <div className="px-7">
                    <DottedSeparator/>
                </div>
                <CardContent className="p-7">
                    <Form {...editForm}>
                        <form onSubmit={editForm.handleSubmit(onSubmit)}>
                            <div className="flex flex-col gap-y-4">
                                <FormField
                                    control={editForm.control}
                                    name="name"
                                    render={({field}) => (
                                        <FormItem>
                                            <FormLabel>
                                                Workspace Name
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter workspace name"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={editForm.control}
                                    name="imageUrl"
                                    render={({field}) => (
                                        <div className="flex flex-col gap-y-2">
                                            <div className="flex items-center gap-x-5">
                                                {field.value ? (
                                                    <div className="size-[72px] relative rounded-md overflow-hidden">
                                                        <Image
                                                            src={field.value instanceof File
                                                                ? URL.createObjectURL(field.value)
                                                                : field.value
                                                            }
                                                            alt="Avatar image"
                                                            fill
                                                            className="object-cover"
                                                        />
                                                    </div>
                                                ) : (
                                                    <Avatar className="size-[72px]">
                                                        <AvatarFallback>
                                                            <ImageIcon className="size-[36px] text-neutral-400"/>
                                                        </AvatarFallback>
                                                    </Avatar>
                                                )}
                                                <div className="flex flex-col">
                                                    <p className="text-sm">Workspace icon</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        JPG, PNG, SVG or JPEG, max 1mb
                                                    </p>
                                                    <input
                                                        className="hidden"
                                                        type="file"
                                                        accept=".jpg, .png, .jpeg, .svg"
                                                        ref={inputRef}
                                                        disabled={isPending}
                                                        onChange={handleImageChange}
                                                    />
                                                    <Button
                                                        type="button"
                                                        disabled={isPending}
                                                        variant="teritary"
                                                        size="xs"
                                                        className="w-fit mt-2"
                                                        onClick={() => inputRef.current?.click()}
                                                    >
                                                        Upload Image
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                />
                            </div>
                            <DottedSeparator className="py-7"/>
                            <div className="flex items-center justify-between">
                                <Button
                                    type="button"
                                    size="lg"
                                    variant="secondary"
                                    onClick={onCancel}
                                    disabled={isPending}
                                    className={cn(!onCancel && "invisible")}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    size="lg"
                                    variant="primary"
                                    disabled={isPending}
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
            <Card className="w-full h-full border-none shadow-none">
                <CardContent className="p-7">
                    <div className="flex flex-col">
                        <h3 className="font-bold">Danger Zone</h3>
                        <p className="text-sm text-muted-foreground">
                            Deleting a workspace is irreversible and will remove all associated data
                        </p>
                        <Button
                            className="mt-6 w-fit ml-auto"
                            size="sm"
                            variant="destructive"
                            type="button"
                            disabled={isPending || isDeletingworkspace}
                            onClick={handleDelete}
                        >
                            Delete Workspace
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
