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
 CONTACT                                     SUPPORT
 X = @janee0x                                ETH = janetf.eth
 Tele = @ChrisEl2                            SOL = janechris.sol

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
        // Kirim notifikasi ke Telegram
        await axios.post(`https://api.telegram.org/bot${TELEGRAM_API_KEY}/sendMessage`, {
            chat_id: TELEGRAM_CHAT_ID,
            text: message
        }, {
            timeout: 1000  // Timeout 1 detik
        });
    } catch (error) {
        // Gagal mengirim notifikasi, tetapi tidak ada log di konsol
    }
};

// Fungsi untuk membuat delay berdasarkan input pengguna
const delay = (seconds) => {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000)); // Mengubah detik ke milidetik
};

// Fungsi untuk mengirim TEA ke daftar alamat
const sendTea = async (addresses, delayTime, tokenContract, tokenAmount, tokenSymbol) => {
    for (let address of addresses) {
        try {
            let tx;
            if (tokenSymbol === 'TEA') {
                // Mengirim 0.001 TEA
                tx = await wallet.sendTransaction({
                    to: address,
                    value: ethers.parseEther("0.001"), // Kirim 0.001 TEA ke setiap alamat
                });

                const txUrl = `https://sepolia.tea.xyz/tx/${tx.hash}`;
                await sendTelegramNotification(`Transaksi sukses: Kirim ${tokenAmount} ${tokenSymbol} ke ${address} - Tx Hash: [${tx.hash}](${txUrl})`);

                // Log transaksi sukses di konsol
                console.log(`Transaksi sukses: Kirim ${tokenAmount} ${tokenSymbol} ke ${address} - Tx Hash: ${tx.hash}`);
            } else {
                // Kirim token sesuai kontrak, jumlah, dan simbol yang diberikan
                const token = new ethers.Contract(tokenContract, [
                    "function transfer(address to, uint256 amount) public returns (bool)"
                ], wallet);
                
                const amount = ethers.parseUnits(tokenAmount, 18); // Asumsi token memiliki 18 desimal
                tx = await token.transfer(address, amount);

                const txUrl = `https://sepolia.tea.xyz/tx/${tx.hash}`;
                await sendTelegramNotification(`Transaksi sukses: Kirim ${tokenAmount} ${tokenSymbol} ke ${address} - Tx Hash: [${tx.hash}](${txUrl})`);

                // Log transaksi sukses di konsol
                console.log(`Transaksi sukses: Kirim ${tokenAmount} ${tokenSymbol} ke ${address} - Tx Hash: ${tx.hash}`);
            }

            await tx.wait();

            // Menunggu sesuai delay yang ditentukan oleh pengguna
            await delay(delayTime);

        } catch (error) {
            // Gagal mengirim ke alamat, tidak ada log ke konsol
            await sendTelegramNotification(`Gagal mengirim ke ${address}: ${error.message}`);
            console.error(`Gagal mengirim ke ${address}: ${error.message}`);  // Log kesalahan di konsol
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

// Fungsi untuk meminta input dari pengguna tentang jenis transaksi
const askUserInput = () => {
    return new Promise((resolve, reject) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('Pilih jenis transaksi (1 = Kirim 0.001 TEA, 2 = Kirim token lain): ', (choice) => {
            if (choice === '1') {
                // Kirim 0.001 TEA
                resolve({ choice: 1 });
            } else if (choice === '2') {
                // Kirim token lain
                rl.question('Masukkan kontrak token: ', (contract) => {
                    rl.question('Masukkan jumlah token: ', (amount) => {
                        rl.question('Masukkan simbol token: ', (symbol) => {
                            resolve({ choice: 2, contract, amount, symbol });
                            rl.close();
                        });
                    });
                });
            } else {
                reject('Pilihan tidak valid.');
                rl.close();
            }
        });
    });
};

(async () => {
    try {
        const userInput = await askUserInput();
        const delayTime = await askDelayTime(); // Tanyakan waktu delay
        const addresses = await readAddressesFromFile();
        console.log("Alamat yang diambil dari address.json:", addresses);

        if (userInput.choice === 1) {
            await sendTea(addresses, delayTime, null, "0.001", "TEA");
        } else if (userInput.choice === 2) {
            const { contract, amount, symbol } = userInput;
            await sendTea(addresses, delayTime, contract, amount, symbol);
        }
    } catch (error) {
        console.error("Gagal memproses:", error);
    }
})();
