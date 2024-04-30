// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.20;


contract chatRequest {
    struct MessageRequest {
        uint requestId;
        address sender;
        address recipient;
        uint timestamp;
        string text;
        string status;
    }
    uint private nextRequestId = 0;
    mapping(uint => MessageRequest) public requests;
    mapping(address => bool) public isParticipant;
    mapping(address => bool) public blocked;

    event MessageRequestCreated(uint indexed requestId, address indexed sender, address indexed recipient,uint timestamp);
    event MessageRequestApproved(uint indexed requestId, uint timestamp);
    event MessageRequestDenied(uint indexed requestId, uint timestamp);
    event MessageRequestCancelled(uint indexed requestId, uint timestamp);
    event AddressBlocked(address indexed user, address indexed blockedUser, uint timestamp);
    event AddressUnblocked(address indexed user, address indexed blockedUser, uint timestamp);

    modifier onlySender(uint _requestId) {
    require(requests[_requestId].sender == msg.sender, "Only the sender can perform this action.");
    _;
    }

    modifier onlyParticipant() {
        require(true);
        _;
    }

    modifier notBlocked() {
        require(!blocked[msg.sender], "You are blocked from recipient");
        _;
    }


    function createMessageRequest(address _recipient, string memory _text) public onlyParticipant notBlocked {
        require(_recipient != address(0), "Invalid recipient address");
        requests[nextRequestId] = MessageRequest(nextRequestId, msg.sender, _recipient, block.timestamp, _text, "waiting");
        emit MessageRequestCreated(nextRequestId, msg.sender, _recipient, block.timestamp);
        nextRequestId++;
    }

    function approveMessageRequest(uint _requestId) public onlyParticipant notBlocked {
        MessageRequest storage request = requests[_requestId];
        require(msg.sender == request.recipient, "Only the recipient can approve this message");
        require(keccak256(abi.encodePacked(request.status)) != keccak256(abi.encodePacked("approved")), "Request already approved");
        require(keccak256(abi.encodePacked(request.status)) != keccak256(abi.encodePacked("denied")), "Request already denied");
        require(keccak256(abi.encodePacked(request.status)) != keccak256(abi.encodePacked("canceled")), "Request already canceled");
        request.status = "approved";
        emit MessageRequestApproved(_requestId, block.timestamp);
    }

    function denyMessageRequest(uint _requestId) public onlyParticipant notBlocked {
        MessageRequest storage request = requests[_requestId];
        require(msg.sender == request.recipient, "Only the recipient can deny this message");
        require(keccak256(abi.encodePacked(request.status)) != keccak256(abi.encodePacked("approved")), "Request already approved");
        require(keccak256(abi.encodePacked(request.status)) != keccak256(abi.encodePacked("denied")), "Request already denied");
        require(keccak256(abi.encodePacked(request.status)) != keccak256(abi.encodePacked("canceled")), "Request already canceled");
        request.status = "denied";
        emit MessageRequestDenied(_requestId, block.timestamp);
    }

    function cancelMessageRequest(uint _requestId) public onlySender(_requestId) {
        MessageRequest storage request = requests[_requestId];
        require(keccak256(abi.encodePacked(request.status)) != keccak256(abi.encodePacked("approved")), "Request already approved");
        require(keccak256(abi.encodePacked(request.status)) != keccak256(abi.encodePacked("denied")), "Request already denied");
        require(keccak256(abi.encodePacked(request.status)) != keccak256(abi.encodePacked("canceled")), "Request already canceled");
        request.status = "canceled";
        emit MessageRequestCancelled(_requestId, block.timestamp);
    }

    function blockAddress(address _user) public onlyParticipant{
        require(!blocked[_user], "User is already blocked");
        blocked[_user] = true;
        emit AddressBlocked(msg.sender,_user, block.timestamp);
        //blocka event koyulmasından emin degilim
    }

    function unblockAddress(address _user) public onlyParticipant{
        require(blocked[_user], "User is not blocked");
        blocked[_user] = false;
        emit AddressUnblocked(msg.sender,_user, block.timestamp);
    }

    function getMessageRequest(uint _requestId) public view returns (address sender, address recipient, string memory text, uint timestamp, string memory status) {
        require(_requestId < nextRequestId, "Request ID does not exist.");
        MessageRequest storage request = requests[_requestId];
        return (request.sender, request.recipient, request.text, request.timestamp, request.status);
    }
}