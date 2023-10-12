import mongoose from "mongoose";


const DBconnection =async()=>{
    try {
        await mongoose.connect(process.env.MONGO_URL,{
            // useNewUrlParser:true,
            // useunifiedTopology:true,
            useNewUrlParser: true,
            useUnifiedTopology: true,   
        })
        console.log("Connected to database")
    } catch(error){
        console.error('error whole connecting to db',error);
    }
}

export default DBconnection