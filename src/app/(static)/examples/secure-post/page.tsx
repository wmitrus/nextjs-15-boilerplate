'use client';

import { useState } from 'react';

import { apiClient } from '@/lib/api/client';

import type { ApiResponse } from '@/types/responseService';

// Shape returned by /api/examples/secure-post on success
type SecurePostData = { echoed: { name: string; message: string } };
type SecurePostResponse = ApiResponse<SecurePostData>;

export default function SecurePostExamplePage() {
  const [name, setName] = useState('Alice');
  const [message, setMessage] = useState('Hello <b>world</b>!');
  const [result, setResult] = useState<SecurePostResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await apiClient.post<SecurePostData>(
        '/api/examples/secure-post',
        { name, message },
      );
      setResult(response);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Secure POST Example</h1>
      <p className="mb-4 text-sm text-gray-600">
        Demonstrates CSRF protection and deep sanitization of JSON inputs.
      </p>

      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            className="mt-1 w-full rounded border px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium">
            Message
          </label>
          <input
            id="message"
            className="mt-1 w-full rounded border px-3 py-2"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <p className="mt-1 text-xs text-gray-500">
            Any HTML will be sanitized server-side.
          </p>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : 'Send'}
        </button>
      </form>

      {result && (
        <pre className="mt-6 overflow-auto rounded bg-gray-100 p-4 text-sm">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
