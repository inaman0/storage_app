import { rm } from "fs/promises";
import { ObjectId } from "mongodb";
import Directory from "../models/directoryModel.js";
import File from "../models/fileModel.js";
import mongoose from "mongoose";

export const getDirectoryById = async (req, res) => {
  const user = req.user;
  const _id = req.params.id || user.rootDirId.toString();

  const directoryData = await Directory.findOne({_id}).lean()
  if (!directoryData) {
    return res.status(404).json({ error: "Directory not found or you do not have access to it!" });
  }

  const files = await File.find({parentDirId : directoryData._id}).lean()
  const directories = await Directory.find({parentDirId : _id}).lean()

  return res.status(200).json({ ...directoryData, files: files.map((file)=>({...file,id:file._id})), directories: directories.map((dir)=>({...dir,id:dir._id}))});
}

export const createDirectory = async (req, res, next) => {
  try {
    const user = req.user
    const parentDirId = req.params.parentDirId || user.rootDirId.toString()
    const dirname = req.headers.dirname || 'New Folder'

    const parentDir = await Directory.findOne({_id : parentDirId}).lean()
    if(!parentDir) return res.status(404).json({message: "Parent Directory Does not exist!"})

    await Directory.create({
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
}

export const renameDirectory = async (req, res, next) => {
  const user = req.user;
  const { id } = req.params;
  const { newDirName } = req.body;

  try {
    await Directory.findOneAndUpdate(
      { 
        _id:id, 
        userId:user._id 
      },
      {
        name : newDirName
      })
    res.status(200).json({ message: "Directory Renamed!" });
  } catch (err) {
    next(err);
  }
}

export const deleteDirectory = async (req, res, next) => {
  const { id } = req.params;

  try{
    const dirData = await Directory.findOne({_id : id , userId : req.user._id})
    if(!dirData){
      return res.status(404).json({error : "Directory not found"})
    }

    async function getDirectoryContent(id){
      let files = await File.find({parentDirId : id}).select('extension').lean()
      let directories = await Directory.find({parentDirId : id}).select('_id').lean()

      for (const {_id,name} of directories){
        const {files : childfiles,directories:childdirectories} = await getDirectoryContent(_id)
        files = [...files,...childfiles]
        directories = [...directories,...childdirectories]
      }

      return {files,directories}
    }

    const {files,directories} = await getDirectoryContent(id)
    for(const {_id,extension} of files){
      await rm(`./storage/${_id.toString()}${extension}`)
    }

    await File.deleteMany({_id : {$in : files.map(({_id})=> _id)}})
    await Directory.deleteMany({_id : {$in : [...directories.map(({_id})=> _id),id]}})

    res.json({message : "file deleted successfully"})
  }catch(err){
    next(err)
  } 
}