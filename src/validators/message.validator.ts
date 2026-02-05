import { z } from "zod";

export const sendMessageSchema = z.object({
    body: z.object({
        content: z.string().min(1),
    }),
});

export const assignCoHostSchema = z.object({
    body: z.object({
        co_host_id: z.number().int(),
    }),
});
