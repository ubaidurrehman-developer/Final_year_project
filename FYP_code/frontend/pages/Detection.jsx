import { useReducer, useCallback, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload,
    X,
    ScanLine,
    FileImage,
    Clock,
    Hash,
    Clipboard,
    Check,
    AlertCircle,
    ArrowLeft,
    Send,
    Loader2
} from 'lucide-react';
import { api } from '../src/index';

const initialState = {
    file: null,
    preview: null,
    meta: "",
    isDragging: false,
    loading: false,
    results: null,
    error: "",
    copied: false,
};

function reducer(state, action) {
    switch (action.type) {
        case "SET_FILE":
            return {
                ...state,
                file: action.file,
                meta: action.meta,
                preview: action.preview,
                results: null,
                error: "",
            };

        case "LOADING":
            return { ...state, loading: true, error: "" };

        case "SUCCESS":
            return { ...state, loading: false, results: action.results };

        case "ERROR":
            return { ...state, loading: false, error: action.error };

        case "RESET":
            return initialState;

        case "DRAG":
            return { ...state, isDragging: action.value };

        case "COPIED":
            return { ...state, copied: action.value };

        default:
            return state;
    }
}

const Detection = () => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const [isProcessing, setIsProcessing] = useState(true);
    const [llmStatus, setLlmStatus] = useState('idle'); // 'idle', 'loading', 'success'

    const fileInputRef = useRef(null);
    const resultsRef = useRef(null);

    const { file, preview, meta, isDragging, loading, results, error, copied } = state;

    const processFile = useCallback((f) => {
        if (!f || !f.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            dispatch({
                type: 'SET_FILE',
                file: f,
                meta: `${f.name} (${(f.size / 1024).toFixed(1)} KB)`,
                preview: e.target.result,
            });
        };
        reader.readAsDataURL(f);
    }, []);

    const callingLLM = async (prompt) => {
        if (!prompt.trim() || !results?.raw) return;

        setLlmStatus('loading');
        try {
            const cleanSourceData = JSON.parse(JSON.stringify(results.raw));
            const response = await api.post('/llm/', {
                prompt: prompt,
                json: cleanSourceData
            });

            if (response.data?.updated_json) {
                dispatch({
                    type: 'SUCCESS',
                    results: {
                        ...results,
                        raw: response.data.updated_json
                    }
                });
                setLlmStatus('success');
                setTimeout(() => setLlmStatus('idle'), 2000);
            } else {
                setLlmStatus('idle');
            }
        } catch (err) {
            setLlmStatus('idle');
            dispatch({
                type: 'ERROR',
                error: 'Failed to refine data with LLM'
            });
            console.error("LLM Refinement Error:", err);
        }
    }

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        dispatch({ type: 'DRAG', value: false });
        if (e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
        }
    }, [processFile]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        dispatch({ type: 'DRAG', value: true });
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        dispatch({ type: 'DRAG', value: false });
    }, []);

    const handleFileSelect = (e) => {
        if (e.target.files.length > 0) {
            processFile(e.target.files[0]);
        }
    };

    const handleReset = () => {
        dispatch({ type: 'RESET' });
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDetection = async () => {
        if (!file) return;
        dispatch({ type: 'LOADING' });
        const startTime = performance.now();

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post('/detection/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);

            if (response.data.status === 'success') {
                dispatch({
                    type: 'SUCCESS',
                    results: {
                        count: response.data.count,
                        time: `${elapsed}s`,
                        raw: response.data,
                    },
                });
                console.log(response.data);
                setTimeout(() => {
                    resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            } else {
                dispatch({ type: 'ERROR', error: response.data.error || 'Detection failed' });
            }
        } catch (err) {
            dispatch({
                type: 'ERROR',
                error: err.response?.data?.message || err.response?.data?.error || 'Failed to run detection',
            });
        }
    };

    const handleCopyJson = async () => {
        if (!results) return;
        try {
            await navigator.clipboard.writeText(JSON.stringify(results.raw, null, 2));
            dispatch({ type: 'COPIED', value: true });
            setTimeout(() => dispatch({ type: 'COPIED', value: false }), 2000);
        } catch {
            dispatch({ type: 'ERROR', error: 'Failed to copy to clipboard' });
        }
    };

    return (
        isProcessing ? (
            <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[var(--page-bg)] transition-colors duration-300 py-12 px-4">
                {/* Background blobs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary-600 rounded-full blur-[120px] animate-blob" style={{ opacity: 'var(--blob-opacity)' }} />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-teal-600 rounded-full blur-[120px] animate-blob animation-delay-2000" style={{ opacity: 'var(--blob-opacity)' }} />
                    <div className="absolute top-[40%] left-[40%] w-[500px] h-[500px] bg-blue-600 rounded-full blur-[120px] animate-blob animation-delay-4000" style={{ opacity: 'var(--blob-opacity)' }} />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="relative z-10 w-full max-w-3xl"
                >
                    {/* Main Card */}
                    <div className="bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-3xl shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="px-8 pt-8 pb-4">
                            <div className="flex items-center gap-3 mb-1">
                                <div className="p-2.5 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl shadow-lg shadow-teal-500/20">
                                    <ScanLine className="h-6 w-6 text-white" />
                                </div>
                                <h1 className="text-2xl font-bold text-[var(--page-text)]">Document Analysis</h1>
                            </div>
                            <p className="text-sm text-[var(--text-muted)] ml-[52px]">Upload an image to detect and analyze document elements</p>
                        </div>

                        {/* Content */}
                        <div className="p-8 pt-4">
                            {/* Error */}
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 text-xs font-medium flex items-center gap-2"
                                    >
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Drop Zone */}
                            <div
                                onClick={() => !preview && fileInputRef.current?.click()}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                className={`
                                relative rounded-2xl border-2 border-dashed transition-all duration-300
                                ${preview
                                        ? 'border-[var(--glass-border)] bg-[var(--glass-bg)]'
                                        : isDragging
                                            ? 'border-teal-500 bg-teal-500/5 scale-[1.01]'
                                            : 'border-gray-300 dark:border-gray-600 bg-[var(--glass-bg)] hover:border-teal-400 hover:bg-teal-500/5 cursor-pointer'
                                    }
                            `}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />

                                <AnimatePresence mode="wait">
                                    {!preview ? (
                                        /* Upload Prompt */
                                        <motion.div
                                            key="prompt"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="flex flex-col items-center justify-center py-16 px-6"
                                        >
                                            <div className="p-4 bg-teal-500/10 rounded-2xl mb-4">
                                                <Upload className="h-10 w-10 text-teal-500" strokeWidth={1.5} />
                                            </div>
                                            <h3 className="text-lg font-semibold text-[var(--page-text)] mb-1">
                                                Drop Image Here
                                            </h3>
                                            <p className="text-sm text-[var(--text-muted)]">
                                                or click to browse files (JPG, PNG)
                                            </p>
                                        </motion.div>
                                    ) : (
                                        /* Preview */
                                        <motion.div
                                            key="preview"
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.98 }}
                                            className="p-5"
                                        >
                                            {/* Preview Header */}
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <FileImage className="h-4 w-4 text-teal-500" />
                                                    <span className="text-sm font-medium text-[var(--page-text)]">Preview</span>
                                                    <span className="text-xs text-[var(--text-muted)] bg-[var(--glass-bg)] border border-[var(--glass-border)] px-2 py-0.5 rounded-full">
                                                        {meta}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleReset(); }}
                                                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-all"
                                                    title="Reset"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>

                                            {/* Image */}
                                            <img
                                                src={preview}
                                                alt="Selected Document"
                                                className="w-full max-h-[400px] object-contain rounded-xl border border-[var(--glass-border)]"
                                            />

                                            {/* Run Detection Button */}
                                            <div className="flex justify-center mt-5">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDetection(); }}
                                                    disabled={loading}
                                                    className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:to-blue-500 text-white font-semibold py-3 px-8 rounded-full shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {loading ? (
                                                        isProcessing ? (
                                                            <>
                                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                                                <span className="text-sm">Processing...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Check className="h-5 w-5 text-green-300" strokeWidth={3} />
                                                                <span className="text-sm text-green-300 font-bold">Done</span>
                                                            </>
                                                        )
                                                    ) : (
                                                        <>
                                                            <ScanLine className="h-4 w-4" />
                                                            <span className="text-sm">Run Detection</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Results Section */}
                            <AnimatePresence>
                                {results && (
                                    <motion.div
                                        ref={resultsRef}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                        transition={{ duration: 0.4 }}
                                        className="mt-6"
                                    >
                                        <div className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-6">
                                            {/* Results Header */}
                                            <div className="flex items-center justify-between mb-5">
                                                <h2 className="text-lg font-bold text-[var(--page-text)]">Detection Results</h2>
                                                <button
                                                    onClick={handleCopyJson}
                                                    className="p-2 rounded-lg text-[var(--text-muted)] hover:text-teal-500 hover:bg-teal-500/10 transition-all"
                                                    title="Copy JSON"
                                                >
                                                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Clipboard className="h-4 w-4" />}
                                                </button>
                                            </div>

                                            {/* Stats */}
                                            <div className="grid grid-cols-2 gap-4 mb-5">
                                                <div className="bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl p-4 text-center">
                                                    <div className="flex items-center justify-center gap-1.5 mb-1">
                                                        <Hash className="h-4 w-4 text-teal-500" />
                                                    </div>
                                                    <div className="text-2xl font-bold text-teal-500">{results.count}</div>
                                                    <div className="text-xs text-[var(--text-muted)] mt-1">Items Found</div>
                                                </div>
                                                <div className="bg-[var(--card-bg)] border border-[var(--glass-border)] rounded-xl p-4 text-center">
                                                    <div className="flex items-center justify-center gap-1.5 mb-1">
                                                        <Clock className="h-4 w-4 text-blue-500" />
                                                    </div>
                                                    <div className="text-2xl font-bold text-blue-500">{results.time}</div>
                                                    <div className="text-xs text-[var(--text-muted)] mt-1">Time Taken</div>
                                                </div>
                                                <div className="text-1xl font-italic" onClick={() => {
                                                    setIsProcessing(false)
                                                }}>
                                                    Do you want to see results?
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            </div>

        ) : (
            <div className="min-h-screen w-full bg-[var(--page-bg)] py-12 px-4 transition-colors duration-300 relative overflow-hidden">
                {/* Background blobs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary-600 rounded-full blur-[120px] animate-blob" style={{ opacity: 'var(--blob-opacity)' }} />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-teal-600 rounded-full blur-[120px] animate-blob animation-delay-2000" style={{ opacity: 'var(--blob-opacity)' }} />
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative z-10 w-full max-w-4xl mx-auto"
                >
                    <div className="bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--glass-border)] rounded-3xl shadow-2xl p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-[var(--page-text)] mb-1">Extracted Fields</h1>
                                <p className="text-[var(--text-muted)] text-sm">Review the structured data pulled from your document</p>
                            </div>
                            <button
                                onClick={() => setIsProcessing(true)}
                                className="flex items-center gap-2 bg-[var(--glass-bg)] border border-[var(--glass-border)] hover:bg-[var(--glass-border)] text-[var(--page-text)] px-4 py-2.5 rounded-xl transition-all shadow-sm"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                <span className="font-medium text-sm">Upload New</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Array.isArray(results?.raw?.structured?.fields) &&
                                results.raw.structured.fields.map((field, index) => (
                                    <div
                                        key={index}
                                        className="bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-5 hover:border-teal-500/40 transition-colors group"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <h3 className="font-semibold text-[var(--page-text)] text-lg capitalize">
                                                {field.name?.replace(/_/g, " ")}
                                            </h3>

                                            <span className="text-[10px] font-bold px-2 py-1 bg-teal-500/10 text-teal-600 rounded-md uppercase tracking-wider">
                                                {field.type?.replace("_", " ")}
                                            </span>
                                        </div>

                                        <div className="mt-2">
                                            <p className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5 px-1">
                                                Extracted Value
                                            </p>

                                            <div className="bg-[var(--card-bg)] rounded-xl p-3 border border-[var(--glass-border)] group-hover:border-teal-500/20 transition-colors">
                                                <span
                                                    className={`text-sm ${field.value
                                                        ? "text-[var(--page-text)] font-semibold"
                                                        : "text-[var(--text-muted)] italic"
                                                        }`}
                                                >
                                                    {field.value ?? "No value present"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Confidence */}
                                        {field.confidence && (
                                            <div className="mt-2 text-[10px] text-teal-500 font-medium">
                                                Confidence: {(field.confidence * 100).toFixed(1)}%
                                            </div>
                                        )}

                                        {/* BBOX */}
                                        <div className="mt-4 flex items-center justify-between pt-3 border-t border-[var(--glass-border)]">
                                            <div className="flex gap-1.5 items-center flex-wrap">
                                                <span className="text-[10px] text-[var(--text-muted)] font-medium">
                                                    BBOX:
                                                </span>
                                                {field.bbox?.map((coord, i) => (
                                                    <span
                                                        key={i}
                                                        className="text-[10px] text-[var(--text-muted)] bg-[var(--page-bg)] px-1.5 py-0.5 rounded border border-[var(--glass-border)]"
                                                    >
                                                        {coord}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                            {/* Button */}
                            {results.raw?.structured?.fields && <div className="col-span-full flex justify-end">
                                <button className="bg-teal-500 text-white px-16 py-2 rounded-xl hover:bg-teal-600">
                                    Confirm
                                </button>
                            </div>
                            }
                        </div>

                        {results && (!results.raw?.structured?.fields || results.raw.structured.fields.length === 0) && (
                            <div className="w-full space-y-4">
                                <div className="text-center py-10 px-4 border-2 border-dashed border-red-500/20 bg-red-500/5 rounded-2xl mt-4">
                                    <div className="p-3 bg-red-500/10 inline-block rounded-full mb-3">
                                        <AlertCircle className="h-6 w-6 text-red-500" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-[var(--page-text)] mb-1">LLM Verification Failed</h3>
                                    <p className="text-sm text-[var(--text-muted)] max-w-sm mx-auto">
                                        This result is not verified by LLM because of a connection issue. Showing raw extracted data below.
                                    </p>
                                </div>

                                {results.raw?.final_result && (
                                    <div className="space-y-2">
                                        {results.raw.final_result.map((item, i) => (
                                            <div key={i} className="bg-[var(--glass-bg)] p-2 rounded">
                                                <p className="text-sm font-semibold">{item.text}</p>
                                                <p className="text-xs text-gray-500">
                                                    {(item.confidence * 100).toFixed(1)}%
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    {results.raw?.structured?.fields && <div className="w-full mt-8 relative group">
                        <textarea
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    callingLLM(e.target.value);
                                    e.target.value = "";
                                }
                            }}
                            rows={1}
                            placeholder="Enter prompt to refine / correct the extracted JSON..."
                            className="w-full resize-none rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] pl-4 pr-12 py-3 text-sm text-[var(--page-text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all shadow-sm"
                        />
                        <div className="absolute right-4 top-[30px] -translate-y-1/2 pointer-events-none transition-all">
                            {llmStatus === 'loading' ? (
                                <Loader2 className="h-4 w-4 animate-spin text-teal-500" />
                            ) : llmStatus === 'success' ? (
                                <Check className="h-4 w-4 text-green-500" />
                            ) : (
                                <Send className="h-4 w-4 text-[var(--text-muted)] group-focus-within:text-teal-500 transition-colors" />
                            )}
                        </div>
                    </div>
                    }
                </motion.div>
            </div>
        )
    );
};

export default Detection;
