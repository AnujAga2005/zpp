export const KEYWORDS: Record<string, string> = {
  // I/O & Values
  yap: "console.log",
  gimme: "prompt",
  no_cap: "true",
  cap: "false",
  ghosted: "null",
  
  // Control Flow
  bet: "if",
  hol_up: "else if",
  ratio: "else",
  doomscroll: "for",
  grind: "while",
  ragequit: "break",
  continue: "continue",
  nvm: "// pass",
  
  // Functions & Classes
  cook: "function",
  serve: "return",
  leak: "yield",
  squad: "class",
  me: "this",
  
  // Error Handling
  fuck_around: "try",
  find_out: "catch",
  ong: "finally",
  crashout: "throw new Error",
  fr: "assert",
  
  // Logic & Ops
  and: "&&",
  or: "||",
  sike: "!",
  is: "===",
  in: "in",
  
  // Declarations
  yoink: "import",
  from: "from",
  aka: "as",
  cancel: "delete",
  global: "var",
  be: "=",
  let: "let",
};

export const compileToJS = (source: string): string => {
  const lines = source.split("\n");
  let jsLines: string[] = [];
  let indentStack: number[] = [0]; 

  lines.forEach((line) => {
    if (line.trim() === "") return; // Skip empty lines

    const currentIndent = line.search(/\S/);
    const trimmedLine = line.trim();

    // Handle Dedentation (Closing Blocks)
    while (currentIndent < indentStack[indentStack.length - 1]) {
      indentStack.pop();
      jsLines.push("}");
    }

    // Handle Block Start (Python style ':')
    let processedLine = trimmedLine;
    if (processedLine.endsWith(":")) {
      processedLine = processedLine.slice(0, -1) + " {";
      indentStack.push(currentIndent + 2); 
    }

    // Tokenize and Translate
    const tokens = processedLine.split(/([{}()=\s,.:+\-*/%]|"[^"]*")/g);
    const translatedTokens = tokens.map(token => {
      if (token.startsWith('"') || token.startsWith("'")) return token;
      return KEYWORDS[token] || token;
    });

    jsLines.push(translatedTokens.join(""));
  });

  // Close remaining blocks
  while (indentStack.length > 1) {
    indentStack.pop();
    jsLines.push("}");
  }

  return jsLines.join("\n");
};
