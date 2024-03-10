import "dotenv/config";

import { readFileSync } from "fs";
import { fastify } from "fastify";
import cors from "@fastify/cors";

import { Message } from "telegraf/types";
import { Context, Markup, Telegraf, Input } from "telegraf";

import type { WebAppData, ImageKit } from "./types";
import { imagekitRoute } from "./routes/imagekit.route";

function createBot(accessToken: string) {
  const bot = new Telegraf(accessToken);
  let link = "https://meme-flip-ai.vercel.app";

  const echo = (ctx: Context) => {
    const message = ctx.message as Message.TextMessage;
    if (
      message.text.startsWith("/") &&
      ["/help", "/socials"].includes(message.text)
    )
      return;

    ctx.replyWithMarkdownV2(
      readFileSync("./start.md", "utf-8").replace(/\!/g, "\\!"),
      Markup.inlineKeyboard([Markup.button.webApp("Create Meme", link)])
    );
  };

  bot.telegram.setMyCommands([
    {
      command: "help",
      description: "Show sora help",
    },
    {
      command: "socials",
      description: "Show our social media handles and website",
    },
  ]);

  bot.start(echo);

  const onWebData = (ctx: Context) => {
    const { command, response } = JSON.parse(
      (ctx.message as Message.WebAppDataMessage).web_app_data.data
    ) as WebAppData<ImageKit>;
    if (command === "echo-imagekit") {
      ctx.replyWithPhoto(Input.fromURL(response.url), {
        caption: "Meme output generated using MemeAI",
      });
    }
  };

  const onHelp = (ctx: Context) => {
    ctx.replyWithMarkdownV2(
      readFileSync("./help.md", "utf-8")
        .replace(/\-/g, "\\-")
        .replace(/\./g, "\\.")
    );
  };

  const onSocials = (ctx: Context) => {
    ctx.replyWithMarkdownV2(readFileSync("./socials.md", "utf-8"));
  };

  bot.on("message", (ctx) => {
    if ("web_app_data" in ctx.message) return onWebData(ctx);
    const message = ctx.message as Message.TextMessage;
    if ("text" in message) {
      if (message.text === "/socials") return onSocials(ctx);
      if (message.text === "/help") return onHelp(ctx);
    }

    return echo(ctx);
  });

  return bot;
}

export async function main() {
  const app = fastify({
    logger: true,
    ignoreTrailingSlash: true,
    ignoreDuplicateSlashes: true,
  });

  await app.register(cors, {
    origin: "*",
  });

  const bot = createBot(process.env.TELEGRAM_API_KEY!);
  const port = Number(process.env.PORT);
  const webhook = (await bot.createWebhook({
    domain: process.env.RENDER_EXTERNAL_HOSTNAME,
  })) as any;

  imagekitRoute(app);
  app.post(`/telegraf/${bot.secretPathComponent()}`, webhook);

  try {
    await app.listen({ port, host: process.env.HOST });
    console.log("Listening on port", port);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main().catch(console.log);
