const Spinner = () => {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-[var(--page-bg)] z-50">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--glass-border)] border-t-primary-500" />
                <p className="text-sm text-[var(--text-muted)] font-medium">Loading...</p>
            </div>
        </div>
    );
};

export default Spinner;