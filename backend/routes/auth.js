const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const https = require('https');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const User = require('../models/User');
const Professional = require('../models/Professional');
const authController = require('../controllers/authController');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads', 'profile-photos');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        cb(null, name);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error('Only JPG, JPEG, PNG files are allowed'));
        }
        cb(null, true);
    }
});

// Helper to generate JWT
const generateToken = (user) => {
    return jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
};

const serializeUser = (user) => ({
    _id: user._id,
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    cpf: user.cpf,
    professionalId: user.professionalId,
    image: user.profilePhoto?.url || user.image || null,
    profilePhoto: user.profilePhoto || null,
    plan: user.plan,
    consultationsLeft: user.consultationsLeft,
    createdAt: user.createdAt,
});

// Verify JWT token for protected routes
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });
    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = verified;
        next();
    } catch (err) {
        console.error('❌ Token verification failed:', err.message);
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired. Please login again.' });
        }
        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token. Please login again.' });
        }
        res.status(401).json({ error: 'Token verification failed. Please login again.' });
    }
};

// Register - return token + user
router.post('/register', async (req, res) => {
    const { name, email, password, role, cpf, specialty } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    try {
        const existingEmail = await User.findOne({ email: normalizedEmail });
        if (existingEmail) return res.status(409).json({ error: 'Email already in use' });

        if (cpf) {
            const existingCPF = await User.findOne({ cpf });
            if (existingCPF) return res.status(409).json({ error: 'CPF já cadastrado' });
        }

        let hashedPassword = null;
        if (password) hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({ name, email: normalizedEmail, password: hashedPassword, role, cpf });
        await user.save();

        // If registering as professional, create Professional document
        if (role === 'professional') {
            const professional = new Professional({
                name,
                email,
                specialty: specialty || 'Especialista',
                rating: 5,
                price: 'Premium',
                image: 'https://i.pravatar.cc/150?img=12',
                availability: 'Disponível',
                clients: [],
                balance: 0,
            });
            await professional.save();
            user.professionalId = professional._id;
            await user.save();
        } else if (role === 'patient') {
            // Do not auto-associate patients on registration. Patient will connect manually.
        }

        const token = generateToken(user);
        res.status(201).json({ token, user: serializeUser(user) });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Password reset request
router.post('/forgot-password', authController.forgotPassword);
router.post('/password-reset-request', authController.forgotPassword);

// Reset password with token
router.post('/reset-password', authController.resetPassword);
router.post('/password-reset', authController.resetPassword);

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    try {
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        if (user.password) {
            const match = await bcrypt.compare(password, user.password);
            if (!match) return res.status(401).json({ error: 'Invalid credentials' });
        } else {
            // User exists but has no password (e.g., created via Google)
            return res.status(401).json({ error: 'Use Google login for this account' });
        }

        // Do not auto-link patients on login. Connections are created explicitly on subscription or connect flow.

        if (user.role === 'professional' && !user.professionalId) {
            const professional = await Professional.findOne({ email: user.email });
            if (professional) {
                user.professionalId = professional._id;
                await user.save();
            }
        }

        const token = generateToken(user);
        res.json({ token, user: serializeUser(user) });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.get('/me', verifyToken, async (req, res) => {
    try {
        let user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.role === 'professional' && !user.professionalId) {
            const professional = await Professional.findOne({ email: user.email });
            if (professional) {
                user.professionalId = professional._id;
                await user.save();
            }
        }

        res.json(serializeUser(user));
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update current user's profile (name, image, etc.)
router.put('/me', verifyToken, upload.single('image'), async (req, res) => {
    try {
        const updates = req.body || {};
        const allowed = ['name'];
        const toUpdate = {};

        const removeImage = updates.removeImage === 'true' || updates.removeImage === true;
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (removeImage && (user.image || user.profilePhoto?.publicId)) {
            const existingFilename = user.profilePhoto?.publicId || user.image?.split('/').pop();
            const existingPath = path.join(uploadDir, existingFilename);
            if (existingPath.startsWith(uploadDir) && fs.existsSync(existingPath)) {
                fs.unlinkSync(existingPath);
            }
            toUpdate.image = null;
            toUpdate.profilePhoto = null;
        }

        if (req.file) {
            const previousPublicId = user.profilePhoto?.publicId || user.image?.split('/').pop();
            if (previousPublicId) {
                const previousPath = path.join(uploadDir, previousPublicId);
                if (previousPath.startsWith(uploadDir) && fs.existsSync(previousPath)) {
                    fs.unlinkSync(previousPath);
                }
            }
            const photoUrl = `${req.protocol}://${req.get('host')}/uploads/profile-photos/${req.file.filename}`;
            toUpdate.profilePhoto = {
                url: photoUrl,
                publicId: req.file.filename,
                updatedAt: new Date(),
            };
            toUpdate.image = photoUrl;
        }

        allowed.forEach((k) => { if (updates[k] !== undefined) toUpdate[k] = updates[k]; });

        const updatedUser = await User.findByIdAndUpdate(req.user.id, { $set: toUpdate }, { new: true });
        res.json(serializeUser(updatedUser));
    } catch (err) {
        console.error('Error updating profile:', err);
        const message = err.message?.includes('Only JPG') ? err.message : 'Failed to update profile';
        res.status(400).json({ error: message });
    }
});

// Google mobile: verify idToken with Google's tokeninfo endpoint
router.post('/google/mobile', async (req, res) => {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: 'idToken is required' });

    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`;

    https.get(url, (resp) => {
        let data = '';
        resp.on('data', (chunk) => { data += chunk; });
        resp.on('end', async () => {
            try {
                const payload = JSON.parse(data);

                const validGoogleClientIds = [
                    process.env.GOOGLE_CLIENT_ID,
                    process.env.GOOGLE_WEB_CLIENT_ID,
                    process.env.GOOGLE_EXPO_CLIENT_ID,
                    process.env.GOOGLE_ANDROID_CLIENT_ID,
                    process.env.GOOGLE_IOS_CLIENT_ID,
                ].filter(Boolean);

                console.log('Google idToken audience:', payload.aud);
                console.log('Configured Google valid audiences:', validGoogleClientIds);

                if (!validGoogleClientIds.length) {
                    return res.status(500).json({ error: 'Google client IDs are not configured on the backend' });
                }

                if (!validGoogleClientIds.includes(payload.aud)) {
                    return res.status(401).json({ error: 'Invalid Google client ID' });
                }

                const email = payload.email;
                const name = payload.name || payload.email.split('@')[0];
                const googleId = payload.sub;

                let user = await User.findOne({ email });
                const isNewUser = !user;

                if (!user) {
                    user = new User({ name, email, googleId, role: 'patient' });
                    await user.save();
                } else if (!user.googleId) {
                    user.googleId = googleId;
                    await user.save();
                }

                // Do not auto-link patients on Google login. Connections should be explicit or created via a subscription.
                if (user.role === 'patient') {
                    // preserve existing professionalId if already associated
                }

                const token = generateToken(user);
                return res.json({
                    token,
                    user: {
                        _id: user._id,
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        cpf: user.cpf,
                        professionalId: user.professionalId,
                        plan: user.plan,
                        consultationsLeft: user.consultationsLeft
                    }
                });
            } catch (e) {
                return res.status(400).json({ error: 'Invalid token payload' });
            }
        });
    }).on('error', (err) => {
        return res.status(500).json({ error: 'Failed to verify token' });
    });
});

// Admin: cleanup test users (development only - should require special permission)
router.delete('/admin/cleanup-test-users', verifyToken, async (req, res) => {
    try {
        // Only allow if user is admin or in development mode
        const isDev = process.env.NODE_ENV === 'development' || process.env.ALLOW_CLEANUP === 'true';
        if (!isDev && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const testEmails = [
            'test@example.com',
            'test2@example.com',
            'test16@example.com',
            'test@test.com',
            'joao@example.com',
            'joao2@test.com',
            'joao5@test.com',
            'joao.teste@conectasaude.com',
            'maria.teste@conectasaude.com',
            'pedro.teste@conectasaude.com',
        ];

        const result = await User.deleteMany({
            email: { $in: testEmails.map(e => new RegExp(`^${e}$`, 'i')) }
        });

        res.json({
            message: 'Test users cleaned up successfully',
            deletedCount: result.deletedCount
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;