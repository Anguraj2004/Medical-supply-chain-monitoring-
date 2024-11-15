const  mongoose =require("mongoose");
const connect=mongoose.connect("mongodb+srv://Auth:Auth@cluster0.bldbxeq.mongodb.net/Login?retryWrites=true&w=majority");

connect.then(()=>{
    console.log("Database connected");
})
.catch(()=>{
    console.log("Database not connected");
});

const LoginSchema=new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true
    },
    phone:{
        type: String,
        required: true
    },
    sec:{
        type: String,
        required: true
    },
    rollno:{
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true
    }

});
const collection = new mongoose.model("users",LoginSchema);
module.exports=collection;