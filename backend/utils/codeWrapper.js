const JS_LANGUAGE_IDS = new Set([63]);
const JAVA_LANGUAGE_IDS = new Set([62, 91]);
const CPP_LANGUAGE_IDS = new Set([52, 53, 54, 76]);
const PYTHON_LANGUAGE_IDS = new Set([71]);

const isJavaScript = (languageId) => JS_LANGUAGE_IDS.has(languageId);
const isJava = (languageId) => JAVA_LANGUAGE_IDS.has(languageId);
const isCpp = (languageId) => CPP_LANGUAGE_IDS.has(languageId);
const isPython = (languageId) => PYTHON_LANGUAGE_IDS.has(languageId);

function splitTopLevel(input) {
  const parts = [];
  let current = "";
  let depth = 0;
  let inSingle = false;
  let inDouble = false;
  let escaped = false;

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];

    if (escaped) {
      current += ch;
      escaped = false;
      continue;
    }

    if ((inSingle || inDouble) && ch === "\\") {
      current += ch;
      escaped = true;
      continue;
    }

    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      current += ch;
      continue;
    }

    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
      current += ch;
      continue;
    }

    if (!inSingle && !inDouble) {
      if (ch === "[" || ch === "(" || ch === "{") {
        depth += 1;
      } else if (ch === "]" || ch === ")" || ch === "}") {
        depth = Math.max(0, depth - 1);
      } else if (ch === "," && depth === 0) {
        if (current.trim()) {
          parts.push(current.trim());
        }
        current = "";
        continue;
      }
    }

    current += ch;
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
}

function parseInputAssignments(input) {
  return splitTopLevel(input)
    .map((part) => {
      const eqIndex = part.indexOf("=");
      if (eqIndex === -1) {
        return null;
      }
      const name = part.slice(0, eqIndex).trim();
      const value = part.slice(eqIndex + 1).trim();
      return name && value ? { name, value } : null;
    })
    .filter(Boolean);
}

function stripQuotes(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function escapeStringLiteral(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function inferScalarType(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return "string";
  }
  if (trimmed === "true" || trimmed === "false") {
    return "boolean";
  }
  if (/^-?\d+\.\d+$/.test(trimmed)) {
    return "double";
  }
  if (/^-?\d+$/.test(trimmed)) {
    return "int";
  }
  return "string";
}

function parseArrayElements(value) {
  const trimmed = value.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) {
    return [];
  }
  const inner = trimmed.slice(1, -1).trim();
  if (!inner) {
    return [];
  }
  return splitTopLevel(inner).map((entry) => entry.trim());
}

function inferValueType(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    const elements = parseArrayElements(trimmed);
    if (elements.length === 0) {
      return { kind: "array", elementKind: "int", elements: [] };
    }
    const elementTypes = elements.map(inferScalarType);
    let elementKind = "int";
    if (elementTypes.includes("string")) {
      elementKind = "string";
    } else if (elementTypes.includes("double")) {
      elementKind = "double";
    } else if (elementTypes.includes("boolean")) {
      elementKind = "boolean";
    }
    return { kind: "array", elementKind, elements };
  }

  return { kind: "scalar", scalarKind: inferScalarType(trimmed) };
}

// Strip block comments (/* ... */) and line comments (// ...) and Python (#)
function stripComments(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/#.*$/gm, "");
}

function getFunctionName(code) {
  const cleaned = stripComments(code);
  const match =
    cleaned.match(/function\s+(\w+)\s*\(/) ||
    cleaned.match(/var\s+(\w+)\s*=\s*function/) ||
    cleaned.match(/const\s+(\w+)\s*=\s*\(/);
  return match ? match[1] : null;
}

function getPythonFunctionName(code) {
  const cleaned = stripComments(code);
  const match = cleaned.match(/def\s+(\w+)\s*\(/);
  return match ? match[1] : null;
}

function getJavaMethodName(code) {
  const cleaned = stripComments(code);
  const regex = /(?:public|private|protected)?\s*(?:static\s*)?[\w<>\[\]]+\s+(\w+)\s*\([^;{]*\)\s*\{/g;
  let match;
  while ((match = regex.exec(cleaned)) !== null) {
    if (match[1] !== "main") {
      return match[1];
    }
  }
  return null;
}

function getCppFunctionName(code) {
  const cleaned = stripComments(code);
  const regex = /(?:^|\s)[\w:<>&*\[\]]+\s+(\w+)\s*\([^;{]*\)\s*\{/g;
  let match;
  while ((match = regex.exec(cleaned)) !== null) {
    if (match[1] !== "main") {
      return match[1];
    }
  }
  return null;
}

function sanitizeJavaCode(code) {
  return code.replace(/\bpublic\s+class\s+/g, "class ");
}

function indentLines(text, indent) {
  return text
    .split("\n")
    .map((line) => (line ? `${indent}${line}` : line))
    .join("\n");
}

// ─────────────────────────────────────────────────────────────
// ListNode detection: checks if user code uses ListNode
// (ignoring comments where the definition is shown)
// ─────────────────────────────────────────────────────────────
function codeUsesListNode(code) {
  // Strip block comments (/* ... */) and line comments (// ...)
  const stripped = code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/#.*$/gm, "");
  return /\bListNode\b/.test(stripped);
}

// Determine which parameter names should be treated as ListNode
// by parsing the method signature from user code.
function getJavaListNodeParams(code) {
  // Match parameters like: ListNode list1, ListNode list2
  const cleaned = stripComments(code);
  const methodMatch = cleaned.match(
    /(?:public|private|protected)\s+[\w<>\[\]*]+\s+\w+\s*\(([^)]*)\)/
  );
  if (!methodMatch) return new Set();
  const params = methodMatch[1];
  const listNodeParams = new Set();
  const paramRegex = /ListNode\s+(\w+)/g;
  let m;
  while ((m = paramRegex.exec(params)) !== null) {
    listNodeParams.add(m[1]);
  }
  return listNodeParams;
}

function getCppListNodeParams(code) {
  const cleaned = stripComments(code);
  const methodMatch = cleaned.match(
    /[\w<>&*\[\]]+\s+\w+\s*\(([^)]*)\)\s*\{/
  );
  if (!methodMatch) return new Set();
  const params = methodMatch[1];
  const listNodeParams = new Set();
  const paramRegex = /ListNode\s*\*\s*(\w+)/g;
  let m;
  while ((m = paramRegex.exec(params)) !== null) {
    listNodeParams.add(m[1]);
  }
  return listNodeParams;
}

function getJsListNodeParams(code) {
  // JS uses JSDoc: @param {ListNode} list1
  const listNodeParams = new Set();
  const paramRegex = /@param\s+\{ListNode\}\s+(\w+)/g;
  let m;
  while ((m = paramRegex.exec(code)) !== null) {
    listNodeParams.add(m[1]);
  }
  return listNodeParams;
}

function getPythonListNodeParams(code) {
  // Python uses type hints: list1: Optional[ListNode]  or  list1: ListNode
  const cleaned = stripComments(code);
  const methodMatch = cleaned.match(/def\s+\w+\s*\(([^)]*)\)/);
  if (!methodMatch) return new Set();
  const params = methodMatch[1];
  const listNodeParams = new Set();
  const paramRegex = /(\w+)\s*:\s*(?:Optional\[)?ListNode\]?/g;
  let m;
  while ((m = paramRegex.exec(params)) !== null) {
    if (m[1] !== "self") {
      listNodeParams.add(m[1]);
    }
  }
  return listNodeParams;
}

// ─────────────────────────────────────────────────────────────
// Java declarations – now with ListNode support
// ─────────────────────────────────────────────────────────────
function buildJavaDeclarations(assignments, listNodeParams) {
  const declarations = [];
  const argNames = [];

  assignments.forEach(({ name, value }) => {
    const typeInfo = inferValueType(value);
    argNames.push(name);

    // If this parameter is a ListNode, build it from the array
    if (listNodeParams && listNodeParams.has(name) && typeInfo.kind === "array") {
      const elementValues = typeInfo.elements.map((entry) => entry.trim());
      declarations.push(
        `ListNode ${name} = buildList(new int[]{${elementValues.join(",")}});`
      );
      return;
    }

    if (typeInfo.kind === "array") {
      const elementKind = typeInfo.elementKind;
      const elementValues = typeInfo.elements.map((entry) => {
        if (elementKind === "string") {
          return `"${escapeStringLiteral(stripQuotes(entry))}"`;
        }
        if (elementKind === "boolean") {
          return entry.trim().toLowerCase();
        }
        return entry.trim();
      });
      const javaType =
        elementKind === "double"
          ? "double"
          : elementKind === "boolean"
            ? "boolean"
            : elementKind === "string"
              ? "String"
              : "int";
      declarations.push(
        `${javaType}[] ${name} = new ${javaType}[]{${elementValues.join(",")}};`
      );
      return;
    }

    const scalarKind = typeInfo.scalarKind;
    if (scalarKind === "string") {
      declarations.push(
        `String ${name} = "${escapeStringLiteral(stripQuotes(value))}";`
      );
    } else if (scalarKind === "boolean") {
      declarations.push(`boolean ${name} = ${value.trim().toLowerCase()};`);
    } else if (scalarKind === "double") {
      declarations.push(`double ${name} = ${value.trim()};`);
    } else {
      declarations.push(`int ${name} = ${value.trim()};`);
    }
  });

  return {
    declarations: declarations.join("\n"),
    argList: argNames.join(", "),
  };
}

// ─────────────────────────────────────────────────────────────
// C++ declarations – now with ListNode support
// ─────────────────────────────────────────────────────────────
function buildCppDeclarations(assignments, listNodeParams) {
  const declarations = [];
  const argNames = [];

  assignments.forEach(({ name, value }) => {
    const typeInfo = inferValueType(value);
    argNames.push(name);

    // If this parameter is a ListNode*, build it from the array
    if (listNodeParams && listNodeParams.has(name) && typeInfo.kind === "array") {
      const elementValues = typeInfo.elements.map((entry) => entry.trim());
      declarations.push(
        `ListNode* ${name} = buildList({${elementValues.join(",")}});`
      );
      return;
    }

    if (typeInfo.kind === "array") {
      const elementKind = typeInfo.elementKind;
      const elementValues = typeInfo.elements.map((entry) => {
        if (elementKind === "string") {
          return `"${escapeStringLiteral(stripQuotes(entry))}"`;
        }
        if (elementKind === "boolean") {
          return entry.trim().toLowerCase();
        }
        return entry.trim();
      });
      const cppType =
        elementKind === "double"
          ? "double"
          : elementKind === "boolean"
            ? "bool"
            : elementKind === "string"
              ? "string"
              : "int";
      declarations.push(
        `vector<${cppType}> ${name} = {${elementValues.join(",")}};`
      );
      return;
    }

    const scalarKind = typeInfo.scalarKind;
    if (scalarKind === "string") {
      declarations.push(
        `string ${name} = "${escapeStringLiteral(stripQuotes(value))}";`
      );
    } else if (scalarKind === "boolean") {
      declarations.push(`bool ${name} = ${value.trim().toLowerCase()};`);
    } else if (scalarKind === "double") {
      declarations.push(`double ${name} = ${value.trim()};`);
    } else {
      declarations.push(`int ${name} = ${value.trim()};`);
    }
  });

  return {
    declarations: declarations.join("\n"),
    argList: argNames.join(", "),
  };
}

// ─────────────────────────────────────────────────────────────
// Language-specific ListNode definitions
// ─────────────────────────────────────────────────────────────
const JAVA_LISTNODE_CLASS = `
class ListNode {
  int val;
  ListNode next;
  ListNode() {}
  ListNode(int val) { this.val = val; }
  ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}`;

const JAVA_LISTNODE_HELPERS = `
  private static ListNode buildList(int[] values) {
    ListNode dummy = new ListNode(0);
    ListNode curr = dummy;
    for (int v : values) {
      curr.next = new ListNode(v);
      curr = curr.next;
    }
    return dummy.next;
  }

  private static String toJson(ListNode head) {
    StringBuilder sb = new StringBuilder();
    sb.append("[");
    ListNode curr = head;
    boolean first = true;
    while (curr != null) {
      if (!first) {
        sb.append(",");
      }
      sb.append(curr.val);
      first = false;
      curr = curr.next;
    }
    sb.append("]");
    return sb.toString();
  }`;

const CPP_LISTNODE_STRUCT = `
struct ListNode {
  int val;
  ListNode *next;
  ListNode() : val(0), next(nullptr) {}
  ListNode(int x) : val(x), next(nullptr) {}
  ListNode(int x, ListNode *next) : val(x), next(next) {}
};`;

const CPP_LISTNODE_HELPERS = `
ListNode* buildList(vector<int> values) {
  ListNode dummy(0);
  ListNode* curr = &dummy;
  for (int v : values) {
    curr->next = new ListNode(v);
    curr = curr->next;
  }
  return dummy.next;
}

void printResult(ListNode* head) {
  cout << "[";
  ListNode* curr = head;
  bool first = true;
  while (curr != nullptr) {
    if (!first) {
      cout << ",";
    }
    cout << curr->val;
    first = false;
    curr = curr->next;
  }
  cout << "]";
}`;

const JS_LISTNODE_HELPERS = `
function ListNode(val, next) {
  this.val = (val === undefined ? 0 : val);
  this.next = (next === undefined ? null : next);
}

function buildList(arr) {
  let dummy = new ListNode(0);
  let curr = dummy;
  for (let i = 0; i < arr.length; i++) {
    curr.next = new ListNode(arr[i]);
    curr = curr.next;
  }
  return dummy.next;
}

function listToArray(head) {
  const result = [];
  let curr = head;
  while (curr !== null) {
    result.push(curr.val);
    curr = curr.next;
  }
  return result;
}`;

const PYTHON_LISTNODE_HELPERS = `
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

from typing import Optional

def build_list(arr):
    dummy = ListNode(0)
    curr = dummy
    for v in arr:
        curr.next = ListNode(v)
        curr = curr.next
    return dummy.next

def list_to_array(head):
    result = []
    curr = head
    while curr is not None:
        result.append(curr.val)
        curr = curr.next
    return result`;

// ─────────────────────────────────────────────────────────────
// JavaScript wrapper
// ─────────────────────────────────────────────────────────────
const generateJavaScriptWrapper = (code, input) => {
  const functionName = getFunctionName(code);
  if (!functionName) {
    console.error("Function name not found in submitted code.");
    return code;
  }

  const assignments = parseInputAssignments(input);
  if (assignments.length === 0) {
    console.error("Could not find variables in the input string.");
    return code;
  }

  const usesListNode = codeUsesListNode(code);
  const listNodeParams = usesListNode ? getJsListNodeParams(code) : new Set();

  const declarations = assignments
    .map(({ name, value }) => {
      if (listNodeParams.has(name)) {
        return `const ${name} = buildList(${value});`;
      }
      return `const ${name} = ${value};`;
    })
    .join("\n");
  const argList = assignments.map(({ name }) => name).join(", ");

  // Strip the ListNode comment definition from user code to avoid redeclaration
  const cleanCode = usesListNode
    ? code.replace(/\/\*\*[\s\S]*?\*\/\s*\n?/g, (match) =>
      /ListNode/.test(match) ? "" : match
    )
    : code;

  const resultConversion = usesListNode
    ? `
const result = ${functionName}(${argList});
if (result instanceof ListNode || result === null) {
  console.log(JSON.stringify(listToArray(result)));
} else {
  console.log(JSON.stringify(result));
}`
    : `
const result = ${functionName}(${argList});
console.log(JSON.stringify(result));`;

  const wrappedCode = `
${usesListNode ? JS_LISTNODE_HELPERS : ""}

${cleanCode}

${declarations}
${resultConversion}
`;

  console.log("Wrapped Code:\n", wrappedCode);
  return wrappedCode;
};

// ─────────────────────────────────────────────────────────────
// Java wrapper
// ─────────────────────────────────────────────────────────────
const generateJavaWrapper = (code, input) => {
  if (/\bmain\s*\(/.test(code)) {
    return { sourceCode: code, usesStdin: true };
  }

  const assignments = parseInputAssignments(input);
  if (assignments.length === 0) {
    return { sourceCode: code, usesStdin: true };
  }

  const methodName = getJavaMethodName(code);
  if (!methodName) {
    return { sourceCode: code, usesStdin: true };
  }

  const usesListNode = codeUsesListNode(code);
  const listNodeParams = usesListNode ? getJavaListNodeParams(code) : new Set();
  const returnsListNode = usesListNode && new RegExp(`\\bListNode\\s+${methodName}\\b`).test(code);

  const sanitizedCode = sanitizeJavaCode(code);
  const hasSolutionClass = /class\s+Solution\b/.test(sanitizedCode);
  const solutionCode = hasSolutionClass
    ? sanitizedCode
    : `class Solution {\n${indentLines(sanitizedCode, "  ")}\n}`;

  const { declarations, argList } = buildJavaDeclarations(assignments, listNodeParams);
  const mainCode = `
class Main {
  private static String escapeJson(String value) {
    StringBuilder sb = new StringBuilder();
    for (int i = 0; i < value.length(); i += 1) {
      char ch = value.charAt(i);
      if (ch == 92 || ch == '"') {
        sb.append((char) 92);
      }
      sb.append(ch);
    }
    return sb.toString();
  }

  private static String toJson(int[] arr) {
    StringBuilder sb = new StringBuilder();
    sb.append("[");
    for (int i = 0; i < arr.length; i += 1) {
      if (i > 0) {
        sb.append(",");
      }
      sb.append(arr[i]);
    }
    sb.append("]");
    return sb.toString();
  }

  private static String toJson(long[] arr) {
    StringBuilder sb = new StringBuilder();
    sb.append("[");
    for (int i = 0; i < arr.length; i += 1) {
      if (i > 0) {
        sb.append(",");
      }
      sb.append(arr[i]);
    }
    sb.append("]");
    return sb.toString();
  }

  private static String toJson(double[] arr) {
    StringBuilder sb = new StringBuilder();
    sb.append("[");
    for (int i = 0; i < arr.length; i += 1) {
      if (i > 0) {
        sb.append(",");
      }
      sb.append(arr[i]);
    }
    sb.append("]");
    return sb.toString();
  }

  private static String toJson(boolean[] arr) {
    StringBuilder sb = new StringBuilder();
    sb.append("[");
    for (int i = 0; i < arr.length; i += 1) {
      if (i > 0) {
        sb.append(",");
      }
      sb.append(arr[i] ? "true" : "false");
    }
    sb.append("]");
    return sb.toString();
  }

  private static String toJson(String[] arr) {
    StringBuilder sb = new StringBuilder();
    sb.append("[");
    for (int i = 0; i < arr.length; i += 1) {
      if (i > 0) {
        sb.append(",");
      }
      sb.append((char) 34).append(escapeJson(arr[i])).append((char) 34);
    }
    sb.append("]");
    return sb.toString();
  }

  private static String toJsonList(List<?> list) {
    StringBuilder sb = new StringBuilder();
    sb.append("[");
    for (int i = 0; i < list.size(); i += 1) {
      if (i > 0) {
        sb.append(",");
      }
      sb.append(toJson(list.get(i)));
    }
    sb.append("]");
    return sb.toString();
  }

  private static String toJson(Object obj) {
    if (obj == null) {
      return "null";
    }
    if (obj instanceof int[]) {
      return toJson((int[]) obj);
    }
    if (obj instanceof long[]) {
      return toJson((long[]) obj);
    }
    if (obj instanceof double[]) {
      return toJson((double[]) obj);
    }
    if (obj instanceof boolean[]) {
      return toJson((boolean[]) obj);
    }
    if (obj instanceof String[]) {
      return toJson((String[]) obj);
    }
    if (obj instanceof List) {
      return toJsonList((List<?>) obj);
    }
    if (obj instanceof String) {
      return "" + (char) 34 + escapeJson((String) obj) + (char) 34;
    }
    if (obj instanceof Boolean) {
      return ((Boolean) obj) ? "true" : "false";
    }
${usesListNode ? `    if (obj instanceof ListNode) {
      return toJson((ListNode) obj);
    }` : ""}
    return String.valueOf(obj);
  }
${usesListNode ? JAVA_LISTNODE_HELPERS : ""}

  public static void main(String[] args) {
    ${indentLines(declarations, "    ")}
    Solution solution = new Solution();
${returnsListNode ? `    ListNode result = solution.${methodName}(${argList});
    System.out.println(toJson(result));` : `    Object result = solution.${methodName}(${argList});
    System.out.println(toJson(result));`}
  }
}`;

  const listNodeDef = usesListNode ? JAVA_LISTNODE_CLASS : "";
  return {
    sourceCode: `import java.util.*;\n${listNodeDef}\n${solutionCode}\n${mainCode}`,
    usesStdin: false,
  };
};

// ─────────────────────────────────────────────────────────────
// C++ wrapper
// ─────────────────────────────────────────────────────────────
const generateCppWrapper = (code, input) => {
  if (/\bmain\s*\(/.test(code)) {
    return { sourceCode: code, usesStdin: true };
  }

  const assignments = parseInputAssignments(input);
  if (assignments.length === 0) {
    return { sourceCode: code, usesStdin: true };
  }

  const functionName = getCppFunctionName(code);
  if (!functionName) {
    return { sourceCode: code, usesStdin: true };
  }

  const usesListNode = codeUsesListNode(code);
  const listNodeParams = usesListNode ? getCppListNodeParams(code) : new Set();

  const { declarations, argList } = buildCppDeclarations(assignments, listNodeParams);
  const hasSolutionClass = /class\s+Solution\b/.test(code);
  const callLine = hasSolutionClass
    ? `Solution solution; auto result = solution.${functionName}(${argList});`
    : `auto result = ${functionName}(${argList});`;

  // Strip the ListNode comment definition from user code to avoid redeclaration
  const cleanCode = usesListNode
    ? code.replace(/\/\*\*[\s\S]*?\*\/\s*\n?/g, (match) =>
      /ListNode/.test(match) ? "" : match
    )
    : code;

  const helperCode = `
string escapeJson(const string& value) {
  string out;
  out.reserve(value.size());
  for (char ch : value) {
    if (ch == '\\\\' || ch == '"') {
      out.push_back('\\\\');
    }
    out.push_back(ch);
  }
  return out;
}

void printResult(const string& value) {
  cout << "\\"" << escapeJson(value) << "\\"";
}

void printResult(bool value) {
  cout << (value ? "true" : "false");
}

template <typename T>
void printResult(const vector<T>& vec) {
  cout << "[";
  for (size_t i = 0; i < vec.size(); i += 1) {
    if (i > 0) {
      cout << ",";
    }
    printResult(vec[i]);
  }
  cout << "]";
}

template <typename T>
void printResult(const T& value) {
  cout << value;
}`;

  const mainCode = `
int main() {
  ${indentLines(declarations, "  ")}
  ${callLine}
  printResult(result);
  return 0;
}`;

  const listNodeDef = usesListNode ? CPP_LISTNODE_STRUCT : "";
  const listNodeHelpers = usesListNode ? CPP_LISTNODE_HELPERS : "";

  return {
    sourceCode: `#include <bits/stdc++.h>\nusing namespace std;\n${listNodeDef}\n${cleanCode}\n${listNodeHelpers}\n${helperCode}\n${mainCode}`,
    usesStdin: false,
  };
};

// ─────────────────────────────────────────────────────────────
// Python wrapper
// ─────────────────────────────────────────────────────────────
const generatePythonWrapper = (code, input) => {
  const functionName = getPythonFunctionName(code);
  if (!functionName) {
    return { sourceCode: code, usesStdin: true };
  }

  const assignments = parseInputAssignments(input);
  if (assignments.length === 0) {
    return { sourceCode: code, usesStdin: true };
  }

  const usesListNode = codeUsesListNode(code);
  const listNodeParams = usesListNode ? getPythonListNodeParams(code) : new Set();

  const declarations = assignments
    .map(({ name, value }) => {
      if (listNodeParams.has(name)) {
        return `${name} = build_list(${value})`;
      }
      return `${name} = ${value}`;
    })
    .join("\n");
  const argList = assignments.map(({ name }) => name).join(", ");

  // Strip the ListNode comment definition from user code to avoid redeclaration
  const cleanCode = usesListNode
    ? code.replace(/^#\s*Definition for singly-linked list\.[\s\S]*?(?=\nclass\s)/m, "")
      .replace(/^#\s*class ListNode:.*\n(?:#.*\n)*/m, "")
    : code;

  const resultBlock = usesListNode
    ? `
import json
_result = ${functionName}(${argList})
if isinstance(_result, ListNode) or _result is None:
    print(json.dumps(list_to_array(_result), separators=(",", ":")))
elif isinstance(_result, bool):
    print("true" if _result else "false")
elif isinstance(_result, (list, dict)):
    print(json.dumps(_result, separators=(",", ":")))
else:
    print(_result)`
    : `
import json
_result = ${functionName}(${argList})
if isinstance(_result, bool):
    print("true" if _result else "false")
elif isinstance(_result, (list, dict)):
    print(json.dumps(_result, separators=(",", ":")))
else:
    print(_result)`;

  const wrappedCode = `
${usesListNode ? PYTHON_LISTNODE_HELPERS : ""}

${cleanCode}

${declarations}
${resultBlock}
`;

  return { sourceCode: wrappedCode.trim(), usesStdin: false };
};

// ─────────────────────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────────────────────
const buildSubmissionCode = (code, input, languageId) => {
  if (isJavaScript(languageId)) {
    return { sourceCode: generateJavaScriptWrapper(code, input), usesStdin: false };
  }
  if (isPython(languageId)) {
    return generatePythonWrapper(code, input);
  }
  if (isJava(languageId)) {
    return generateJavaWrapper(code, input);
  }
  if (isCpp(languageId)) {
    return generateCppWrapper(code, input);
  }
  return { sourceCode: code, usesStdin: true };
};

export { buildSubmissionCode };
