import axios from 'axios';
import React, { createContext, useEffect, useState } from 'react'

export const UserContext=createContext({});


export const UserContextProvider = ({children}) => {
const [username,setUserName] = useState(null);
const [id,setId] = useState(null);

useEffect(()=>{
    axios.get('/profile').then(response=>{
        setUserName(response.data.username);
        setId(response.data.UserId);
    })
},[])

  return (
    <UserContext.Provider value={{username,setUserName,id,setId}}>
        {children}
    </UserContext.Provider>
  )
}

export default UserContext