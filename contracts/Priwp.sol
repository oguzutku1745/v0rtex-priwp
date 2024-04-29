
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {UltraVerifier} from "./Verifier.sol";

contract Priwp {
    UltraVerifier verifier;

    mapping(bytes32 => uint256) public balances;
    mapping(bytes32 => bool) public nullifiers;
    bytes32 public merkleRoot;

    constructor(bytes32 _merkleRoot, address _verifier) {
        merkleRoot = _merkleRoot;
        verifier = UltraVerifier(_verifier);
    }

    // Event declarations
    event DepositMade(bytes32 indexed hashedAddress, uint256 amount);
    event WithdrawalMade(bytes32 indexed hashedAddress, uint256 amount);
    event MerkleRootUpdated(bytes32 newRoot);

    function log10(uint256 value) internal pure returns (uint256) {
        uint256 result = 0;
        unchecked {
            if (value >= 10 ** 64) {
                value /= 10 ** 64;
                result += 64;
            }
            if (value >= 10 ** 32) {
                value /= 10 ** 32;
                result += 32;
            }
            if (value >= 10 ** 16) {
                value /= 10 ** 16;
                result += 16;
            }
            if (value >= 10 ** 8) {
                value /= 10 ** 8;
                result += 8;
            }
            if (value >= 10 ** 4) {
                value /= 10 ** 4;
                result += 4;
            }
            if (value >= 10 ** 2) {
                value /= 10 ** 2;
                result += 2;
            }
            if (value >= 10 ** 1) {
                result += 1;
            }
        }
        return result;
    }

    bytes16 private constant HEX_DIGITS = "0123456789abcdef";

    function toString(uint256 value) internal pure returns (string memory) {
        unchecked {
            uint256 length = log10(value) + 1;
            string memory buffer = new string(length);
            uint256 ptr;
            /// @solidity memory-safe-assembly
            assembly {
                ptr := add(buffer, add(32, length))
            }
            while (true) {
                ptr--;
                /// @solidity memory-safe-assembly
                assembly {
                    mstore8(ptr, byte(mod(value, 10), HEX_DIGITS))
                }
                value /= 10;
                if (value == 0) break;
            }
            return buffer;
        }
    }

    function concatenateHexArray(bytes32[] memory hexArray, uint start, uint end) internal pure returns (bytes32) {
        bytes32 result;
        for (uint256 i = start; i < end; i++) {
            result = result << 8 | hexArray[i];
        }
        return result;
    }

    function hashCommentMessage(string memory comment) public pure returns(bytes32) {
        return keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n",
            toString(bytes(comment).length),
            comment));
    }

        // Deposit funds into the contract. The sender must provide the new Merkle root after adding the receiver's hashed address.
    function depositAndUpdateRoot(bytes32 hashedReceiver, bytes32 newMerkleRoot) external payable {
        require(msg.value > 0, "Deposit value must be greater than zero");
        balances[hashedReceiver] += msg.value;
        merkleRoot = newMerkleRoot;  // Update the Merkle root
        emit DepositMade(hashedReceiver, msg.value);
        emit MerkleRootUpdated(newMerkleRoot);

    }


    // Withdraw funds from the contract after proving ownership of the hashed address
function withdrawByProof(
    bytes calldata proof,
    bytes32 hashedReceiver,
    uint256 amount,
    bytes32 nullifierHash,
    string memory comment
) public
{
    require(!nullifiers[nullifierHash], "Proof has been already submitted");
    require(balances[hashedReceiver] >= amount, "Insufficient balance");

    // Compute the hash of the comment
    bytes32 commentHash = hashCommentMessage(comment);

    // Expand array size to fit all inputs including the nullifierHash and merkleRoot
    bytes32[] memory _publicInputs = new bytes32[](35); // Ensure this is the correct size
    _publicInputs[0] = hashedReceiver;

    // Fill indices 1 to 33 with the hash of the comment
    for (uint i = 1; i <= 33; i++) {
        _publicInputs[i] = commentHash;  // Repeat the hash or use parts of it if necessary
    }

    _publicInputs[33] = nullifierHash; // Note: This might overwrite the last entry if indices are 1-based
    _publicInputs[34] = merkleRoot;

    require(verifier.verify(proof, _publicInputs), "Invalid proof");

    balances[hashedReceiver] -= amount;
    payable(msg.sender).transfer(amount);
    emit WithdrawalMade(hashedReceiver, amount);
}

}