import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import io from "socket.io-client";
import "../App.css";

function Messages() {
  const [state, setState] = useState({ message: "", sender: "" });
  const [chat, setChat] = useState([]);
  const [sendTo, setSendTo] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const socketRef = useRef();
  const chatLogRef = useRef(null);
  const axiosRef = useRef(axios);

  useEffect(() => {
    socketRef.current = io("/");

    // need to implement backend route (fetchAllMessages)

    const fetchData = async () => {
      try {
        const { data } = await axios.get(`http://localhost:4000/messages`);
        console.log(data);
        const allUsers = [];
        data.map(({ sender, message, receiver }, index) => {
          if (sender === state.sender) {
            if (!allUsers.includes(receiver)) allUsers.push(receiver);
          }
          if (receiver === state.sender) {
            if (!allUsers.includes(sender)) allUsers.push(sender);
          }
        });
        setLoading(false);
        setChat(data);
        setUsers(allUsers);
        if (allUsers.length > 0) {
          setSendTo(allUsers[0]);
        }
      } catch (e) {
        console.log(e);
        setError(true);
      }
    };
    fetchData();

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  useEffect(() => {
    socketRef.current.on("message", ({ sender, message, receiver }) => {
      setChat([...chat, { sender, message, receiver }]);
      if (receiver === state.sender) {
        if (!users.includes(sender)) setUsers([...users, sender]);
      }
    });
    socketRef.current.on("user_join", function (data) {
      setChat([
        ...chat,
        {
          sender: "ChatBot",
          message: `${data} has joined the global.`,
          receiver: state.sender,
        },
      ]);
    });

    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }

    return () => {
      socketRef.current.off("message");
      socketRef.current.off("user_join");
    };
  }, [chat, users]);

  const userjoin = (name) => {
    socketRef.current.emit("user_join", name);
  };

  const onMessageSubmit = async (e) => {
    try {
      e.preventDefault();
      let msgEle = document.getElementById("message");
      axiosRef.current.defaults.url = window.location.href;

      const { data } = await axiosRef.current.post(
        `http://localhost:4000/messages`,
        {
          sender: state.sender,
          message: msgEle.value,
          receiver: sendTo,
        }
      );
      socketRef.current.emit("message", {
        sender: state.sender,
        message: msgEle.value,
        receiver: sendTo,
      });
      setState({ message: "", sender: state.sender });
      msgEle.value = "";
      msgEle.focus();
    } catch (e) {
      console.log(e);
      setError(true);
    }
  };

  const renderChat = () => {
    let prevSender = null;
    return chat.map(({ sender, message, receiver }, index) => {
      if (
        (sender === state.sender || receiver === state.sender) &&
        (sender === sendTo || receiver === sendTo)
      ) {
        const sameSender = prevSender === sender;
        prevSender = sender;
        return (
          <div key={index}>
            {!sameSender && sender !== state.sender && (
              <h3 className="chat-name">{sender}</h3>
            )}
            <span
              className={
                sender === state.sender ? "chat-message self" : "chat-message"
              }
            >
              {message}
            </span>
          </div>
        );
      }
      return null;
    });
  };

  if (error) {
    return (
      <div>
        <h1>404 ERROR: NOT FOUND</h1>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <h1>Loading...</h1>
      </div>
    );
  }

  return (
    <div className="messages">
      {state.sender && (
        <div className="messages-container">
          <div className="messages-bar">
            <h2>Messages</h2>
            <div className="messages-list">
              <div className="messages-users">
                <div>
                  <button
                    onClick={() => {
                      setSendTo("Johnny");
                    }}
                    className="users-list"
                  >
                    Johnny
                  </button>
                </div>

                {users.length === 0 ? (
                  <div>
                    <p>No one to message</p>
                  </div>
                ) : (
                  users.map((user) => (
                    <div>
                      <button
                        onClick={() => {
                          setSendTo(user);
                        }}
                        className={
                          sendTo === user ? "messages-selected" : "users-list"
                        }
                      >
                        {user}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <div className="messages-body">
            <div className="render-chat">
              <div className="room-chat">
                <p className="room-chat-to">To: </p>
                <span className="room-chat-name">{sendTo}</span>
              </div>
              <div className="chat-log" ref={chatLogRef}>
                {renderChat()}
              </div>
              <form className="send-box" onSubmit={onMessageSubmit}>
                <div>
                  <label for="message" className="message-label">
                    Type a message
                  </label>
                  <input
                    name="message"
                    id="message"
                    variant="outlined"
                    placeholder="Type a message..."
                  />
                  <button type="submit">{">"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {!state.sender && (
        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            setState({
              sender: document.getElementById("username_input").value,
            });
            userjoin(document.getElementById("username_input").value);
            // userName.value = '';
          }}
        >
          <div className="form-group">
            <label>
              User Name:
              <br />
              <input id="username_input" />
            </label>
          </div>
          <br />

          <br />
          <br />
          <button type="submit"> Click to join</button>
        </form>
      )}
    </div>
  );
}

export default Messages;