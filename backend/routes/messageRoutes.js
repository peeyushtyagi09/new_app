const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');

// Add validation or authentication middleware here if needed
// Example: const { authenticate } = require('../middleware/authenticate');

// Get all messages
router.get('/', /* authenticate, */ messageController.getMessages);

// You can add more routes as needed, e.g.:
// router.post('/', messageController.createMessage);
// router.get('/:id', messageController.getMessageById);
// router.delete('/:id', messageController.deleteMessage);

module.exports = router;