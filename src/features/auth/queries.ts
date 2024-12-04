import "server-only"
import {createSessionClient} from "@/lib/appwrite";

export const getCurrent = async () => {
    try {
        const { account } = await createSessionClient()

        return account.get();
    } catch (error) {
        return null;
    }
}
