import express from "express";
import validateid from "../middlewares/validateid.js";
import { createFile, deleteFile, getFile, renameFile } from "../controllers/fileController.js";

const router = express.Router();

router.param("id",validateid)
router.param("parentDirId",validateid)

router.get("/:id", getFile);

router.post("/:parentDirId?", createFile);

router.patch("/:id", renameFile);

router.delete("/:id", deleteFile);

export default router;
