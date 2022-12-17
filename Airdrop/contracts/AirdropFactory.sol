// SPDX-License-Identifier: MIT

pragma solidity ^0.8.14;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import '@openzeppelin/contracts/proxy/Clones.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/security/Pausable.sol';
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import './Airdrop.sol';

contract AirdropFactory is Ownable, Pausable {

    mapping(address => address) public tokenToairdrop;
    // using SafeERC20 for IERC20;

    event AirdropCreated(string name, address caller,address clone );
    event FeeUpdated(uint256 newFee, uint256 oldfees);

    address immutable AirdropImplemetation;
    uint256 public fee;
    address public feeAddress;

    constructor(address _feeAddress ,uint256 _fee) 
    {
        require(_feeAddress != address(0), "Invalid Address");
        require(_fee != 0, "Invalid fee");
        feeAddress = _feeAddress;
        fee = _fee;
        AirdropImplemetation = address(new Airdrop());
    }

    function createairdrop(string memory _name, address _token) public payable whenNotPaused 
    {
        require(_token != address(0), "Invalid Token");

        address clone = Clones.clone(AirdropImplemetation);
        Airdrop(clone).initialize
        (
            _name,
            IERC20(_token)  
        );

        Airdrop(clone).transferOwnership(msg.sender);
        tokenToairdrop[_token] = clone;
        emit AirdropCreated(_name, msg.sender, clone);
    }

    function updatefee(uint256 _newfee) external onlyOwner 
    {
        uint256 oldFee = fee;
        fee = _newfee;
        emit FeeUpdated(_newfee, oldFee);
    }
}



