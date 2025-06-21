import * as z from "zod/v4"

const configRes = z
    .object({
        DISCORD_WEBHOOK_URL: z.url(),
        ZEROTIER_TOKEN: z.string(),
        ZEROTIER_NETWORK_ID: z.string(),
        ZEROTIER_DESCRIPTION_KEYWORD: z.string().default(""),
        DISCORD_WEBHOOK_MESSAGE_ID: z.string().nullish(),
    })
    .safeParse(process.env)
if (!configRes.success) {
    console.error("Invalid environment variables:")
    console.error(z.prettifyError(configRes.error))
    process.exit()
}
export const config = configRes.data
