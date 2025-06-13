'use client';
import React, { useState } from 'react';

export default function Feedback() {
  const [text, setText] = useState('');
  const handleSubmit = () => {
    alert('Thanks for your feedback: ' + text);
    setText('');
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-2">Give Feedback</h2>
      <textarea
        className="w-full border p-2 mb-2"
        rows={4}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Your thoughts..."
      />
      <button onClick={handleSubmit} className="px-4 py-2 bg-green-600 text-white rounded">
        Submit
      </button>
    </div>
  );
}

