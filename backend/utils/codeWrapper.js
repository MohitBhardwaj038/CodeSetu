const JS_LANGUAGE_IDS = new Set([63]);
const JAVA_LANGUAGE_IDS = new Set([62, 91]);
const CPP_LANGUAGE_IDS = new Set([52, 53, 54, 76]);

const isJavaScript = (languageId) => JS_LANGUAGE_IDS.has(languageId);
const isJava = (languageId) => JAVA_LANGUAGE_IDS.has(languageId);
const isCpp = (languageId) => CPP_LANGUAGE_IDS.has(languageId);

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
  return value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
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

function getFunctionName(code) {
  const match =
    code.match(/function\s+(\w+)\s*\(/) ||
    code.match(/var\s+(\w+)\s*=\s*function/) ||
    code.match(/const\s+(\w+)\s*=\s*\(/);
  return match ? match[1] : null;
}

function getJavaMethodName(code) {
  const regex = /(?:public|private|protected)?\s*(?:static\s*)?[\w<>\[\]]+\s+(\w+)\s*\([^;{]*\)\s*\{/g;
  let match;
  while ((match = regex.exec(code)) !== null) {
    if (match[1] !== "main") {
      return match[1];
    }
  }
  return null;
}

function getCppFunctionName(code) {
  const regex = /(?:^|\s)[\w:<>&*\[\]]+\s+(\w+)\s*\([^;{]*\)\s*\{/g;
  let match;
  while ((match = regex.exec(code)) !== null) {
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

function buildJavaDeclarations(assignments) {
  const declarations = [];
  const argNames = [];

  assignments.forEach(({ name, value }) => {
    const typeInfo = inferValueType(value);
    argNames.push(name);

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

function buildCppDeclarations(assignments) {
  const declarations = [];
  const argNames = [];

  assignments.forEach(({ name, value }) => {
    const typeInfo = inferValueType(value);
    argNames.push(name);

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

  const declarations = assignments
    .map(({ name, value }) => `const ${name} = ${value};`)
    .join("\n");
  const argList = assignments.map(({ name }) => name).join(", ");

  const wrappedCode = `
${code}

${declarations}

const result = ${functionName}(${argList});
console.log(JSON.stringify(result));
`;

  console.log("Wrapped Code:\n", wrappedCode);
  return wrappedCode;
};

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

  const sanitizedCode = sanitizeJavaCode(code);
  const hasSolutionClass = /class\s+Solution\b/.test(sanitizedCode);
  const solutionCode = hasSolutionClass
    ? sanitizedCode
    : `class Solution {\n${indentLines(sanitizedCode, "  ")}\n}`;

  const { declarations, argList } = buildJavaDeclarations(assignments);
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
      sb.append("\\\"").append(escapeJson(arr[i])).append("\\\"");
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
      return "\\\"" + escapeJson((String) obj) + "\\\"";
    }
    if (obj instanceof Boolean) {
      return ((Boolean) obj) ? "true" : "false";
    }
    return String.valueOf(obj);
  }

  public static void main(String[] args) {
    ${indentLines(declarations, "    ")}
    Solution solution = new Solution();
    Object result = solution.${methodName}(${argList});
    System.out.println(toJson(result));
  }
}`;

  return {
    sourceCode: `import java.util.*;\n${solutionCode}\n${mainCode}`,
    usesStdin: false,
  };
};

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

  const { declarations, argList } = buildCppDeclarations(assignments);
  const hasSolutionClass = /class\s+Solution\b/.test(code);
  const callLine = hasSolutionClass
    ? `Solution solution; auto result = solution.${functionName}(${argList});`
    : `auto result = ${functionName}(${argList});`;

  const helperCode = `
string escapeJson(const string& value) {
  string out;
  out.reserve(value.size());
  for (char ch : value) {
    if (ch == '\\' || ch == '"') {
      out.push_back('\\');
    }
    out.push_back(ch);
  }
  return out;
}

void printResult(const string& value) {
  cout << "\"" << escapeJson(value) << "\"";
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

  return {
    sourceCode: `#include <bits/stdc++.h>\nusing namespace std;\n${code}\n${helperCode}\n${mainCode}`,
    usesStdin: false,
  };
};

const buildSubmissionCode = (code, input, languageId) => {
  if (isJavaScript(languageId)) {
    return { sourceCode: generateJavaScriptWrapper(code, input), usesStdin: false };
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
