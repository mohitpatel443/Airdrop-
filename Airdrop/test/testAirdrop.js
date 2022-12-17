const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@openzeppelin/test-helpers");
const ether = require("@openzeppelin/test-helpers/src/ether");
const moment = require("moment")

describe('Airdrop factory', () => 
{

    before(async() => 
    {
        [owner, user1, user2, user3, user4, user5, ...users] = await ethers.getSigners();  
        AirdropFactory = await(await ethers.getContractFactory('AirdropFactory')).deploy(owner.address, ethers.utils.parseEther('0.01'));
        token1 = await(await ethers.getContractFactory('SampleERC20')).deploy();
        token2 = await(await ethers.getContractFactory('SampleERC20')).deploy();
        Airdrop = await ethers.getContractFactory('Airdrop');
    });

    
    it('Checking feeaddress and fee', async () => {

        expect(await AirdropFactory.owner()).to.equal(owner.address);
        expect(await AirdropFactory.feeAddress()).to.equal(owner.address);
        expect(await AirdropFactory.fee()).to.equal(ethers.utils.parseEther('0.01'));
    });

    it('Should update fee', async () => {

        await expect(AirdropFactory.updatefee(ethers.utils.parseEther("0.02"))).to.emit(AirdropFactory, 'FeeUpdated').withArgs( ethers.utils.parseEther("0.02"), ethers.utils.parseEther("0.01"));
        expect(await AirdropFactory.fee()).to.equal(ethers.utils.parseEther("0.02"));
    })

    it('should create An Airdrop1 with passed arguments', async () => {

       await expect(AirdropFactory.createairdrop(
       "airdrop1", 
       token1.address 
       )).to.emit(AirdropFactory, 'AirdropCreated');
       
       await expect(AirdropFactory.createairdrop(
        "airdrop1", 
        ethers.constants.AddressZero,
        )).to.be.revertedWith('Invalid Token');
 
       airdrop1 = await Airdrop.attach(await AirdropFactory.tokenToairdrop(token1.address));
       expect(await airdrop1.name()).to.equal('airdrop1');
       expect(await airdrop1.token()).to.equal(token1.address);
       expect(await airdrop1.owner()).to.equal(owner.address);
    });
    
    it('start airdrop', async () => {

        expect(await airdrop1.setAllocation([user1.address], [1000]));
       
        // blockNumberBefore=await ethers.provider.getBlockNumber();
        // blockNumer=await ethers.provider.getBlock(blockNumberBefore);
        // timestamp= await blockNumer.timestamp;

        timestamp = moment.utc().unix()

        expect(await airdrop1.startAirdrop(timestamp));
        await token1.approve(airdrop1.address, 1000);
        await expect(airdrop1.setAllocation([user1.address], [1000])).to.be.revertedWith('Airdrop started');
    })

    // it('cancel Airdrop', async () => {

    //     expect(await airdrop1.cancelAirdrop());
    // })

    it('claim airdrop', async () => {

        await airdrop1.connect(user1).claim(); 
        expect(await airdrop1.pendingClaim(user1.address)).to.equal('0');
    })

    it('should create An Airdrop2 with passed arguments', async () => {

        await expect(AirdropFactory.createairdrop(
        "airdrop2", 
        token2.address 
        )).to.emit(AirdropFactory, 'AirdropCreated');
        

        await expect(AirdropFactory.createairdrop(
        "airdrop2", 
        ethers.constants.AddressZero,
        )).to.be.revertedWith('Invalid Token');

        airdrop2 = await Airdrop.attach(await AirdropFactory.tokenToairdrop(token2.address));
        expect(await airdrop2.name()).to.equal('airdrop2');
        expect(await airdrop2.token()).to.equal(token2.address);
        expect(await airdrop2.owner()).to.equal(owner.address);
    });

    it('Should set and remove allocation ', async () => {
        
        expect(await airdrop2.setAllocation([user2.address], [1000]));
        expect(await airdrop2.removeAllAllocation());
        await expect(airdrop2.connect(user2).claim()).to.be.revertedWith('No claimable tokens'); 
    })

    it('Should set vesting ', async () => {

        expect(await airdrop2.setVesting
            ({
                vesting: true,
                vestingCyclePeriod: 1000                                                                                                                                                       ,
                vestingRelease: [4000,2000,2000,2000],
            }));
    })
 
    it('start airdrop', async () => {

        expect(await airdrop2.setAllocation([user2.address], [1000]));

        blockNumberBefore=await ethers.provider.getBlockNumber();
        blockNumer=await ethers.provider.getBlock(blockNumberBefore);
        timestamp= await blockNumer.timestamp;

        expect(await airdrop2.startAirdrop(timestamp));
        await token2.approve(airdrop2.address, 1000);
    })

    it('claiming first release of airdrop2 ', async () => {

        currentTime = (await airdrop2.startTime());

        expect(await airdrop2.pendingClaim(user2.address)).to.equal('400');
        await airdrop2.connect(user2).claim(); 
        expect(await token2.balanceOf(user2.address)).to.equal('400');
    })

    it('claiming second release of airdrop2 ', async () => {

        await time.increaseTo(parseInt(await airdrop2.startTime()) + 1001 ) ;

        expect(await airdrop2.pendingClaim(user2.address)).to.equal('200');
        await airdrop2.connect(user2).claim();  
        expect(await token2.balanceOf(user2.address)).to.equal('600');
    })

    it('claiming third release of airdrop2 ', async () => {

        await time.increaseTo(parseInt(await airdrop2.startTime()) + 2001);

        expect(await airdrop2.pendingClaim(user2.address)).to.equal('200');
        await airdrop2.connect(user2).claim();  
        expect(await token2.balanceOf(user2.address)).to.equal('800');
    })

    it('claiming fourth release of airdrop2 ', async () => {

        await time.increaseTo(parseInt(await airdrop2.startTime()) + 3001);

        expect(await airdrop2.pendingClaim(user2.address)).to.equal('200');        
        await airdrop2.connect(user2).claim();  
        expect(await token2.balanceOf(user2.address)).to.equal('1000');
    })

}); 
