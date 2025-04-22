import axios from "axios";

export async function sendDiscordWebhook({ depositor, email, slug, memo, userInfoText = "" }) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) {
    console.warn("❗ DISCORD_WEBHOOK_URL 이 설정되지 않았습니다.");
    return;
  }

  const content = `/* * * * * * * * * * * * * */\n📥 **입금 확인 요망**\n\n👤 입금자명: ${depositor}\n📧 이메일: ${email}\n📚 전자책: ${slug}\n📝 메모: ${memo || "없음"}${userInfoText}\n🕒 ${new Date().toLocaleString("ko-KR")}`;

  console.log("🔔 Discord Webhook 요청 내용:\n", content); // 추가됨

  try {
    const res = await axios.post(url, { content });
    console.log("✅ Discord Webhook 전송 성공", res.status);
  } catch (err) {
    console.error("❌ Discord Webhook 전송 실패:", err.response?.data || err.message);
    throw err; // 500 전달을 위해 그대로 throw
  }
}
