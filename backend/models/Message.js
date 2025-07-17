const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        trim: true
    },
    sender: {
        type: String,
        required: true,
        trim: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        immutable: true
    }
});

// Prevent model overwrite in watch mode or testing
module.exports = mongoose.models.Message || mongoose.model('Message', messageSchema);