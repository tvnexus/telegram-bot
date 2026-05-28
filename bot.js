require('dotenv').config();
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_ID = process.env.ADMIN_ID;

// 用户 → 管理员
bot.on('message', async (ctx) => {
    if (ctx.chat.type !== 'private') return;

    const user = ctx.from;

    const text = ctx.message.text || '[Non-text message]';

    await ctx.telegram.sendMessage(
        ADMIN_ID,
        `📩 New Message

👤 ${user.first_name}
🆔 ${user.id}
📛 @${user.username || 'none'}

💬 ${text}`
    );

    await ctx.reply('✅ Message sent to support.');
});

// 管理员回复 → 用户
bot.on('text', async (ctx) => {
    if (ctx.from.id.toString() !== ADMIN_ID) return;

    if (!ctx.message.reply_to_message) return;

    const match = ctx.message.reply_to_message.text.match(/🆔 (\d+)/);

    if (!match) return;

    const userId = match[1];

    await ctx.telegram.sendMessage(
        userId,
        `💬 Support:\n\n${ctx.message.text}`
    );
});

bot.launch();
console.log("Bot running...");