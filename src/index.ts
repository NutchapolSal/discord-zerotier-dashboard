import { EmbedBuilder, WebhookClient } from "discord.js"
import { config } from "./config.ts"
import { getNetwork, getNetworkMembers } from "./zt.ts"

const keyword = config.ZEROTIER_DESCRIPTION_KEYWORD

async function createEmbed() {
    const dateNow = new Date()

    const embed = new EmbedBuilder()
    embed.setColor("#ffb441")

    const network = await getNetwork({
        networkId: config.ZEROTIER_NETWORK_ID,
        token: config.ZEROTIER_TOKEN,
    })

    const networkMembers = await getNetworkMembers({
        networkId: config.ZEROTIER_NETWORK_ID,
        token: config.ZEROTIER_TOKEN,
    })

    embed.setTitle(network.config.name)
    embed.setDescription(`\`${config.ZEROTIER_NETWORK_ID}\`\n`)

    embed.setTimestamp(dateNow)

    const lastSeenLimitDate = new Date(dateNow)
    lastSeenLimitDate.setMinutes(lastSeenLimitDate.getMinutes() - 5)

    const authedMembers = networkMembers.filter((v) => v.config.authorized)

    authedMembers
        .filter((v) => v.description.includes(keyword))
        .toSorted((a, b) => (a.name ?? "").localeCompare(b.name ?? ""))
        .forEach((v) => {
            const online = lastSeenLimitDate < new Date(v.lastSeen)
            const domainName = v.name?.toLowerCase().replace(/ /gu, "-")
            const list = []
            if (domainName) {
                list.push(`\`${domainName}.${network.config.dns.domain}\``)
            }
            list.push(...v.config.ipAssignments.map((ip) => `\`${ip}\``))
            const list2 = [`**Internal**\n${list.join("\n")}`]
            if (v.physicalAddress) {
                list2.push(`**Physical**\n\`${v.physicalAddress}\``)
            }
            embed.addFields({
                name: `${online ? "🟢" : "➖"} ${v.name}`,
                value: list2.join("\n"),
            })
        })

    const onlineCount = authedMembers.filter(
        (v) => lastSeenLimitDate < new Date(v.lastSeen),
    ).length
    const allCount = authedMembers.length

    embed.setFooter({
        text: `${onlineCount} online / ${allCount} total`,
        iconURL:
            "https://www.zerotier.com/wp-content/uploads/2024/10/Favicon-300x300.png",
    })

    return embed
}

const webhookClient = new WebhookClient({ url: config.DISCORD_WEBHOOK_URL })
if (!config.DISCORD_WEBHOOK_MESSAGE_ID) {
    const msg = await webhookClient.send({
        content: "",
        embeds: [await createEmbed()],
    })
    console.log(`set DISCORD_WEBHOOK_MESSAGE_ID with ${msg.id}`)
    process.exit()
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
while (true) {
    // eslint-disable-next-line no-await-in-loop
    await webhookClient.editMessage(config.DISCORD_WEBHOOK_MESSAGE_ID, {
        content: "",
        // eslint-disable-next-line no-await-in-loop
        embeds: [await createEmbed()],
    })
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 1000 * 60 * 3))
}
