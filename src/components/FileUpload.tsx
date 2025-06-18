import React, { useCallback } from 'react';
import { Upload, FileText } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  className?: string;
}

export function FileUpload({ onFileUpload, className = '' }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const iniFile = files.find(file => 
      file.name.toLowerCase().endsWith('.ini') || 
      file.type === 'text/plain'
    );
    
    if (iniFile) {
      onFileUpload(iniFile);
    }
  }, [onFileUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  }, [onFileUpload]);

  return (
    <div
      className={`border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-8 text-center transition-colors ${
        isDragOver ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-400'
      } ${className}`}
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
    >
      <div className="flex flex-col items-center space-y-4">
        <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full">
          <FileText className="text-gray-600" size={24} />
        </div>
        
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
            Upload INI File
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4 px-2">
            Drag and drop your INI file here, or click to browse
          </p>
        </div>
        
        <label className="flex items-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors min-h-11 text-base">
          <Upload size={16} />
          <span>Choose File</span>
          <input
            type="file"
            accept=".ini,.txt"
            onChange={handleFileInput}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}