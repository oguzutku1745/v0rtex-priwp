import React, { useState } from "react";
import "./ChatApp.css"; // Make sure to import the CSS file

const ChatApp = () => {
    const [selectedContact, setSelectedContact] = useState(null);
    const [messages, setMessages] = useState([]); // This would ideally come from XMTP or similar

    // Dummy contacts for display
    const contacts = [
        { id: 1, address: "0xABC...123" },
        { id: 2, address: "0xDEF...456" },
        { id: 3, address: "0xGHI...789" },
    ];

    const handleSelectContact = (contact) => {
        setSelectedContact(contact);
        // Fetch messages for selected contact
        setMessages([
            { id: 1, text: "Hello there!", sender: contact.address },
            { id: 2, text: "Hi, how are you?", sender: "You" },
        ]);
    };

    return (
        <div className="chat-app">
            <div className="sidebar">
                <ul className="contacts-list">
                    {contacts.map((contact) => (
                        <li
                            key={contact.id}
                            className={`contact-item ${
                                selectedContact === contact ? "active" : ""
                            }`}
                            onClick={() => handleSelectContact(contact)}
                        >
                            {contact.address}
                        </li>
                    ))}
                </ul>
            </div>
            <div className="chat-area">
                <div className="message-list">
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`message ${
                                message.sender === "You" ? "sent" : "received"
                            }`}
                        >
                            <p>{message.text}</p>
                        </div>
                    ))}
                </div>
                <div className="message-input">
                    <input type="text" placeholder="Type a message..." />
                    <button>Send</button>
                </div>
            </div>
        </div>
    );
};

export default ChatApp;
