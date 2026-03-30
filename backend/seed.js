import { Problem } from "./models/problem.model.js";
import { TestCase } from "./models/testCase.model.js";
import env from "./utils/env.js";
import mongoose from "mongoose";
import dns from "dns";

dns.setServers(["1.1.1.1", "8.8.8.8"]);

const problemsData = [
  {
    title: "Two Sum",
    slug: "two-sum",
    order: 1,
    description:
      "Given an array of integers `nums` and an integer `target`, return *indices of the two numbers such that they add up to `target`*.\n\nYou may assume that each input would have **exactly one solution**, and you may not use the same element twice.\n\nYou can return the answer in any order.",
    difficulty: "Easy",
    topicTags: ["Array", "Hash Table"],
    companyTags: ["Google", "Amazon", "Meta", "Microsoft", "Apple"],
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists.",
    ],
    hints: [
      "A brute force approach would be to check every pair of numbers. Can you do better?",
      "Try using a hash map to store the complement of each number as you iterate.",
    ],
    editorial:
      "**Approach 1: Brute Force** — Check every pair O(n²).\n\n**Approach 2: Hash Map** — For each element, check if `target - nums[i]` exists in the map. If yes, return indices. Otherwise, store `nums[i]` with its index. Time: O(n), Space: O(n).",
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
      },
      {
        input: "nums = [3,2,4], target = 6",
        output: "[1,2]",
        explanation: "",
      },
      {
        input: "nums = [3,3], target = 6",
        output: "[0,1]",
        explanation: "",
      },
    ],
    starterCode: [
      {
        languageId: 63,
        language: "javascript",
        code: "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    // Write your code here\n};",
      },
      {
        languageId: 62,
        language: "java",
        code: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your code here\n    }\n}",
      },
      {
        languageId: 54,
        language: "cpp",
        code: "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your code here\n    }\n};",
      },
      {
        languageId: 71,
        language: "python",
        code: "class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        # Write your code here\n        pass",
      },
    ],
    testCases: [
      { input: "nums = [2,7,11,15], target = 9", expectedOutput: "[0,1]", isHidden: false, explanation: "nums[0] + nums[1] = 2 + 7 = 9" },
      { input: "nums = [3,2,4], target = 6", expectedOutput: "[1,2]", isHidden: false, explanation: "" },
      { input: "nums = [3,3], target = 6", expectedOutput: "[0,1]", isHidden: false, explanation: "" },
      { input: "nums = [1,5,3,7,2], target = 8", expectedOutput: "[0,3]", isHidden: true, explanation: "" },
      { input: "nums = [-1,-2,-3,-4,-5], target = -8", expectedOutput: "[2,4]", isHidden: true, explanation: "" },
      { input: "nums = [0,4,3,0], target = 0", expectedOutput: "[0,3]", isHidden: true, explanation: "" },
    ],
  },
  {
    title: "Reverse String",
    slug: "reverse-string",
    order: 2,
    description:
      'Write a function that reverses a string. The input string is given as an array of characters `s`.\n\nYou must do this by modifying the input array **in-place** with `O(1)` extra memory.',
    difficulty: "Easy",
    topicTags: ["Two Pointers", "String"],
    companyTags: ["Amazon", "Microsoft", "Apple"],
    constraints: [
      "1 <= s.length <= 10^5",
      "s[i] is a printable ASCII character.",
    ],
    hints: [
      "Use two pointers, one at the start and one at the end.",
    ],
    editorial:
      "**Two Pointer Approach** — Swap `s[left]` and `s[right]`, then move pointers inward. Time: O(n), Space: O(1).",
    examples: [
      {
        input: 's = ["h","e","l","l","o"]',
        output: '["o","l","l","e","h"]',
        explanation: "",
      },
      {
        input: 's = ["H","a","n","n","a","h"]',
        output: '["h","a","n","n","a","H"]',
        explanation: "",
      },
    ],
    starterCode: [
      {
        languageId: 63,
        language: "javascript",
        code: "/**\n * @param {character[]} s\n * @return {void} Do not return anything, modify s in-place instead.\n */\nvar reverseString = function(s) {\n    // Write your code here\n};",
      },
      {
        languageId: 62,
        language: "java",
        code: "class Solution {\n    public void reverseString(char[] s) {\n        // Write your code here\n    }\n}",
      },
      {
        languageId: 54,
        language: "cpp",
        code: "class Solution {\npublic:\n    void reverseString(vector<char>& s) {\n        // Write your code here\n    }\n};",
      },
      {
        languageId: 71,
        language: "python",
        code: 'class Solution:\n    def reverseString(self, s: list[str]) -> None:\n        """\n        Do not return anything, modify s in-place instead.\n        """\n        # Write your code here\n        pass',
      },
    ],
    testCases: [
      { input: 's = ["h","e","l","l","o"]', expectedOutput: '["o","l","l","e","h"]', isHidden: false, explanation: "" },
      { input: 's = ["H","a","n","n","a","h"]', expectedOutput: '["h","a","n","n","a","H"]', isHidden: false, explanation: "" },
      { input: 's = ["a"]', expectedOutput: '["a"]', isHidden: true, explanation: "" },
      { input: 's = ["A","b"]', expectedOutput: '["b","A"]', isHidden: true, explanation: "" },
    ],
  },
  {
    title: "Palindrome Number",
    slug: "palindrome-number",
    order: 3,
    description:
      "Given an integer `x`, return `true` *if* `x` *is a palindrome*, *and* `false` *otherwise*.\n\nAn integer is a **palindrome** when it reads the same forward and backward.\n\n- For example, `121` is a palindrome while `123` is not.",
    difficulty: "Easy",
    topicTags: ["Math"],
    companyTags: ["Amazon", "Bloomberg", "Adobe"],
    constraints: ["-2^31 <= x <= 2^31 - 1"],
    hints: [
      "Negative numbers are never palindromes.",
      "Could you solve it without converting the integer to a string?",
    ],
    editorial:
      "**Approach 1: String conversion** — Convert to string, reverse, compare.\n\n**Approach 2: Math** — Reverse half of the number. Compare the reversed half with the remaining half. Time: O(log n), Space: O(1).",
    examples: [
      { input: "x = 121", output: "true", explanation: "121 reads as 121 from left to right and from right to left." },
      { input: "x = -121", output: "false", explanation: "From left to right, it reads -121. From right to left it becomes 121-. Therefore it is not a palindrome." },
      { input: "x = 10", output: "false", explanation: "Reads 01 from right to left. Therefore it is not a palindrome." },
    ],
    starterCode: [
      {
        languageId: 63,
        language: "javascript",
        code: "/**\n * @param {number} x\n * @return {boolean}\n */\nvar isPalindrome = function(x) {\n    // Write your code here\n};",
      },
      {
        languageId: 62,
        language: "java",
        code: "class Solution {\n    public boolean isPalindrome(int x) {\n        // Write your code here\n    }\n}",
      },
      {
        languageId: 54,
        language: "cpp",
        code: "class Solution {\npublic:\n    bool isPalindrome(int x) {\n        // Write your code here\n    }\n};",
      },
      {
        languageId: 71,
        language: "python",
        code: "class Solution:\n    def isPalindrome(self, x: int) -> bool:\n        # Write your code here\n        pass",
      },
    ],
    testCases: [
      { input: "x = 121", expectedOutput: "true", isHidden: false, explanation: "121 is a palindrome" },
      { input: "x = -121", expectedOutput: "false", isHidden: false, explanation: "Negative numbers are not palindromes" },
      { input: "x = 10", expectedOutput: "false", isHidden: false, explanation: "" },
      { input: "x = 0", expectedOutput: "true", isHidden: true, explanation: "" },
      { input: "x = 12321", expectedOutput: "true", isHidden: true, explanation: "" },
      { input: "x = 1000021", expectedOutput: "false", isHidden: true, explanation: "" },
    ],
  },
  {
    title: "Valid Parentheses",
    slug: "valid-parentheses",
    order: 4,
    description:
      "Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
    difficulty: "Easy",
    topicTags: ["String", "Stack"],
    companyTags: ["Google", "Amazon", "Meta", "Microsoft", "Bloomberg"],
    constraints: [
      "1 <= s.length <= 10^4",
      "s consists of parentheses only '()[]{}'.",
    ],
    hints: [
      "Use a stack. Push opening brackets, pop on closing brackets and check if they match.",
      "If the stack is empty at the end, the string is valid.",
    ],
    editorial:
      "**Stack Approach** — Iterate through each character. If opening bracket, push to stack. If closing bracket, pop from stack and check if it matches. At the end, stack should be empty. Time: O(n), Space: O(n).",
    examples: [
      { input: 's = "()"', output: "true", explanation: "" },
      { input: 's = "()[]{}"', output: "true", explanation: "" },
      { input: 's = "(]"', output: "false", explanation: "" },
    ],
    starterCode: [
      {
        languageId: 63,
        language: "javascript",
        code: "/**\n * @param {string} s\n * @return {boolean}\n */\nvar isValid = function(s) {\n    // Write your code here\n};",
      },
      {
        languageId: 62,
        language: "java",
        code: "class Solution {\n    public boolean isValid(String s) {\n        // Write your code here\n    }\n}",
      },
      {
        languageId: 54,
        language: "cpp",
        code: "class Solution {\npublic:\n    bool isValid(string s) {\n        // Write your code here\n    }\n};",
      },
      {
        languageId: 71,
        language: "python",
        code: "class Solution:\n    def isValid(self, s: str) -> bool:\n        # Write your code here\n        pass",
      },
    ],
    testCases: [
      { input: 's = "()"', expectedOutput: "true", isHidden: false, explanation: "" },
      { input: 's = "()[]{}"', expectedOutput: "true", isHidden: false, explanation: "" },
      { input: 's = "(]"', expectedOutput: "false", isHidden: false, explanation: "" },
      { input: 's = "([)]"', expectedOutput: "false", isHidden: true, explanation: "" },
      { input: 's = "{[]}"', expectedOutput: "true", isHidden: true, explanation: "" },
      { input: 's = ""', expectedOutput: "true", isHidden: true, explanation: "" },
      { input: 's = "((("', expectedOutput: "false", isHidden: true, explanation: "" },
    ],
  },
  {
    title: "Best Time to Buy and Sell Stock",
    slug: "best-time-to-buy-and-sell-stock",
    order: 5,
    description:
      "You are given an array `prices` where `prices[i]` is the price of a given stock on the `i`th day.\n\nYou want to maximize your profit by choosing a **single day** to buy one stock and choosing a **different day in the future** to sell that stock.\n\nReturn *the maximum profit you can achieve from this transaction*. If you cannot achieve any profit, return `0`.",
    difficulty: "Easy",
    topicTags: ["Array", "Dynamic Programming"],
    companyTags: ["Amazon", "Google", "Meta", "Microsoft", "Goldman Sachs"],
    constraints: [
      "1 <= prices.length <= 10^5",
      "0 <= prices[i] <= 10^4",
    ],
    hints: [
      "Track the minimum price seen so far.",
      "At each step, calculate potential profit = current price - min price. Keep the maximum.",
    ],
    editorial:
      "**One Pass** — Keep track of the minimum price so far and the maximum profit so far. For each price, update `minPrice = min(minPrice, price)` and `maxProfit = max(maxProfit, price - minPrice)`. Time: O(n), Space: O(1).",
    examples: [
      {
        input: "prices = [7,1,5,3,6,4]",
        output: "5",
        explanation: "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.",
      },
      {
        input: "prices = [7,6,4,3,1]",
        output: "0",
        explanation: "In this case, no transactions are done and the max profit = 0.",
      },
    ],
    starterCode: [
      {
        languageId: 63,
        language: "javascript",
        code: "/**\n * @param {number[]} prices\n * @return {number}\n */\nvar maxProfit = function(prices) {\n    // Write your code here\n};",
      },
      {
        languageId: 62,
        language: "java",
        code: "class Solution {\n    public int maxProfit(int[] prices) {\n        // Write your code here\n    }\n}",
      },
      {
        languageId: 54,
        language: "cpp",
        code: "class Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        // Write your code here\n    }\n};",
      },
      {
        languageId: 71,
        language: "python",
        code: "class Solution:\n    def maxProfit(self, prices: list[int]) -> int:\n        # Write your code here\n        pass",
      },
    ],
    testCases: [
      { input: "prices = [7,1,5,3,6,4]", expectedOutput: "5", isHidden: false, explanation: "Buy at 1, sell at 6" },
      { input: "prices = [7,6,4,3,1]", expectedOutput: "0", isHidden: false, explanation: "No profit possible" },
      { input: "prices = [2,4,1]", expectedOutput: "2", isHidden: true, explanation: "" },
      { input: "prices = [1,2]", expectedOutput: "1", isHidden: true, explanation: "" },
      { input: "prices = [2,1,4]", expectedOutput: "3", isHidden: true, explanation: "" },
    ],
  },
  {
    title: "Maximum Subarray",
    slug: "maximum-subarray",
    order: 6,
    description:
      "Given an integer array `nums`, find the subarray with the largest sum, and return *its sum*.\n\nA **subarray** is a contiguous non-empty sequence of elements within an array.",
    difficulty: "Medium",
    topicTags: ["Array", "Divide and Conquer", "Dynamic Programming"],
    companyTags: ["Amazon", "Google", "Microsoft", "Apple", "LinkedIn"],
    constraints: [
      "1 <= nums.length <= 10^5",
      "-10^4 <= nums[i] <= 10^4",
    ],
    hints: [
      "Think about Kadane's algorithm.",
      "At each position, decide whether to extend the current subarray or start a new one.",
    ],
    editorial:
      "**Kadane's Algorithm** — Maintain a running sum `currentSum`. At each element, `currentSum = max(nums[i], currentSum + nums[i])`. Track the global maximum. Time: O(n), Space: O(1).",
    examples: [
      {
        input: "nums = [-2,1,-3,4,-1,2,1,-5,4]",
        output: "6",
        explanation: "The subarray [4,-1,2,1] has the largest sum 6.",
      },
      { input: "nums = [1]", output: "1", explanation: "The subarray [1] has the largest sum 1." },
      {
        input: "nums = [5,4,-1,7,8]",
        output: "23",
        explanation: "The subarray [5,4,-1,7,8] has the largest sum 23.",
      },
    ],
    starterCode: [
      {
        languageId: 63,
        language: "javascript",
        code: "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar maxSubArray = function(nums) {\n    // Write your code here\n};",
      },
      {
        languageId: 62,
        language: "java",
        code: "class Solution {\n    public int maxSubArray(int[] nums) {\n        // Write your code here\n    }\n}",
      },
      {
        languageId: 54,
        language: "cpp",
        code: "class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        // Write your code here\n    }\n};",
      },
      {
        languageId: 71,
        language: "python",
        code: "class Solution:\n    def maxSubArray(self, nums: list[int]) -> int:\n        # Write your code here\n        pass",
      },
    ],
    testCases: [
      { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", expectedOutput: "6", isHidden: false, explanation: "[4,-1,2,1] = 6" },
      { input: "nums = [1]", expectedOutput: "1", isHidden: false, explanation: "" },
      { input: "nums = [5,4,-1,7,8]", expectedOutput: "23", isHidden: false, explanation: "" },
      { input: "nums = [-1]", expectedOutput: "-1", isHidden: true, explanation: "" },
      { input: "nums = [-2,-1]", expectedOutput: "-1", isHidden: true, explanation: "" },
      { input: "nums = [1,2,3,4,5]", expectedOutput: "15", isHidden: true, explanation: "" },
    ],
  },
  {
    title: "Merge Two Sorted Lists",
    slug: "merge-two-sorted-lists",
    order: 7,
    description:
      "You are given the heads of two sorted linked lists `list1` and `list2`.\n\nMerge the two lists into one **sorted** list. The list should be made by splicing together the nodes of the first two lists.\n\nReturn *the head of the merged linked list*.",
    difficulty: "Easy",
    topicTags: ["Linked List", "Recursion"],
    companyTags: ["Amazon", "Google", "Microsoft", "Apple"],
    constraints: [
      "The number of nodes in both lists is in the range [0, 50].",
      "-100 <= Node.val <= 100",
      "Both list1 and list2 are sorted in non-decreasing order.",
    ],
    hints: [
      "Compare the heads of both lists and pick the smaller one.",
      "You can solve this iteratively or recursively.",
    ],
    editorial:
      "**Iterative** — Use a dummy head. Compare nodes from both lists, attach the smaller one. Move that pointer forward. Time: O(n+m), Space: O(1).\n\n**Recursive** — If list1.val < list2.val, list1.next = merge(list1.next, list2). Otherwise swap.",
    examples: [
      {
        input: "list1 = [1,2,4], list2 = [1,3,4]",
        output: "[1,1,2,3,4,4]",
        explanation: "",
      },
      { input: "list1 = [], list2 = []", output: "[]", explanation: "" },
      { input: "list1 = [], list2 = [0]", output: "[0]", explanation: "" },
    ],
    starterCode: [
      {
        languageId: 63,
        language: "javascript",
        code: "/**\n * Definition for singly-linked list.\n * function ListNode(val, next) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.next = (next===undefined ? null : next)\n * }\n */\n/**\n * @param {ListNode} list1\n * @param {ListNode} list2\n * @return {ListNode}\n */\nvar mergeTwoLists = function(list1, list2) {\n    // Write your code here\n};",
      },
      {
        languageId: 62,
        language: "java",
        code: "/**\n * Definition for singly-linked list.\n * public class ListNode {\n *     int val;\n *     ListNode next;\n *     ListNode() {}\n *     ListNode(int val) { this.val = val; }\n *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }\n * }\n */\nclass Solution {\n    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {\n        // Write your code here\n    }\n}",
      },
      {
        languageId: 54,
        language: "cpp",
        code: "/**\n * Definition for singly-linked list.\n * struct ListNode {\n *     int val;\n *     ListNode *next;\n *     ListNode() : val(0), next(nullptr) {}\n *     ListNode(int x) : val(x), next(nullptr) {}\n *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n * };\n */\nclass Solution {\npublic:\n    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {\n        // Write your code here\n    }\n};",
      },
      {
        languageId: 71,
        language: "python",
        code: "# Definition for singly-linked list.\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next\nclass Solution:\n    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:\n        # Write your code here\n        pass",
      },
    ],
    testCases: [
      { input: "list1 = [1,2,4], list2 = [1,3,4]", expectedOutput: "[1,1,2,3,4,4]", isHidden: false, explanation: "" },
      { input: "list1 = [], list2 = []", expectedOutput: "[]", isHidden: false, explanation: "" },
      { input: "list1 = [], list2 = [0]", expectedOutput: "[0]", isHidden: false, explanation: "" },
      { input: "list1 = [5], list2 = [1,2,4]", expectedOutput: "[1,2,4,5]", isHidden: true, explanation: "" },
    ],
  },
  {
    title: "Container With Most Water",
    slug: "container-with-most-water",
    order: 8,
    description:
      "You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the `i`th line are `(i, 0)` and `(i, height[i])`.\n\nFind two lines that together with the x-axis form a container, such that the container contains the most water.\n\nReturn *the maximum amount of water a container can store*.\n\n**Notice** that you may not slant the container.",
    difficulty: "Medium",
    topicTags: ["Array", "Two Pointers", "Greedy"],
    companyTags: ["Amazon", "Google", "Meta", "Goldman Sachs"],
    constraints: [
      "n == height.length",
      "2 <= n <= 10^5",
      "0 <= height[i] <= 10^4",
    ],
    hints: [
      "Start with the widest container (left = 0, right = n-1).",
      "Move the pointer pointing to the shorter line inward.",
    ],
    editorial:
      "**Two Pointer** — Start with left=0, right=n-1. Area = min(h[l], h[r]) * (r-l). Move the pointer with the smaller height inward. Time: O(n), Space: O(1).",
    examples: [
      {
        input: "height = [1,8,6,2,5,4,8,3,7]",
        output: "49",
        explanation: "Lines at index 1 (height=8) and index 8 (height=7) form the container with most water: min(8,7) * (8-1) = 49.",
      },
      { input: "height = [1,1]", output: "1", explanation: "" },
    ],
    starterCode: [
      {
        languageId: 63,
        language: "javascript",
        code: "/**\n * @param {number[]} height\n * @return {number}\n */\nvar maxArea = function(height) {\n    // Write your code here\n};",
      },
      {
        languageId: 62,
        language: "java",
        code: "class Solution {\n    public int maxArea(int[] height) {\n        // Write your code here\n    }\n}",
      },
      {
        languageId: 54,
        language: "cpp",
        code: "class Solution {\npublic:\n    int maxArea(vector<int>& height) {\n        // Write your code here\n    }\n};",
      },
      {
        languageId: 71,
        language: "python",
        code: "class Solution:\n    def maxArea(self, height: list[int]) -> int:\n        # Write your code here\n        pass",
      },
    ],
    testCases: [
      { input: "height = [1,8,6,2,5,4,8,3,7]", expectedOutput: "49", isHidden: false, explanation: "" },
      { input: "height = [1,1]", expectedOutput: "1", isHidden: false, explanation: "" },
      { input: "height = [4,3,2,1,4]", expectedOutput: "16", isHidden: true, explanation: "" },
      { input: "height = [1,2,1]", expectedOutput: "2", isHidden: true, explanation: "" },
    ],
  },
  {
    title: "Longest Substring Without Repeating Characters",
    slug: "longest-substring-without-repeating-characters",
    order: 9,
    description:
      "Given a string `s`, find the length of the **longest substring** without repeating characters.\n\nA **substring** is a contiguous non-empty sequence of characters within a string.",
    difficulty: "Medium",
    topicTags: ["Hash Table", "String", "Sliding Window"],
    companyTags: ["Amazon", "Google", "Meta", "Microsoft", "Bloomberg", "Apple"],
    constraints: [
      "0 <= s.length <= 5 * 10^4",
      "s consists of English letters, digits, symbols and spaces.",
    ],
    hints: [
      "Use a sliding window approach with a set or map.",
      "When you encounter a duplicate, shrink the window from the left.",
    ],
    editorial:
      "**Sliding Window** — Use a HashSet/Map to track characters in the current window [left, right]. If `s[right]` is already in the set, remove `s[left]` and increment left. Track the max window size. Time: O(n), Space: O(min(n, alphabet)).",
    examples: [
      { input: 's = "abcabcbb"', output: "3", explanation: 'The answer is "abc", with the length of 3.' },
      { input: 's = "bbbbb"', output: "1", explanation: 'The answer is "b", with the length of 1.' },
      { input: 's = "pwwkew"', output: "3", explanation: 'The answer is "wke", with the length of 3.' },
    ],
    starterCode: [
      {
        languageId: 63,
        language: "javascript",
        code: "/**\n * @param {string} s\n * @return {number}\n */\nvar lengthOfLongestSubstring = function(s) {\n    // Write your code here\n};",
      },
      {
        languageId: 62,
        language: "java",
        code: "class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // Write your code here\n    }\n}",
      },
      {
        languageId: 54,
        language: "cpp",
        code: "class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        // Write your code here\n    }\n};",
      },
      {
        languageId: 71,
        language: "python",
        code: "class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        # Write your code here\n        pass",
      },
    ],
    testCases: [
      { input: 's = "abcabcbb"', expectedOutput: "3", isHidden: false, explanation: "" },
      { input: 's = "bbbbb"', expectedOutput: "1", isHidden: false, explanation: "" },
      { input: 's = "pwwkew"', expectedOutput: "3", isHidden: false, explanation: "" },
      { input: 's = ""', expectedOutput: "0", isHidden: true, explanation: "" },
      { input: 's = " "', expectedOutput: "1", isHidden: true, explanation: "" },
      { input: 's = "dvdf"', expectedOutput: "3", isHidden: true, explanation: "" },
    ],
  },
  {
    title: "3Sum",
    slug: "3sum",
    order: 10,
    description:
      "Given an integer array `nums`, return all the triplets `[nums[i], nums[j], nums[k]]` such that `i != j`, `i != k`, and `j != k`, and `nums[i] + nums[j] + nums[k] == 0`.\n\nNotice that the solution set must not contain duplicate triplets.",
    difficulty: "Medium",
    topicTags: ["Array", "Two Pointers", "Sorting"],
    companyTags: ["Amazon", "Google", "Meta", "Microsoft", "Apple", "Bloomberg"],
    constraints: [
      "3 <= nums.length <= 3000",
      "-10^5 <= nums[i] <= 10^5",
    ],
    hints: [
      "Sort the array first. Then for each element, use two pointers to find the remaining two.",
      "Skip duplicates to avoid duplicate triplets.",
    ],
    editorial:
      "**Sort + Two Pointers** — Sort the array. For each index `i`, use two pointers `left = i+1` and `right = n-1`. Skip duplicates for `i`, `left`, and `right`. Time: O(n²), Space: O(1) ignoring output.",
    examples: [
      {
        input: "nums = [-1,0,1,2,-1,-4]",
        output: "[[-1,-1,2],[-1,0,1]]",
        explanation: "nums[0] + nums[1] + nums[2] = (-1) + 0 + 1 = 0. nums[1] + nums[2] + nums[4] = 0 + 1 + (-1) = 0. The distinct triplets are [-1,0,1] and [-1,-1,2].",
      },
      { input: "nums = [0,1,1]", output: "[]", explanation: "The only possible triplet does not sum up to 0." },
      { input: "nums = [0,0,0]", output: "[[0,0,0]]", explanation: "The only possible triplet sums up to 0." },
    ],
    starterCode: [
      {
        languageId: 63,
        language: "javascript",
        code: "/**\n * @param {number[]} nums\n * @return {number[][]}\n */\nvar threeSum = function(nums) {\n    // Write your code here\n};",
      },
      {
        languageId: 62,
        language: "java",
        code: "class Solution {\n    public List<List<Integer>> threeSum(int[] nums) {\n        // Write your code here\n    }\n}",
      },
      {
        languageId: 54,
        language: "cpp",
        code: "class Solution {\npublic:\n    vector<vector<int>> threeSum(vector<int>& nums) {\n        // Write your code here\n    }\n};",
      },
      {
        languageId: 71,
        language: "python",
        code: "class Solution:\n    def threeSum(self, nums: list[int]) -> list[list[int]]:\n        # Write your code here\n        pass",
      },
    ],
    testCases: [
      { input: "nums = [-1,0,1,2,-1,-4]", expectedOutput: "[[-1,-1,2],[-1,0,1]]", isHidden: false, explanation: "" },
      { input: "nums = [0,1,1]", expectedOutput: "[]", isHidden: false, explanation: "" },
      { input: "nums = [0,0,0]", expectedOutput: "[[0,0,0]]", isHidden: false, explanation: "" },
      { input: "nums = [-2,0,1,1,2]", expectedOutput: "[[-2,0,2],[-2,1,1]]", isHidden: true, explanation: "" },
      { input: "nums = [-1,0,1,0]", expectedOutput: "[[-1,0,1]]", isHidden: true, explanation: "" },
    ],
  },
  {
    title: "Climbing Stairs",
    slug: "climbing-stairs",
    order: 11,
    description:
      "You are climbing a staircase. It takes `n` steps to reach the top.\n\nEach time you can either climb `1` or `2` steps. In how many distinct ways can you climb to the top?",
    difficulty: "Easy",
    topicTags: ["Math", "Dynamic Programming", "Memoization"],
    companyTags: ["Amazon", "Google", "Apple", "Adobe"],
    constraints: ["1 <= n <= 45"],
    hints: [
      "To reach step n, you could have come from step n-1 or step n-2.",
      "This is the Fibonacci sequence!",
    ],
    editorial:
      "**DP / Fibonacci** — `dp[i] = dp[i-1] + dp[i-2]`. Base cases: dp[1]=1, dp[2]=2. Time: O(n), Space: O(1) with two variables.",
    examples: [
      { input: "n = 2", output: "2", explanation: "There are two ways to climb to the top.\n1. 1 step + 1 step\n2. 2 steps" },
      { input: "n = 3", output: "3", explanation: "There are three ways to climb to the top.\n1. 1+1+1\n2. 1+2\n3. 2+1" },
    ],
    starterCode: [
      {
        languageId: 63,
        language: "javascript",
        code: "/**\n * @param {number} n\n * @return {number}\n */\nvar climbStairs = function(n) {\n    // Write your code here\n};",
      },
      {
        languageId: 62,
        language: "java",
        code: "class Solution {\n    public int climbStairs(int n) {\n        // Write your code here\n    }\n}",
      },
      {
        languageId: 54,
        language: "cpp",
        code: "class Solution {\npublic:\n    int climbStairs(int n) {\n        // Write your code here\n    }\n};",
      },
      {
        languageId: 71,
        language: "python",
        code: "class Solution:\n    def climbStairs(self, n: int) -> int:\n        # Write your code here\n        pass",
      },
    ],
    testCases: [
      { input: "n = 2", expectedOutput: "2", isHidden: false, explanation: "" },
      { input: "n = 3", expectedOutput: "3", isHidden: false, explanation: "" },
      { input: "n = 1", expectedOutput: "1", isHidden: true, explanation: "" },
      { input: "n = 5", expectedOutput: "8", isHidden: true, explanation: "" },
      { input: "n = 10", expectedOutput: "89", isHidden: true, explanation: "" },
      { input: "n = 45", expectedOutput: "1836311903", isHidden: true, explanation: "" },
    ],
  },
  {
    title: "Binary Search",
    slug: "binary-search",
    order: 12,
    description:
      "Given an array of integers `nums` which is sorted in ascending order, and an integer `target`, write a function to search `target` in `nums`. If `target` exists, then return its index. Otherwise, return `-1`.\n\nYou must write an algorithm with `O(log n)` runtime complexity.",
    difficulty: "Easy",
    topicTags: ["Array", "Binary Search"],
    companyTags: ["Amazon", "Microsoft", "Apple"],
    constraints: [
      "1 <= nums.length <= 10^4",
      "-10^4 < nums[i], target < 10^4",
      "All the integers in nums are unique.",
      "nums is sorted in ascending order.",
    ],
    hints: ["Use two pointers left and right, and check the middle element each time."],
    editorial:
      "**Classic Binary Search** — left=0, right=n-1. While left <= right: mid = (left+right)/2. If nums[mid] == target return mid. If nums[mid] < target, left = mid+1. Else right = mid-1. Time: O(log n).",
    examples: [
      { input: "nums = [-1,0,3,5,9,12], target = 9", output: "4", explanation: "9 exists in nums and its index is 4." },
      { input: "nums = [-1,0,3,5,9,12], target = 2", output: "-1", explanation: "2 does not exist in nums so return -1." },
    ],
    starterCode: [
      {
        languageId: 63,
        language: "javascript",
        code: "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number}\n */\nvar search = function(nums, target) {\n    // Write your code here\n};",
      },
      {
        languageId: 62,
        language: "java",
        code: "class Solution {\n    public int search(int[] nums, int target) {\n        // Write your code here\n    }\n}",
      },
      {
        languageId: 54,
        language: "cpp",
        code: "class Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        // Write your code here\n    }\n};",
      },
      {
        languageId: 71,
        language: "python",
        code: "class Solution:\n    def search(self, nums: list[int], target: int) -> int:\n        # Write your code here\n        pass",
      },
    ],
    testCases: [
      { input: "nums = [-1,0,3,5,9,12], target = 9", expectedOutput: "4", isHidden: false, explanation: "" },
      { input: "nums = [-1,0,3,5,9,12], target = 2", expectedOutput: "-1", isHidden: false, explanation: "" },
      { input: "nums = [5], target = 5", expectedOutput: "0", isHidden: true, explanation: "" },
      { input: "nums = [2,5], target = 5", expectedOutput: "1", isHidden: true, explanation: "" },
      { input: "nums = [2,5], target = 0", expectedOutput: "-1", isHidden: true, explanation: "" },
    ],
  },
  {
    title: "Longest Common Prefix",
    slug: "longest-common-prefix",
    order: 13,
    description:
      'Write a function to find the longest common prefix string amongst an array of strings.\n\nIf there is no common prefix, return an empty string `""`.',
    difficulty: "Easy",
    topicTags: ["String", "Trie"],
    companyTags: ["Amazon", "Google", "Apple"],
    constraints: [
      "1 <= strs.length <= 200",
      "0 <= strs[i].length <= 200",
      "strs[i] consists of only lowercase English letters.",
    ],
    hints: [
      "Compare characters at the same position across all strings.",
    ],
    editorial:
      '**Vertical Scanning** — Take the first string as reference. For each character position, check if all other strings have the same character at that position. Stop when there\'s a mismatch or a string ends. Time: O(S) where S is sum of all characters.',
    examples: [
      { input: 'strs = ["flower","flow","flight"]', output: '"fl"', explanation: "" },
      { input: 'strs = ["dog","racecar","car"]', output: '""', explanation: "There is no common prefix among the input strings." },
    ],
    starterCode: [
      {
        languageId: 63,
        language: "javascript",
        code: "/**\n * @param {string[]} strs\n * @return {string}\n */\nvar longestCommonPrefix = function(strs) {\n    // Write your code here\n};",
      },
      {
        languageId: 62,
        language: "java",
        code: "class Solution {\n    public String longestCommonPrefix(String[] strs) {\n        // Write your code here\n    }\n}",
      },
      {
        languageId: 54,
        language: "cpp",
        code: "class Solution {\npublic:\n    string longestCommonPrefix(vector<string>& strs) {\n        // Write your code here\n    }\n};",
      },
      {
        languageId: 71,
        language: "python",
        code: "class Solution:\n    def longestCommonPrefix(self, strs: list[str]) -> str:\n        # Write your code here\n        pass",
      },
    ],
    testCases: [
      { input: 'strs = ["flower","flow","flight"]', expectedOutput: '"fl"', isHidden: false, explanation: "" },
      { input: 'strs = ["dog","racecar","car"]', expectedOutput: '""', isHidden: false, explanation: "" },
      { input: 'strs = ["a"]', expectedOutput: '"a"', isHidden: true, explanation: "" },
      { input: 'strs = ["","b"]', expectedOutput: '""', isHidden: true, explanation: "" },
      { input: 'strs = ["ab","a"]', expectedOutput: '"a"', isHidden: true, explanation: "" },
    ],
  },
  {
    title: "Merge Intervals",
    slug: "merge-intervals",
    order: 14,
    description:
      "Given an array of `intervals` where `intervals[i] = [start_i, end_i]`, merge all overlapping intervals, and return *an array of the non-overlapping intervals that cover all the intervals in the input*.",
    difficulty: "Medium",
    topicTags: ["Array", "Sorting"],
    companyTags: ["Google", "Meta", "Amazon", "Microsoft", "Bloomberg"],
    constraints: [
      "1 <= intervals.length <= 10^4",
      "intervals[i].length == 2",
      "0 <= start_i <= end_i <= 10^4",
    ],
    hints: [
      "Sort the intervals by start time first.",
      "Then iterate and merge overlapping intervals.",
    ],
    editorial:
      "**Sort + Merge** — Sort intervals by start. Initialize result with first interval. For each subsequent interval, if it overlaps with the last in result (start <= last.end), merge by updating last.end = max(last.end, current.end). Otherwise, add to result. Time: O(n log n).",
    examples: [
      {
        input: "intervals = [[1,3],[2,6],[8,10],[15,18]]",
        output: "[[1,6],[8,10],[15,18]]",
        explanation: "Since intervals [1,3] and [2,6] overlap, merge them into [1,6].",
      },
      {
        input: "intervals = [[1,4],[4,5]]",
        output: "[[1,5]]",
        explanation: "Intervals [1,4] and [4,5] are considered overlapping.",
      },
    ],
    starterCode: [
      {
        languageId: 63,
        language: "javascript",
        code: "/**\n * @param {number[][]} intervals\n * @return {number[][]}\n */\nvar merge = function(intervals) {\n    // Write your code here\n};",
      },
      {
        languageId: 62,
        language: "java",
        code: "class Solution {\n    public int[][] merge(int[][] intervals) {\n        // Write your code here\n    }\n}",
      },
      {
        languageId: 54,
        language: "cpp",
        code: "class Solution {\npublic:\n    vector<vector<int>> merge(vector<vector<int>>& intervals) {\n        // Write your code here\n    }\n};",
      },
      {
        languageId: 71,
        language: "python",
        code: "class Solution:\n    def merge(self, intervals: list[list[int]]) -> list[list[int]]:\n        # Write your code here\n        pass",
      },
    ],
    testCases: [
      { input: "intervals = [[1,3],[2,6],[8,10],[15,18]]", expectedOutput: "[[1,6],[8,10],[15,18]]", isHidden: false, explanation: "" },
      { input: "intervals = [[1,4],[4,5]]", expectedOutput: "[[1,5]]", isHidden: false, explanation: "" },
      { input: "intervals = [[1,4],[0,4]]", expectedOutput: "[[0,4]]", isHidden: true, explanation: "" },
      { input: "intervals = [[1,4],[2,3]]", expectedOutput: "[[1,4]]", isHidden: true, explanation: "" },
      { input: "intervals = [[1,4],[0,0]]", expectedOutput: "[[0,0],[1,4]]", isHidden: true, explanation: "" },
    ],
  },
  {
    title: "Trapping Rain Water",
    slug: "trapping-rain-water",
    order: 15,
    description:
      "Given `n` non-negative integers representing an elevation map where the width of each bar is `1`, compute how much water it can trap after raining.",
    difficulty: "Hard",
    topicTags: ["Array", "Two Pointers", "Dynamic Programming", "Stack", "Monotonic Stack"],
    companyTags: ["Amazon", "Google", "Meta", "Microsoft", "Goldman Sachs", "Apple"],
    constraints: [
      "n == height.length",
      "1 <= n <= 2 * 10^4",
      "0 <= height[i] <= 10^5",
    ],
    hints: [
      "For each bar, the water above it = min(maxLeft, maxRight) - height[i].",
      "You can precompute maxLeft and maxRight arrays, or use two pointers.",
    ],
    editorial:
      "**Two Pointer** — Use left=0, right=n-1 with leftMax, rightMax. Move the smaller side inward. Water at each position = max(0, currentMax - height). Time: O(n), Space: O(1).\n\n**DP** — Precompute leftMax[i] and rightMax[i]. Water at i = min(leftMax[i], rightMax[i]) - height[i]. Time: O(n), Space: O(n).",
    examples: [
      {
        input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]",
        output: "6",
        explanation: "The elevation map is represented by array [0,1,0,2,1,0,1,3,2,1,2,1]. In this case, 6 units of rain water are being trapped.",
      },
      { input: "height = [4,2,0,3,2,5]", output: "9", explanation: "" },
    ],
    starterCode: [
      {
        languageId: 63,
        language: "javascript",
        code: "/**\n * @param {number[]} height\n * @return {number}\n */\nvar trap = function(height) {\n    // Write your code here\n};",
      },
      {
        languageId: 62,
        language: "java",
        code: "class Solution {\n    public int trap(int[] height) {\n        // Write your code here\n    }\n}",
      },
      {
        languageId: 54,
        language: "cpp",
        code: "class Solution {\npublic:\n    int trap(vector<int>& height) {\n        // Write your code here\n    }\n};",
      },
      {
        languageId: 71,
        language: "python",
        code: "class Solution:\n    def trap(self, height: list[int]) -> int:\n        # Write your code here\n        pass",
      },
    ],
    testCases: [
      { input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]", expectedOutput: "6", isHidden: false, explanation: "" },
      { input: "height = [4,2,0,3,2,5]", expectedOutput: "9", isHidden: false, explanation: "" },
      { input: "height = [4,2,3]", expectedOutput: "1", isHidden: true, explanation: "" },
      { input: "height = [1,0,1]", expectedOutput: "1", isHidden: true, explanation: "" },
      { input: "height = [5,4,1,2]", expectedOutput: "1", isHidden: true, explanation: "" },
    ],
  },
];

const seedDatabase = async () => {
  try {
    const conn = await mongoose.connect(`${env.MONGODB_URI}/${env.DB_NAME}`);
    console.log("\n✅ MongoDB connected !! DB HOST:", conn.connection.host);

    let created = 0;
    let updated = 0;

    for (const problemData of problemsData) {
      const { testCases: testCasesData, ...problemFields } = problemData;

      // Upsert the problem
      const problem = await Problem.findOneAndUpdate(
        { slug: problemFields.slug },
        problemFields,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      const isNew = !problem.testCases || problem.testCases.length === 0;

      if (isNew && testCasesData && testCasesData.length > 0) {
        // Create test cases
        const testCasesToInsert = testCasesData.map((tc) => ({
          ...tc,
          problemId: problem._id,
        }));
        const insertedTestCases = await TestCase.insertMany(testCasesToInsert);
        const testCaseIds = insertedTestCases.map((tc) => tc._id);

        // Link test cases to problem
        problem.testCases = testCaseIds;
        await problem.save();

        created++;
        console.log(`  ✅ Created: "${problem.title}" with ${insertedTestCases.length} test cases`);
      } else {
        updated++;
        console.log(`  🔄 Updated: "${problem.title}"`);
      }
    }

    console.log(`\n🎉 Seeding complete! Created: ${created}, Updated: ${updated}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

seedDatabase();