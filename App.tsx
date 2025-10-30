
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateProductName } from './services/geminiService';

// --- Helper Functions & Utilities ---

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Return only the base64 part
            resolve(result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
    });
};

// --- SVG Icons (defined outside components to prevent re-creation) ---

const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
    </svg>
);

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
);

const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
    </svg>
);


// --- UI Components ---

const Header: React.FC = () => (
    <header className="text-center p-4 md:p-6 border-b border-slate-700">
        <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
            AI Product Namer
        </h1>
        <p className="text-slate-400 mt-2">Powered by Gemini - Your first step to perfect product branding.</p>
    </header>
);

interface ImageUploaderProps {
    onImageSelect: (file: File) => void;
    previewUrl: string | null;
    isLoading: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageSelect, previewUrl, isLoading }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onImageSelect(file);
        }
    };

    const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
        const file = event.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            onImageSelect(file);
        }
    };
    
    const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
        event.preventDefault();
    };

    return (
        <div className="w-full max-w-lg mx-auto">
            <label 
                htmlFor="image-upload" 
                className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-800 hover:bg-slate-700 transition-colors ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                {previewUrl ? (
                    <img src={previewUrl} alt="Product preview" className="object-contain w-full h-full rounded-lg" />
                ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-400">
                        <UploadIcon className="w-10 h-10 mb-3" />
                        <p className="mb-2 text-sm font-semibold">Click to upload or drag and drop</p>
                        <p className="text-xs">PNG, JPG, GIF up to 10MB</p>
                    </div>
                )}
                <input 
                    id="image-upload" 
                    ref={fileInputRef} 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    disabled={isLoading}
                />
            </label>
        </div>
    );
};

interface ResultDisplayProps {
    productName: string;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ productName }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(productName);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!productName) return null;

    return (
        <div className="w-full max-w-lg mx-auto mt-8 p-6 bg-slate-800 rounded-lg shadow-lg border border-slate-700 animate-fade-in">
            <h3 className="text-lg font-medium text-slate-400 mb-2">Generated Product Name:</h3>
            <div className="flex items-center justify-between gap-4">
                <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-indigo-400 flex-grow">
                    {productName}
                </p>
                <button
                    onClick={handleCopy}
                    className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    title="Copy to clipboard"
                >
                    {copied ? 'Copied!' : <CopyIcon className="w-5 h-5" />}
                </button>
            </div>
        </div>
    );
};

const Loader: React.FC = () => (
    <div className="flex items-center justify-center space-x-2">
        <div className="w-4 h-4 rounded-full animate-pulse bg-indigo-400"></div>
        <div className="w-4 h-4 rounded-full animate-pulse bg-indigo-400" style={{ animationDelay: '0.2s' }}></div>
        <div className="w-4 h-4 rounded-full animate-pulse bg-indigo-400" style={{ animationDelay: '0.4s' }}></div>
        <span className="ml-2 text-slate-300">Analyzing...</span>
    </div>
);


// --- Main App Component ---

const App: React.FC = () => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [productName, setProductName] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    // Effect to clean up the object URL to prevent memory leaks
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleImageSelect = (file: File) => {
        setImageFile(file);
        // Revoke old URL if it exists
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(URL.createObjectURL(file));
        setProductName('');
        setError('');
    };

    const handleAnalyzeClick = useCallback(async () => {
        if (!imageFile) {
            setError('Please upload an image first.');
            return;
        }

        setIsLoading(true);
        setError('');
        setProductName('');

        try {
            const base64String = await fileToBase64(imageFile);
            const generatedName = await generateProductName(base64String, imageFile.type);
            setProductName(generatedName);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred during analysis.');
        } finally {
            setIsLoading(false);
        }
    }, [imageFile]);

    return (
        <div className="min-h-screen flex flex-col font-sans">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8 md:py-12 flex flex-col items-center">
                <div className="w-full flex flex-col items-center gap-8">
                    <ImageUploader onImageSelect={handleImageSelect} previewUrl={previewUrl} isLoading={isLoading} />

                    {error && <p className="text-red-400 text-center">{error}</p>}
                    
                    <div className="h-12 flex items-center">
                        {isLoading ? (
                            <Loader />
                        ) : (
                            <button
                                onClick={handleAnalyzeClick}
                                disabled={!imageFile || isLoading}
                                className="flex items-center gap-2 px-8 py-3 font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 disabled:scale-100"
                            >
                                <SparklesIcon className="w-5 h-5" />
                                Generate Name
                            </button>
                        )}
                    </div>
                    
                    <ResultDisplay productName={productName} />
                </div>
            </main>
            <footer className="text-center p-4 text-slate-500 text-sm">
                <p>&copy; {new Date().getFullYear()} AI Product Namer. A complex SEO, marketing, and copywriting app.</p>
            </footer>
        </div>
    );
};

export default App;
