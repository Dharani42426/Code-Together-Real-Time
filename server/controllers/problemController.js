const Problem = require('../models/Problem');
const { successResponse, errorResponse } = require('../utils/generateRoomId');

// @desc    Get all problems with search and filter
// @route   GET /api/problems
// @access  Private
const getProblems = async (req, res) => {
  try {
    const { search, difficulty, category, page = 1, limit = 20 } = req.query;

    const query = {};

    if (search) {
      query.$text = { $search: search };
    }

    if (difficulty && difficulty !== 'All') {
      query.difficulty = difficulty;
    }

    if (category && category !== 'All') {
      query.category = { $in: [category] };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [problems, total] = await Promise.all([
      Problem.find(query)
        .select('-testCases -starterCode')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Problem.countDocuments(query),
    ]);

    return successResponse(res, 200, 'Problems fetched', {
      problems,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch problems', error.message);
  }
};

// @desc    Get single problem by ID
// @route   GET /api/problems/:id
// @access  Private
const getProblem = async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) return errorResponse(res, 404, 'Problem not found');

    // Only return visible test cases
    const visibleTestCases = problem.testCases.filter((tc) => !tc.isHidden);

    return successResponse(res, 200, 'Problem fetched', {
      problem: { ...problem.toObject(), testCases: visibleTestCases },
    });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch problem', error.message);
  }
};

// @desc    Create problem (admin only)
// @route   POST /api/problems
// @access  Private/Admin
const createProblem = async (req, res) => {
  try {
    const problem = await Problem.create({ ...req.body, createdBy: req.user._id });
    return successResponse(res, 201, 'Problem created', { problem });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to create problem', error.message);
  }
};

// @desc    Update problem (admin only)
// @route   PUT /api/problems/:id
// @access  Private/Admin
const updateProblem = async (req, res) => {
  try {
    const problem = await Problem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!problem) return errorResponse(res, 404, 'Problem not found');
    return successResponse(res, 200, 'Problem updated', { problem });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to update problem', error.message);
  }
};

// @desc    Delete problem (admin only)
// @route   DELETE /api/problems/:id
// @access  Private/Admin
const deleteProblem = async (req, res) => {
  try {
    const problem = await Problem.findByIdAndDelete(req.params.id);
    if (!problem) return errorResponse(res, 404, 'Problem not found');
    return successResponse(res, 200, 'Problem deleted');
  } catch (error) {
    return errorResponse(res, 500, 'Failed to delete problem', error.message);
  }
};

// @desc    Seed default problems
// @route   POST /api/problems/seed
// @access  Private/Admin
const seedProblems = async (req, res) => {
  try {
    const count = await Problem.countDocuments();
    if (count > 0) {
      return successResponse(res, 200, 'Problems already seeded', { count });
    }

    const problems = [
      {
        title: 'Two Sum',
        difficulty: 'Easy',
        description:
          'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
        category: ['Array', 'Hash Table'],
        examples: [
          { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'nums[0] + nums[1] == 9' },
          { input: 'nums = [3,2,4], target = 6', output: '[1,2]', explanation: '' },
        ],
        constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', 'Only one valid answer exists.'],
        testCases: [
          { input: '[2,7,11,15]\n9', expectedOutput: '[0,1]' },
          { input: '[3,2,4]\n6', expectedOutput: '[1,2]', isHidden: true },
        ],
        starterCode: {
          javascript: 'var twoSum = function(nums, target) {\n    \n};',
          python: 'class Solution:\n    def twoSum(self, nums, target):\n        pass',
          java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}',
        },
        acceptance: '49.1%',
      },
      {
        title: 'Binary Search',
        difficulty: 'Easy',
        description:
          'Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.',
        category: ['Array', 'Binary Search'],
        examples: [
          { input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4', explanation: '9 exists at index 4' },
        ],
        constraints: ['1 <= nums.length <= 10^4', 'All integers in nums are unique.'],
        testCases: [
          { input: '[-1,0,3,5,9,12]\n9', expectedOutput: '4' },
          { input: '[1,3,5,7,9]\n3', expectedOutput: '1', isHidden: true },
        ],
        starterCode: {
          javascript: 'var search = function(nums, target) {\n    \n};',
          python: 'class Solution:\n    def search(self, nums, target):\n        pass',
          java: 'class Solution {\n    public int search(int[] nums, int target) {\n        \n    }\n}',
        },
        acceptance: '55.3%',
      },
      {
        title: 'Valid Parentheses',
        difficulty: 'Easy',
        description:
          "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
        category: ['String', 'Stack'],
        examples: [
          { input: 's = "()"', output: 'true', explanation: '' },
          { input: 's = "()[]{}"', output: 'true', explanation: '' },
          { input: 's = "(]"', output: 'false', explanation: '' },
        ],
        constraints: ['1 <= s.length <= 10^4', "s consists of parentheses only '()[]{}'."],
        testCases: [
          { input: '()', expectedOutput: 'true' },
          { input: '(]', expectedOutput: 'false', isHidden: true },
        ],
        starterCode: {
          javascript: 'var isValid = function(s) {\n    \n};',
          python: 'class Solution:\n    def isValid(self, s):\n        pass',
          java: 'class Solution {\n    public boolean isValid(String s) {\n        \n    }\n}',
        },
        acceptance: '40.7%',
      },
      {
        title: 'Maximum Subarray',
        difficulty: 'Medium',
        description:
          'Given an integer array nums, find the subarray with the largest sum, and return its sum.',
        category: ['Array', 'Dynamic Programming'],
        examples: [
          { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: 'Subarray [4,-1,2,1] has the largest sum 6.' },
        ],
        constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
        testCases: [
          { input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6' },
          { input: '[1]', expectedOutput: '1', isHidden: true },
        ],
        starterCode: {
          javascript: 'var maxSubArray = function(nums) {\n    \n};',
          python: 'class Solution:\n    def maxSubArray(self, nums):\n        pass',
          java: 'class Solution {\n    public int maxSubArray(int[] nums) {\n        \n    }\n}',
        },
        acceptance: '50.2%',
      },
      {
        title: 'Merge Sorted Array',
        difficulty: 'Easy',
        description:
          'You are given two integer arrays nums1 and nums2, sorted in non-decreasing order, and two integers m and n, representing the number of elements in nums1 and nums2 respectively. Merge nums1 and nums2 into a single array sorted in non-decreasing order.',
        category: ['Array', 'Two Pointers'],
        examples: [
          { input: 'nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3', output: '[1,2,2,3,5,6]', explanation: '' },
        ],
        constraints: ['nums1.length == m + n', '0 <= m, n <= 200'],
        testCases: [
          { input: '[1,2,3,0,0,0]\n3\n[2,5,6]\n3', expectedOutput: '[1,2,2,3,5,6]' },
        ],
        starterCode: {
          javascript: 'var merge = function(nums1, m, nums2, n) {\n    \n};',
          python: 'class Solution:\n    def merge(self, nums1, m, nums2, n):\n        pass',
          java: 'class Solution {\n    public void merge(int[] nums1, int m, int[] nums2, int n) {\n        \n    }\n}',
        },
        acceptance: '47.8%',
      },
      {
        title: 'Reverse Linked List',
        difficulty: 'Easy',
        description: 'Given the head of a singly linked list, reverse the list, and return the reversed list.',
        category: ['Linked List', 'Recursion'],
        examples: [
          { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]', explanation: '' },
        ],
        constraints: ['The number of nodes in the list is in the range [0, 5000].'],
        testCases: [
          { input: '[1,2,3,4,5]', expectedOutput: '[5,4,3,2,1]' },
        ],
        starterCode: {
          javascript: 'var reverseList = function(head) {\n    \n};',
          python: 'class Solution:\n    def reverseList(self, head):\n        pass',
          java: 'class Solution {\n    public ListNode reverseList(ListNode head) {\n        \n    }\n}',
        },
        acceptance: '73.5%',
      },
    ];

    await Problem.insertMany(problems);
    return successResponse(res, 201, 'Problems seeded successfully', { count: problems.length });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to seed problems', error.message);
  }
};

module.exports = { getProblems, getProblem, createProblem, updateProblem, deleteProblem, seedProblems };
