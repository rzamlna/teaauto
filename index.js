const { ethers } = require("ethers");
require("dotenv").config();
const readline = require("readline");
const fs = require('fs');
const axios = require('axios');

// ASCII Art as a string
const asciiArt = `
       ░▒▓█▓▒░░▒▓██████▓▒░░▒▓███████▓▒░░▒▓████████▓▒░▒▓████████▓▒░▒▓████████▓▒░  ▒▓████████▓▒░▒▓████████▓▒░▒▓█▓▒░░▒▓█▓▒░ 
       ░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░         ░▒▓█▓▒░   ░▒▓█▓▒░        ░▒▓█▓▒░         ░▒▓█▓▒░   ░▒▓█▓▒░░▒▓█▓▒░ 
       ░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░         ░▒▓█▓▒░   ░▒▓█▓▒░        ░▒▓█▓▒░         ░▒▓█▓▒░   ░▒▓█▓▒░░▒▓█▓▒░ 
       ░▒▓█▓▒░▒▓████████▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓██████▓▒░    ░▒▓█▓▒░   ░▒▓██████▓▒░   ░▒▓██████▓▒░    ░▒▓█▓▒░   ░▒▓████████▓▒░ 
░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░         ░▒▓█▓▒░   ░▒▓█▓▒░        ░▒▓█▓▒░         ░▒▓█▓▒░   ░▒▓█▓▒░░▒▓█▓▒░ 
░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░         ░▒▓█▓▒░   ░▒▓█▓▒░  ▒▓██▓▒░▒▓█▓▒░         ░▒▓█▓▒░   ░▒▓█▓▒░░▒▓█▓▒░ 
 ░▒▓██████▓▒░░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓████████▓▒░  ░▒▓█▓▒░   ░▒▓█▓▒░  ▒▓██▓▒░▒▓████████▓▒░  ░▒▓█▓▒░   ░▒▓█▓▒░░▒▓█▓▒░ 
 CONTACT                                     SUPPORT
 X = @janee0x                                ETH = janetf.eth
 Tele = @ChrisEl2                            SOL = janechris.sol
`;

console.log(asciiArt);  // Display ASCII Art

// Retrieve private key and Telegram bot token from .env
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const TEA_RPC_URL = "https://tea-sepolia.g.alchemy.com/public";
const TELEGRAM_API_KEY = process.env.TELEGRAM_API_KEY;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!PRIVATE_KEY || !TELEGRAM_API_KEY || !TELEGRAM_CHAT_ID) {
    console.error("Please fill in PRIVATE_KEY, TELEGRAM_API_KEY, and TELEGRAM_CHAT_ID in the .env file.");
    process.exit(1);
}

const provider = new ethers.JsonRpcProvider(TEA_RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Function to send a message to the Telegram bot
const sendTelegramNotification = async (message) => {
    try {
        // Send notification to Telegram
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_API_KEY}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message
        }, {
            timeout: 1000  // 1 second timeout
        });
    } catch (error) {
        // Failed to send notification, but no log in the console
    }
};

// Function to create a delay based on user input
const delay = (seconds) => {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000)); // Convert seconds to milliseconds
};

// Function to send TEA to a list of addresses
const sendTea = async (addresses, delayTime, tokenContract, tokenAmount, tokenSymbol) => {
    for (let address of addresses) {
        try {
            let tx;
            if (tokenSymbol === 'TEA') {
                // Send 0.001 TEA
                tx = await wallet.sendTransaction({
                    to: address,
                    value: ethers.parseEther("0.001"), // Send 0.001 TEA to each address
                });

                const txUrl = `https://sepolia.tea.xyz/tx/${tx.hash}`;
                await sendTelegramNotification(`Transaction successful: Sent ${tokenAmount} ${tokenSymbol} to ${address} - Tx Hash: [${tx.hash}](${txUrl})`);

                // Log successful transaction to the console
                console.log(`Transaction successful: Sent ${tokenAmount} ${tokenSymbol} to ${address} - Tx Hash: ${tx.hash}`);
            } else {
                // Send token according to contract, amount, and symbol provided
                const token = new ethers.Contract(tokenContract, [
                    "function transfer(address to, uint256 amount) public returns (bool)"
                ], wallet);
                
                const amount = ethers.parseUnits(tokenAmount, 18); // Assuming token has 18 decimals
                tx = await token.transfer(address, amount);

                const txUrl = `https://sepolia.tea.xyz/tx/${tx.hash}`;
                await sendTelegramNotification(`Transaction successful: Sent ${tokenAmount} ${tokenSymbol} to ${address} - Tx Hash: [${tx.hash}](${txUrl})`);

                // Log successful transaction to the console
                console.log(`Transaction successful: Sent ${tokenAmount} ${tokenSymbol} to ${address} - Tx Hash: ${tx.hash}`);
            }

            await tx.wait();

            // Wait according to the delay time specified by the user
            await delay(delayTime);

        } catch (error) {
            // Failed to send to address, no log to console
            await sendTelegramNotification(`Failed to send to ${address}: ${error.message}`);
            console.error(`Failed to send to ${address}: ${error.message}`);  // Log error to console
        }
    }
};

// Read the address file (address.json)
const readAddressesFromFile = () => {
    return new Promise((resolve, reject) => {
        fs.readFile('address.json', 'utf8', (err, data) => {
            if (err) {
                reject("An error occurred while reading the file:", err);
            } else {
                const addresses = JSON.parse(data);
                resolve(addresses);
            }
        });
    });
};

// Function to ask for delay time from the user
const askDelayTime = () => {
    return new Promise((resolve, reject) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('Enter delay time (in seconds, between 1 and 1000): ', (answer) => {
            const delayTime = parseInt(answer);
            if (delayTime >= 1 && delayTime <= 1000) {
                resolve(delayTime);
                rl.close();
            } else {
                reject('Invalid input. Please enter a number between 1 and 1000.');
                rl.close();
            }
        });
    });
};

// Function to ask the user for transaction type input
const askUserInput = () => {
    return new Promise((resolve, reject) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('Select transaction type (1 = Send 0.001 TEA, 2 = Send other token): ', (choice) => {
            if (choice === '1') {
                // Send 0.001 TEA
                resolve({ choice: 1 });
            } else if (choice === '2') {
                // Send other token
                rl.question('Enter token contract: ', (contract) => {
                    rl.question('Enter token amount: ', (amount) => {
                        rl.question('Enter token symbol: ', (symbol) => {
                            resolve({ choice: 2, contract, amount, symbol });
                            rl.close();
                        });
                    });
                });
            } else {
                reject('Invalid choice.');
                rl.close();
            }
        });
    });
};

(async () => {
    try {
        const userInput = await askUserInput();
        const delayTime = await askDelayTime(); // Ask for delay time
        const addresses = await readAddressesFromFile();
        console.log("Addresses retrieved from address.json:", addresses);

        if (userInput.choice === 1) {
            await sendTea(addresses, delayTime, null, "0.001", "TEA");
        } else if (userInput.choice === 2) {
            const { contract, amount, symbol } = userInput;
            await sendTea(addresses, delayTime, contract, amount, symbol);
        }
    } catch (error) {
        console.error("Failed to process:", error);
    }
})();
