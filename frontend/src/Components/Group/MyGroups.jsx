import { useEffect, useState } from "react";
import { BASE_API_URL } from "../../config/api";

const MyGroups = () => {
  const [groups, setGroups] = useState([]);
  const token = localStorage.getItem("token");

  // Temporary snippet in App.js or MyGroups.jsx
  useEffect(() => {
	  const token = localStorage.getItem("token");
          fetch("http://72.60.192.150:8080/api/chats/user", {
		  headers: { Authorization: `Bearer ${token}` },
  })
        
    .then((res) => res.json())
    .then((data) => {
      console.log("All chats:", data); // full objects
      data
        .filter((chat) => chat.isGroupChat)
        .forEach((group) =>
          console.log(`Group name: ${group.chatName}, ID: ${group.id}`)
        );
    });
}, []);


  const fetchGroups = async () => {
    try {
      const res = await fetch(`${BASE_API_URL}/chats/user`, {
        headers: { Authorization: token },
      });
      const data = await res.json();
      // Filter only group chats
      const groupChats = data.filter((chat) => chat.isGroupChat);
      setGroups(groupChats);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      {groups.map((group) => (
        <div key={group.id} className="flex justify-between items-center p-2 border-b">
          <span>{group.chatName}</span>
          {/* Delete button will be added in Step 2 */}
        </div>
      ))}
    </div>
  );
};

export default MyGroups;

