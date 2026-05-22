import { buildSubmissionCode } from '../utils/codeWrapper.js';

// Test: Java code for Merge Two Sorted Lists
const javaCode = `/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode() {}
 *     ListNode(int val) { this.val = val; }
 *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }
 * }
 */
class Solution {
    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {
        ListNode dummy = new ListNode(0);
        ListNode curr = dummy;
        while (list1 != null && list2 != null) {
            if (list1.val <= list2.val) {
                curr.next = list1;
                list1 = list1.next;
            } else {
                curr.next = list2;
                list2 = list2.next;
            }
            curr = curr.next;
        }
        curr.next = list1 != null ? list1 : list2;
        return dummy.next;
    }
}`;

const testCases = [
  { input: "list1 = [1,2,4], list2 = [1,3,4]", expected: "[1,1,2,3,4,4]" },
  { input: "list1 = [], list2 = []", expected: "[]" },
  { input: "list1 = [], list2 = [0]", expected: "[0]" },
];

console.log("=== Testing Java Wrapper ===\n");
testCases.forEach((tc, i) => {
  const result = buildSubmissionCode(javaCode, tc.input, 62);
  console.log(`--- Test Case ${i + 1}: ${tc.input} ---`);
  console.log(`Uses stdin: ${result.usesStdin}`);
  console.log(`Source code:\n${result.sourceCode}\n`);
  console.log("---\n");
});

// Test: C++ code for Merge Two Sorted Lists
const cppCode = `/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
class Solution {
public:
    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {
        ListNode dummy(0);
        ListNode* curr = &dummy;
        while (list1 && list2) {
            if (list1->val <= list2->val) {
                curr->next = list1;
                list1 = list1->next;
            } else {
                curr->next = list2;
                list2 = list2->next;
            }
            curr = curr->next;
        }
        curr->next = list1 ? list1 : list2;
        return dummy.next;
    }
};`;

console.log("=== Testing C++ Wrapper ===\n");
const cppResult = buildSubmissionCode(cppCode, "list1 = [1,2,4], list2 = [1,3,4]", 54);
console.log(`Uses stdin: ${cppResult.usesStdin}`);
console.log(`Source code:\n${cppResult.sourceCode}\n`);

// Test: Python code
const pythonCode = `# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:
        dummy = ListNode(0)
        curr = dummy
        while list1 and list2:
            if list1.val <= list2.val:
                curr.next = list1
                list1 = list1.next
            else:
                curr.next = list2
                list2 = list2.next
            curr = curr.next
        curr.next = list1 or list2
        return dummy.next`;

console.log("=== Testing Python Wrapper ===\n");
const pyResult = buildSubmissionCode(pythonCode, "list1 = [1,2,4], list2 = [1,3,4]", 71);
console.log(`Uses stdin: ${pyResult.usesStdin}`);
console.log(`Source code:\n${pyResult.sourceCode}\n`);

// Test: JavaScript code
const jsCode = `/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} list1
 * @param {ListNode} list2
 * @return {ListNode}
 */
var mergeTwoLists = function(list1, list2) {
    let dummy = new ListNode(0);
    let curr = dummy;
    while (list1 !== null && list2 !== null) {
        if (list1.val <= list2.val) {
            curr.next = list1;
            list1 = list1.next;
        } else {
            curr.next = list2;
            list2 = list2.next;
        }
        curr = curr.next;
    }
    curr.next = list1 || list2;
    return dummy.next;
};`;

console.log("=== Testing JavaScript Wrapper ===\n");
const jsResult = buildSubmissionCode(jsCode, "list1 = [1,2,4], list2 = [1,3,4]", 63);
console.log(`Uses stdin: ${jsResult.usesStdin}`);
console.log(`Source code:\n${jsResult.sourceCode}\n`);

// Test: non-ListNode problem should still work
console.log("=== Testing Non-ListNode Problem (Two Sum) ===\n");
const twoSumCode = `class Solution {
    public int[] twoSum(int[] nums, int target) {
        for (int i = 0; i < nums.length; i++) {
            for (int j = i + 1; j < nums.length; j++) {
                if (nums[i] + nums[j] == target) return new int[]{i, j};
            }
        }
        return new int[]{};
    }
}`;
const twoSumResult = buildSubmissionCode(twoSumCode, "nums = [2,7,11,15], target = 9", 62);
console.log(`Uses stdin: ${twoSumResult.usesStdin}`);
console.log(`Source code:\n${twoSumResult.sourceCode}\n`);
