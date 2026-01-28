import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="container">
            <div className="paste-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <div className="modal-icon" style={{ background: 'rgba(100, 116, 139, 0.1)', color: 'var(--text-muted)' }}>?</div>
                <h1 style={{
                    background: 'linear-gradient(to right, #64748b, #94a3b8)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '1rem'
                }}>
                    404 - Not Found
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '2.5rem' }}>
                    We couldn't find the paste you were looking for. It may have been deleted or the link might be incorrect.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Link href="/" className="btn" style={{ width: 'auto', padding: '0.75rem 2.5rem', textDecoration: 'none' }}>
                        Go to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
