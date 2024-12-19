import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";

const app=express()

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credential:true
}))

app.use(express.json({limit:"16 KB"}))
app.use(express.urlencoded({extended:true,limit:"16 KB"}))
app.use(express.static("puiblic"))
app.use(cookieParser())

export {app}