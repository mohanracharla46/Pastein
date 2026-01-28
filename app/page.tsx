'use client';

import { useState } from 'react';

export default function Home() {
  const [content, setContent] = useState('');
  const [ttl, setTtl] = useState('');
  const [maxViews, setMaxViews] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: string; url: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/pastes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          ttl_seconds: ttl ? parseInt(ttl, 10) : undefined,
          max_views: maxViews ? parseInt(maxViews, 10) : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setResult(data);
      setContent('');
      setTtl('');
      setMaxViews('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result.url);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="container">
      <div className="paste-card">
        <h1>Create a New Paste</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="content">Content (Required)</label>
            <textarea
              id="content"
              placeholder="Paste your text here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          <div className="grid">
            <div className="form-group">
              <label htmlFor="ttl">TTL (Seconds, Optional)</label>
              <input
                type="number"
                id="ttl"
                placeholder="e.g. 3600"
                min="1"
                value={ttl}
                onChange={(e) => setTtl(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="maxViews">Max Views (Optional)</label>
              <input
                type="number"
                id="maxViews"
                placeholder="e.g. 5"
                min="1"
                value={maxViews}
                onChange={(e) => setMaxViews(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Creating...' : 'Create Paste'}
          </button>
        </form>

        {result && (
          <div className="success-message">
            <p><strong>Success!</strong> Your paste is ready:</p>
            <div className="copy-area">
              <input type="text" readOnly value={result.url} />
              <button onClick={copyToClipboard} className="btn" style={{ width: 'auto' }}>
                Copy
              </button>
            </div>
            <p style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
              <a href={result.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                View Paste &rarr;
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
