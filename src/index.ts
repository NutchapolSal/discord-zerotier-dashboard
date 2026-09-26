import { EmbedBuilder, WebhookClient } from "discord.js"
import { config } from "./config.ts"
import { toHostname } from "./hostname.ts"
import { getNetwork, getNetworkMembers, type ZTNetworkMember } from "./zt.ts"

const keyword = config.ZEROTIER_DESCRIPTION_KEYWORD

function createEmbed(
    networkName: string,
    networkDomain: string | null,
    networkMembers: ZTNetworkMember[],
) {
    const dateNow = new Date()

    const embed = new EmbedBuilder()
    embed.setColor("#ffb441")

    embed.setTitle(networkName)
    embed.setDescription(`\`${config.ZEROTIER_NETWORK_ID}\`\n`)

    embed.setTimestamp(dateNow)

    const lastSeenLimitDate = new Date(dateNow)
    lastSeenLimitDate.setMinutes(lastSeenLimitDate.getMinutes() - 5)

    const authedMembers = networkMembers.filter((v) => v.config.authorized)

    authedMembers
        .filter((v) => v.description.includes(keyword))
        .toSorted((a, b) =>
            (a.name ?? a.nodeId).localeCompare(b.name ?? a.nodeId),
        )
        .forEach((v) => {
            const online = lastSeenLimitDate < new Date(v.lastSeen)
            const header = `${online ? "🟢" : "➖"} ${v.name ?? v.nodeId}`
            if (!online) {
                if (config.DISPLAY_OFFLINE_MEMBERS === false) {
                    return
                }

                if (config.DISPLAY_OFFLINE_MEMBERS == "short") {
                    embed.addFields({
                        name: header,
                        value: "",
                    })
                    return
                }
            }

            const list = []
            if (networkDomain) {
                const domainName = v.name ? toHostname(v.name) : null
                if (domainName) {
                    list.push(`\`${domainName}.${networkDomain}\``)
                } else {
                    list.push(`\`zt-${v.nodeId}.${networkDomain}\``)
                }
            }
            list.push(...v.config.ipAssignments.map((ip) => `\`${ip}\``))
            const list2 = []
            if (config.DISPLAY_PHYSICAL_ADDRESS) {
                list2.push(`**Internal**`)
            }
            list2.push(list.join("\n"))
            if (config.DISPLAY_PHYSICAL_ADDRESS && v.physicalAddress) {
                list2.push(`**Physical**`)
                list2.push(`\`${v.physicalAddress}\``)
            }
            embed.addFields({
                name: header,
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
        embeds: [createEmbed("Loading...", "zt.example.com", [])],
    })
    console.log(`set DISCORD_WEBHOOK_MESSAGE_ID with ${msg.id}`)
    process.exit()
}

console.log("starting...", new Date())
/* eslint-disable no-await-in-loop */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
while (true) {
    const network = await getNetwork({
        networkId: config.ZEROTIER_NETWORK_ID,
        token: config.ZEROTIER_TOKEN,
    })

    const networkMembers = await getNetworkMembers({
        networkId: config.ZEROTIER_NETWORK_ID,
        token: config.ZEROTIER_TOKEN,
    })

    const zerotierDomain =
        network.config.dns.domain ?? config.ZEROTIER_DOMAIN ?? null

    await webhookClient.editMessage(config.DISCORD_WEBHOOK_MESSAGE_ID, {
        content: "",
        embeds: [
            createEmbed(network.config.name, zerotierDomain, networkMembers),
        ],
    })
    await new Promise((resolve) => setTimeout(resolve, 1000 * 60 * 3))
}
