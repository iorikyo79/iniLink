import React, { useCallback } from 'react';
import { Upload, FileText, Code, Database } from 'lucide-react';
import { FileType } from '../types/unified';

interface UnifiedFileUploadProps {
  onFileUpload: (file: File) => void;
  className?: string;
}

export function UnifiedFileUpload({ onFileUpload, className = '' }: UnifiedFileUploadProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const configFile = files.find(file => {
      const extension = file.name.toLowerCase().split('.').pop();
      return ['ini', 'json', 'xml', 'cfg', 'conf', 'config', 'txt'].includes(extension || '');
    });
    
    if (configFile) {
      onFileUpload(configFile);
    }
  }, [onFileUpload]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  }, [onFileUpload]);

  const getSupportedFormats = () => [
    { type: 'ini' as FileType, icon: FileText, label: 'INI', description: 'Configuration files' },
    { type: 'json' as FileType, icon: Code, label: 'JSON', description: 'JavaScript Object Notation' },
    { type: 'xml' as FileType, icon: Database, label: 'XML', description: 'Extensible Markup Language' },
  ];

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
      <div className="flex flex-col items-center space-y-6">
        <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full">
          <Upload className="text-gray-600" size={32} />
        </div>
        
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
            Upload Configuration File
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4 px-2">
            Drag and drop your configuration file here, or click to browse
          </p>
        </div>

        {/* Supported Formats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-md">
          {getSupportedFormats().map(({ type, icon: Icon, label, description }) => (
            <div key={type} className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
              <Icon size={24} className={`mb-2 ${
                type === 'ini' ? 'text-blue-600' :
                type === 'json' ? 'text-yellow-600' :
                'text-green-600'
              }`} />
              <span className="font-medium text-sm text-gray-900">{label}</span>
              <span className="text-xs text-gray-500 text-center">{description}</span>
            </div>
          ))}
        </div>
        
        <label className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors min-h-11 text-base">
          <Upload size={16} />
          <span>Choose File</span>
          <input
            type="file"
            accept=".ini,.json,.xml,.cfg,.conf,.config,.txt"
            onChange={handleFileInput}
            className="hidden"
          />
        </label>

        <div className="text-xs text-gray-500 max-w-md">
          <p className="mb-1"><strong>Supported formats:</strong> INI, JSON, XML, CFG, CONF, CONFIG, TXT</p>
          <p><strong>Maximum file size:</strong> 10MB</p>
        </div>
      </div>
    </div>
  );
}