# Digital-Twin Frontend

Digital-Twin web application built with React, Vite, and Tailwind CSS.

---

## 🚀 Running with Docker (Recommended for All Systems)

Using Docker guarantees that the application runs identically on **Linux, macOS, and Windows** without version conflicts, missing native binaries, or messing up your host environment.

### 1. Development Mode (with Live Reload / HMR)
Run the development server inside an isolated container:

```bash
docker compose up
```
*(Or with npm: `npm run docker:dev`)*

- **URL**: [http://localhost:5173](http://localhost:5173)
- Any edits you make in `src/` will automatically hot-reload in real-time.
- `node_modules` stays isolated inside the container volume.

To stop the development container:
```bash
docker compose down
```

---

### 2. Production Mode (Optimized with Nginx)
Run the high-performance Nginx production build:

```bash
docker compose --profile prod up --build -d prod
```
*(Or with npm: `npm run docker:prod`)*

- **URL**: [http://localhost:8080](http://localhost:8080)
- Uses an ultra-lightweight Alpine Nginx image with SPA client-side routing, gzip compression, and asset caching.

To stop the production container:
```bash
docker compose --profile prod down
```

---

## 💻 Running Locally (Without Docker)

If you prefer to run natively on your host machine:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the Vite dev server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

---

## ⚙️ Backend & Environment Configuration

Configuration for API endpoints is located in:
- `src/Services/BackendConfige.jsx`

Default endpoints:
- `BACKEND_URL`: `http://172.20.13.39:8506`
- `DGTW_URL`: `https://dgtw.um.ac.ir`

To customize endpoints for your local environment or other servers, copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
and edit the URLs as needed:
```env
VITE_BACKEND_URL=http://172.20.13.39:8506
VITE_DGTW_URL=https://dgtw.um.ac.ir
```
*(Note: `.env.local` is git-ignored and will not be pushed to remote repositories).*