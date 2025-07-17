const Message = require('../models/Message');

exports.getMessages = async (req, res) => {
    try {
        // Optionally, filter by chatId or room if needed: e.g., { room: req.query.room }
        const messages = await Message.find().sort({ timestamp: 1 }).lean();
        res.status(200).json(messages);
    } catch (error) {
        console.error('Error retrieving messages:', error);
        res.status(500).json({ error: 'Failed to retrieve messages.' });
    }
};