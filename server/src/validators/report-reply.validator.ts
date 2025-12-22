import { z } from "zod";

export const reportReplySchema = z.object({
    message: z.string().min(1),
});
