import React, { useState, useEffect } from 'react';
import { Save, X, AlertCircle, AlertTriangle, XCircle } from 'lucide-react';
import { IniKey, ValidationError } from '../types/ini';
import { validateValue } from '../utils/iniParser';

interface EditorFormProps {
  selectedKey: IniKey | null;
  validationErrors?: ValidationError[];
  onSave: (section: string, key: string, value: string, comment?: string) => void;
  onCancel: () => void;
}

export function EditorForm({ selectedKey, validationErrors = [], onSave, onCancel }: EditorFormProps) {
  const [value, setValue] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedKey) {
      setValue(selectedKey.value);
      setComment(selectedKey.comment || '');
      setError(null);
    }
  }, [selectedKey]);

  const handleSave = () => {
    if (!selectedKey) return;

    const validationError = validateValue(value, selectedKey.type);
    if (validationError) {
      setError(validationError);
      return;
    }

    onSave(selectedKey.section, selectedKey.key, value, comment.trim() || undefined);
    setError(null);
  };

  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    if (selectedKey) {
      const validationError = validateValue(newValue, selectedKey.type);
      setError(validationError);
    }
  };

  // Get validation errors for the selected key
  const keyValidationErrors = selectedKey ? validationErrors.filter(
    error => error.section === selectedKey.section && error.key === selectedKey.key
  ) : [];

  const getErrorIcon = (severity: 'error' | 'warning') => {
    switch (severity) {
      case 'error':
        return <XCircle size={16} className="text-red-500" />;
      case 'warning':
        return <AlertTriangle size={16} className="text-yellow-500" />;
      default:
        return <AlertCircle size={16} className="text-gray-500" />;
    }
  };

  if (!selectedKey) {
    return (
      <div className="bg-white h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium mb-2">No key selected</p>
          <p>Select a key from the tree view to edit its value</p>
        </div>
      </div>
    );
  }

  const hasErrors = keyValidationErrors.some(e => e.severity === 'error') || !!selectedKey.error || !!error;
  const hasWarnings = keyValidationErrors.some(e => e.severity === 'warning');

  return (
    <div className="bg-white h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold text-gray-900">Edit Key</h2>
            {hasErrors && (
              <div className="flex items-center space-x-1">
                {getErrorIcon('error')}
                <span className="text-sm text-red-600 font-medium">Has Errors</span>
              </div>
            )}
            {hasWarnings && !hasErrors && (
              <div className="flex items-center space-x-1">
                {getErrorIcon('warning')}
                <span className="text-sm text-yellow-600 font-medium">Has Warnings</span>
              </div>
            )}
          </div>
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Section:</span>
              <p className="text-gray-900">{selectedKey.section || 'Root'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Key:</span>
              <p className="text-gray-900">{selectedKey.key}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Type:</span>
              <p className="text-gray-900 capitalize">
                {selectedKey.type}
                {selectedKey.type === 'boolean' && ' (true/false/1/0/yes/no/on/off)'}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Original:</span>
              <p className="text-gray-900 font-mono text-xs break-all">
                {selectedKey.originalValue}
              </p>
            </div>
          </div>
        </div>

        {/* Validation Errors Display */}
        {(keyValidationErrors.length > 0 || selectedKey.error) && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">Validation Issues:</h3>
            
            {selectedKey.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-1">
                  {getErrorIcon('error')}
                  <span className="text-red-800 font-medium text-sm">Current Value Error</span>
                </div>
                <p className="text-red-700 text-sm">{selectedKey.error}</p>
              </div>
            )}

            {keyValidationErrors.map((validationError, index) => (
              <div key={index} className={`p-3 border rounded-lg ${
                validationError.severity === 'error' 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-center space-x-2 mb-1">
                  {getErrorIcon(validationError.severity)}
                  <span className={`font-medium text-sm ${
                    validationError.severity === 'error' ? 'text-red-800' : 'text-yellow-800'
                  }`}>
                    {validationError.type.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <p className={`text-sm ${
                  validationError.severity === 'error' ? 'text-red-700' : 'text-yellow-700'
                }`}>
                  {validationError.message}
                </p>
                {validationError.line && (
                  <p className={`text-xs mt-1 ${
                    validationError.severity === 'error' ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    Line: {validationError.line}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Value
          </label>
          {selectedKey.type === 'boolean' ? (
            <select
              value={value}
              onChange={(e) => handleValueChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                error || hasErrors ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            >
              <option value="true">true</option>
              <option value="false">false</option>
              <option value="1">1</option>
              <option value="0">0</option>
              <option value="yes">yes</option>
              <option value="no">no</option>
              <option value="on">on</option>
              <option value="off">off</option>
            </select>
          ) : (
            <input
              type={selectedKey.type === 'number' ? 'number' : 'text'}
              value={value}
              onChange={(e) => handleValueChange(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                error || hasErrors ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder={`Enter ${selectedKey.type} value`}
            />
          )}
          {error && (
            <div className="mt-2 flex items-center space-x-2 text-red-600">
              <AlertCircle size={16} />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Change Comment (Optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Add a comment about this change..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
          />
        </div>
        
        {selectedKey.isModified && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-yellow-800">
              <AlertCircle size={16} />
              <span className="text-sm font-medium">Modified Value</span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              This key has been modified from its original value.
            </p>
            {selectedKey.comment && (
              <p className="text-sm text-yellow-700 mt-2">
                <strong>Comment:</strong> {selectedKey.comment}
              </p>
            )}
          </div>
        )}

        {/* Value Type Help */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Value Type Guidelines:</h4>
          <div className="text-xs text-blue-700 space-y-1">
            {selectedKey.type === 'boolean' && (
              <p><strong>Boolean:</strong> Accepts true/false, 1/0, yes/no, on/off</p>
            )}
            {selectedKey.type === 'number' && (
              <p><strong>Number:</strong> Must be a valid finite number</p>
            )}
            {selectedKey.type === 'string' && (
              <p><strong>String:</strong> Any text value (avoid line breaks)</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-3">
          <button
            onClick={handleSave}
            disabled={!!error}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Save size={16} />
            <span>Save Changes</span>
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}