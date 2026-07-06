const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const { verifyToken } = require('../middlewares/authMiddleware');

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
});

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

router.get('/', async (req, res) => {
    try {
        const { role } = req.query;
        const filter = {};

        if (role) {
            filter.role = role;
        }

        const users = await User.find(filter).select('name email role cpf plan consultationsLeft createdAt profilePhoto');
        res.json(users);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('name email role cpf plan consultationsLeft professionalId profilePhoto');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.post('/profile-photo', verifyToken, upload.single('photo'), async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (!req.file) {
            return res.status(400).json({ error: 'No photo uploaded' });
        }

        if (user.profilePhoto?.publicId) {
            const previousPath = path.join(uploadDir, user.profilePhoto.publicId);
            if (previousPath.startsWith(uploadDir) && fs.existsSync(previousPath)) {
                fs.unlinkSync(previousPath);
            }
        }

        const photoUrl = `${req.protocol}://${req.get('host')}/uploads/profile-photos/${req.file.filename}`;
        user.profilePhoto = {
            url: photoUrl,
            publicId: req.file.filename,
            updatedAt: new Date(),
        };
        user.image = photoUrl;
        await user.save();

        res.json({ success: true, user: serializeUser(user) });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/profile-photo', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.profilePhoto?.publicId) {
            const existingPath = path.join(uploadDir, user.profilePhoto.publicId);
            if (existingPath.startsWith(uploadDir) && fs.existsSync(existingPath)) {
                fs.unlinkSync(existingPath);
            }
        }

        user.profilePhoto = null;
        user.image = null;
        await user.save();

        res.json({ success: true, user: serializeUser(user) });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
