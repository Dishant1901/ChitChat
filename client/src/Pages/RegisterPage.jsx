import React, { useContext, useState } from 'react'
// import { Link, Navigate } from 'react-router-dom'
import axios from 'axios'
import UserContext from '../UserContext';

const RegisterPage = () => {

  const [username,setUserName]=useState('');
  // const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [login,setLogin]=useState(false)
  const [loginOrRegister,setLoginOrRegister]=useState('Register')
  const url= loginOrRegister === 'Register' ? 'register' : 'login'
  //
  const {setUserName:setLoggedInUserName,setId}=useContext(UserContext);

 const registerUser =async (e)=>{
    e.preventDefault();

    try {
      const {data}=await axios.post(url,{
        username,
        password,
      })
  
      alert(`User registrated successfully`)
      setLoggedInUserName(username);
      setId(data.id)
      
    } catch (error) {
      console.error(error)
      alert("Registration failed!") 
    }

   

  }
  
  // if(login){
  //   // return <Navigate to={'/login'} />
  // }
  return (
        <div className=' grow flex items-center justify-center bg-blue-50 h-screen '>

<div className=' mt-8 '>
<h1 className='text-4xl mb-4 text-center'>{loginOrRegister}</h1>
<form className='max-w-md mx-auto' onSubmit={registerUser}>
    <input 
      type="text" 
      placeholder='User Name'
      value={username} 
      onChange={e=>setUserName(e.target.value)}
     />
    {/* <input 
      type="email" 
      placeholder='your@eamil.com'
      value={email}
      onChange={e=>setEmail(e.target.value)}  /> */}

    <input 
      type="password" 
      placeholder='Password' 
      value={password}
      onChange={e=>setPassword(e.target.value)}/>

    <button  className=' mt-4 primary'>{loginOrRegister}</button>
    <div className='text-center mt-4'>
      {loginOrRegister == 'Register' && (
        <div>
             Already a user? 
        <button onClick={()=>setLoginOrRegister('Login')} 
        className=' text-blue-500 '> Login</button> here
        </div>
      )}

{loginOrRegister == 'Login' && (
        <div>
             Not a user? 
        <button onClick={()=>setLoginOrRegister('Register')} 
        className=' text-blue-500 '> Register</button> here
        </div>
      )}
     </div>
</form>
</div>



</div>
    
  )
}

export default RegisterPage