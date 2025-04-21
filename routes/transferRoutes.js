import axios from "axios";
const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

await axios.post(webhookUrl, {
  content: `📩 *무통장입금 신청 접수*\n\n📚 **${book.title}**\n👤 예금자명: ${name}\n✉️ 이메일: ${email}\n🕒 시간: ${new Date().toLocaleString("ko-KR")}`,
});
