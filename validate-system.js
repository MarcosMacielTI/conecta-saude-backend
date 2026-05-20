#!/usr/bin/env node

/**
 * 🔍 System Validation Script
 * Verifica se o sistema está pronto para deployment
 */

const fs = require('fs');
const path = require('path');

const checks = [];

console.log('\n🔍 App Conecta Saúde - System Validation\n');
console.log('=' .repeat(50));

// Check 1: Backend .env
try {
    const envPath = path.join(__dirname, 'backend/.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const hasMongoUri = envContent.includes('MONGO_URI');
        const hasJwtSecret = envContent.includes('JWT_SECRET');
        const hasMercadoPago = envContent.includes('MERCADO_PAGO_ACCESS_TOKEN');
        
        if (hasMongoUri && hasJwtSecret && hasMercadoPago) {
            checks.push({ name: 'Backend .env configuration', status: '✅ PASS' });
        } else {
            checks.push({ name: 'Backend .env configuration', status: '⚠️  INCOMPLETE' });
        }
    } else {
        checks.push({ name: 'Backend .env file', status: '❌ MISSING' });
    }
} catch (e) {
    checks.push({ name: 'Backend .env check', status: '❌ ERROR: ' + e.message });
}

// Check 2: Backend package.json
try {
    const pkgPath = path.join(__dirname, 'backend/package.json');
    if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        const requiredDeps = ['express', 'mongoose', 'jsonwebtoken', 'mercadopago', 'socket.io'];
        const hasDeps = requiredDeps.every(dep => pkg.dependencies[dep]);
        
        if (hasDeps) {
            checks.push({ name: 'Backend dependencies', status: '✅ PASS' });
        } else {
            checks.push({ name: 'Backend dependencies', status: '⚠️  MISSING: ' + requiredDeps.filter(d => !pkg.dependencies[d]).join(', ') });
        }
    } else {
        checks.push({ name: 'Backend package.json', status: '❌ MISSING' });
    }
} catch (e) {
    checks.push({ name: 'Backend package.json check', status: '❌ ERROR: ' + e.message });
}

// Check 3: Backend package-lock.json
try {
    const lockPath = path.join(__dirname, 'backend/package-lock.json');
    checks.push({ 
        name: 'Backend package-lock.json', 
        status: fs.existsSync(lockPath) ? '✅ PASS' : '⚠️  MISSING (run: npm install)'
    });
} catch (e) {
    checks.push({ name: 'Backend package-lock check', status: '❌ ERROR: ' + e.message });
}

// Check 4: Frontend package.json
try {
    const pkgPath = path.join(__dirname, 'HealthcareApp/package.json');
    if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        const requiredDeps = ['expo', 'react', 'react-native', 'axios', 'socket.io-client'];
        const hasDeps = requiredDeps.every(dep => pkg.dependencies[dep]);
        
        if (hasDeps) {
            checks.push({ name: 'Frontend dependencies', status: '✅ PASS' });
        } else {
            checks.push({ name: 'Frontend dependencies', status: '⚠️  MISSING: ' + requiredDeps.filter(d => !pkg.dependencies[d]).join(', ') });
        }
    } else {
        checks.push({ name: 'Frontend package.json', status: '❌ MISSING' });
    }
} catch (e) {
    checks.push({ name: 'Frontend package.json check', status: '❌ ERROR: ' + e.message });
}

// Check 5: Backend routes
const routeFiles = [
    'backend/routes/auth.js',
    'backend/routes/payments.js',
    'backend/routes/appointments.js',
    'backend/routes/messages.js',
    'backend/routes/subscriptions.js'
];

const allRoutesExist = routeFiles.every(file => fs.existsSync(path.join(__dirname, file)));
checks.push({ 
    name: 'Backend route files', 
    status: allRoutesExist ? '✅ PASS' : '❌ MISSING routes'
});

// Check 6: Backend models
const modelFiles = [
    'backend/models/User.js',
    'backend/models/Professional.js',
    'backend/models/Payment.js',
    'backend/models/Subscription.js',
    'backend/models/Message.js'
];

const allModelsExist = modelFiles.every(file => fs.existsSync(path.join(__dirname, file)));
checks.push({ 
    name: 'Backend model files', 
    status: allModelsExist ? '✅ PASS' : '❌ MISSING models'
});

// Check 7: Frontend screens
const screenFiles = [
    'HealthcareApp/LoginScreen.js',
    'HealthcareApp/PlansScreen.js',
    'HealthcareApp/ChatScreen.js',
    'HealthcareApp/App.js'
];

const allScreensExist = screenFiles.every(file => fs.existsSync(path.join(__dirname, file)));
checks.push({ 
    name: 'Frontend screen files', 
    status: allScreensExist ? '✅ PASS' : '❌ MISSING screens'
});

// Check 8: Health check endpoint
try {
    const indexPath = path.join(__dirname, 'backend/index.js');
    const indexContent = fs.readFileSync(indexPath, 'utf8');
    const hasHealthCheck = indexContent.includes('/api/health');
    checks.push({ 
        name: 'Health check endpoint', 
        status: hasHealthCheck ? '✅ PASS' : '❌ NOT FOUND'
    });
} catch (e) {
    checks.push({ name: 'Health check check', status: '❌ ERROR: ' + e.message });
}

// Check 9: Payment flow
try {
    const paymentsPath = path.join(__dirname, 'backend/routes/payments.js');
    const paymentsContent = fs.readFileSync(paymentsPath, 'utf8');
    const hasPixPayment = paymentsContent.includes('create-pix');
    const hasPaymentStatus = paymentsContent.includes('getStatus');
    checks.push({ 
        name: 'Payment flow', 
        status: (hasPixPayment && hasPaymentStatus) ? '✅ PASS' : '⚠️  PARTIAL'
    });
} catch (e) {
    checks.push({ name: 'Payment flow check', status: '❌ ERROR: ' + e.message });
}

// Check 10: Authentication middleware
try {
    const authPath = path.join(__dirname, 'backend/middlewares/authMiddleware.js');
    checks.push({ 
        name: 'Auth middleware', 
        status: fs.existsSync(authPath) ? '✅ PASS' : '⚠️  MISSING'
    });
} catch (e) {
    checks.push({ name: 'Auth middleware check', status: '❌ ERROR: ' + e.message });
}

// Print results
console.log('\nSystem Status:\n');
checks.forEach(check => {
    console.log(`${check.status.padEnd(20)} - ${check.name}`);
});

console.log('\n' + '='.repeat(50));

const passCount = checks.filter(c => c.status.includes('✅')).length;
const totalCount = checks.length;

console.log(`\n📊 Results: ${passCount}/${totalCount} checks passed\n`);

if (passCount === totalCount) {
    console.log('✅ System is ready for deployment!\n');
    process.exit(0);
} else if (passCount >= totalCount * 0.8) {
    console.log('⚠️  System is mostly ready. Some items need attention.\n');
    process.exit(0);
} else {
    console.log('❌ System has critical issues. Please fix them before deployment.\n');
    process.exit(1);
}
