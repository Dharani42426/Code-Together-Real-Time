export const mockUser = {
  id: 'u1',
  name: 'Alex Johnson',
  email: 'alex@codetogether.dev',
  avatar: null,
  initials: 'AJ',
  skills: ['React', 'Node.js', 'Python', 'TypeScript'],
  languages: ['JavaScript', 'Python', 'Java', 'C++'],
  problemsSolved: 142,
  codingHours: 387,
  streak: 14,
  rank: 3,
  score: 4820,
  joinedDate: 'January 2024',
};

export const mockRooms = [
  { id: 'room-abc123', name: 'Algorithm Study Group', language: 'Python', participants: 4, maxParticipants: 8, isPublic: true, owner: 'Alex Johnson', createdAt: '2 hours ago', status: 'active' },
  { id: 'room-def456', name: 'React Interview Prep', language: 'JavaScript', participants: 2, maxParticipants: 4, isPublic: false, owner: 'Sarah Chen', createdAt: '1 day ago', status: 'active' },
  { id: 'room-ghi789', name: 'LeetCode Hard Problems', language: 'C++', participants: 6, maxParticipants: 10, isPublic: true, owner: 'Mike Torres', createdAt: '3 days ago', status: 'idle' },
];

export const mockProblems = [
  { id: 1, title: 'Two Sum', difficulty: 'Easy', acceptance: '49.1%', solved: true, topics: ['Array', 'Hash Table'] },
  { id: 2, title: 'Binary Search', difficulty: 'Easy', acceptance: '55.3%', solved: true, topics: ['Array', 'Binary Search'] },
  { id: 3, title: 'Valid Parentheses', difficulty: 'Easy', acceptance: '40.7%', solved: false, topics: ['String', 'Stack'] },
  { id: 4, title: 'Maximum Subarray', difficulty: 'Medium', acceptance: '50.2%', solved: true, topics: ['Array', 'DP'] },
  { id: 5, title: 'Merge Sorted Array', difficulty: 'Easy', acceptance: '47.8%', solved: false, topics: ['Array', 'Two Pointers'] },
  { id: 6, title: 'Reverse Linked List', difficulty: 'Easy', acceptance: '73.5%', solved: false, topics: ['Linked List', 'Recursion'] },
  { id: 7, title: 'Climbing Stairs', difficulty: 'Easy', acceptance: '52.1%', solved: true, topics: ['DP', 'Math'] },
  { id: 8, title: 'Best Time to Buy Stock', difficulty: 'Easy', acceptance: '54.6%', solved: false, topics: ['Array', 'DP'] },
  { id: 9, title: 'Word Search', difficulty: 'Medium', acceptance: '40.3%', solved: false, topics: ['Array', 'Backtracking'] },
  { id: 10, title: 'Trapping Rain Water', difficulty: 'Hard', acceptance: '60.2%', solved: false, topics: ['Array', 'Two Pointers'] },
];

export const mockProblemDetails = {
  1: {
    title: 'Two Sum',
    difficulty: 'Easy',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.`,
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]', explanation: '' },
    ],
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9', 'Only one valid answer exists.'],
    starterCode: {
      JavaScript: `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    \n};`,
      Python: `class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        pass`,
      Java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}`,
    },
  },
};

export const mockLeaderboard = [
  { rank: 1, name: 'Sarah Chen', initials: 'SC', color: '#58a6ff', problemsSolved: 312, score: 9840, streak: 45 },
  { rank: 2, name: 'Mike Torres', initials: 'MT', color: '#bc8cff', problemsSolved: 287, score: 8920, streak: 32 },
  { rank: 3, name: 'Alex Johnson', initials: 'AJ', color: '#3fb950', problemsSolved: 142, score: 4820, streak: 14, isCurrentUser: true },
  { rank: 4, name: 'Priya Sharma', initials: 'PS', color: '#ffa657', problemsSolved: 198, score: 6340, streak: 28 },
  { rank: 5, name: 'David Kim', initials: 'DK', color: '#f85149', problemsSolved: 176, score: 5670, streak: 19 },
  { rank: 6, name: 'Emma Wilson', initials: 'EW', color: '#d29922', problemsSolved: 154, score: 4980, streak: 11 },
  { rank: 7, name: 'Carlos Ruiz', initials: 'CR', color: '#58a6ff', problemsSolved: 133, score: 4210, streak: 8 },
  { rank: 8, name: 'Yuki Tanaka', initials: 'YT', color: '#bc8cff', problemsSolved: 121, score: 3890, streak: 22 },
];

export const mockParticipants = [
  { id: 'u1', name: 'Alex Johnson', initials: 'AJ', color: '#3fb950', role: 'Owner', online: true },
  { id: 'u2', name: 'Sarah Chen', initials: 'SC', color: '#58a6ff', role: 'Editor', online: true },
  { id: 'u3', name: 'Mike Torres', initials: 'MT', color: '#bc8cff', role: 'Viewer', online: false },
];

export const mockMessages = [
  { id: 1, user: 'Sarah Chen', initials: 'SC', color: '#58a6ff', text: 'Hey! Should we use a hash map for this?', time: '10:32 AM' },
  { id: 2, user: 'Alex Johnson', initials: 'AJ', color: '#3fb950', text: 'Yes, O(n) time complexity that way', time: '10:33 AM' },
  { id: 3, user: 'Sarah Chen', initials: 'SC', color: '#58a6ff', text: 'Perfect, let me write the solution', time: '10:34 AM' },
];

export const mockAIResponses = {
  explain: `**Code Explanation:**\n\nThis function iterates through the array using a hash map to store previously seen values. For each element, it checks if the complement (target - current) exists in the map.\n\n- Time Complexity: O(n)\n- Space Complexity: O(n)`,
  debug: `**Potential Issues Found:**\n\n1. Edge case: Empty array not handled\n2. Consider integer overflow for large values\n3. Missing return statement in some paths\n\n**Suggested Fix:** Add input validation at the start of the function.`,
  optimize: `**Optimization Suggestions:**\n\n1. Use a single-pass hash map instead of two-pass\n2. Early termination when solution is found\n3. Current approach is already optimal at O(n)\n\nYour solution looks good! Minor improvement: pre-allocate map size.`,
  generate: `**Generated Code:**\n\n\`\`\`javascript\nvar twoSum = function(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) {\n      return [map.get(complement), i];\n    }\n    map.set(nums[i], i);\n  }\n};\n\`\`\``,
  timeComplexity: `**Time Complexity Analysis:**\n\n- Best Case: O(1) — solution found at first iteration\n- Average Case: O(n) — single pass through array\n- Worst Case: O(n) — solution at last element\n\nThe hash map lookup is O(1) amortized, making the overall complexity **O(n)**.`,
  spaceComplexity: `**Space Complexity Analysis:**\n\n- Auxiliary Space: O(n) — hash map stores up to n elements\n- Input Space: O(n) — input array\n- Total: **O(n)**\n\nThe space is proportional to the input size due to the hash map.`,
};

export const languages = ['JavaScript', 'Python', 'Java', 'C++', 'C', 'TypeScript', 'Go', 'Rust', 'Ruby', 'Swift'];

export const generateRoomId = () => 'room-' + Math.random().toString(36).substr(2, 8).toUpperCase();

export const activityData = [4, 7, 2, 9, 5, 11, 8, 3, 6, 10, 7, 4, 8, 12, 6, 9, 3, 7, 11, 5, 8, 4, 9, 6, 10, 7, 3, 8, 5, 11];
