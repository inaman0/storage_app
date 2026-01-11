import mongoose from "mongoose"

export async function connectDB(){
    try{
        await mongoose.connect("mongodb://naman:naman@localhost:27017/storageApp")
        console.log("database connected")
    }
    catch(err){
        console.log("could not connect databse")
        process.exit(1)
    }
}

process.on("SIGINT", async ()=>{
    await mongoose.close()
    console.log("Database disconnected")
    process.exit(0)
})
