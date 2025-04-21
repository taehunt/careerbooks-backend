import axios from "axios";

export async function sendDiscordWebhook({ depositor, email, slug, memo, userInfoText = "" }) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return;

  const content = `📥 **입금 요청 도착!**\n\n👤 입금자명: ${depositor}\n📧 이메일: ${email}\n📚 전자책: ${slug}\n📝 메모: ${memo || "없음"}${userInfoText}\n🕒 ${new Date().toLocaleString("ko-KR")}`;

  try {
    await axios.post(url, { content });
  } catch (err) {
    console.error("❌ Discord Webhook 전송 실패:", err.response?.data || err.message);
  }
}
