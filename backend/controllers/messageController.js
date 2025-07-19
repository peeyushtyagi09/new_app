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

exports.createMessage = async (req, res) => {
    try {
        const { content, sender } = req.body;
        if (!content || !sender) {
            return res.status(400).json({ error: 'Content and sender are required.' });
        }
        const newMessage = await Message.create({ content, sender });
        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Error creating message:', error);
        res.status(500).json({ error: 'Failed to create message.' });
    }
};

exports.getMessageById = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) {
            return res.status(404).json({ error: 'Message not found.' });
        }
        res.status(200).json(message);
    } catch (error) {
        console.error('Error retrieving message:', error);
        res.status(500).json({ error: 'Failed to retrieve message.' });
    }
};

exports.deleteMessage = async (req, res) => {
    try {
        const deleted = await Message.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: 'Message not found.' });
        }
        res.status(200).json({ message: 'Message deleted.' });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ error: 'Failed to delete message.' });
    }
};