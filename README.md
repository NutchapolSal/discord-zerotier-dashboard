# discord-zerotier-dashboard
small script to update a webhook message with data from a zerotier network

![Screenshot 2025-06-22 212135](https://github.com/user-attachments/assets/6222f6b4-30c2-4e99-b445-6218f577f050)

## Setup
available as a docker image `ghcr.io/nutchapolsal/discord-zerotier-dashboard`

## Configuring
you need to provide some environment variables so the script can work
- `ZEROTIER_NETWORK_ID`: the network id
- `ZEROTIER_TOKEN`: a zerotier central api token for the account with admin(?) access to the network, which can be obtained at https://my.zerotier.com/account
- `ZEROTIER_DESCRIPTION_KEYWORD`: if specified, the script will only show details of network members with the keyword in their description
- `DISCORD_WEBHOOK_URL`: a discord webhook url
- `DISCORD_WEBHOOK_MESSAGE_ID`: the message id for the script to keep updating the same message. if unspecified, the script will send a new message and print out the message id to be put here.
