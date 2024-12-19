import connectDB from "./db/index.js";
import dotenv from 'dotenv'
import {app} from './app.js'

dotenv.config({
    path:'./.env'
})

connectDB()
.then(()=>{
     app.listen(process.env.PORT || 8000,()=>{
        console.log(`The server is running at the PORT ${process.env.PORT}`)
     })
})
.catch((error)=>{
    console.log("Mongo db connection failed",error)
})





/*
import express from "express";
const app=express();

(async()=>{
   try{
    mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    app.on("error",(error)=>{
        console.log("ERR: ",Error);
        throw error;
    })

    app.listen(process.env.PORT,()=>{
        console.log(`the app is listening on the port ${process.env.PORT}`)
    })
   }catch(error){
    console.error("ERROR: ", error);
    throw error;
   }
})()
   */