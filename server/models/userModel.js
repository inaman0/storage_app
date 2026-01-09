import {model, Schema} from 'mongoose'

const userSchema = new Schema({
    name: {
        type: String,
        required :true 
    },
    email: {
        type: String,
        required :true,
        match: [/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$/]
    },
    password: {
        type: String,
        required :true 
    },
    rootDirId: {
        type: Schema.Types.ObjectId,
        required :true,
        ref: 'Directory'
    }
},{
    strict : "throw",
    versionKey: false
})

const User = model("User",userSchema)

export default User