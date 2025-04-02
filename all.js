const { ethers } = require("ethers");
require("dotenv").config();
const readline = require("readline");
const fs = require('fs');
const axios = require('axios');

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

// Ambil private key dan token bot Telegram dari .env
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const TEA_RPC_URL = "https://tea-sepolia.g.alchemy.com/public";
const TELEGRAM_API_KEY = process.env.TELEGRAM_API_KEY;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!PRIVATE_KEY || !TELEGRAM_API_KEY || !TELEGRAM_CHAT_ID) {
    console.error("Harap isi PRIVATE_KEY, TELEGRAM_API_KEY, dan TELEGRAM_CHAT_ID di file .env");
    process.exit(1);
}

const provider = new ethers.JsonRpcProvider(TEA_RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// ABI ERC-20 standar untuk interaksi transfer
const ERC20_ABI = [
    "function transfer(address to, uint256 amount) public returns (bool)",
    "function symbol() public view returns (string)"
];

// Fungsi untuk mengirim pesan ke bot Telegram
const sendTelegramNotification = async (message) => {
    try {
        const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_API_KEY}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message,
            parse_mode: 'Markdown'  // Untuk memformat teks dengan link yang dapat diklik
        });
        console.log("Notifikasi dikirim ke Telegram:", response.data);
    } catch (error) {
        console.error("Gagal mengirim notifikasi ke Telegram:", error);
    }
};

// Fungsi untuk membuat delay berdasarkan input pengguna
const delay = (seconds) => {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000)); // Mengubah detik ke milidetik
};

// Fungsi untuk mengirim token ERC-20 ke daftar alamat
const sendToken = async (contractAddress, addresses, amount, delayTime, symbol) => {
    const contract = new ethers.Contract(contractAddress, ERC20_ABI, wallet);

    for (let address of addresses) {
        try {
            const tx = await contract.transfer(address, ethers.parseUnits(amount.toString(), 18));  // Mengirim token dengan jumlah yang ditentukan
            console.log(`Mengirim ${amount} ${symbol} ke ${address}. Tx Hash: ${tx.hash}`);
            await tx.wait();  // Tunggu transaksi selesai

            // Membuat URL untuk Tx Hash
            const txUrl = `https://sepolia.tea.xyz/tx/${tx.hash}`;

            // Mengirim notifikasi ke Telegram dengan link Tx Hash
            await sendTelegramNotification(`Transaksi sukses: Kirim ${amount} ${symbol} ke ${address} - Tx Hash: [${tx.hash}](${txUrl})`);

            // Menunggu sesuai delay yang ditentukan oleh pengguna setelah notifikasi
            await delay(delayTime);

        } catch (error) {
            console.error(`Gagal mengirim token ke ${address}:`, error);
            // Mengirim notifikasi jika gagal mengirim transaksi
            await sendTelegramNotification(`Gagal mengirim token ke ${address}: ${error.message}`);
        }
    }
};

// Membaca file address.json
const readAddressesFromFile = () => {
    return new Promise((resolve, reject) => {
        fs.readFile('address.json', 'utf8', (err, data) => {
            if (err) {
                reject("Terjadi kesalahan saat membaca file:", err);
            } else {
                const addresses = JSON.parse(data);
                resolve(addresses);
            }
        });
    });
};

// Fungsi untuk meminta input dari pengguna
const askDelayTime = () => {
    return new Promise((resolve, reject) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('Masukkan waktu delay (dalam detik, antara 1 dan 1000): ', (answer) => {
            const delayTime = parseInt(answer);
            if (delayTime >= 1 && delayTime <= 1000) {
                resolve(delayTime);
                rl.close();
            } else {
                reject('Input tidak valid. Masukkan angka antara 1 dan 1000.');
                rl.close();
            }
        });
    });
};

// Fungsi untuk meminta input alamat kontrak, jumlah token, dan simbol berurutan
const askContractAndAmountAndSymbol = () => {
    return new Promise((resolve, reject) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('Masukkan alamat kontrak token (ERC-20): ', (contractAddress) => {
            rl.question('Masukkan jumlah token yang ingin dikirim: ', (amount) => {
                rl.question('Masukkan simbol token yang ingin dikirim (misalnya: KONTOL, MEMEK): ', (symbol) => {
                    resolve({ contractAddress, amount, symbol });
                    rl.close();
                });
            });
        });
    });
};

(async () => {
    try {
        const delayTime = await askDelayTime();  // Meminta input delay dari pengguna
        const { contractAddress, amount, symbol } = await askContractAndAmountAndSymbol();  // Meminta kontrak, jumlah, dan simbol berurutan
        const addresses = await readAddressesFromFile();  // Membaca daftar alamat dari file
        console.log("Alamat yang diambil dari address.json:", addresses);

        // Kirim token berdasarkan kontrak yang dimasukkan pengguna
        await sendToken(contractAddress, addresses, amount, delayTime, symbol);
    } catch (error) {
        console.error("Gagal memproses input:", error);
    }
})();
