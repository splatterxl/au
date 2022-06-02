import { Client, GatewayIntentBits, OAuth2Scopes, Partials, PermissionFlagsBits } from "discord.js";
import { dirname, resolve } from "node:path/posix";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./util/config.js";
import { load } from "./util/load.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  sweepers: {
    messages: {
      interval: /* 5 seconds */ 5000,
      lifetime: /* 30 minutes */ 1800000,
    },
  },
  partials: [
    Partials.Message,
  ]
});

await loadConfig();

function dir(path: string, meta = import.meta!.url) {
  return resolve(dirname(fileURLToPath(meta)), path);
}

for await (const [{ name }, { default: handler }] of load<{ default: any }>(dir("events"))) {
  console.log(":: Load event %s", name);
  client.on(name, handler.bind(null, client));
}

client.login().then(() => {
  console.log("(info) invite link: %s", client.generateInvite({
    scopes: [OAuth2Scopes.Bot],
    permissions: [
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ViewChannel,
    ]
  }))
});
