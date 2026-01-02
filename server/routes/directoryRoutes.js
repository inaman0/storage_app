import express from "express";
import { rm } from "fs/promises";
import validateid from "../middlewares/validateid.js";
import { ObjectId } from "mongodb";

const router = express.Router();

router.param("id",validateid)
router.param("parentDirId",validateid)

router.get("/:id?", async (req, res) => {
  const db = req.db
  const dircollection = db.collection('directories')
  const user = req.user;
  const _id = req.params.id ? new ObjectId(req.params.id) : user.rootDirId;

  const directoryData = await dircollection.findOne({_id})
  if (!directoryData) {
    return res.status(404).json({ error: "Directory not found or you do not have access to it!" });
  }

  const files = await db.collection('files').find({parentDirId : directoryData._id}).toArray()
  const directories = await dircollection.find({parentDirId : _id}).toArray()

  return res.status(200).json({ ...directoryData, files: files.map((file)=>({...file,id:file._id})), directories: directories.map((dir)=>({...dir,id:dir._id}))});
});

router.post("/:parentDirId?", async (req, res, next) => {
  try {
    const db = req.db
    const dircollection = db.collection('directories')
    const user = req.user
    const parentDirId = req.params.parentDirId ? new ObjectId(req.params.parentDirId) : user.rootDirId
    const dirname = req.headers.dirname || 'New Folder'

    const parentDir = await dircollection.findOne({_id : parentDirId})
    if(!parentDir) return res.status(404).json({message: "Parent Directory Does not exist!"})

    await dircollection.insertOne({
      name: dirname,
      parentDirId,
      userId: user._id
    })
    return res.status(200).json({ message: "Directory Created!" })
  } catch (err) {
    if(err.code === 121){
      res.status(400).json({error : "Invalid input, please enter valid details"})
    }
    else{
      next(err)
    }
  }
});

router.patch('/:id', async (req, res, next) => {
  const db = req.db
  const dircollection = db.collection('directories')
  const user = req.user;
  const { id } = req.params;
  const { newDirName } = req.body;

  try {
    await dircollection.updateOne({_id : new ObjectId(id) , userId : user._id},{$set : {name : newDirName}})
    res.status(200).json({ message: "Directory Renamed!" });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  const { id } = req.params;

  const db = req.db
  const dircollection = db.collection('directories')
  const filecollection = db.collection('files')
  const dirObjId = new ObjectId(id)

  const dirData = await dircollection.findOne({_id : dirObjId , userId : req.user._id})
  if(!dirData){
    return res.status(404).json({error : "Directory not found"})
  }

  async function getDirectoryContent(id){
    let files = await filecollection.find({parentDirId : id},{projection : {extension : 1}}).toArray()
    let directories = await dircollection.find({parentDirId : id},{projection : {_id : 1}}).toArray()

    for (const {_id,name} of directories){
      const {files : childfiles,directories:childdirectories} = await getDirectoryContent(new ObjectId(_id))
      files = [...files,...childfiles]
      directories = [...directories,...childdirectories]
    }

    return {files,directories}
  }

  const {files,directories} = await getDirectoryContent(dirObjId)
  for(const {_id,extension} of files){
    await rm(`./storage/${_id.toString()}${extension}`)
  }

  await filecollection.deleteMany({_id : {$in : files.map(({_id})=> _id)}})
  await dircollection.deleteMany({_id : {$in : [...directories.map(({_id})=> _id),dirObjId]}})

  res.json({message : "file deleted successfully"})
});

export default router;
