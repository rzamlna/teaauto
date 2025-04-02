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

// Fungsi untuk mengirim TEA ke daftar alamat
const sendTea = async (addresses, delayTime) => {
    for (let address of addresses) {
        try {
            const tx = await wallet.sendTransaction({
                to: address,
                value: ethers.parseEther("0.001"), // Kirim 0.001 TEA ke setiap alamat
            });
            console.log(`Mengirim 0.001 TEA ke ${address}. Tx Hash: ${tx.hash}`);
            await tx.wait();  // Tunggu transaksi selesai

            // Membuat URL untuk Tx Hash
            const txUrl = `https://sepolia.tea.xyz/tx/${tx.hash}`;

            // Mengirim notifikasi ke Telegram dengan link Tx Hash
            await sendTelegramNotification(`Transaksi sukses: Kirim 0.001 TEA ke ${address} - Tx Hash: [${tx.hash}](${txUrl})`);

            // Menunggu sesuai delay yang ditentukan oleh pengguna setelah notifikasi
            await delay(delayTime);

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

(async () => {
    try {
        const delayTime = await askDelayTime();  // Meminta input delay dari pengguna
        const addresses = await readAddressesFromFile();  // Membaca daftar alamat dari file
        console.log("Alamat yang diambil dari address.json:", addresses);
        await sendTea(addresses, delayTime);  // Mengirimkan TEA ke alamat yang sudah dibaca
    } catch (error) {
        console.error("Gagal memproses alamat:", error);
    }
})();
