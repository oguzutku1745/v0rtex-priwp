import React, { useEffect, useState } from "react";
import { Client } from "@xmtp/xmtp-js";
import { ethers } from "ethers";
import { MerkleTree } from "merkletreejs";
import SHA256 from "crypto-js/sha256";
import Tree from "../components/Tree";

const App = () => {
    const [recipientAddress, setrecipientAddress] = useState("");
    const [message, setMessage] = useState("");
    const [xmtp, setXmtp] = useState(null);

    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState({});
    const [newMessage, setNewMessage] = useState("");

    /////////////
    /////////////

    //// XMTP

    /////////
    let chatContract;
    // Ethereum Setup

    const contractAddress = "Contract Address Here";
    const contractABI = [
        "function createMessageRequest(address _recipient, string memory _text) public",
        "function approveMessageRequest(uint _requestId) public",
        "function getMessageRequest(uint _requestId) public view returns (address sender, address recipient, string memory text, uint timestamp, bool approved)",
        "event MessageRequestCreated(uint indexed requestId, address indexed sender, address indexed recipient)",
        "event MessageRequestApproved(uint indexed requestId)",
    ];
    // Initialize XMTP Client
    useEffect(() => {
        const init = async () => {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();
            chatContract = new ethers.Contract(
                contractAddress,
                contractABI,
                signer
            );
            const client = await Client.create(signer);

            setXmtp(client);
        };
        init();
    }, []);

    const listenForMessages = async (conversation) => {
        for await (const message of conversation.streamMessages()) {
            setMessages((prev) => ({
                ...prev,
                [conversation.peerAddress]: [
                    ...prev[conversation.peerAddress],
                    message,
                ],
            }));
        }
    };

    // Listen for new XMTP conversations and messages
    const listenForNewConversations = async () => {
        if (!xmtp) return;
        for await (const conversation of xmtp.conversations.stream()) {
            setConversations((prev) => [...prev, conversation]);
            setMessages((prev) => ({
                ...prev,
                [conversation.peerAddress]: [],
            }));
            listenForMessages(conversation);
        }
    };

    useEffect(() => {
        listenForNewConversations();
    }, [xmtp]);

    // Function to start a new conversation
    const startConversation = async (peerAddress) => {
        if (!xmtp) return;
        return await xmtp.conversations.newConversation(peerAddress);
    };

    // Function to send a message in a conversation
    const sendMessage = async (conversation, messageText) => {
        await conversation.send(messageText);
    };

    // Ethereum contract interactions
    useEffect(() => {
        chatContract.on(
            "MessageRequestCreated",
            (requestId, sender, recipient) => {
                console.log(
                    `Message request from ${sender} to ${recipient} with ID: ${requestId}`
                );
            }
        );

        chatContract.on("MessageRequestApproved", async (requestId) => {
            console.log(`Message request ${requestId} has been approved.`);
            const requestDetails = await getMessageRequestDetails(requestId);
            const conversation = await startConversation(
                requestDetails.recipient
            );
            await sendMessage(conversation, "Hello, this is our private chat!");
            listenForMessages(conversation);
        });

        return () => {
            chatContract.removeAllListeners();
        };
    }, []);

    // Additional helper functions as needed
    const sendMessageRequest = async () => {
        await chatContract.createMessageRequest(recipientAddress, messageText);
    };

    const approveMessageRequest = async (requestId) => {
        await chatContract.approveMessageRequest(requestId);
    };

    const getMessageRequestDetails = async (requestId) => {
        return await chatContract.getMessageRequest(requestId);
    };

    const handleSendMessage = async () => {
        if (!selectedConversation) return;
        await selectedConversation.send(newMessage);
        setNewMessage("");
    };

    const handleMessageChange = (event) => {
        setNewMessage(event.target.value);
    };

    const handleSelectConversation = (conversation) => {
        setSelectedConversation(conversation);
    };

    return (
        <div>
            <Tree />
            <div className="app">
                <div className="sidebar">
                    <h2>Contacts</h2>
                    {conversations.map((conversation, index) => (
                        <div
                            key={index}
                            onClick={() =>
                                handleSelectConversation(conversation)
                            }
                            className="contact"
                        >
                            {conversation.peerAddress}
                        </div>
                    ))}
                </div>
                <div className="chat">
                    <div className="messages">
                        {selectedConversation &&
                            messages[selectedConversation.peerAddress]?.map(
                                (msg, index) => <p key={index}>{msg.content}</p>
                            )}
                    </div>
                    <div className="send-message">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={handleMessageChange}
                            placeholder="Type a message"
                        />
                        <button onClick={handleSendMessage}>Send</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
