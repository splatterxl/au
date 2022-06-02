import { readFile } from "node:fs/promises";
import * as YAML from "yaml";

export interface Config {
  config: ConfigData;
}

export interface ConfigData {
  guilds: Record<
    string,
    {
      allow_expressions?: boolean;
      blacklist_user_ids?: string[];
      allow_role_ids?: string[];
      log_channel_id?: string;
      tags: Array<{
        name: string;
        trigger: string;
        content?: string;
        file?: string;
      }>;
    }
  >;
}

export interface ConfigDataResolved {
  guilds: Map<
    string,
    {
      allowExpressions: boolean;
      denyUserIds: string[];
      allowRoleIds: string[];
      logChannelId: string;
      tags: Array<{
        name: string;
        trigger: RegExp;
        content: string;
      }>;
    }
  >;
}

export let config: ConfigDataResolved = undefined as any;

export async function loadConfig() {
  const data = await readFile("./config.yaml", "utf8");

  console.log(":: Config loading");

  config = await handle(YAML.parse(data));

  console.log(":: Config loaded");
}

async function handle(data: Config) {
  const config = data.config;

  let field = ["config"];

  if (!config) {
    _error("Missing configuration", field);
  }

  const resolved: ConfigDataResolved = {
    guilds: new Map(),
  };

  for (const id in config.guilds) {
    if (typeof id !== "string") {
      _error("Invalid guild id", field);
    }

    const guild = config.guilds[id];
    const data: any = {};

    field = ["config", "guilds", id];

    if (!guild) {
      _error("Missing guild configuration", field);
    }

    if (
      "allow_expressions" in guild &&
      typeof guild.allow_expressions !== "boolean"
    ) {
      _error("Invalid allow_expressions", field);
    }

    data.allowExpressions = guild.allow_expressions ?? true;

    if (
      "blacklist_user_ids" in guild &&
      !Array.isArray(guild.blacklist_user_ids)
    ) {
      _error("Invalid blacklist_role_ids", field);
    }

    data.denyUserIds = guild.blacklist_user_ids ?? [];

    if ("allow_role_ids" in guild && !Array.isArray(guild.allow_role_ids)) {
      _error("Invalid allow_role_ids", field);
    }

    data.allowRoleIds = guild.allow_role_ids ?? [];

    if ("log_channel_id" in guild && typeof guild.log_channel_id !== "string") {
      _error("Invalid log_channel_id", field);
    }

    data.logChannelId = guild.log_channel_id ?? "";

    if (!Array.isArray(guild.tags)) {
      _error("Invalid tags", field);
    }

    data.tags = await Promise.all(
      guild.tags.map(async (tag) => {
        field = [
          "config",
          "guilds",
          id,
          "tags",
          guild.tags.indexOf(tag).toString(),
        ];

        if (typeof tag.name !== "string") {
          _error("Invalid tag name", field);
        }

        if (typeof tag.trigger !== "string") {
          _error("Invalid tag trigger", field);
        }

        // @ts-ignore
        let trigger =
          tag.trigger.indexOf("/") === 0
            ? new RegExp(...tag.trigger.slice(1).split("/", 2))
            : new RegExp(tag.trigger);

        if (
          "content" in tag &&
          (typeof tag.content !== "string" || !tag.content)
        ) {
          _error("Invalid tag content", field);
        }

        if ("file" in tag && typeof tag.file !== "string") {
          _error("Invalid tag file", field);
        }

        if ("content" in tag && "file" in tag) {
          _error("Tag cannot have both content and file", field);
        }

        let { content = "", file } = tag;

        if (file) {
          try {
            content = await readFile(file, "utf8");
          } catch (err) {
            _error("Failed to read tag file", field);
          }
        }

        return {
          name: tag.name,
          trigger,
          content: content.trim(),
        };
      })
    );

    resolved.guilds.set(id, data);
  }

  return resolved;
}

function _error(message: string, field: string[]) {
  console.error(":: Config error at field %s: %s", field.join("."), message);
  process.exit(1);
}
