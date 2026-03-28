import OTP from "../models/otpModel.js";
import { sendOtpService } from "../services/sendOtpService.js";

export const sendOtp = async (req, res, next) => {
  const { email } = req.body;
  const resData = await sendOtpService(email);
  res.status(201).json(resData);
};

export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  const otpRecord = await OTP.findOne({ email });

  if (!otpRecord) {
    return res.status(400).json({ error: "OTP not found" });
  }

  // Expiry check (extra safety)
  const isExpired =
    new Date() - new Date(otpRecord.createdAt) > 10 * 60 * 1000;

  if (isExpired) {
    return res.status(400).json({ error: "OTP expired" });
  }

  if (otpRecord.otp !== otp) {
    return res.status(400).json({ error: "Invalid OTP" });
  }

  return res.json({ message: "OTP Verified!" });
};
