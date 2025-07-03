import nodemailer from "nodemailer";
import { authMailTemplate } from "./authMailTemplate";

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  secure: true,
  auth: {
    user: process.env.EMAIL_SENDER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

type MailType = "reset" | "forgot";

interface SendAuthEmailOptions {
  to: string;
  name: string;
  code: string | number;
  expiresOn: string;
  type: MailType;
}

export async function sendAuthEmail({
  to,
  name,
  code,
  expiresOn,
  type,
}: SendAuthEmailOptions): Promise<string> {
  let subject: string;
  let message: string;
  if (type === "reset") {
    subject = "Your Password Reset Code";
    message = "Your password reset code is:";
  } else if (type === "forgot") {
    subject = "Your Forgot Password Code";
    message = "Your forgot password code is:";
  } else {
    throw new Error("Invalid email type");
  }

  const html = authMailTemplate({
    title: subject,
    message,
    name,
    code,
    expiresOn,
  });

  try {
    const info = await transporter.sendMail({
      from: `"DarajaDevToolkit" <${process.env.EMAIL_SENDER}>`,
      to,
      subject,
      html,
    });
    if (info.accepted.length > 0) {
      return "Email sent successfully";
    } else {
      return "Email not sent, please try again";
    }
  } catch (error) {
    console.error(error);
    return "Email server error";
  }
}

export const sendNotificationEmail = async (
  email: string,
  subject: string,
  message: string,
) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      host: 'smtp.gmail.com',
      secure: true,
      auth: {
        user: process.env.EMAIL_SENDER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_SENDER,
      to: email,
      subject: subject,
      
     
    };

    const mailRes = await transporter.sendMail(mailOptions);
   

    if (mailRes.accepted.length > 0) {
      return "Notification email sent successfully";
    } else if (mailRes.rejected.length > 0) {
      return "Notification email not sent, please try again";
    } else {
      return "Email server error";
    }
  } catch (error) {
    console.error(error);
    return "Email server error";
  }
};