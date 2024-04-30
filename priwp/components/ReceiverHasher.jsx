import React, { useState } from 'react';
import { computePedersenHash } from '../utils/pedersen_hash';

function HashedReceiver() {
    const [input, setInput] = useState('');
    const [hash, setHash] = useState('');

    const handleInputChange = (e) => {
        setInput(e.target.value);
    };

    const handleComputeHash = () => {
        const hashResult = computePedersenHash(input);
        setHash(hashResult);
        console.log("Hash computed:", hashResult); 
    };

    return (
        <div className="App">
            <input type="text" value={input} onChange={handleInputChange} placeholder="Enter Address" />
            <button onClick={handleComputeHash}>Compute Hash</button>
            <p>Hash: {hash}</p>
        </div>
    );
}

export default HashedReceiver;
