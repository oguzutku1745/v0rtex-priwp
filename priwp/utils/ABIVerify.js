export const ABIVerify = [
    {
        inputs: [
            { internalType: "bytes32", name: "_merkleRoot", type: "bytes32" },
            { internalType: "address", name: "_verifier", type: "address" },
        ],
        stateMutability: "nonpayable",
        type: "constructor",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "bytes32",
                name: "hashedAddress",
                type: "bytes32",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "amount",
                type: "uint256",
            },
        ],
        name: "DepositMade",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: false,
                internalType: "bytes32",
                name: "newRoot",
                type: "bytes32",
            },
        ],
        name: "MerkleRootUpdated",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "bytes32",
                name: "hashedAddress",
                type: "bytes32",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "amount",
                type: "uint256",
            },
        ],
        name: "WithdrawalMade",
        type: "event",
    },
    {
        inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
        name: "balances",
        outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "bytes32",
                name: "hashedReceiver",
                type: "bytes32",
            },
            { internalType: "bytes32", name: "newMerkleRoot", type: "bytes32" },
        ],
        name: "depositAndUpdateRoot",
        outputs: [],
        stateMutability: "payable",
        type: "function",
    },
    {
        inputs: [{ internalType: "string", name: "comment", type: "string" }],
        name: "hashCommentMessage",
        outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
        stateMutability: "pure",
        type: "function",
    },
    {
        inputs: [],
        name: "merkleRoot",
        outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
        name: "nullifiers",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            { internalType: "bytes", name: "proof", type: "bytes" },
            {
                internalType: "bytes32",
                name: "hashedReceiver",
                type: "bytes32",
            },
            { internalType: "uint256", name: "amount", type: "uint256" },
            { internalType: "bytes32", name: "nullifierHash", type: "bytes32" },
            { internalType: "string", name: "comment", type: "string" },
        ],
        name: "withdrawByProof",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
    },
];
