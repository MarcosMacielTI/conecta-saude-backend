## Backend — Database & Google setup

This file explains how to set up MongoDB (local or Atlas) and how to configure Google OAuth for the backend.

1) MongoDB (Local via Docker)

Recommended for development: run a local MongoDB container:

```bash
cd backend
docker compose up -d
```

This starts MongoDB on port `27017`. Use the connection string:

```
MONGO_URI=mongodb://localhost:27017/conecta_saude
```

Put that into your `backend/.env` and then start the backend:

```bash
npm install
npm run dev
```

2) MongoDB Atlas (cloud)

- Create a free cluster at https://www.mongodb.com/cloud/atlas
- Create a database user and whitelist your IP (or allow access from anywhere during development).
- Copy the connection string and set `MONGO_URI` in `backend/.env`, e.g.:

```
MONGO_URI="mongodb+srv://<user>:<pass>@cluster0.xxxx.mongodb.net/conecta_saude?retryWrites=true&w=majority"
```

3) Google OAuth (for Sign-In)

- Go to Google Cloud Console → APIs & Services → Credentials.
- Create an OAuth 2.0 Client ID for Web application (or for Android/iOS if using native flows).
- For Expo web redirect URIs use the values recommended by Expo docs. For native Android/iOS, create separate client IDs.

Required values to set in `backend/.env`:

```
GOOGLE_CLIENT_ID=your_web_or_expo_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_if_needed
```

The backend validates the `idToken` audience (`aud`) against `GOOGLE_CLIENT_ID`.

## 🐳 Docker Setup

### Prerequisites
- Docker and Docker Compose installed
- At least 2GB of available RAM

### Quick Start with Docker Compose

1. **Build and run all services:**
```bash
cd backend
docker-compose up --build
```

2. **Run in background:**
```bash
docker-compose up -d --build
```

3. **View logs:**
```bash
docker-compose logs -f app
```

4. **Stop services:**
```bash
docker-compose down
```

### Services Included

- **app**: Node.js application (port 3000)
- **mongo**: MongoDB database (port 27017)

### Security Features

- ✅ Non-root user execution
- ✅ Minimal Alpine Linux base image
- ✅ Security hardening with `no-new-privileges`
- ✅ Read-only filesystem with tmpfs
- ✅ Proper signal handling with dumb-init
- ✅ Updated Node.js 20 LTS
- ✅ Optimized .dockerignore

### Environment Variables for Docker

When using Docker Compose, the app automatically connects to the MongoDB container. For production, ensure your `.env` file has:

```
NODE_ENV=production
MONGO_URI=mongodb://mongo:27017/conecta_saude
PORT=3000
```

### Troubleshooting

- **Port conflicts**: If port 3000 or 27017 are in use, stop local services or change ports in docker-compose.yml
- **Build issues**: Clear Docker cache with `docker system prune -a`
- **Permission issues**: Ensure Docker daemon is running and you have proper permissions

4) Notes
- If you want me to insert your `MONGO_URI` or `GOOGLE_CLIENT_ID` directly into `.env`, provide them and I'll patch the file.
- After updating `.env`, restart the backend:

```bash
# in backend
npm run dev
```