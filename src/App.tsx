import { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Code, Terminal, Play, Trash2, Home, Zap, Sparkles, Rocket, Sun, Moon } from 'lucide-react';
import { compileToJS, KEYWORDS } from './compiler';

interface TerminalLine {
  type: 'log' | 'error' | 'info';
  content: string;
}

const DEFAULT_CODE = `yap("Hello, Z++ World!")

cook greet(name):
  yap("Yo, " + name + "!")

greet("Developer")

let x be 10
bet (x > 5):
  yap("x is bussin")
ratio:
  yap("x is mid")

doomscroll (let i be 0; i < 3; i++):
  yap("Count: " + i)
`;

const EXAMPLES = [
  {
    title: "Hello World",
    icon: Sparkles,
    code: `yap("Hello, Z++ World!")`,
    output: "Hello, Z++ World!"
  },
  {
    title: "Functions",
    icon: Zap,
    code: `cook greet(name):
  yap("Yo " + name + "!")
  
greet("Alex")`,
    output: "Yo Alex!"
  },
  {
    title: "Conditionals",
    icon: Code,
    code: `let vibe be "bussin"

bet (vibe is "bussin"):
  yap("It's bussin fr fr")
ratio:
  yap("It's mid ngl")`,
    output: "It's bussin fr fr"
  },
  {
    title: "Loops",
    icon: Rocket,
    code: `doomscroll (let i be 0; i < 3; i++):
  yap("Iteration: " + i)`,
    output: `Iteration: 0
Iteration: 1
Iteration: 2`
  },
  {
    title: "Variables",
    icon: Terminal,
    code: `let mood be "excited"
let score be 100

yap(mood + " score: " + score)`,
    output: "excited score: 100"
  },
  {
    title: "Error Handling",
    icon: Code,
    code: `fuck_around:
  yap("Trying something risky...")
find_out(error):
  yap("Caught an error!")`,
    output: "Trying something risky..."
  }
];

export default function App() {
  const [showPlayground, setShowPlayground] = useState(false);
  const [code, setCode] = useState(DEFAULT_CODE);
  const [terminalOutput, setTerminalOutput] = useState<TerminalLine[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const editorRef = useRef<any>(null);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('zpp-theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('zpp-theme', newTheme);
    
    // Update Monaco editor theme
    if (editorRef.current) {
      const monaco = (window as any).monaco;
      if (monaco) {
        monaco.editor.setTheme(newTheme === 'light' ? 'light-minimal' : 'dark-minimal');
      }
    }
  };

  // Initialize Monaco Editor with Z++ language support
  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Register Z++ language
    monaco.languages.register({ id: 'zpp' });

    // Define Z++ tokens
    monaco.languages.setMonarchTokensProvider('zpp', {
      keywords: Object.keys(KEYWORDS),
      symbols: /[=><!~?:&|+\-*\/\^%]+/,
      tokenizer: {
        root: [
          [/[a-z_$][\w$]*/, {
            cases: {
              '@keywords': 'keyword',
              '@default': 'identifier'
            }
          }],
          [/"([^"\\]|\\.)*$/, 'string.invalid'],
          [/"/, 'string', '@string'],
          [/\d+/, 'number'],
          [/[{}()\[\]]/, '@brackets'],
          [/@symbols/, 'operator'],
          [/\s+/, 'white'],
        ],
        string: [
          [/[^\\"]+/, 'string'],
          [/"/, 'string', '@pop']
        ],
      },
    });

    // Configure autocomplete for Z++ keywords
    monaco.languages.registerCompletionItemProvider('zpp', {
      provideCompletionItems: () => {
        const suggestions = Object.keys(KEYWORDS).map((keyword: string) => ({
          label: keyword,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: keyword,
          detail: `Z++ Keyword → ${KEYWORDS[keyword]}`,
          documentation: `Transpiles to: ${KEYWORDS[keyword]}`,
        }));
        return { suggestions };
      },
    });

    // Define light theme
    monaco.editor.defineTheme('light-minimal', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '000000', fontStyle: 'bold' },
        { token: 'identifier', foreground: '333333' },
        { token: 'string', foreground: '000000' },
        { token: 'number', foreground: '000000' },
        { token: 'operator', foreground: '666666' },
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#000000',
        'editorLineNumber.foreground': '#999999',
        'editorCursor.foreground': '#000000',
        'editor.selectionBackground': '#e0e0e0',
        'editor.lineHighlightBackground': '#f5f5f5',
      },
    });

    // Define dark theme
    monaco.editor.defineTheme('dark-minimal', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'ffffff', fontStyle: 'bold' },
        { token: 'identifier', foreground: 'cccccc' },
        { token: 'string', foreground: 'ffffff' },
        { token: 'number', foreground: 'ffffff' },
        { token: 'operator', foreground: 'aaaaaa' },
      ],
      colors: {
        'editor.background': '#000000',
        'editor.foreground': '#ffffff',
        'editorLineNumber.foreground': '#666666',
        'editorCursor.foreground': '#ffffff',
        'editor.selectionBackground': '#333333',
        'editor.lineHighlightBackground': '#0a0a0a',
      },
    });

    // Set initial theme
    monaco.editor.setTheme(theme === 'light' ? 'light-minimal' : 'dark-minimal');
  };

  const handleRunCode = () => {
    try {
      // Clear previous output
      setTerminalOutput([]);

      // Compile Z++ to JavaScript
      const jsCode = compileToJS(code);

      // Capture console.log outputs
      const logs: TerminalLine[] = [];
      const originalLog = console.log;
      const originalError = console.error;

      console.log = (...args: any[]) => {
        logs.push({
          type: 'log',
          content: args.map(arg => String(arg)).join(' '),
        });
        originalLog.apply(console, args);
      };

      console.error = (...args: any[]) => {
        logs.push({
          type: 'error',
          content: args.map(arg => String(arg)).join(' '),
        });
        originalError.apply(console, args);
      };

      // Execute the compiled JavaScript
      try {
        // eslint-disable-next-line no-eval
        eval(jsCode);
        logs.push({
          type: 'info',
          content: '\n✓ Execution completed successfully',
        });
      } catch (execError: any) {
        logs.push({
          type: 'error',
          content: `Runtime Error: ${execError.message}`,
        });
      }

      // Restore original console methods
      console.log = originalLog;
      console.error = originalError;

      setTerminalOutput(logs);
    } catch (error: any) {
      setTerminalOutput([
        {
          type: 'error',
          content: `Compilation Error: ${error.message}`,
        },
      ]);
    }
  };

  const handleClearTerminal = () => {
    setTerminalOutput([]);
  };

  const handleGoHome = () => {
    setShowPlayground(false);
  };

  if (!showPlayground) {
    return (
      <div className="landing">
        {/* Theme Toggle */}
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'light' ? <Moon /> : <Sun />}
        </button>

        <div className="landing-content">
          <div className="logo">Z++</div>
          <div className="tagline">Code Like You Text - The Gen Z Programming Language</div>
          
          <button className="enter-btn" onClick={() => setShowPlayground(true)}>
            Enter Playground
          </button>

          <div className="creator-credit">
            created by <a href="https://github.com/AnujAga2005" target="_blank" rel="noopener noreferrer" className="creator-link">Anuj Agarwal</a>
          </div>

          <div className="features">
            <div className="feature">
              <Code />
              <span>Python-Style Syntax</span>
            </div>
            <div className="feature">
              <Terminal />
              <span>Slang Keywords</span>
            </div>
            <div className="feature">
              <Play />
              <span>Instant Transpiler</span>
            </div>
          </div>

          {/* Code Examples Section */}
          <div className="examples-section">
            <div className="examples-title">Learn Z++ in Minutes</div>
            <div className="examples-grid">
              {EXAMPLES.map((example, index) => {
                const IconComponent = example.icon;
                return (
                  <div key={index} className="example-card">
                    <div className="example-header">
                      <div className="example-icon">
                        <IconComponent size={16} />
                      </div>
                      <div className="example-title">{example.title}</div>
                    </div>
                    <div className="example-code">{example.code}</div>
                    <div className="example-output">
                      <span className="output-label">Output:</span>
                      {example.output}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="playground">
      {/* Theme Toggle */}
      <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
        {theme === 'light' ? <Moon /> : <Sun />}
      </button>

      {/* Header */}
      <div className="header">
        <div className="header-left">
          <div className="title">Z++</div>
          <div className="subtitle">Gen Z Programming Language</div>
        </div>
        <div className="header-actions">
          <button className="btn" onClick={handleGoHome}>
            <Home />
            <span>Home</span>
          </button>
          <button className="btn" onClick={handleClearTerminal}>
            <Trash2 />
            <span>Clear</span>
          </button>
          <button className="btn btn-primary" onClick={handleRunCode}>
            <Play />
            <span>Run Code</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Editor Panel */}
        <div className="editor-panel">
          <div className="panel-header">
            <Code />
            <span>Z++ Editor</span>
          </div>
          <div className="editor-container">
            <Editor
              height="100%"
              defaultLanguage="zpp"
              language="zpp"
              value={code}
              onChange={(value) => setCode(value || '')}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'SF Mono', 'Monaco', 'Courier New', monospace",
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: 'on',
                bracketPairColorization: { enabled: true },
                suggest: {
                  showKeywords: true,
                },
              }}
            />
          </div>
        </div>

        {/* Output Panel */}
        <div className="output-panel">
          <div className="panel-header">
            <Terminal />
            <span>Terminal Output</span>
          </div>
          <div className="output-content">
            <div className="terminal">
              {terminalOutput.length === 0 ? (
                <div className="empty-state">
                  <Terminal />
                  <div>Press "Run Code" to execute your Z++ program</div>
                </div>
              ) : (
                terminalOutput.map((line, index) => (
                  <div
                    key={index}
                    className={`terminal-line ${
                      line.type === 'error' ? 'terminal-error' : ''
                    }`}
                  >
                    <span className="terminal-prompt">{'>'}</span>
                    {line.content}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
