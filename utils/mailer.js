// 파일 위치: root/server/utils/mailer.js
import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEbookEmail = async ({ to, subject, text, attachmentUrl, fileName }) => {
  const res = await fetch(attachmentUrl);
  const buffer = await res.arrayBuffer();

  return transporter.sendMail({
    from: `"CareerBooks" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    attachments: [
      {
        filename: fileName,
        content: Buffer.from(buffer),
      },
    ],
  });
};
