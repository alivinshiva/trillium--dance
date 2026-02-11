const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "TrilliumFlowDance",
        resource_type: "video", // Ensure video uploads work
        format: async (req, file) => 'webm', // Default to webm or keep original if possible
        public_id: (req, file) => file.fieldname + "-" + Date.now(),
        transformation: [
            { quality: "auto:best" }
        ]
    }
});

const upload = multer({ storage: storage });

module.exports = { upload, cloudinary };
