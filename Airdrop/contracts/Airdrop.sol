// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./test/SampleERC20.sol";

contract Airdrop is Initializable, ReentrancyGuard, Ownable
{
    using SafeERC20 for IERC20;

    uint256 public allocationCount;
    string  public  name;
    IERC20 public token;
    uint256 public startTime;
    bool public isCancel;

    struct VestingParameters 
    {
        bool vesting;
        uint256 vestingCyclePeriod;     
        uint256[] vestingRelease;
    }

    VestingParameters public vpar;

    uint256 public currentRemoveCount; //
    mapping(uint256 => mapping (address => uint256)) public addressToamount;
    mapping(address => uint256) public claimed;

    event Claim(address indexed account, uint256 tokens);



   function initialize (string memory _name, IERC20 _token ) public initializer 
    {
        _transferOwnership(_msgSender());
        name = _name;
        token = _token;
    }

    function setAllocation(address[] memory users, uint256[] memory amount) external onlyOwner 
    {
        require(isCancel == false,"canceled");
        require(users.length == amount.length, "Length Mismatch");
        if(startTime > 0)
        {
            require(block.timestamp < startTime , "Airdrop started"); 
        }
        for(uint256 i=0; i < users.length; i++)
        {
            if(addressToamount[currentRemoveCount][users[i]] == 0)
            {
                allocationCount += 1;
            }
            addressToamount[currentRemoveCount][users[i]] += amount[i];
        }
    }

    function setVesting( VestingParameters memory _vpar) external onlyOwner 
    {
        require(isCancel == false,"canceled");
        if(startTime > 0)
        {
            require(block.timestamp < startTime , "Airdrop started"); 
        }
        vpar = _vpar;
    }


    function removeAllAllocation() external onlyOwner 
    {
       if(startTime > 0)
        {
            require(block.timestamp < startTime , "Airdrop started"); 
        }
        currentRemoveCount += 1;
    }

    function startAirdrop(uint256 timestamp) external onlyOwner 
    { 
        require(isCancel == false,"canceled");
        if(startTime > 0)
        {
            require(block.timestamp < startTime , "Airdrop started"); 
        }
        startTime = timestamp;
    } 

    function cancelAirdrop() external onlyOwner
    {
            isCancel=true;
    } 

    function calculateTokens(address account) public view returns(uint256 tokens)
    {
        return tokens = addressToamount[currentRemoveCount][account] - claimed[account];
    }
    

    function pendingClaim(address account) public view returns (uint256 tokens)
    { 
        uint256 uclaimed = calculateTokens(account);
        uint256 cycles = 0;

        if (vpar.vesting)
        {
            if (vpar.vestingCyclePeriod > 0) 
            {
                cycles =
                (block.timestamp - startTime) /
                vpar.vestingCyclePeriod;
            }
            cycles = min(vpar.vestingRelease.length, cycles + 1);

            for (uint256 i = 0; i < cycles; i++) 
            {
                tokens += (addressToamount[currentRemoveCount][account] * vpar.vestingRelease[i]) / 10000;
            }
            tokens -= claimed[account];
        } else 
        {
            tokens = uclaimed;
        }
    }

    function claim() public nonReentrant
    {
        require(isCancel == false,"canceled");
        require(allocationCount != 0, "Airdrop finished");

        uint256 tokens;
        tokens = pendingClaim(msg.sender);

        require(tokens > 0 , "No claimable tokens");

        claimed[msg.sender] += tokens;
        token.safeTransferFrom(owner() ,msg.sender, tokens);

        if(addressToamount[currentRemoveCount][msg.sender] == claimed[msg.sender])
        {
            allocationCount -= 1;
        }
        emit Claim(msg.sender, tokens);
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) 
    {
        return a < b ? a : b;
    }

}
