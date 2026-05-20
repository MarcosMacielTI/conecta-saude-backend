@echo off
REM Quick start script for local testing on Windows

echo 🚀 Starting Backend...
cd backend

REM Check if .env exists
if not exist .env (
    echo ❌ .env file not found in backend/
    echo 📝 Please create .env with required variables:
    echo    MONGO_URI, JWT_SECRET, MP_ACCESS_TOKEN, etc.
    echo.
    echo Example .env:
    echo MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/database
    echo JWT_SECRET=your-secret-key-here
    echo MP_ACCESS_TOKEN=your-mercado-pago-token
    echo NODE_ENV=development
    echo PORT=3000
    pause
    exit /b 1
)

echo ✅ .env file found
echo 🔧 Installing dependencies if needed...
call npm install

echo 📝 Starting backend server on port 3000...
echo 🌐 Access at: http://localhost:3000
echo 🏥 Health check: http://localhost:3000/api/health
echo.
call npm start

pause
