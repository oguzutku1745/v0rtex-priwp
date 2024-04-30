import React, { useEffect, useState } from "react";
import { Client } from "@xmtp/xmtp-js";
import { ethers } from "ethers";
import Tree from "../components/Tree";
import { BarretenbergBackend } from "@noir-lang/backend_barretenberg";
import { Noir } from "@noir-lang/noir_js";
import circuit from "../../circuits/target/noirtest.json";
import { ABI } from "../utils/ABI";
import { ABIVerify } from "../utils/ABIVerify";

const App = () => {
    const [recipientAddress, setrecipientAddress] = useState("");
    const [message, setMessage] = useState("");
    const [xmtp, setXmtp] = useState(null);
    const [amountEth, setAmountEth] = useState(0);

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
    const contractAddress = "0x9e4F913d59955eeBa541fEF094D27B3556Fa45Cb";

    const contractAddressVerify = "0xF97565cdd63Db28C8016f1e95379E2DAc7f42E4D";
    const contractABI = ABI;
    const contractABIVerify = ABIVerify;

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

    const withdrawWProof = async (comment) => {
        document.getElementById("web3_message").textContent =
            "Please sign the message ✍️";

        const provider = new ethers.providers.Web3Provider(
            window.ethereum,
            "any"
        );
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const signeraddress = await signer.getAddress();

        const signature = await signer.signMessage(comment);
        var hashedMessage = ethers.utils.hashMessage(comment);
        var publicKey = ethers.utils.recoverPublicKey(hashedMessage, signature);

        publicKey = publicKey.substring(4);

        let pub_key_x = publicKey.substring(0, 64);
        let pub_key_y = publicKey.substring(64);

        var sSignature = Array.from(ethers.utils.arrayify(signature));
        sSignature.pop();

        const backend = new BarretenbergBackend(circuit);
        const noir = new Noir(circuit, backend);

        let merkleTree = [
            {
                value: "0x707e55a12557E89915D121932F83dEeEf09E5d70",
                index: "0",
                hashPath: [
                    "0x000000000000000000000000bef34f2FCAe62dC3404c3d01AF65a7784c9c4A19",
                    "0x00000000000000000000000008966BfFa14A7d0d7751355C84273Bb2eaF20FC3",
                ],
            },
            {
                value: "0xbef34f2FCAe62dC3404c3d01AF65a7784c9c4A19",
                index: "1",
                hashPath: [
                    "0x000000000000000000000000707e55a12557E89915D121932F83dEeEf09E5d70",
                    "0x00000000000000000000000008966BfFa14A7d0d7751355C84273Bb2eaF20FC3",
                ],
            },
            {
                value: "0x08966BfFa14A7d0d7751355C84273Bb2eaF20FC3",
                index: "2",
                hashPath: [
                    "0x00000000000000000000000008966BfFa14A7d0d7751355C84273Bb2eaF20FC3",
                    "0x1476e5c502f3a532e7c36640e88eebf769ae99d6c50f3be65279ca937b795a3d",
                ],
            },
        ];

        let index = null;
        let hashPath = null;
        for (let i = 0; i < merkleTree.length; i++) {
            if (merkleTree[i].value == signeraddress) {
                index = merkleTree[i].index;
                hashPath = merkleTree[i].hashPath;
            }
        }
        if (index == null || index == hashPath) {
            console.log("Could not find the signer on the merkle tree");
            return;
        }

        const amountInWei = ethers.utils.parseEther(amountEth);

        const input = {
            pub_key_x: Array.from(ethers.utils.arrayify("0x" + pub_key_x)),
            pub_key_y: Array.from(ethers.utils.arrayify("0x" + pub_key_y)),
            signature: sSignature,
            hashed_receiver: ethers.utils.hashMessage(signeraddress),
            hashed_message: Array.from(ethers.utils.arrayify(hashedMessage)),
            nullifier: ethers.utils.hashMessage(sSignature),
            root: merkleTree,
            hashPath: hashPath,
        };

        document.getElementById("web3_message").textContent =
            "Generating proof... ⌛";
        var proof = await noir.generateFinalProof(input);
        document.getElementById("web3_message").textContent =
            "Generating proof... ✅";

        proof =
            "0x" + ethereumjs.Buffer.Buffer.from(proof.proof).toString("hex");

        var tHashedMessage = splitIntoPairs(hashedMessage.substring(2));

        for (var i = 0; i < tHashedMessage.length; i++) {
            tHashedMessage[i] =
                "0x00000000000000000000000000000000000000000000000000000000000000" +
                tHashedMessage[i];
        }

        tHashedMessage.push(
            "0x2a550743aa7151b3324482a03b2961ec4b038672a701f8ad0051b2c9d2e6c4c0"
        );

        console.log("tHashedMessage2");
        console.log(tHashedMessage);

        const transaction = {
            from: signeraddress,
            to: COMMENT_VERIFIER_ADDRESS,
            value: "0",
            gasPrice: "700000000", // 0.7 gwei
            nonce: await provider.getTransactionCount(signeraddress),
            chainId: "534351",
            data: contract.interface.encodeFunctionData("withdrawByProof", [
                proof,
                hashed_receiver,
                amountInWei,
                nullifier,
                comment,
            ]),
        };
        const signedTransaction = await signer.populateTransaction(transaction);
        const transactionResponse = await signer.sendTransaction(
            signedTransaction
        );
        console.log(
            "🎉 The hash of your transaction is:",
            transactionResponse.hash
        );
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
