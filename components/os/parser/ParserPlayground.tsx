'use client';

import { useState } from 'react';
import { groupedExamples } from '@/lib/action-parser/commandCorpus';

export default function ParserPlayground() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<any>(null);
  const [filter, setFilter] = useState('all');

  const handleParse = async () => {
    const res = await fetch('/api/parse-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: input }),
    });
    const data = await res.json();
    setResult(data);
  };

  const examples = filter === 'all'
    ? Object.values(groupedExamples).flat()
    : groupedExamples[filter] || [];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Universal Action Parser Playground</h1>

      <div>
        <label>Filter corpus: </label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          {Object.keys(groupedExamples).map((key) => (
            <option key={key} value={key}>{key}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        {examples.slice(0, 10).map((ex, i) => (
          <button
            key={i}
            onClick={() => setInput(ex.text)}
            className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm"
          >
            {ex.text.slice(0, 40)}...
          </button>
        ))}
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={3}
        className="w-full border p-2 rounded"
        placeholder="Type a command…"
      />
      <button onClick={handleParse} className="bg-blue-500 text-white px-4 py-2 rounded">
        Parse
      </button>

      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold">Parsed JSON</h2>
          <pre className="text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      {result && (
        <div className="bg-green-50 p-4 rounded">
          <h2 className="font-semibold">Execution Preview</h2>
          <p>{result.preview || 'No preview available'}</p>
          <div className="flex gap-2 mt-2">
            <button className="bg-green-500 text-white px-3 py-1 rounded">Confirm (mock)</button>
            <button className="bg-red-500 text-white px-3 py-1 rounded">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
