import axios from "axios";

export async function sendDiscordWebhook({ content }) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;

  const message = {
    content: `📥 **입금 요청 도착!**\n\n👤 입금자명: ${data.depositor}\n📧 이메일: ${data.email}\n📚 전자책: ${data.slug}\n📝 메모: ${data.memo || "없음"}\n🕒 ${new Date().toLocaleString("ko-KR")}`
  };

  try {
    await axios.post(url, { content });
  } catch (err) {
    console.error("❌ Discord Webhook 전송 실패:", err.response?.data || err.message);
  }
}
