import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReset = () => {
        if (confirm('这将清除所有本地缓存（习惯数据）。确定要重置吗？\nThis will clear all local data. Are you sure?')) {
            localStorage.clear();
            window.location.reload();
        }
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#0f172a',
                    color: '#e2e8f0',
                    textAlign: 'center',
                    padding: '2rem'
                }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#f87171' }}>
                        出错了 (Something went wrong)
                    </h1>
                    <p style={{ maxWidth: '600px', marginBottom: '2rem', opacity: 0.8 }}>
                        应用遇到了一个严重错误导致崩溃。这通常是因为数据格式不兼容。
                        <br />
                        The application crashed due to an unexpected error.
                    </p>
                    <pre style={{
                        background: '#1e293b',
                        padding: '1rem',
                        borderRadius: '8px',
                        overflow: 'auto',
                        maxWidth: '800px',
                        marginBottom: '2rem',
                        color: '#fca5a5'
                    }}>
                        {this.state.error?.toString()}
                    </pre>
                    <button
                        onClick={this.handleReset}
                        style={{
                            background: '#dc2626',
                            color: 'white',
                            border: 'none',
                            padding: '1rem 2rem',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        重置所有数据并恢复 (Reset Data & Restore)
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
