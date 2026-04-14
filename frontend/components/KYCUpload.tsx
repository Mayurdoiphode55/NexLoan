import React, { useState, useRef } from 'react';

interface KYCUploadProps {
  label: string;
  accept?: string;
  onFileSelect: (file: File) => void;
  error?: string;
}

export default function KYCUpload({ label, accept = "image/jpeg, image/png", onFileSelect, error }: KYCUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be under 5MB");
        return;
      }
      
      setFileName(file.name);
      onFileSelect(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClear = () => {
    setPreviewUrl(null);
    setFileName(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full group">
      <label className="block text-sm font-bold text-gray-700 dark:text-gray-400 mb-2 ml-1 uppercase tracking-widest">{label}</label>
      
      {!previewUrl ? (
        <div 
          className="mt-1 flex justify-center px-6 pt-10 pb-10 border-2 border-gray-300 dark:border-slate-700 border-dashed rounded-2xl hover:bg-white dark:hover:bg-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-all cursor-pointer bg-gray-50 dark:bg-slate-900/50 group-hover:shadow-lg shadow-blue-500/10"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="space-y-4 text-center">
            <div className="bg-white dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-sm group-hover:scale-110 transition-transform">
              <svg className="h-8 w-8 text-blue-500 dark:text-blue-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
              <span className="relative rounded-md font-bold text-blue-600 dark:text-blue-400 group-hover:text-blue-500 transition-colors">
                <span>Upload a file</span>
              </span>
            </div>
            <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-600 tracking-tighter">PNG, JPG up to 5MB</p>
          </div>
        </div>
      ) : (
        <div className="relative mt-1 border dark:border-slate-700 rounded-2xl p-3 bg-gray-50 dark:bg-slate-900 shadow-inner scale-in-95 animate-in fade-in duration-300">
          <div className="aspect-video rounded-xl overflow-hidden shadow-lg">
            <img src={previewUrl} alt={label} className="object-cover w-full h-full" />
          </div>
          <div className="flex justify-between items-center mt-4 px-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate max-w-[200px]">{fileName}</span>
            <button 
              type="button" 
              onClick={handleClear}
              className="bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      
      <input 
        type="file" 
        className="hidden" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept={accept}
      />
      
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
