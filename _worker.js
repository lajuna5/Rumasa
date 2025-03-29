const TELEGRAM_BOT_TOKEN = '7921302665:AAFynbwLQWJOTRCTnnsINj-mUueAnq6ENVc'; // Token Telegram Anda
const TELEGRAM_USER_ID = 'ariyelDlacasa'; // Nama Telegram pengguna

const servervless = 'gendarbot.ari-andikha.web.id';
const servertrojan = 'gendarbot.ari-andikha.web.id';
const passuid = '6ac83a31-453a-45a3-b01d-1bd20ee9101f';

const usersWithError = new Set();

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  try {
    if (request.method === 'POST') {
      const data = await request.json();
      const message = data.message || data.callback_query?.message;
      const chatId = message.chat.id;
      const text = message.text?.trim();

      console.log(`Received message: ${text}`); // Logging the incoming message

      // Kata sambutan untuk perintah /start
      if (text === "/start") {
        const welcomeMessage = `
🎉 Selamat datang di Bot Akun VLESS dan Trojan! 🎉

👤 Saya adalah asisten virtual yang siap membantu Anda membuat akun VLESS dan Trojan dengan mudah.

🔹 **Cara Penggunaan**:
1. Kirimkan *Proxy:Port* Anda (contoh: 192.168.1.1:443).
2. Bot akan memproses dan mengirimkan tautan Trojan dan VLESS untuk Anda.

🔹 **Contoh Penggunaan**:
Kirim pesan dengan format berikut:
\`\`\`
192.168.1.1:443
\`\`\`

📩 **Hubungi Saya**:
Jika Anda memerlukan bantuan, hubungi saya di sini: [@ariyelDlacasa](https://t.me/ariyelDlacasa)

Silakan kirim proxy dan port Anda sekarang untuk memulai!
`;

        await sendMessage(chatId, welcomeMessage);
        return new Response("OK");
      }

      // Jika format input adalah Proxy:Port
      if (text?.includes(":")) {
        const [proxy, port] = text.split(":");
        if (!validateIP(proxy) || !validatePort(port)) {
          if (!usersWithError.has(chatId)) {
            await sendMessage(chatId, `❌ Format salah! Kirim dengan format Proxy:Port\nContoh: 192.168.1.1:443`);
            usersWithError.add(chatId);
          }
          return new Response("OK");
        }

        // Mendapatkan informasi proxy
        try {
          const proxyInfo = await getProxyInfo(proxy);

          // Periksa nama proxy
          if (proxyInfo.isp === "DoD Network Information Center") {
            await sendMessage(chatId, `❌ Proxy berasal dari DoD Network Information Center. Silakan periksa kembali proxy Anda.`);
            return new Response("OK");
          }

          // Jika proxy aktif, kirimkan informasi beserta akun Trojan dan VLESS
          if (proxyInfo.status === 'active') {
            const vlessLink = generateVlessLink(proxy, port);
            const trojanLink = generateTrojanLink(proxy, port);

            const responseMessage = `
✅ Berikut akun Anda:

🔹 **Alamat Proxy**: ${proxyInfo.address}
🔹 **Nama Proxy**: ${proxyInfo.isp}
🔹 **Negara**: ${proxyInfo.country}
🔹 **Status Proxy**: Aktif

🔹 **Trojan Link**:
\`\`\`
${trojanLink}
\`\`\`
------------------------------------

🔹 **VLESS Link**:
\`\`\`
${vlessLink}
\`\`\`
------------------------------------

Selamat menggunakan akun Anda!
`;

            await sendMessage(chatId, responseMessage);
          } else {
            await sendMessage(chatId, `❌ Proxy tidak aktif atau informasi tidak dapat diakses. Cek kembali alamat proxy dan coba lagi.`);
          }
        } catch (error) {
          console.error('Error getting proxy information:', error);
          await sendMessage(chatId, `❌ Gagal mendapatkan informasi proxy. Coba lagi nanti.`);
        }

        return new Response("OK");
      }

      // Jika format tidak dikenali
      await sendMessage(chatId, `❌ Format tidak dikenali! Kirim dengan format Proxy:Port\nContoh: 192.168.1.1:443`);
      return new Response("OK");
    } else {
      return new Response("Method Not Allowed", { status: 405 });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// Fungsi untuk mendapatkan informasi proxy
async function getProxyInfo(proxy) {
  const apiUrl = `http://ip-api.com/json/${proxy}?fields=country,regionName,city,isp,query,status`;
  const response = await fetch(apiUrl);
  const data = await response.json();

  if (data.status === 'fail') {
    return { status: 'fail' };
  }

  return {
    address: data.query,
    country: data.country,
    region: data.regionName,
    city: data.city,
    isp: data.isp,
    status: data.status === 'success' ? 'active' : 'inactive',
  };
}

// Fungsi untuk mengirim pesan ke Telegram
async function sendMessage(chatId, text) {
  const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  const body = JSON.stringify({ chat_id: chatId, text: text, parse_mode: "Markdown" });

  try {
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body,
    });
    if (!response.ok) {
      throw new Error(`Telegram API responded with status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error sending message to Telegram:', error);
  }
}

// Validasi Proxy (IP Address)
function validateIP(ip) {
  const ipParts = ip.split(".");
  return ipParts.length === 4 && ipParts.every(part => {
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255;
  });
}

// Validasi Port
function validatePort(port) {
  const num = parseInt(port, 10);
  return num >= 1 && num <= 65535;
}

// Generate VLESS Link
function generateVlessLink(proxy, port) {
  return `vless://${passuid}@${servervless}:443?encryption=none&security=tls&sni=${servervless}&fp=randomized&type=ws&host=${servervless}&path=%2F${proxy}%3A${port}#VLESS-GhenDaarBot`;
}

// Generate Trojan Link
function generateTrojanLink(proxy, port) {
  return `trojan://${passuid}@${servertrojan}:443?encryption=none&security=tls&sni=${servertrojan}&fp=randomized&type=ws&host=${servertrojan}&path=%2F${proxy}%3A${port}#TROJAN-GhenDaarBot`;
}
