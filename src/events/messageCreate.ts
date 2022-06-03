import {
  Client,
  Message,
  TextBasedChannel,
  ChannelType,
  PermissionFlagsBits,
} from "discord.js";
import { config } from "../util/config.js";

export default async function (client: Client, message: Message) {
  if (!message.guild || message.author.bot) return;

  const guild = config.guilds.get(message.guild.id);

  if (!guild) {
    // get first channel we can talk in
    const channel = message.guild!.channels.cache.find(
      (c) =>
        c.type === ChannelType.GuildText &&
        c
          .permissionsFor(message.guild!.members.me!)
          ?.has(PermissionFlagsBits.SendMessages)
    ) as TextBasedChannel;

    if (channel) {
      channel.send(
        "I don't have any configuration for this server, please contact my owner(s). Goodbye! :wave:"
      );
    }

    await message.guild!.leave();

    return;
  }

  if (guild.denyUserIds?.includes(message.author.id)) {
    return;
  }

  const clean = message.content.replace(/<[@&]!?.*?>|<a?:.*?:.*?>/g, " ");

  for (const tag of guild.tags) {
    if (tag.trigger.test(clean)) {
      console.log(
        "tag %s matched by user %s (%s) in channel %s",
        tag.name,
        message.author.username,
        message.author.id,
        message.channel.id
      );
      // fetch the last 5 messages in the channel
      const messages = message.channel.messages.cache
        .sort((a, b) => b.createdTimestamp - a.createdTimestamp)
        .map((x) => [x.author.id, x.content])
        .slice(0, 10);

      if (guild.logChannelId) {
        const logChannel = message.guild.channels.cache.get(
          guild.logChannelId
        ) as TextBasedChannel;

        if (logChannel) {
          await logChannel.send({
            content: `**${message.author.tag}** (\`${message.author.id}\`) triggered response **"${tag.name}"** with content:`,
            embeds: [
              {
                description: message.content,
                color: 0x00ff00,
              },
            ],
          });
        }
      }

      if (
        messages.some(
          ([id, content]) => id === client.user!.id && content === tag.content
        )
      ) {
        break;
      }

      await message.channel.send({
        content: tag.content,
        reply: {
          messageReference: message,
        },
      });

      break;
    }
  }
}
