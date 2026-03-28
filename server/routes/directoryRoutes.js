import express from "express";
import validateid from "../middlewares/validateid.js";
import { createDirectory, deleteDirectory, getDirectory, renameDirectory } from "../controllers/directoryController.js";

const router = express.Router();

router.param("id",validateid)
router.param("parentDirId",validateid)

router.get("/:id?", getDirectory);

router.post("/:parentDirId?", createDirectory);

router.patch('/:id', renameDirectory);

router.delete("/:id", deleteDirectory);

export default router;
