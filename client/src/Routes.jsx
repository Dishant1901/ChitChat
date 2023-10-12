import React, { useContext } from 'react'
import RegisterAndLogin from './Pages/RegisterPage'
import UserContext from './UserContext'
import Chat from './Components/Chat'

const Routes = () => {
     const{username,id} = useContext(UserContext)
     if(username){
        return <Chat/>
     }
  return (
    <RegisterAndLogin/>
  )
}

export default Routes