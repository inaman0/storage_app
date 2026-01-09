import User from "../models/userModel.js";
import Directory from "../models/directoryModel.js";
import mongoose from "mongoose";

export const createUser = async (req, res, next) => {
    const {name, email, password} = req.body
    const foundUser = await User.findOne({email}).lean()
    if(foundUser) {
        return res.status(409).json({
        error: "User already exists",
        message: "A user with this email address already exists. Please try logging in or use a different email."
        })
    }
    const rootDirId = new mongoose.Types.ObjectId()
    const userId = new mongoose.Types.ObjectId()

    const session = await mongoose.startSession()
    try {
        session.startTransaction() 

        await Directory.insertOne({
            _id: rootDirId,
            name : `root-${email}`,
            parentDirId : null,
            userId,
        },{session})

        await User.insertOne({
            _id:userId,
            name,
            email,
            password,
            rootDirId,
        },{session})
        session.commitTransaction()
        res.status(201).json({message: "User Registered"})
    } catch(err) {
        if(err.code === 121){
        res.status(400).json({error : "Invalid input, please enter valid details"})
        session.abortTransaction()
        }
        else{
        next(err)
        }
    }
}

export const userLogin = async (req, res, next) => {
    const {email, password} = req.body
    const user = await User.findOne({email,password})
    if(!user) {
        return res.status(404).json({error: 'Invalid Credentials'})
    }
    const userOid = user._id.toString()
    res.cookie('uid', userOid, {
        httpOnly: true,
        maxAge: 60 * 1000 * 60 * 24 * 7
    })
    res.json({message: 'logged in'})
}