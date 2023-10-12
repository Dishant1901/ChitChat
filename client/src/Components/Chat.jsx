import React, { useContext, useEffect, useState,useRef } from "react";
import Avtar from "./Avtar";
import UserContext from "../UserContext";
import {set, uniqBy} from 'lodash'
import axios from 'axios'
import ContactPerson from "./ContactPerson";

const Chat = () => {
  const [ws, setWs] = useState(null);
  const [onlinePpl, setOnlinePpl] = useState({});
  const [offlinePeople,setOfflinePeople] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null);
  const { username, setUserName,setId, id } = useContext(UserContext);
  const [newMsgText, setNewMsgText] = useState('');
  const [messages,setMessages] = useState([]);
  const divUnderMessages = useRef();
  useEffect(() => {
   connectToWs();
  }, []);

  // FUNCTION TO CONNECT & AUTO-RECONNECT TO WS
  const connectToWs=()=>{
    const ws = new WebSocket("ws://localhost:3000");
    setWs(ws);
    ws.addEventListener("message", handleMessage); 
    ws.addEventListener("close",()=>{
      setTimeout(()=>{
        console.log('Dissconnected. Trying to reconnect')
        connectToWs();
      })
    })
  }

// FUNCTION TO LOGOUT USER
  const logout=()=>{
    axios.post('/logout').then(()=>{
      setId(null);
      setUserName(null);
      setWs(null);
    })
  }  

  const showOnlinePpl = (ppl) => {
    const people = {};
    ppl.forEach(({ userId, username }) => {
      people[userId] = username;
    });
    setOnlinePpl(people);
    // console.log(people)
  };

  // function to handle msg comming from selected user
  const handleMessage = (e) => {
    const msgData = JSON.parse(e.data);
    console.log({e,msgData})
    if (msgData.online) {
      showOnlinePpl(msgData.online);
    }
    else if('text' in msgData){
      // console.log({msgData})
      if(msgData.sender === selectedUserId){
        setMessages(prev=>([...prev,{...msgData}]))
      }
    }
  };

  //Function to send messages
  const sendMsg=(e,file=null)=>{
    if(e) e.preventDefault();
      ws.send(JSON.stringify({
    
        recipient: selectedUserId,
        text: newMsgText,
        file,
  }))
  
  // RELOADING MSGS AFTER A FILE IS BENG SENT
  if(file){
    axios.get('/messages/'+selectedUserId).then(res=>{
      setMessages(res.data)
    })
  } else{
      // console.log(newMsgText + ' before setting box to empty')
      setNewMsgText('');
      // console.log(newMsgText + ' after setting box to empty')
      setMessages(prev=>([...prev,{
        text:newMsgText,
        sender:id,
        recipient:selectedUserId,
        _id: Date.now() // random id to make each sent masg usnique and to be disalyed in chat
  }]))
  }
    
}

// FUCNTION TO SEND FILE
const sendFile=(e)=>{
  // e.preventDefault()
  const reader = new FileReader();
  reader.readAsDataURL(e.target.files[0]);
  reader.onload = ()=>{
    sendMsg(null,{
      name:e.target.files[0].name,
      data:reader.result,
    })
  }
}


  // auto scroll
  // howeever this wont work as it takes some time becaause above action
  // in function takes time so it'll only scroll a bit
  // const div=divUnderMessages.current;
  // div.scrollIntoView({behavior:'smooth',block:'end'})
 

  // auto scrolling 
  useEffect(()=>{
    const div=divUnderMessages.current;
    if(div){
      div.scrollIntoView({behavior:'smooth',block:'end'})
    }
  },[messages])

  // useEffect to fetch msg from DB
  useEffect(()=>{
    if(selectedUserId){
      axios.get('/messages/'+selectedUserId).then(res=>{
        setMessages(res.data)
      })
    }

  },[selectedUserId])

  // useEffect to show offline people
  useEffect(()=>{
    axios.get('/people').then(res=>{
      const offlinepplarr=res.data
      .filter(p=>p._id !==id)
      .filter(p=> !Object.keys(onlinePpl).includes(p._id))
      // console.log(offlineppl)
      const offlinePeople={}
      offlinepplarr.forEach(p=> {
        offlinePeople[p._id] =p;
      });
      setOfflinePeople(offlinePeople)
        // console.log(offlinePeople)
    })
  },[onlinePpl])

  const onlinePplExlcurrUser = { ...onlinePpl };
  delete onlinePplExlcurrUser[id];
  const msgWithoutDup=uniqBy(messages,'_id')

  return (
    <div className="flex h-screen">
      <div className="bg-blue-50 w-1/3 flex flex-col ">
        <div className="flex-grow">
        <div className=" font-bold text-blue-700 p-4 text-lg">ChitChat</div>
  
  {/* SHOWING ONLINE PEOPLE USING COMPONENT */}
        {Object.keys(onlinePplExlcurrUser).map((userId) => (
         <ContactPerson
          key={userId} 
          id={userId}
          online={true}
          username={onlinePplExlcurrUser[userId]}
          onClick={()=>setSelectedUserId(userId)}
          selected={userId === selectedUserId}/>
        ))}
        {/*  */}
  {/* SHOWING OFFLINE PEOPLE USING COMPONENT */}
          {Object.keys(offlinePeople).map((userId) => (
         <ContactPerson
         key={userId} 
          id={userId}
          online={false}
          username={offlinePeople[userId].username}
          onClick={()=>setSelectedUserId(userId)}
          selected={userId === selectedUserId}/>
        ))}
        

        </div>
{/* LOGOUT */}
        <div className="p-2 text-center">
          <button
              onClick={logout} 
              className="text-sm text-gray-700 px-2 py-1 rounded-md bg-blue-500" >LogOut</button>
        </div>
      </div>
      {/* CENTER */}
      <div className=" flex flex-col bg-blue-200 w-2/3 p-2">
        <div className="flex-grow">
          {!selectedUserId && (
            <div className="flex flex-grow justify-center items-center h-full">
              <div className="text-gray-500  text-lg">no selected person</div>
            </div>
          )}
        </div>
        {/* TO DISPLAY CONVERSTION WITH CURR USER */}
        {!!selectedUserId && (
          // pb-[100%]
          <div className="relative h-full">

          <div className=" overflow-y-scroll absolute inset-0">
            {msgWithoutDup.map(message =>(
              <div className={(message.sender===id ? 'text-right ': 'text-left ')}>
              <div className={" text-left inline-block text-sm p-2 m-3 rounded-md" + (message.sender ===id? ' bg-blue-500 text-white':' bg-white text-gray-500' )}>
                {message.text}
                {message.file && (
                  <div>
                    <a target="" href={axios.defaults.baseURL + '/uploads/'+message.file}>
                      {message.file}
                    </a>
                  </div>
                )} </div>
              </div>
            ))}
            <div ref={divUnderMessages} ></div>
          </div>
            </div>
        )}
          {!!selectedUserId && (
        
        <form onSubmit={sendMsg} className="flex gap-2 ">
          <input
            type="text"
            value={newMsgText}
            onChange={(e) => setNewMsgText(e.target.value)}
            placeholder="Write Your Message"
            className=" border rounded-sm p-2 flex-grow "
          />
                      <label className="bg-blue-200 p-2 text-gray-600 cursor-pointer rounded-sm border border-blue-200">
              <input type="file"  className="hidden" onChange= {sendFile}  />
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path fillRule="evenodd" d="M18.97 3.659a2.25 2.25 0 00-3.182 0l-10.94 10.94a3.75 3.75 0 105.304 5.303l7.693-7.693a.75.75 0 011.06 1.06l-7.693 7.693a5.25 5.25 0 11-7.424-7.424l10.939-10.94a3.75 3.75 0 115.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 015.91 15.66l7.81-7.81a.75.75 0 011.061 1.06l-7.81 7.81a.75.75 0 001.054 1.068L18.97 6.84a2.25 2.25 0 000-3.182z" clipRule="evenodd" />
              </svg>
            </label>
          <button type="submit " className="p-2 bg-blue-500 rounded-sm">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
              />
            </svg>
          </button>
        </form>            
          )}

      </div>
    </div>
  );
};

export default Chat;
