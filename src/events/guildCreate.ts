import {
  Client,
  Guild,
  ChannelType,
  PermissionFlagsBits,
  TextBasedChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import { config } from "../util/config.js";

export default function (client: Client, guild: Guild) {
  // log guild create
  console.log(
    "-> Joined guild %s (%s; owner %s)",
    guild.name,
    guild.id,
    guild.ownerId
  );

  // send message in first channel we can write in
  const channel = guild.channels.cache.find(
    (c) =>
      c.type === ChannelType.GuildText &&
      c.permissionsFor(guild.members.me!)?.has(PermissionFlagsBits.SendMessages)
  ) as TextBasedChannel;

  // check if config includes this guild
  if (!config.guilds.has(guild.id)) {
    console.log("--> Guild %s (%s) has no config", guild.name, guild.id);

    if (channel) {
      channel.send(
        "Hello! I'm a private, selfhosted bot to manage automatic responses to certain phrases.\n\nI don't seem to have any configuration stored for this server, so I'm afraid I will have to leave. If this is a mistake, please check my logs."
      );
    }

    guild.leave();
  } else {
    console.log("--> Guild %s (%s) has config", guild.name, guild.id);

    if (channel) {
      channel.send({
        content:
          "Hello! I'm a private, selfhosted bot to manage automatic responses to certain phrases.\n\nI'm now ready to listen to triggers in this server. Don't worry, I don't log messages.",
        components: [
          new ActionRowBuilder<ButtonBuilder>()
            .addComponents([
              new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel("Privacy Policy")
                .setURL(
                  "https://github.com/splatterxl/au/blob/main/privacy.md"
                ),
            ])
            .toJSON(),
        ],
      });
    }
  }
}
