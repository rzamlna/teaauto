const { ethers } = require("ethers");
require("dotenv").config();
const readline = require("readline");

// ASCII Art sebagai string
const asciiArt = `

       ░▒▓█▓▒░░▒▓██████▓▒░░▒▓███████▓▒░░▒▓████████▓▒░▒▓████████▓▒░▒▓████████▓▒░  ▒▓████████▓▒░▒▓████████▓▒░▒▓█▓▒░░▒▓█▓▒░ 
       ░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░         ░▒▓█▓▒░   ░▒▓█▓▒░        ░▒▓█▓▒░         ░▒▓█▓▒░   ░▒▓█▓▒░░▒▓█▓▒░ 
       ░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░         ░▒▓█▓▒░   ░▒▓█▓▒░        ░▒▓█▓▒░         ░▒▓█▓▒░   ░▒▓█▓▒░░▒▓█▓▒░ 
       ░▒▓█▓▒░▒▓████████▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓██████▓▒░    ░▒▓█▓▒░   ░▒▓██████▓▒░   ░▒▓██████▓▒░    ░▒▓█▓▒░   ░▒▓████████▓▒░ 
░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░         ░▒▓█▓▒░   ░▒▓█▓▒░        ░▒▓█▓▒░         ░▒▓█▓▒░   ░▒▓█▓▒░░▒▓█▓▒░ 
░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░         ░▒▓█▓▒░   ░▒▓█▓▒░  ▒▓██▓▒░▒▓█▓▒░         ░▒▓█▓▒░   ░▒▓█▓▒░░▒▓█▓▒░ 
 ░▒▓██████▓▒░░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓████████▓▒░  ░▒▓█▓▒░   ░▒▓█▓▒░  ▒▓██▓▒░▒▓████████▓▒░  ░▒▓█▓▒░   ░▒▓█▓▒░░▒▓█▓▒░ 
                                                                                                                       
`;

console.log(asciiArt);  // Menampilkan ASCII Art

// Ambil private key dari .env
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const TEA_RPC_URL = "https://tea-sepolia.g.alchemy.com/public";

if (!PRIVATE_KEY) {
    console.error("Harap isi PRIVATE_KEY di file .env");
    process.exit(1);
}

const provider = new ethers.JsonRpcProvider(TEA_RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Fungsi untuk menghasilkan alamat acak
const generateRandomAddresses = (count) => {
    let addresses = [];
    for (let i = 0; i < count; i++) {
        const randomWallet = ethers.Wallet.createRandom();
        addresses.push(randomWallet.address);
    }
    return addresses;
};

// Fungsi untuk mengirim TEA ke daftar alamat
const sendTea = async (addresses) => {
    for (let address of addresses) {
        try {
            const tx = await wallet.sendTransaction({
                to: address,
                value: ethers.parseEther("0.01"), // Kirim 0.01 TEA ke setiap alamat
            });
            console.log(`Mengirim 0.01 TEA ke ${address}. Tx Hash: ${tx.hash}`);
            await tx.wait();
        } catch (error) {
            console.error(`Gagal mengirim ke ${address}:`, error);
        }
    }
};

// Fungsi untuk meminta input jumlah alamat
const askForAmount = () => {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        rl.question("Berapa jumlah alamat yang diinginkan? (atau ketik 'custom' untuk menggunakan daftar sendiri) ", (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
};

// Fungsi untuk meminta input daftar alamat secara manual
const askForCustomAddresses = () => {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        console.log("Masukkan daftar alamat satu per baris. Ketik 'done' jika sudah selesai:");
        let addresses = [];

        rl.on("line", (line) => {
            if (line.trim().toLowerCase() === "done") {
                rl.close();
                resolve(addresses);
            } else {
                addresses.push(line.trim());
            }
        });
    });
};

(async () => {
    const userChoice = await askForAmount();

    let addresses = [];

    if (userChoice.toLowerCase() === "custom") {
        addresses = await askForCustomAddresses();
        console.log("Daftar alamat yang dimasukkan:", addresses);
    } else {
        const amount = Number(userChoice);
        if (isNaN(amount) || amount <= 0) {
            console.error("Jumlah yang dimasukkan tidak valid.");
            process.exit(1);
        }
        addresses = generateRandomAddresses(amount);
        console.log(`Alamat yang dihasilkan (${amount} alamat):`, addresses);
    }

    await sendTea(addresses);
})();
