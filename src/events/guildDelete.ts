import { Client, Guild } from "discord.js";

export default function (client: Client, guild: Guild) {
  console.log(
    "-> Left guild %s (%s, owner %s)",
    guild.name,
    guild.id,
    guild.ownerId
  );
}
