# Digital-Twin Frontend

Digital-Twin web application built with React, Vite, and Tailwind CSS.

---

## 🏗️ Architecture & Dual Environment Configurations

The frontend includes two dedicated configuration models tailored for different execution environments:

| Feature | 💻 Local PC (`local`) | 🌐 Remote Server (`server`) |
| :--- | :--- | :--- |
| **Compose File** | `docker-compose.local.yml` (or default `docker-compose.yml`) | `docker-compose.server.yml` |
| **Docker Network** | Isolated local bridge (`digital-twin_net`) | Shared unified stack network (`fum_net`) |
| **Backend Target** | `http://host.docker.internal:7000` (Docker) or `http://localhost:7000` (Native) | `http://bot_svc:7000` (Container DNS) |
| **Reverse Proxy** | Automatic via Vite (no CORS or firewall issues) | Automatic via Vite (direct container routing) |
| **Use Case** | Developing on personal laptop/desktop | Deploying to server (`digitaltwin.um.ac.ir`) |

---

## 💻 1. Running on Local PC

You can run the frontend on your local computer either with Docker or natively with Node.js.

### Option A: With Docker (Recommended)

Runs in an isolated container with live Hot Module Replacement (HMR). Does not require external Docker networks.

```bash
# Start dev server on local PC
docker compose up -d

# Or explicitly using the local compose file
docker compose -f docker-compose.local.yml up -d

# Or via npm shortcut
npm run docker:local
```

- **URL**: [http://localhost:5173](http://localhost:5173)
- **Backend Routing**: Proxies `/api/v1` to `http://host.docker.internal:7000` (where your local backend is published).
- **View logs**:
  ```bash
  docker compose logs -f dev
  ```
- **Stop**:
  ```bash
  docker compose down
  # or: npm run docker:local:down
  ```

---

### Option B: Without Docker (Native Node.js)

If you have Node.js 20+ installed and prefer running directly in your terminal:

```bash
# 1. Install dependencies
npm install

# 2. Start Vite dev server
npm run dev
```

- **URL**: [http://localhost:5173](http://localhost:5173)
- **Backend Routing**: Automatically defaults proxy to `http://localhost:7000` (connecting to your local FastAPI backend).

---

## 🌐 2. Running on the Server

On the remote server (`root@digitaltwin:/home/jalilian/DT/Digital-Twin`), the backend services (`bot_svc`, `traefik`, `postgres`, `redis`) run on the unified Docker network **`fum_net`**.

The server configuration joins `fum_net` and routes requests directly container-to-container (`bot_svc:7000`), completely bypassing host firewalls and UFW.

### Step-by-Step Server Deployment

1. **Pull the latest changes**:
   ```bash
   cd /home/jalilian/DT/Digital-Twin
   git pull origin main
   ```

2. **Start with the server configuration**:
   ```bash
   docker compose -f docker-compose.server.yml up -d
   ```
   *(Or via npm shortcut: `npm run docker:server`)*

3. **Verify the container is running and inspect logs**:
   ```bash
   docker compose -f docker-compose.server.yml logs -f dev
   ```

4. **Stop the server container**:
   ```bash
   docker compose -f docker-compose.server.yml down
   ```

---

## 🚀 3. Production Build (Nginx)

To run the optimized production container served with Alpine Nginx:

### On Local PC:
```bash
docker compose --profile prod up --build -d prod
```
- **URL**: [http://localhost:8080](http://localhost:8080)

### On Server:
```bash
docker compose -f docker-compose.server.yml --profile prod up --build -d prod
```

---

## ⚙️ Environment Overrides (.env / .env.local)

To override backend targets or external services, create a `.env.local` file:

```bash
cp .env.example .env.local
```

Available variables:
```env
# Proxy destinations (Vite server-side)
BACKEND_PROXY_URL=http://localhost:7000
LEGACY_BACKEND_PROXY_URL=http://172.20.13.39:8506

# Media and streaming services
VITE_DGTW_URL=https://dgtw.um.ac.ir
VITE_STT_WS_URL=wss://172.20.13.39:8881/ws
```