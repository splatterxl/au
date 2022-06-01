import { Client, GatewayIntentBits, OAuth2Scopes, PermissionFlagsBits } from "discord.js";
import { dirname, resolve } from "node:path/posix";
import { fileURLToPath } from "node:url";
import { loadConfig } from "./util/config.js";
import { load } from "./util/load.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
  partials: [],
});

await loadConfig();

function dir(path: string, meta = import.meta!.url) {
  return resolve(dirname(fileURLToPath(meta)), path);
}

for await (const [{ name }, { default: handler }] of load<{ default: any }>(dir("events"))) {
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
