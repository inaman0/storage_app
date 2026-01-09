import express from "express";
import validateid from "../middlewares/validateid.js";
import { createDirectory, deleteDirectory, getDirectoryById, renameDirectory } from "../controllers/directoryController.js";

const router = express.Router();

router.param("id",validateid)
router.param("parentDirId",validateid)

router.get("/:id?", getDirectoryById);

router.post("/:parentDirId?", createDirectory);

router.patch('/:id', renameDirectory);

router.delete("/:id", deleteDirectory);

export default router;
