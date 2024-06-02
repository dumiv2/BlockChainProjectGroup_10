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

const main = async () => {
    // Example usage: Deposit 0.001 MATIC
    await depositMATIC(0.001);
};

main();


function niceNumber(num) {
    try{
          var sOut = num.toString();
        if ( sOut.length >=17 || sOut.indexOf("e") > 0){
        sOut=parseFloat(num).toPrecision(5)+"";
        sOut = sOut.replace("e","x10<sup>")+"</sup>";
        }
        return sOut;
  
    }
    catch ( e) {
        return num;
    }
  }
  

const balances = async () => {

    let data = await pool_contract.methods.getUserAccountData(signer.address).call()
    let collateral = (parseInt(data.totalCollateralBase / 10) / 10 ** 18)
    let borrow = (parseInt(data.totalDebtBase / 10) / 10 ** 18)
    console.log(`2- Balances:\n`)
    console.log('collateral:', collateral, '\n')
    console.log('borrow:', borrow, '\n')

}



const approveUSDC = async (tokenSupply) => {


    // Token approval
    await usdc_contract.methods.approve(pool_contract_addr, tokenSupply).send({ from: signer.address, gas: 100000 })
        .on('transactionHash', hash => {
            console.log('TX Hash Approve', hash)
        })
        .on('error', error => {
            console.log('Approve Error', error)
        })
}
const supply = async (tokenSupply) => {



    // Supply
    await pool_contract.methods.supply(usdc_avax_address, tokenSupply , signer.address, "0").send({ from: signer.address, gas: 500000 })
        .on('transactionHash', hash => {
            console.log('TX Hash Supply', hash)
        })
        .on('error', error => {
            console.log('Supply Error', error)
        })
        .on('receipt', receipt => {
            console.log('Mined', receipt)
            if (receipt.status == '0x1' || receipt.status == 1) {
                console.log('Transaction Success')
            }
            else
                console.log('Transaction Failed')
        })

}
const borrow = async (tokenSupply) => {

    await pool_contract.methods.borrow(usdc_avax_address, tokenSupply / 10, 2, "0", signer.address).send({ from: signer.address, gas: 500000 })
        .on('transactionHash', hash => {
            console.log('TX Hash Borrow', hash)
        })
        .on('error', error => {
            console.log('Supply Error', error)
        })
        .on('receipt', receipt => {
            console.log('Mined', receipt)
            if (receipt.status == '0x1' || receipt.status == 1) {
                console.log('Transaction Success')
            }
            else
                console.log('Transaction Failed')
        })

}

const checkBalanceUSDC = async (wallet, decimals) => {
    let balance = await usdc_contract.methods.balanceOf(wallet).call()
    balance = parseInt(balance) / 10 ** decimals;
    console.log(`1- USDC Balance: ${((balance))}\n`)
}

