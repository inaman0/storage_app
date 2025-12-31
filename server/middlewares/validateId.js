export default function (req,res,next,id){

    if(id.length !== 24){
        return res.status(404).json({message : "Invalid id"})
    }
    next()
}