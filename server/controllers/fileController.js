import { createWriteStream } from "fs";
import { rm } from "fs/promises";
import path from "path";
import { ObjectId } from "mongodb";
import File from "../models/fileModel.js";
import Directory from "../models/fileModel.js";
import mongoose from "mongoose";

export const getFile = async (req, res) => {
    const { id } = req.params;
    const fileData = await File.findOne({_id: id , userId : req.user._id}).lean();

    if (!fileData) {
        return res.status(404).json({ error: "File not found!" });
    }

    const filepath =`${process.cwd()}/storage/${id}${fileData.extension}`
    if (req.query.action === "download") {
        return res.download(filepath,fileData.name)
    }

    return res.sendFile(filepath, (err) => {
        if (!res.headersSent && err) {
        return res.status(404).json({ error: "File not found!" });
        }
    });
}

export const createFile = async (req, res, next) => {
  try {
    const parentDirId = new mongoose.Types.ObjectId(
      req.params.parentDirId ?? req.user.rootDirId
    );
    // console.log(parentDirId)
    const parentDirData = await Directory.findOne({
      _id: parentDirId,
      userId: req.user._id
    }).lean();
    
    if (!parentDirData) {
      return res.status(404).json({ error: "Parent directory not found!" });
    }

    const filename = req.headers.filename || "untitled";
    const extension = path.extname(filename) || "unknown";

    const fileDoc = await File.create({
      name: filename,
      extension,
      parentDirId,
      userId: req.user._id
    });

    const fullFileName = `${fileDoc._id}${extension}`;
    const writeStream = createWriteStream(`./storage/${fullFileName}`);

    req.pipe(writeStream);

    writeStream.on("finish", () => {
      res.status(201).json({ message: "File Uploaded" });
    });

    writeStream.on("error", async () => {
      await File.deleteOne({ _id: fileDoc._id });
      res.status(500).json({ message: "Could not upload file" });
    });

  } catch (err) {
    next(err);
  }
};

export const renameFile = async (req, res, next) => {
    const { id } = req.params;
    const file = await File.findOne({_id: new ObjectId(id) , userId : req.user._id});

    if (!file) {
        return res.status(404).json({ error: "File not found!" });
    }

    try {
        file.name = req.body.newFilename
        await file.save()
        return res.status(200).json({ message: "Renamed" });
    } catch (err) {
        err.status = 500;
        next(err);
    }
}

export const deleteFile = async (req, res, next) => {
    const { id } = req.params;

    const fileData = await File.findOne({_id:id , userId : req.user._id}).select("extension");

    if(!fileData){
        return res.status(404).json({error : "File not found"})
    }

    try {
        await rm(`./storage/${id}${fileData.extension}`);
        await fileData.deleteOne()
        return res.status(200).json({ message: "File Deleted Successfully" });
    } catch (err) {
        next(err);
    }
}