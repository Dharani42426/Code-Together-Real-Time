const axios = require('axios');
const Submission = require('../models/Submission');
const Problem = require('../models/Problem');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/generateRoomId');

// Judge0 language ID map
const LANGUAGE_IDS = {
  javascript: 63,
  python: 71,
  java: 62,
  cpp: 54,
  c: 50,
  typescript: 74,
  go: 60,
  rust: 73,
  ruby: 72,
  swift: 83,
};

const executeCode = async (language, code, input = '') => {
  const languageId = LANGUAGE_IDS[language.toLowerCase()] || 63;

  if (!process.env.JUDGE0_API_KEY || process.env.JUDGE0_API_KEY === 'your_judge0_rapidapi_key_here') {
    // Mock execution response when Judge0 key is not configured
    return {
      output: `Mock output for ${language}\nInput: ${input || 'none'}\nExecution simulated.`,
      error: '',
      executionTime: '0.08',
      memory: '5120',
      status: 'Accepted',
    };
  }

  try {
    // Submit to Judge0
    const submitRes = await axios.post(
      `${process.env.JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`,
      {
        language_id: languageId,
        source_code: code,
        stdin: input,
      },
      {
        headers: {
          'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
          'X-RapidAPI-Host': process.env.JUDGE0_API_HOST,
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const result = submitRes.data;
    return {
      output: result.stdout || '',
      error: result.stderr || result.compile_output || '',
      executionTime: result.time || '0',
      memory: result.memory || '0',
      status: result.status?.description || 'Unknown',
    };
  } catch (err) {
    return {
      output: '',
      error: 'Code execution service unavailable',
      executionTime: '0',
      memory: '0',
      status: 'Runtime Error',
    };
  }
};

// @desc    Run code (no submission saved)
// @route   POST /api/submissions/run
// @access  Private
const runCode = async (req, res) => {
  try {
    const { language, code, input } = req.body;
    if (!language || !code) return errorResponse(res, 400, 'Language and code are required');

    const result = await executeCode(language, code, input || '');
    return successResponse(res, 200, 'Code executed', result);
  } catch (error) {
    return errorResponse(res, 500, 'Execution failed', error.message);
  }
};

// @desc    Submit solution for a problem
// @route   POST /api/submissions
// @access  Private
const submitSolution = async (req, res) => {
  try {
    const { problemId, code, language } = req.body;
    if (!problemId || !code || !language) {
      return errorResponse(res, 400, 'problemId, code and language are required');
    }

    const problem = await Problem.findById(problemId);
    if (!problem) return errorResponse(res, 404, 'Problem not found');

    // Run against all test cases
    let passed = 0;
    const total = problem.testCases.length;
    let finalStatus = 'Accepted';
    let lastOutput = '';
    let lastError = '';
    let totalTime = 0;

    for (const tc of problem.testCases) {
      const result = await executeCode(language, code, tc.input);
      const actualOutput = result.output.trim();
      const expectedOutput = tc.expectedOutput.trim();

      if (result.error) {
        finalStatus = result.status === 'Compilation Error' ? 'Compilation Error' : 'Runtime Error';
        lastError = result.error;
        break;
      }

      if (actualOutput === expectedOutput) {
        passed++;
      } else {
        finalStatus = 'Wrong Answer';
        lastOutput = actualOutput;
      }

      totalTime += parseFloat(result.executionTime) || 0;
    }

    if (passed === total && finalStatus === 'Accepted') {
      finalStatus = 'Accepted';
    }

    const submission = await Submission.create({
      userId: req.user._id,
      problemId,
      code,
      language,
      status: finalStatus,
      runtime: `${(totalTime / total).toFixed(2)} s`,
      memory: '42 MB',
      testCasesPassed: passed,
      totalTestCases: total,
      output: lastOutput,
      errorMessage: lastError,
    });

    // Update user stats if accepted
    if (finalStatus === 'Accepted') {
      const alreadySolved = await Submission.findOne({
        userId: req.user._id,
        problemId,
        status: 'Accepted',
        _id: { $ne: submission._id },
      });

      if (!alreadySolved) {
        await User.findByIdAndUpdate(req.user._id, {
          $inc: { problemsSolved: 1, score: problem.difficulty === 'Easy' ? 10 : problem.difficulty === 'Medium' ? 25 : 50 },
        });
      }

      // Update problem acceptance stats
      await Problem.findByIdAndUpdate(problemId, {
        $inc: { acceptedSubmissions: 1, totalSubmissions: 1 },
      });
    } else {
      await Problem.findByIdAndUpdate(problemId, { $inc: { totalSubmissions: 1 } });
    }

    return successResponse(res, 201, 'Submission recorded', { submission });
  } catch (error) {
    return errorResponse(res, 500, 'Submission failed', error.message);
  }
};

// @desc    Get submissions by user
// @route   GET /api/submissions/user/:userId
// @access  Private
const getUserSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ userId: req.params.userId })
      .populate('problemId', 'title difficulty')
      .sort({ createdAt: -1 })
      .limit(50);
    return successResponse(res, 200, 'Submissions fetched', { submissions });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch submissions', error.message);
  }
};

// @desc    Get submissions for a problem
// @route   GET /api/submissions/problem/:problemId
// @access  Private
const getProblemSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({
      problemId: req.params.problemId,
      userId: req.user._id,
    })
      .sort({ createdAt: -1 })
      .limit(20);
    return successResponse(res, 200, 'Submissions fetched', { submissions });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch submissions', error.message);
  }
};

module.exports = { runCode, submitSolution, getUserSubmissions, getProblemSubmissions };
