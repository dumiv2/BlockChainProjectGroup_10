const Web3 = require("web3");
const dotenv = require("dotenv");
const lendingPoolABI = require("../abi/Pool.json");
const ABI = require("../abi/LendingPoo.json");
const ERC20_ABI = require("../abi/ERC20.json");

// Load environment variables from .env file
dotenv.config();

// Providers
const web3 = new Web3(new Web3.providers.HttpProvider('https://polygon-amoy.drpc.org'));

// Wallet from
const privateKey1 = process.env.PRIVATE_KEY; // Private key of account 1
const signer = web3.eth.accounts.privateKeyToAccount(privateKey1);
web3.eth.accounts.wallet.add(signer);

// Contracts
const usdc_avax_address = '0xCaC7Ffa82c0f43EBB0FC11FCd32123EcA46626cf';
const usdc_contract = new web3.eth.Contract(ERC20_ABI, usdc_avax_address);
const pool_contract_addr = '0xf2389E52327AdD85650C3A8DD1739822690BfC80';
const pool_contract = new web3.eth.Contract(ABI, pool_contract_addr);

const depositMATIC = async (amount) => {
    try {
        // Get the transaction nonce
        const nonce = await web3.eth.getTransactionCount(signer.address, 'latest');

        // Create the transaction object
        const tx = {
            from: signer.address,
            to: pool_contract_addr,
            value: web3.utils.toWei(amount.toString(), 'ether'), // Convert MATIC amount to Wei
            gas: 3000000, // Adjust gas limit as necessary
            gasPrice: web3.utils.toWei('30', 'gwei'), // Adjust gas price as necessary
            nonce: nonce,
            data: pool_contract.methods.depositMATIC().encodeABI()
        };

        // Sign the transaction
        const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey1);

        // Send the transaction
        web3.eth.sendSignedTransaction(signedTx.rawTransaction)
            .on('transactionHash', (hash) => {
                console.log('Transaction hash:', hash);
            })
            .on('receipt', (receipt) => {
                console.log('Transaction receipt:', receipt);
            })
            .on('confirmation', (confirmationNumber, receipt) => {
                console.log('Confirmation number:', confirmationNumber);
            })
            .on('error', (error) => {
                console.error('Error during transaction:', error);
            });

    } catch (error) {
        console.error('Error depositing MATIC:', error);
    }
};

const borrowMATIC = async (amount) => {
    try {
        // Get the transaction nonce
        const nonce = await web3.eth.getTransactionCount(signer.address, 'latest');

        // Create the transaction object
        const tx = {
            from: signer.address,
            to: pool_contract_addr,
            value: web3.utils.toWei('0', 'ether'), // No value is sent with the transaction for borrowing
            gas: 3000000, // Adjust gas limit as necessary
            gasPrice: web3.utils.toWei('30', 'gwei'), // Adjust gas price as necessary
            nonce: nonce,
            data: pool_contract.methods.borrow_matic(web3.utils.toWei(amount.toString(), 'ether')).encodeABI()
        };

        // Sign the transaction
        const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey1);

        // Send the transaction
        web3.eth.sendSignedTransaction(signedTx.rawTransaction)
            .on('transactionHash', (hash) => {
                console.log('Transaction hash:', hash);
            })
            .on('receipt', (receipt) => {
                console.log('Transaction receipt:', receipt);
            })
            .on('confirmation', (confirmationNumber, receipt) => {
                console.log('Confirmation number:', confirmationNumber);
            })
            .on('error', (error) => {
                console.error('Error during transaction:', error);
            });

    } catch (error) {
        console.error('Error borrowing MATIC:', error);
    }
};

const repayMATIC = async (amount) => {
    try {
        // Get the transaction nonce
        const nonce = await web3.eth.getTransactionCount(signer.address, 'latest');

        // Create the transaction object
        const tx = {
            from: signer.address,
            to: pool_contract_addr,
            value: web3.utils.toWei(amount.toString(), 'ether'), // Amount to repay
            gas: 3000000, // Adjust gas limit as necessary
            gasPrice: web3.utils.toWei('30', 'gwei'), // Adjust gas price as necessary
            nonce: nonce,
            data: pool_contract.methods.matic_repay().encodeABI()
        };

        // Sign the transaction
        const signedTx = await web3.eth.accounts.signTransaction(tx, privateKey1);

        // Send the transaction
        web3.eth.sendSignedTransaction(signedTx.rawTransaction)
            .on('transactionHash', (hash) => {
                console.log('Transaction hash:', hash);
            })
            .on('receipt', (receipt) => {
                console.log('Transaction receipt:', receipt);
            })
            .on('confirmation', (confirmationNumber, receipt) => {
                console.log('Confirmation number:', confirmationNumber);
            })
            .on('error', (error) => {
                console.error('Error during transaction:', error);
            });

    } catch (error) {
        console.error('Error repaying MATIC:', error);
    }
};


const main = async () => {
    // Example usage: Deposit 0.001 MATIC
    await depositMATIC(0.01);
    await sleep(10000); // 10 seconds delay

    // Example usage: Borrow 0.001 MATIC
    await borrowMATIC(0.001);
    await sleep(10000); // 10 seconds delay

    // Example usage: Repay 0.001 MATIC
    await repayMATIC(0.001);
    await sleep(10000); // 10 seconds delay
};

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

main();
  

