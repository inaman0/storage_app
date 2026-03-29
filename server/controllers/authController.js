import mongoose, { Types } from "mongoose";
import OTP from "../models/otpModel.js";
import User from "../models/userModel.js";
import { verifyIdToken } from "../services/googleAuthService.js";
import { sendOtpService } from "../services/sendOtpService.js";
import Directory from "../models/directoryModel.js";
import Session from "../models/sessionModel.js";

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

export const loginWithGoogle = async(req,res,next)=>{
  const {idToken} = req.body
  const userData = await verifyIdToken(idToken)
  const {name,email,picture,sub} = userData
  const user = await User.findOne({email}).lean()
  if(user){
    const allSessions = await Session.find({ userId: user._id });

    if (allSessions.length >= 2) {
      await allSessions[0].deleteOne();
    }

    const session = await Session.create({ userId: user._id,createdAt: new Date(Date.now() + 3600 * 1000) });

    res.cookie("sid", session.id, {
      httpOnly: true,
      signed: true,
      maxAge: 60 * 1000 * 60 * 24 * 7,
    });

    return res.status(201).json({message : "Logged in"})
  }
  const mongooseSession = await mongoose.startSession();

  try {
    const rootDirId = new Types.ObjectId();
    const userId = new Types.ObjectId();

    mongooseSession.startTransaction();

    await Directory.insertOne(
      {
        _id: rootDirId,
        name: `root-${email}`,
        parentDirId: null,
        userId,
      },
      { mongooseSession }
    );

    const newuser = await User.insertOne(
      {
        _id: userId,
        name,
        email,
        picture,
        rootDirId,
      },
      { mongooseSession }
    );

    const session = await Session.create({ userId: newuser._id,createdAt: new Date(Date.now() + 3600 * 1000)});

    res.cookie("sid", session.id, {
      httpOnly: true,
      signed: true,
      maxAge: 60 * 1000 * 60 * 24 * 7,
    });
    mongooseSession.commitTransaction();
    res.status(201).json({message : "Account created and Logged in"})
  } catch (err) {
    mongooseSession.abortTransaction();
    console.log(err);
    if (err.code === 121) {
      res
        .status(400)
        .json({ error: "Invalid input, please enter valid details" });
    }else {
      next(err);
    }
  }
}
