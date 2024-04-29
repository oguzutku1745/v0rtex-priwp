import React, { useEffect, useState } from "react";
import { MerkleTree } from "merkletreejs";
import SHA256 from "crypto-js/sha256";
// padderson,
const Tree = () => {
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

    return (
        <div>
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
            </div>
        </div>
    );
};

export default Tree;
