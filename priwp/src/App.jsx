import React, { useEffect, useState } from "react";
import { Client } from "@xmtp/xmtp-js";
import { ethers } from "ethers";
import { MerkleTree } from "merkletreejs";
import SHA256 from "crypto-js/sha256";
import ChatApp from "../components/ChatApp";
// padderson,
const App = () => {
    const [tree, setTree] = useState(null);
    const [leaves, setLeaves] = useState(["a"].map((x) => SHA256(x)));
    const [newLeaf, setNewLeaf] = useState("");

    const createTree = () => {
        const newTree = new MerkleTree(leaves, SHA256);
        setTree(newTree);
        alert("Merkle Tree Created!");
    };
    // Function to update the Merkle Tree with new data
    const updateTree = () => {
        if (newLeaf.trim() === "") {
            alert("Please enter a valid leaf.");
            return;
        }
        const updatedLeaves = [...leaves, SHA256(newLeaf)];
        setLeaves(updatedLeaves);
        const updatedTree = new MerkleTree(updatedLeaves, SHA256);
        setTree(updatedTree);
        setNewLeaf(""); // Clear the input after adding
        alert(`Added "${newLeaf}" to the tree`);
    };

    // Handle input change
    const handleInputChange = (event) => {
        setNewLeaf(event.target.value);
    };
    /////////////
    /////////////

    //// XMTP

    /////////
    const [xmtp, setXmtp] = useState(null);
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

    // Listen for new XMTP conversations and messages
    useEffect(() => {
        const listen = async () => {
            if (!xmtp) return;
            for await (const conversation of xmtp.conversations.stream()) {
                console.log(
                    `New conversation started with ${conversation.peerAddress}`
                );
                listenForMessages(conversation);
            }
        };
        listen();
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

    // Function to listen for XMTP messages in a conversation
    const listenForMessages = async (conversation) => {
        for await (const message of conversation.streamMessages()) {
            console.log(
                `New message from ${message.senderAddress}: ${message.content}`
            );
        }
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
    const sendMessageRequest = async (recipientAddress, messageText) => {
        await chatContract.createMessageRequest(recipientAddress, messageText);
    };

    const approveMessageRequest = async (requestId) => {
        await chatContract.approveMessageRequest(requestId);
    };

    const getMessageRequestDetails = async (requestId) => {
        return await chatContract.getMessageRequest(requestId);
    };

    return (
        <div>
            <button onClick={createTree}>Create Merkle Tree</button>
            <input
                type="text"
                value={newLeaf}
                onChange={handleInputChange}
                placeholder="Enter new leaf"
            />
            <button onClick={updateTree}>Add Leaf</button>
            <div>
                <strong>Current Leaves:</strong>
                {leaves.map((leaf, index) => (
                    <div key={index}>{leaf.toString()}</div>
                ))}
            </div>
            <div>
                <strong>Root Hash:</strong>{" "}
                {tree ? tree.getRoot().toString("hex") : "No tree created"}
            </div>
            <ChatApp />
        </div>
    );
};

export default App;
