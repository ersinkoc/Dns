interface CodeBlockProps {
  filename: string;
  language: string;
  children: string;
  lineNumbers?: boolean;
}

export function CodeBlock({ filename, language, children, lineNumbers = true }: CodeBlockProps) {
  const lines = children.trim().split('\n');

  return (
    <div className="code-block">
      <div className="code-header">
        <span className="font-mono text-xs">{filename}</span>
        <button
          onClick={() => navigator.clipboard.writeText(children)}
          className="copy-button"
          aria-label="Copy code"
        >
          Copy
        </button>
      </div>
      <div className="code-content">
        <pre className={`language-${language}`}>
          <code>
            {lineNumbers ? (
              lines.map((line, i) => (
                <div key={i} className="flex">
                  <span className="line-numbers select-none">{i + 1}</span>
                  <span>{line || ' '}</span>
                </div>
              ))
            ) : (
              children
            )}
          </code>
        </pre>
      </div>
    </div>
  );
}
