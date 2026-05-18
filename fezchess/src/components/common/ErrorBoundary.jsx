import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Cấu trúc log thống nhất để dễ wire Sentry/LogRocket sau này.
    if (typeof window !== "undefined" && window.console) {
      console.error("[ErrorBoundary]", {
        message: error?.message,
        stack: error?.stack,
        componentStack: errorInfo?.componentStack,
      });
    }
    if (typeof this.props.onError === "function") {
      try {
        this.props.onError(error, errorInfo);
      } catch {
        /* ignore secondary failure */
      }
    }
  }

  handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof this.props.onReset === "function") {
      this.props.onReset();
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.props.fallback) {
      return typeof this.props.fallback === "function"
        ? this.props.fallback({
            error: this.state.error,
            reset: this.handleReset,
            reload: this.handleReload,
          })
        : this.props.fallback;
    }

    const error = this.state.error;
    const message = error?.message || "Đã xảy ra lỗi không mong muốn.";

    return (
      <div className="min-h-[60vh] w-full flex items-center justify-center px-4 py-10 bg-background text-foreground">
        <div className="max-w-md w-full rounded-2xl border border-border bg-card shadow-sm p-6 md:p-8 space-y-4 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center text-2xl font-bold">
            !
          </div>
          <h2 className="text-xl md:text-2xl font-semibold">Có gì đó không ổn</h2>
          <p className="text-sm md:text-base text-muted-foreground">{message}</p>
          <p className="text-xs text-muted-foreground/80">
            Bạn có thể tải lại trang hoặc quay về trang chủ. Nếu lỗi lặp lại, hãy liên hệ quản trị viên.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
            <button
              onClick={this.handleReset}
              type="button"
              className="px-4 py-2 rounded-lg border border-border hover:bg-muted/50 text-sm transition-colors"
            >
              Thử lại
            </button>
            <button
              onClick={this.handleReload}
              type="button"
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-sm transition-opacity"
            >
              Tải lại trang
            </button>
          </div>
          {import.meta.env?.DEV && error?.stack ? (
            <pre className="mt-4 text-left text-[11px] text-muted-foreground overflow-auto max-h-48 rounded-lg bg-muted/40 p-3">
              {error.stack}
            </pre>
          ) : null}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
