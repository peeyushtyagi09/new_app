const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

// Uncomment and use authentication middleware if needed
// const { authenticate } = require('../middleware/authenticate');

// Get all messages
router.get('/', messageController.getMessages);

// Create a new message
router.post('/', messageController.createMessage);

// Get a message by ID
router.get('/:id', messageController.getMessageById);

// Delete a message by ID
router.delete('/:id', messageController.deleteMessage);

module.exports = router;