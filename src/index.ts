import "dotenv/config";

import { readFileSync } from "fs";
import { fastify } from "fastify";
import { Update, Message } from "telegraf/types";
import { Context, Markup, Telegraf } from "telegraf";

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
  // bot.on("message", echo);
  bot.command("help", (ctx) => {
    ctx.replyWithMarkdownV2(
      readFileSync("./help.md", "utf-8")
        .replace(/\-/g, "\\-")
        .replace(/\./g, "\\.")
    );
  });
  bot.command("socials", (ctx) => {
    ctx.replyWithMarkdownV2(readFileSync("./socials.md", "utf-8"));
  });

  return bot;
}

export async function main() {
  const app = fastify({
    logger: true,
  });

  const bot = createBot(process.env.TELEGRAM_API_KEY!);
  const port = Number(process.env.PORT);
  const webhook = (await bot.createWebhook({
    domain: process.env.RENDER_EXTERNAL_HOSTNAME,
  })) as any;

  app.post(`/telegraf/${bot.secretPathComponent()}`, webhook);

  try {
    await app.listen({ port, host: "0.0.0.0" });
    console.log("Listening on port", port);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main().catch(console.log);
