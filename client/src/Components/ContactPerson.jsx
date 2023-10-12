import React from 'react'
import Avatar from './Avtar'

const ContactPerson = ({id,username,onClick,selected,online}) => {
  return (
    <div
    onClick={() => onClick(id)}
    className={
      " border-b flex gap-2 pl-4  items-cente cursor-pointer border-gray-300 py-2 " +
      (selected ? "bg-blue-100" : "")
    }
  >
    {/* {userId=== selectedUserId && (
        <div className='bg-blue-500 w-1 h-12'></div>
      )} */}
    <Avatar online={online} username={username} userId={id} />
    <span>{username}</span>
  </div>
  )
}

export default ContactPerson