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

// Fungsi untuk mengirim pesan ke bot Telegram
const sendTelegramNotification = async (message) => {
    try {
        const response = await axios.post(`https://api.telegram.org/bot${TELEGRAM_API_KEY}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message
        });
        console.log("Notifikasi dikirim ke Telegram:", response.data);
    } catch (error) {
        console.error("Gagal mengirim notifikasi ke Telegram:", error);
    }
};

// Fungsi untuk mengirim TEA ke daftar alamat
const sendTea = async (addresses) => {
    for (let address of addresses) {
        try {
            const tx = await wallet.sendTransaction({
                to: address,
                value: ethers.parseEther("0.001"), // Kirim 0.001 TEA ke setiap alamat
            });
            console.log(`Mengirim 0.001 TEA ke ${address}. Tx Hash: ${tx.hash}`);
            await tx.wait();

            // Mengirim notifikasi ke Telegram setelah transaksi berhasil
            await sendTelegramNotification(`Transaksi sukses: Kirim 0.001 TEA ke ${address} - Tx Hash: ${tx.hash}`);
        } catch (error) {
            console.error(`Gagal mengirim ke ${address}:`, error);
            // Mengirim notifikasi jika gagal mengirim transaksi
            await sendTelegramNotification(`Gagal mengirim ke ${address}: ${error.message}`);
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

(async () => {
    try {
        const addresses = await readAddressesFromFile();
        console.log("Alamat yang diambil dari address.json:", addresses);
        await sendTea(addresses);
    } catch (error) {
        console.error("Gagal memproses alamat:", error);
    }
})();
