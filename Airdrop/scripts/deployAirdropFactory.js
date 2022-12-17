const hre = require("hardhat");
require('@nomiclabs/hardhat-ethers');


let Contract;

function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

async function main() {

    ContractFactory = await ethers.getContractFactory("AirdropFactory");
    Contract = await ContractFactory.deploy(
        "0xd5d9cfE290bBb499B82BAeB88B691459dea66C4B",
        ethers.BigNumber.from("10000000000000000")
    );

    await Contract.deployed();
    console.log("Contract deployed to:", Contract.address);

    sleep(100000);   

    if (network.name == "goerli") {
        await hre.run("verify:verify", {
            address: Contract.address,
            constructorArguments: [
                "0xd5d9cfE290bBb499B82BAeB88B691459dea66C4B",
                ethers.BigNumber.from("10000000000000000")
            ],
        })
    }
}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
    