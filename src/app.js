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

//importing the routes
import userRouter from './routes/user.routes.js'

//routes declaration
//we are not going to use the app.get here because we are directly writing the route code here instead we are importing it from other files (this is the syntax)
app.use("/api/v1/users",userRouter) //here first it will be directed to the users and then to the register routed in the routes file hence the url will be http://localhost:8000/api/v1/users/register
export {app}