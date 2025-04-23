// 파일 위치: root/server/utils/mailer.js
import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEbookEmail = async ({ to, subject, attachmentUrl, bookTitle }) => {
	return transporter.sendMail({
	  from: `"CareerBooks" <${process.env.EMAIL_USER}>`,
	  to,
	  subject,
	  html: `
		<div style="font-family: Arial, sans-serif; line-height: 1.6;">
		  <h2>📘 ${bookTitle} 전자책 다운로드 안내</h2>
		  <p>안녕하세요!</p>
		  <p><strong>${bookTitle}</strong> 전자책을 아래 버튼을 통해 다운로드하실 수 있습니다.</p>
		  <p style="margin: 20px 0;"><a href="${attachmentUrl}" style="background:#4F46E5;color:#fff;padding:10px 15px;border-radius:5px;text-decoration:none;">📥 다운로드</a></p>
		  <p>감사합니다.<br/>CareerBooks 드림</p>
		</div>
	  `,
	});
  };
  