// src/app/(themed)/admin/dashboard/DashBoardComponents/AddMessage/OtherFields.tsx
'use client';

import React from 'react';

type Line = {
  id: string;
  text: string;
  fontSize: 'heading1' | 'heading2' | 'heading3' | 'body';
  colorVar: string;
  language: 'english' | 'arabic';
};

type OtherFieldsProps = {
  lines: Line[];
  setLines: React.Dispatch<React.SetStateAction<Line[]>>;
};

export default function OtherFields({ lines, setLines }: OtherFieldsProps) {
  const cssColorOptions = [
    { label: 'Text Color', value: '--text-color' },
    { label: 'Accent Color', value: '--accent-color' },
    { label: 'Secondary Color', value: '--secondary-color' },
    { label: 'Yellow', value: '--yellow' },
  ];

  const fontSizeOptions: { label: string; value: Line['fontSize'] }[] = [
    { label: 'Heading 1', value: 'heading1' },
    { label: 'Heading 2', value: 'heading2' },
    { label: 'Heading 3', value: 'heading3' },
    { label: 'Body', value: 'body' },
  ];

  const addLine = () => {
    setLines((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        text: '',
        fontSize: 'body',
        colorVar: '--text-color',
        language: 'english',
      },
    ]);
  };

  const updateLine = (
    id: string,
    changes: Partial<Omit<Line, 'id'>>
  ) => {
    setLines((prev) =>
      prev.map((ln) => (ln.id === id ? { ...ln, ...changes } : ln))
    );
  };

  const removeLine = (id: string) => {
    setLines((prev) => prev.filter((ln) => ln.id !== id));
  };

  // Map fontSize keys to Tailwind classes
  const fontSizeClass: Record<Line['fontSize'], string> = {
    heading1: 'text-2xl font-bold',
    heading2: 'text-xl font-semibold',
    heading3: 'text-lg font-medium',
    body: 'text-base',
  };

  return (
    <div className="space-y-4">
      {/* Lines Editor */}
      {lines.map((line, idx) => (
        <div key={line.id} className="border rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-[var(--text-color)]">
              Line {idx + 1}
            </h4>
            {lines.length > 1 && (
              <button
                onClick={() => removeLine(line.id)}
                className="text-red-500 hover:text-red-700"
                aria-label={`Remove line ${idx + 1}`}
              >
                ×
              </button>
            )}
          </div>

          {/* Text input */}
          <textarea
            value={line.text}
            onChange={(e) => updateLine(line.id, { text: e.target.value })}
            placeholder="Enter text"
            rows={2}
            className="w-full border rounded p-2 bg-[var(--background-end)] text-[var(--text-color)]"
          />

          <div className="flex flex-wrap gap-4">
            {/* Font size selector */}
            <div className="flex flex-col">
              <label className="text-sm text-[var(--text-color)]">
                Font Size
              </label>
              <select
                value={line.fontSize}
                onChange={(e) =>
                  updateLine(line.id, {
                    fontSize: e.target.value as Line['fontSize'],
                  })
                }
                className="p-2 rounded border bg-[var(--background-end)] text-[var(--text-color)]"
              >
                {fontSizeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Color selector */}
            <div className="flex flex-col">
              <label className="text-sm text-[var(--text-color)]">Color</label>
              <select
                value={line.colorVar}
                onChange={(e) =>
                  updateLine(line.id, { colorVar: e.target.value })
                }
                className="p-2 rounded border bg-[var(--background-end)] text-[var(--text-color)]"
              >
                {cssColorOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Language selector */}
            <div className="flex flex-col">
              <label className="text-sm text-[var(--text-color)]">Language</label>
              <select
                value={line.language}
                onChange={(e) =>
                  updateLine(line.id, {
                    language: e.target.value as Line['language'],
                  })
                }
                className="p-2 rounded border bg-[var(--background-end)] text-[var(--text-color)]"
              >
                <option value="english">English</option>
                <option value="arabic">Arabic</option>
              </select>
            </div>
          </div>
        </div>
      ))}

      {/* Add another line button */}
      <button
        onClick={addLine}
        className="underline text-[var(--accent-color)]"
      >
        + Add another line
      </button>

      {/* Preview Area */}
      <div className="mt-6 border-t pt-4">
        <h3 className="text-lg font-semibold text-[var(--text-color)] mb-2">
          Preview
        </h3>
        <div className="space-y-2">
          {lines.map((line) => (
            <p
              key={line.id}
              className={`${fontSizeClass[line.fontSize]} ${
                line.language === 'arabic' ? 'text-right' : 'text-left'
              }`}
              style={{ color: `var(${line.colorVar})` }}
            >
              {line.text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
