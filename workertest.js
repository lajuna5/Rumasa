/*
WM: t.me/bexcode
donate: {
 qris: https://i.ibb.co.com/SX3phRsp/IMG-20250126-134536-103.jpg
 dana: 082229848262
}
*/
export default {
  async fetch(req, env, ctx) {
    if (req.method === 'GET') {
      return new Response(this.getHtmlContent(), {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }
    if (req.method === 'POST') {
      try {
        const url = new URL(req.url);
        const email = url.searchParams.get("email");
        const globalAPIKey = url.searchParams.get("globalapikey");
        const workerName = url.searchParams.get("workerName");
        const rootdomain = url.searchParams.get("domain");

        if (!email || !globalAPIKey || !workerName) {
          return new Response(
            JSON.stringify({ error: "Missing required fields" }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
          );
        }
        const workerFormStr = await req.text();
        const cf = new Cf(email, globalAPIKey, workerName, workerFormStr, rootdomain);
        
        if (rootdomain) {
          await cf.getZoneId();
        }
        
        await cf.getAccount();
        await cf.getSubdomain();
        const { url: workerUrls } = await cf.createWorker();
        
        if (rootdomain) {
          const zoneId = await cf.getZoneId();
          if (zoneId) {
            await cf.registerDomain(zoneId);
          }
        }

        return new Response(
          JSON.stringify({ url: workerUrls }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

      } catch (error) {
        console.error("Error in createWorker:", error);
        return new Response(
          JSON.stringify({ error: error.message || "Internal Server Error" }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(`Method ${req.method} Not Allowed`, { status: 405 });
  },

  getHtmlContent() {
    return `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Worker Deployment</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
            margin: 0;
            padding: 0;
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .container {
            background: #fff;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            max-width: 600px;
            width: 100%;
            margin: 20px;
        }

        h1 {
            font-size: 2rem;
            text-align: center;
            color: #333;
            margin-bottom: 30px;
        }

        label {
            font-size: 1rem;
            color: #555;
            margin-bottom: 5px;
            display: block;
        }

        input, button {
            width: 100%;
            padding: 12px;
            margin-bottom: 20px;
            border: 1px solid #ccc;
            border-radius: 8px;
            font-size: 1rem;
        }

        input:focus, button:focus {
            outline: none;
            border-color: #5b9bd5;
        }

        input[type="file"] {
            border: none;
            padding: 10px;
        }

        button {
            background-color: #2575fc;
            color: white;
            font-weight: bold;
            cursor: pointer;
            transition: background-color 0.3s ease;
        }

        button:hover {
            background-color: #0063d1;
        }

        .result {
            margin-top: 20px;
            padding: 20px;
            background: #f4f4f4;
            border-radius: 8px;
            display: none;
        }

        .result pre {
            background: #e0e0e0;
            padding: 10px;
            border-radius: 5px;
            font-size: 0.9rem;
            white-space: pre-wrap;
            word-wrap: break-word;
        }

        .input-group {
            margin-bottom: 15px;
        }

        .input-group:last-child {
            margin-bottom: 0;
        }

        .input-group input {
            border: 1px solid #ddd;
        }

        .visit-button {
            background-color: #4CAF50;
            color: white;
            padding: 12px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            transition: background-color 0.3s ease;
            margin-top: 10px;
        }

        .visit-button:hover {
            background-color: #45a049;
        }

        /* Loading Spinner */
        .loading {
            display: none;
            text-align: center;
            margin-top: 20px;
        }

        .loading .spinner {
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid #2575fc;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>

    <div class="container">
        <h1>Worker Deployment</h1>

        <form id="deployForm">
            <div class="input-group">
                <label for="email">Email:</label>
                <input type="email" id="email" required>
            </div>

            <div class="input-group">
                <label for="globalapikey">Global API Key:</label>
                <input type="password" id="globalapikey" required>
            </div>

            <div class="input-group">
                <label for="workerName">Worker Name:</label>
                <input type="text" id="workerName" required>
            </div>

            <div class="input-group">
                <label for="domain">Domain (Optional):</label>
                <input type="text" id="domain">
            </div>

            <div class="input-group">
                <label for="workerFile">Worker Script:</label>
                <input type="file" id="workerFile" accept=".js" required>
            </div>

            <button type="submit">Deploy Worker</button>
        </form>

        <div class="loading" id="loading">
            <div class="spinner"></div>
            <p>Loading...</p>
        </div>

        <div class="result" id="result">
            <h2>Deployment Result:</h2>
            <p id="resultUrl"></p>
            <button id="visitButton" class="visit-button" style="display: none;">Visit</button>
        </div>
    </div>

    <script>
        document.getElementById('deployForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const resultDiv = document.getElementById('result');
            const resultUrl = document.getElementById('resultUrl');
            const visitButton = document.getElementById('visitButton');
            const loadingDiv = document.getElementById('loading');
            loadingDiv.style.display = 'block';
            resultDiv.style.display = 'none';

            try {
                const file = document.getElementById('workerFile').files[0];
                const workerCode = await file.text();

                function generateFormData(workerCode) {
                    const metadata = JSON.stringify({
                        compatibility_date: "2024-04-17",
                        bindings: [],
                        main_module: "worker.js"
                    });

                    return [
                        '------WebKitFormBoundarytvoThhvajRSJKhAT',
                        'Content-Disposition: form-data; name="worker.js"; filename="worker.js"',
                        'Content-Type: application/javascript+module',
                        '',
                        workerCode,
                        '------WebKitFormBoundarytvoThhvajRSJKhAT',
                        'Content-Disposition: form-data; name="metadata"; filename="blob"',
                        'Content-Type: application/json',
                        '',
                        metadata,
                        '------WebKitFormBoundarytvoThhvajRSJKhAT--'
                    ].join('\\n');
                }

                const params = new URLSearchParams({
                    email: document.getElementById('email').value,
                    globalapikey: document.getElementById('globalapikey').value,
                    workerName: document.getElementById('workerName').value,
                    domain: document.getElementById('domain').value || ''
                });

                const response = await fetch(\`\${window.location.href}?\${params.toString()}\`, {
                    method: 'POST',
                    body: generateFormData(workerCode),
                    headers: {
                        'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundarytvoThhvajRSJKhAT'
                    }
                });

                const data = await response.json();
                loadingDiv.style.display = 'none';
                resultDiv.style.display = 'block';

                if (!response.ok) {
                    throw new Error(data.error || 'Deployment failed');
                }
                const url = data.url;
                if (url) {
                    resultUrl.textContent = url;
                    visitButton.style.display = 'block';
                    visitButton.addEventListener('click', () => {
                        window.open(url, '_blank');
                    });
                }

            } catch (error) {
                loadingDiv.style.display = 'none';
                resultDiv.style.display = 'block';
                resultUrl.textContent = \`Error: \${error.message}\`;
            }
        });
    </script>

</body>
</html>`;
  }
};
class Cf {
  constructor(email, globalAPIKey, workerName, workerFormStr, rootdomain) {
    this.email = email;
    this.globalAPIKey = globalAPIKey;
    this.workerName = workerName;
    this.workerFormStr = workerFormStr;
    this.rootdomain = rootdomain;
    this.baseURL = "https://api.cloudflare.com/client/v4";
    this.domainList = ["zaintest.vuclip.com", "ava.game.naver.com", "zoomgov", "support.zoom.us", "graph.instagram.com", "z-p15.www.instagram.com", "investors.spotify.com", "quiz.int.vidio.com"];
  }

  async _fetch(url, options = {}) {
    const defaultOptions = {
      headers: {
        "X-Auth-Email": this.email,
        "X-Auth-Key": this.globalAPIKey,
        "Content-Type": "application/json",
      },
    };
    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: { ...defaultOptions.headers, ...options.headers },
    };
    const response = await fetch(this.baseURL + url, mergedOptions);
    if (!response.ok) {
      const errorData = await response.json();
      console.error('API request failed:', response.status, errorData);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async getZoneId() {
    const data = await this._fetch("/zones");
    const zone = data.result.find((zone) => zone.name === this.rootdomain);
    
    if (!zone) {
      throw new Error(`Domain ${this.rootdomain} not found`);
    }
    
    return zone.id;
  }

  async registerDomain(zoneId) {
    const fullDomain = `${this.workerName}.${this.rootdomain}`;
      await this._fetch(`/accounts/${this.id}/workers/domains`, {
        method: "PUT",
        body: JSON.stringify({
          environment: "production",
          hostname: fullDomain,
          service: this.workerName,
          zone_id: zoneId
        })
      });
    for (const domain of this.domainList) {
      const fullDomain = `${domain}.${this.workerName}.${this.rootdomain}`;
      await this._fetch(`/accounts/${this.id}/workers/domains`, {
        method: "PUT",
        body: JSON.stringify({
          environment: "production",
          hostname: fullDomain,
          service: this.workerName,
          zone_id: zoneId
        })
      });
    }
  }

  async getAccount() {
    const data = await this._fetch("/accounts");
    this.id = data.result[0].id;
  }

  async getSubdomain() {
    try {
      const data = await this._fetch(`/accounts/${this.id}/workers/subdomain`);
      this.subdomain = data.result.subdomain;
    } catch (error) {
      if (error.message.includes('status: 404')) {
        const res = await this._fetch(`/accounts/${this.id}/workers/subdomain`, {
          method: 'PUT',
          body: JSON.stringify({ subdomain: this.email.split("@")[0] }),
        });
        this.subdomain = res.result.subdomain;
      } else {
        throw error;
      }
    }
  }

  async _enableSubdomain() {
    await this._fetch(
      `/accounts/${this.id}/workers/services/${this.workerName}/environments/production/subdomain`,
      {
        method: 'POST',
        body: JSON.stringify({ enabled: true })
      }
    );
  }

  async createWorker() {
    const result = await this._fetch(
      `/accounts/${this.id}/workers/services/${this.workerName}/environments/production?include_subdomain_availability=true`,
      {
        method: 'PUT',
        body: this.workerFormStr,
        headers: {
          "Content-Type": "multipart/form-data; boundary=----WebKitFormBoundarytvoThhvajRSJKhAT",
        },
      }
    );

    const host = `${this.workerName}.${this.subdomain}.workers.dev`;
    let url = `https://${host}/`;
    if (this.rootdomain) {
       url = `https://${this.workerName}.${this.rootdomain}/`
    }

    console.log({ url });
    await this._enableSubdomain();

    return { url };
  }
}
