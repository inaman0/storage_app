import nodemailer from "nodemailer";
import OTP from "../models/otpModel.js";

export async function sendOtpService(email) {
  try {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    await OTP.findOneAndUpdate(
      { email },
      { otp, createdAt: new Date() },
      { upsert: true }
    );

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "pandyanaman2@gmail.com",
        pass: "fgszsjxaqrjawrja",
      },
    });

    const mailOptions = {
      from: `"Storage App" <pandyanaman2@gmail.com>`,
      to: email,
      subject: "Your OTP Code",
      html: `
        <div style="font-family:sans-serif;">
          <h2>Your OTP is: ${otp}</h2>
          <p>This OTP is valid for 10 minutes.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return { success: true, message: `OTP sent to ${email}` };

  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to send OTP" };
  }
}