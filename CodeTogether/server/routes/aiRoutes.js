const express = require('express');
const router = express.Router();
const { explainCode, debugCode, optimizeCode, analyzeComplexity } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/explain', protect, explainCode);
router.post('/debug', protect, debugCode);
router.post('/optimize', protect, optimizeCode);
router.post('/complexity', protect, analyzeComplexity);

module.exports = router;
