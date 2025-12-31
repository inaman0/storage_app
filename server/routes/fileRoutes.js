import express from "express";
import { createWriteStream } from "fs";
import { rm } from "fs/promises";
import path from "path";
import validateid from "../middlewares/validateid.js";
import { ObjectId } from "mongodb";

const router = express.Router();

router.param("id",validateid)
router.param("parentDirId",validateid)

router.get("/:id", async (req, res) => {
  const db = req.db
  const filecollection = db.collection('files')
  const { id } = req.params;
  const fileData = await filecollection.findOne({_id: new ObjectId(id) , userId : req.user._id});

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
});

router.post("/:parentDirId?", async (req, res, next) => {
  const db = req.db
  const dircollection = db.collection('directories')
  const filecollection = db.collection('files')
  const parentDirId = req.params.parentDirId ? new ObjectId(req.params.parentDirId) : req.user.rootDirId;
  const parentDirData = await dircollection.findOne({_id : parentDirId, userId : req.user._id})
  
  if (!parentDirData) {
    return res.status(404).json({ error: "Parent directory not found!" });
  }

  const filename = req.headers.filename || "untitled";
  const extension = path.extname(filename);
  
  const insertedfile = await filecollection.insertOne({
    extension,
    name: filename,
    parentDirId : parentDirData._id,
    userId : req.user._id
  })

  const fileId = insertedfile.insertedId.toString()
  const fullFileName = `${fileId}${extension}`;

  const writeStream = createWriteStream(`./storage/${fullFileName}`);
  req.pipe(writeStream);

  req.on("end",() => {
    return res.status(201).json({ message: "File Uploaded" });
  });
  req.on("error",async ()=>{
    await filecollection.deleteOne({_id : insertedfile.insertedId})
    return res.status(404).json({message : "Could not upload"})
  })
});

router.patch("/:id", async (req, res, next) => {
  const db = req.db
  const filecollection = db.collection('files')
  const { id } = req.params;
  const fileData = await filecollection.findOne({_id: new ObjectId(id) , userId : req.user._id});

  if (!fileData) {
    return res.status(404).json({ error: "File not found!" });
  }

  try {
    await filecollection.updateOne({_id : new ObjectId(id)},{$set : {name : req.body.newFilename}})
    return res.status(200).json({ message: "Renamed" });
  } catch (err) {
    err.status = 500;
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  const db = req.db
  const filecollection = db.collection('files')
  const { id } = req.params;

  const fileData = await filecollection.findOne({_id: new ObjectId(id) , userId : req.user._id});

  if(!fileData){
    return res.status(404).json({error : "File not found"})
  }

  try {
    await rm(`./storage/${id}${fileData.extension}`);
    await filecollection.deleteOne({_id: new ObjectId(id)})
    return res.status(200).json({ message: "File Deleted Successfully" });
  } catch (err) {
    next(err);
  }
});


export default router;
