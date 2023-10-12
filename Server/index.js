import express from 'express';
import DBconnection from './DBconnection.js';
import UserModel from "./model/User.js"
import MessageModel from './model/Message.js'
import dotenv from 'dotenv';
import Jwt from "jsonwebtoken"
import cors from "cors"
import cookieParser from 'cookie-parser';
import bcrypt from "bcryptjs"
import fs from "fs"
// import ws from 'ws';
import WebSocket, { WebSocketServer } from 'ws';
import { connect } from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname } from 'path';




dotenv.config();
const app = express();
const PORT = 3000;

const jwtsecret="k;fmiosdnclkancikancwiscpojv;pso"
const bcryptsalt= bcrypt.genSaltSync(10);
// MIDDLEWARE
app.use(cors({
    credentials:true,
    origin: 'http://localhost:4000',
}))
app.use(cookieParser())
app.use(express.json())

// db connection
DBconnection();

const user=UserModel;
const message = MessageModel;
// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use('/uploads', express.static(__dirname + '/uploads'))


// helper FUNCTIOMNS
const getUserDataFromRequest= async(req)=>{
    const token = req.cookies?.token;
    if(!token){
        res.json('no token')
    }
    try{
        const userData=await Jwt.verify(token,jwtsecret,{});
        return userData;
    }catch(err){
        throw err;
    }
}


// method: POST
// URL : /register
// description : to register new user
app.post('/register',async(req,res)=>{
    const {username,password} = req.body;
    const hashedPassword = bcrypt.hashSync(password,bcryptsalt);
    const createdUser = await user.create({username,password:hashedPassword});

    Jwt.sign({UserId: createdUser._id,username} , jwtsecret,{}, (err,token)=>{
        if(err) throw err;
        res.cookie('token',token).status(201).json({
            id:createdUser._id,
            
        });
    })
})
// method: POST
// URL : /login
// description : to register new user
app.post('/login',async(req,res)=>{
    const {username,password} = req.body;

    const fondUser=await user.findOne({username})

    if(fondUser){
    const  passOk=bcrypt.compareSync(password, fondUser.password)

        if(passOk){
            Jwt.sign({UserId: fondUser._id,username},jwtsecret,{},(err,token)=>{
                res.cookie('token',token).json({
                    id:fondUser._id,
                })
            })
        }
    }
})

// method: POST
// URL : /logout
// description : to register new user
// parameter: NONE
app.post('/logout',(req,res)=>{
    res.cookie('token','').json('user logged out')
})

// method: GET
// URL : /profile
// description : to register new user
app.get('/profile',(req,res)=>{
    const token= req.cookies?.token;
    if(token){
        Jwt.verify(token,jwtsecret,{},(err,userData)=>{
            if(err) throw err;
            res.json(userData);
        });
    }
    else{
        res.status(422).json('no token');
    }
})
// method: GET
// URL : /messages/:userId
// description : to register new user
// parameter: userID
app.get('/messages/:userId',async(req,res)=>{
    const {userId} = req.params;
    const userData=await getUserDataFromRequest(req);
    const ourId= userData.UserId;
    // console.log({user: userId,our: ourId} )

    const messages=await message.find({
        sender:{$in:[userId,ourId]},
        recipient:{$in:[userId,ourId]},
    }).sort({createdAt:1});

    res.json(messages )
})

// method: GET
// URL : /people
// description : To send info about all user
// parameter: NONE
app.get('/people' ,async(req,res)=>{
    const users = await user.find({},{'id':1,username:1});
    res.json(users)
})

app.get('/', (req, res) => {
    res.json("heloo from server")
})

// websocket connection
const server = app.listen(PORT)

const wss = new WebSocketServer({server})
wss.on('connection',(connection,req) => {

    // FUNCTION TO NOTIFY ABOUT ONLINE USERS
    const notifyOnlinePeople=()=>{
        [...wss.clients].forEach(client=>{
            const onlineUsers = [...wss.clients].map(c => ({ userId: c.userId, username: c.username }));
            client.send(JSON.stringify({
                online: onlineUsers    
            }));  
        });
    }

    connection.isAlive = true;

    connection.timer = setInterval(() => {
      connection.ping();
      connection.deathTimer = setTimeout(() => {
        connection.isAlive = false;
        clearInterval(connection.timer);
        connection.terminate();
        notifyOnlinePeople();
        console.log('dead');
      }, 1000);
    }, 5000);
  
    connection.on('pong', () => {
      clearTimeout(connection.deathTimer);
    });

    // reading userID and username for specfifix websocket connection
    const cookies = req.headers.cookie;
    if(cookies){
        const tokenCookieString = cookies.split(';').find(str=>str.startsWith('token='))
        if(tokenCookieString) {
            const token = tokenCookieString.split('=')[1];
            if(token){
                // console.log(token)
                Jwt.verify(token,jwtsecret,{},(err,userData)=>{
                    if(err)throw err;
                    const {UserId,username}= userData
                    connection.userId= UserId;
                    connection.username=username
                    // console.log(connection.userId,connection.username)
                })
            }
        }
    }

      // seeing who is online

    // console.log([...wss.clients]);
    notifyOnlinePeople();

    // sending Message to selesccted user
    connection.on('message',async (msg) => {
      const  msgData = JSON.parse(msg.toString());
        const{ recipient,text,file } = msgData;
        let fileName=null
        if(file){
            console.log({file})
            const parts = file.name.split('.');
            console.log(parts)
            const ext =parts[parts.length - 1];
             fileName = Date.now() + '.'+ext
            const path = __dirname +'/uploads/' + fileName;
            const bufferData=  Buffer.from(file.data.split(',')[1],'base64');
            fs.writeFile(path, bufferData,(err)=>{
                if(err){
                    console.log('eerror saving file:',err)
                }
                else{
                    console.log('file saved',path)
                }
            })
        }

        if(recipient && (text || file)){
            const msgDoc=await message.create({ 
                sender:connection.userId,
                recipient,
                text,
                file:file ? fileName : null,
            });
            [...wss.clients]
            .filter(c=>c.userId === recipient).
            forEach(c=>c.send(JSON.stringify({
                text,
                sender:connection.userId,
                recipient,
                _id:msgDoc._id,
            })))
        }
    })
});

 