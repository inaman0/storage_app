import express from "express";
import { createWriteStream } from "fs";
import { rm, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import directoriesData from "../directoriesDB.json" with { type: "json" };
import filesData from "../filesDB.json" with { type: "json" };
import validateid from "../middlewares/validateid.js";

const router = express.Router();

router.param("id",validateid)
router.param("parentDirId",validateid)

router.get("/:id", (req, res) => {
  const { id } = req.params;
  const fileData = filesData.find((file) => file.id === id);

  if (!fileData) {
    return res.status(404).json({ error: "File not found!" });
  }

  const parentDir = directoriesData.find((dir) => dir.id === fileData.parentDirId);
  if (!parentDir) {
    return res.status(404).json({ error: "Parent directory not found!" });
  }
  if (parentDir.userId !== req.user.id) {
    return res.status(403).json({ error: "You don't have access to this file." });
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

router.post("/:parentDirId?", (req, res, next) => {
  const parentDirId = req.params.parentDirId || req.user.rootDirId;
  const parentDirData = directoriesData.find(
    (directoryData) => directoryData.id === parentDirId
  );
  
  if (!parentDirData) {
    return res.status(404).json({ error: "Parent directory not found!" });
  }

  if (parentDirData.userId !== req.user.id) {
    return res.status(403).json({ error: "You do not have permission to upload to this directory." });
  }

  const filename = req.headers.filename || "untitled";
  const id = crypto.randomUUID();
  const extension = path.extname(filename);
  const fullFileName = `${id}${extension}`;

  const writeStream = createWriteStream(`./storage/${fullFileName}`);
  req.pipe(writeStream);

  req.on("end", async () => {
    filesData.push({
      id,
      extension,
      name: filename,
      parentDirId,
    });
    
    parentDirData.files.push(id);

    try {
      await writeFile("./filesDB.json", JSON.stringify(filesData));
      await writeFile("./directoriesDB.json", JSON.stringify(directoriesData));
      return res.status(201).json({ message: "File Uploaded" });
    } catch (err) {
      next(err);
    }
  });
});

router.patch("/:id", async (req, res, next) => {
  const { id } = req.params;
  const fileData = filesData.find((file) => file.id === id);

  if (!fileData) {
    return res.status(404).json({ error: "File not found!" });
  }

  const parentDir = directoriesData.find((dir) => dir.id === fileData.parentDirId);
  if (!parentDir) {
    return res.status(404).json({ error: "Parent directory not found!" });
  }
  if (parentDir.userId !== req.user.id) {
    return res.status(403).json({ error: "You don't have access to this file." });
  }

  fileData.name = req.body.newFilename;
  try {
    await writeFile("./filesDB.json", JSON.stringify(filesData));
    return res.status(200).json({ message: "Renamed" });
  } catch (err) {
    err.status = 500;
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  const { id } = req.params;
  const fileIndex = filesData.findIndex((file) => file.id === id);

  if (fileIndex === -1) {
    return res.status(404).json({ error: "File not found!" });
  }

  const fileData = filesData[fileIndex];

  const parentDir = directoriesData.find((dir) => dir.id === fileData.parentDirId);
  if (!parentDir) {
    return res.status(404).json({ error: "Parent directory not found!" });
  }
  if (parentDir.userId !== req.user.id) {
    return res.status(403).json({ error: "You don't have access to this file." });
  }

  try {
    await rm(`./storage/${id}${fileData.extension}`, { recursive: true });

    filesData.splice(fileIndex, 1);
    parentDir.files = parentDir.files.filter((fileId) => fileId !== id);

    await writeFile("./filesDB.json", JSON.stringify(filesData));
    await writeFile("./directoriesDB.json", JSON.stringify(directoriesData));

    return res.status(200).json({ message: "File Deleted Successfully" });
  } catch (err) {
    next(err);
  }
});


export default router;
