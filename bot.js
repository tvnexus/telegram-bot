require('dotenv').config();
const { Telegraf } = require('telegraf');

// 健壮性检查
if (!process.env.BOT_TOKEN) {
    console.error("【错误】缺少 BOT_TOKEN 环境变量！");
    process.exit(1);
}

const bot = new Telegraf(process.env.BOT_TOKEN);
const ADMIN_ID = process.env.ADMIN_ID;

// 监听所有私聊消息
bot.on('message', async (ctx) => {
    // 只处理私聊，忽略群聊
    if (ctx.chat.type !== 'private') return;

    const user = ctx.from;
    const currentUserId = user.id.toString();

    // ====== 场景 A：管理员回复用户 ======
    if (currentUserId === ADMIN_ID) {
        // 必须是管理员“回复”了某条消息才触发
        if (!ctx.message.reply_to_message) return;

        // 从被回复的那条消息里，用正则表达式匹配出用户的数字 ID
        const match = ctx.message.reply_to_message.text ? ctx.message.reply_to_message.text.match(/🆔 (\d+)/) : null;
        if (!match) {
            await ctx.reply('⚠️ 无法从中匹配到用户 ID，请确保你是右键回复了包含“🆔 数字”的那条系统转发消息。');
            return;
        }

        const targetUserId = match[1];
        const replyText = ctx.message.text || '[暂不支持非文本回复]';

        try {
            await ctx.telegram.sendMessage(targetUserId, `💬 客服回复：\n\n${replyText}`);
            await ctx.reply('✅ 回复已成功送达用户。');
        } catch (err) {
            await ctx.reply(`❌ 发送失败，原因: ${err.message}`);
        }
        return; // 结束流程
    }

    // ====== 场景 B：普通用户发消息给 Bot ======
    const text = ctx.message.text || '[非文本消息]';

    try {
        // 转发给管理员，格式要固定，方便上面场景 A 的正则表达式匹配 ID
        await ctx.telegram.sendMessage(
            ADMIN_ID,
            `📩 收到新客户消息\n\n👤 昵称: ${user.first_name || ''} ${user.last_name || ''}\n🆔 编号: ${user.id}\n📛 用户名: @${user.username || 'none'}\n\n💬 消息内容:\n${text}`
        );
        // 给用户一个收到反馈的提示
        await ctx.reply('✅ 消息已送达支持团队，请耐心等待回复。');
    } catch (err) {
        console.error("转发给管理员失败，可能 ADMIN_ID 填错了:", err);
    }
});

// 启动机器人
bot.launch().then(() => {
    console.log("🚀 机器人已成功连接 Telegram 服务器，正在运行中...");
}).catch((err) => {
    console.error("❌ 机器人启动失败:", err);
});

// 优雅停机
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));