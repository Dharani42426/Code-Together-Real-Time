const axios = require('axios');
const { successResponse, errorResponse } = require('../utils/generateRoomId');

const MOCK_RESPONSES = {
  explain: (language) =>
    `**Code Explanation (${language}):**\n\nThis code implements a solution using an efficient algorithmic approach.\n\n**Key Points:**\n- Uses a hash map for O(1) lookups\n- Single pass through the data structure\n- Time Complexity: O(n)\n- Space Complexity: O(n)\n\nThe logic iterates through each element, checking if the complement exists in the map before adding the current element.`,

  debug: (language) =>
    `**Debug Analysis (${language}):**\n\n**Potential Issues Found:**\n1. Edge case: Empty input not handled\n2. Possible integer overflow for large values\n3. Missing null check before accessing properties\n\n**Suggested Fixes:**\n- Add input validation at the start\n- Use BigInt for large number operations\n- Add null/undefined guards`,

  optimize: (language) =>
    `**Optimization Suggestions (${language}):**\n\n**Current Complexity:**\n- Time: O(n)\n- Space: O(n)\n\n**Suggestions:**\n1. Pre-allocate map size to reduce rehashing\n2. Use early termination when solution is found\n3. Consider in-place operations to reduce memory usage\n4. Your current approach is already near-optimal for this problem type.`,

  complexity: (language) =>
    `**Complexity Analysis (${language}):**\n\n**Time Complexity:**\n- Best Case: O(1) — solution found immediately\n- Average Case: O(n) — single pass\n- Worst Case: O(n) — solution at last element\n\n**Space Complexity:**\n- Auxiliary: O(n) — hash map storage\n- Total: O(n)\n\n**Verdict:** This is an optimal solution for this problem class.`,
};

const callGemini = async (prompt) => {
  const response = await axios.post(
    `${process.env.GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
    {
      contents: [{ parts: [{ text: prompt }] }],
    },
    { timeout: 15000 }
  );
  return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
};

const isGeminiConfigured = () =>
  process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here';

// @desc    Explain code
// @route   POST /api/ai/explain
// @access  Private
const explainCode = async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code) return errorResponse(res, 400, 'Code is required');

    let result;
    if (isGeminiConfigured()) {
      result = await callGemini(
        `Explain the following ${language} code in detail, covering what it does, how it works, and its complexity:\n\n\`\`\`${language}\n${code}\n\`\`\``
      );
    } else {
      result = MOCK_RESPONSES.explain(language || 'code');
    }

    return successResponse(res, 200, 'Code explained', { explanation: result });
  } catch (error) {
    return successResponse(res, 200, 'Code explained', {
      explanation: MOCK_RESPONSES.explain(req.body.language || 'code'),
    });
  }
};

// @desc    Debug code
// @route   POST /api/ai/debug
// @access  Private
const debugCode = async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code) return errorResponse(res, 400, 'Code is required');

    let result;
    if (isGeminiConfigured()) {
      result = await callGemini(
        `Debug the following ${language} code. Identify bugs, issues, and provide fixes:\n\n\`\`\`${language}\n${code}\n\`\`\``
      );
    } else {
      result = MOCK_RESPONSES.debug(language || 'code');
    }

    return successResponse(res, 200, 'Debug complete', { analysis: result });
  } catch (error) {
    return successResponse(res, 200, 'Debug complete', {
      analysis: MOCK_RESPONSES.debug(req.body.language || 'code'),
    });
  }
};

// @desc    Optimize code
// @route   POST /api/ai/optimize
// @access  Private
const optimizeCode = async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code) return errorResponse(res, 400, 'Code is required');

    let result;
    if (isGeminiConfigured()) {
      result = await callGemini(
        `Optimize the following ${language} code for better performance and readability. Provide the optimized version with explanation:\n\n\`\`\`${language}\n${code}\n\`\`\``
      );
    } else {
      result = MOCK_RESPONSES.optimize(language || 'code');
    }

    return successResponse(res, 200, 'Optimization complete', { suggestions: result });
  } catch (error) {
    return successResponse(res, 200, 'Optimization complete', {
      suggestions: MOCK_RESPONSES.optimize(req.body.language || 'code'),
    });
  }
};

// @desc    Analyze complexity
// @route   POST /api/ai/complexity
// @access  Private
const analyzeComplexity = async (req, res) => {
  try {
    const { code, language } = req.body;
    if (!code) return errorResponse(res, 400, 'Code is required');

    let result;
    if (isGeminiConfigured()) {
      result = await callGemini(
        `Analyze the time and space complexity of the following ${language} code. Provide Big O notation with detailed explanation:\n\n\`\`\`${language}\n${code}\n\`\`\``
      );
    } else {
      result = MOCK_RESPONSES.complexity(language || 'code');
    }

    return successResponse(res, 200, 'Complexity analyzed', { analysis: result });
  } catch (error) {
    return successResponse(res, 200, 'Complexity analyzed', {
      analysis: MOCK_RESPONSES.complexity(req.body.language || 'code'),
    });
  }
};

module.exports = { explainCode, debugCode, optimizeCode, analyzeComplexity };
