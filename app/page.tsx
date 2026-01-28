'use client';

import { useState, useRef, useEffect } from 'react';

const TTL_OPTIONS = [
  { label: 'Never', value: '' },
  { label: '30 seconds', value: '30' },
  { label: '1 minute', value: '60' },
  { label: '30 min', value: '1800' },
  { label: '1 Hour', value: '3600' },
  { label: '1 Day', value: '86400' },
  { label: '1 Week', value: '604800' },
  { label: '1 Month', value: '2592000' },
];

export default function Home() {
  const [content, setContent] = useState('');
  const [ttl, setTtl] = useState('');
  const [maxViews, setMaxViews] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsSelectOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const selectedTtlLabel = TTL_OPTIONS.find(opt => opt.value === ttl)?.label || 'Never';

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
              <label>Expiration (Optional)</label>
              <div
                className={`custom-select-container ${isSelectOpen ? 'open' : ''}`}
                ref={selectRef}
              >
                <div
                  className="custom-select-trigger"
                  onClick={() => setIsSelectOpen(!isSelectOpen)}
                >
                  <span>{selectedTtlLabel}</span>
                  <svg className="custom-select-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {isSelectOpen && (
                  <div className="custom-select-options">
                    {TTL_OPTIONS.map((option) => (
                      <div
                        key={option.value}
                        className={`custom-select-option ${ttl === option.value ? 'selected' : ''}`}
                        onClick={() => {
                          setTtl(option.value);
                          setIsSelectOpen(false);
                        }}
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
          <div className="modal-overlay" onClick={() => setResult(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setResult(null)}>&times;</button>
              <div className="modal-icon">✓</div>
              <h2 style={{ marginBottom: '0.5rem', color: 'var(--foreground)' }}>Paste Created!</h2>
              <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
                Your shareable link is ready below.
              </p>
              <div className="copy-area">
                <input type="text" readOnly value={result.url} id="result-url" />
                <button
                  onClick={copyToClipboard}
                  className="btn"
                  style={{ width: 'auto', whiteSpace: 'nowrap' }}
                >
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <a
                  href={result.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                  style={{ textDecoration: 'none' }}
                >
                  View Paste
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
