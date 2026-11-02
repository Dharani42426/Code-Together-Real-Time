const express = require('express');
const router = express.Router();
const {
  getProblems, getProblem, createProblem, updateProblem, deleteProblem, seedProblems,
} = require('../controllers/problemController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', protect, getProblems);
router.get('/:id', protect, getProblem);
router.post('/seed', protect, seedProblems);
router.post('/', protect, adminOnly, createProblem);
router.put('/:id', protect, adminOnly, updateProblem);
router.delete('/:id', protect, adminOnly, deleteProblem);

module.exports = router;
