import React, { useState, useEffect, useRef } from 'react';
import { Save, X, AlertCircle, AlertTriangle, XCircle } from 'lucide-react';
import { UnifiedNode, DataType } from '../types/unified';
import { validateDataType, sanitizeValue } from '../utils/validation';

interface UnifiedEditorFormProps {
  selectedNode: UnifiedNode | null;
  onSave: (path: string, value: any, comment?: string) => void;
  onCancel: () => void;
}

export function UnifiedEditorForm({ selectedNode, onSave, onCancel }: UnifiedEditorFormProps) {
  const [value, setValue] = useState<any>('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [dataType, setDataType] = useState<DataType>('string');
  const valueInputRef = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (selectedNode) {
      setValue(selectedNode.value ?? '');
      setComment('');
      setDataType(selectedNode.type);
      setError(null);
      
      // Scroll input into view on mobile
      setTimeout(() => {
        if (valueInputRef.current && window.innerWidth < 640) {
          valueInputRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 100);
    }
  }, [selectedNode]);

  const handleSave = () => {
    if (!selectedNode) return;

    try {
      // Validate and sanitize value
      const sanitizedValue = sanitizeValue(value, dataType);
      const validationError = validateDataType(sanitizedValue, dataType);
      
      if (validationError) {
        setError(validationError.message);
        return;
      }

      onSave(selectedNode.path, sanitizedValue, comment.trim() || undefined);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid value');
    }
  };

  const handleValueChange = (newValue: any) => {
    setValue(newValue);
    setError(null);
  };

  const renderValueInput = () => {
    const commonProps = {
      ref: valueInputRef as any,
      value: value ?? '',
      onChange: (e: React.ChangeEvent<any>) => handleValueChange(e.target.value),
      className: `w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base min-h-11 ${
        error ? 'border-red-300 bg-red-50' : 'border-gray-300'
      }`
    };

    switch (dataType) {
      case 'boolean':
        return (
          <select {...commonProps}>
            <option value="true">true</option>
            <option value="false">false</option>
            <option value="yes">yes</option>
            <option value="no">no</option>
            <option value="on">on</option>
            <option value="off">off</option>
            <option value="1">1</option>
            <option value="0">0</option>
          </select>
        );
      
      case 'number':
        return (
          <input
            {...commonProps}
            type="number"
            step="any"
            inputMode="numeric"
            placeholder="Enter number"
          />
        );
      
      case 'object':
      case 'array':
        return (
          <textarea
            {...commonProps}
            rows={6}
            placeholder={`Enter ${dataType === 'array' ? 'array items (one per line)' : 'object properties (key=value, one per line)'}`}
            className={`${commonProps.className} resize-y min-h-32`}
          />
        );
      
      default:
        return (
          <input
            {...commonProps}
            type="text"
            placeholder="Enter value"
          />
        );
    }
  };

  if (!selectedNode) {
    return (
      <div className="bg-white h-full flex items-center justify-center p-4">
        <div className="text-center text-gray-500 max-w-md">
          <p className="text-base sm:text-lg font-medium mb-2">No node selected</p>
          <p className="text-sm sm:text-base">Select a node from the tree view to edit its value</p>
        </div>
      </div>
    );
  }

  // Don't show editor for container nodes
  if (selectedNode.children && selectedNode.children.length > 0) {
    return (
      <div className="bg-white h-full flex items-center justify-center p-4">
        <div className="text-center text-gray-500 max-w-md">
          <p className="text-base sm:text-lg font-medium mb-2">Container Node</p>
          <p className="text-sm sm:text-base">This node contains child elements. Select a leaf node to edit its value.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Edit Node</h2>
            {selectedNode.metadata?.isModified && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                Modified
              </span>
            )}
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors min-h-11 min-w-11 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Node Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Path:</span>
              <p className="text-gray-900 text-base break-all font-mono text-xs">
                {selectedNode.path}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Key:</span>
              <p className="text-gray-900 text-base break-all">{selectedNode.key}</p>
            </div>
            <div className="sm:col-span-2">
              <span className="font-medium text-gray-700">Original Value:</span>
              <p className="text-gray-900 font-mono text-sm break-all bg-white p-2 rounded border mt-1">
                {selectedNode.metadata?.originalValue !== undefined 
                  ? String(selectedNode.metadata.originalValue)
                  : 'N/A'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Data Type Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data Type
          </label>
          <select
            value={dataType}
            onChange={(e) => setDataType(e.target.value as DataType)}
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base min-h-11"
          >
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
            <option value="object">Object</option>
            <option value="array">Array</option>
            <option value="null">Null</option>
          </select>
        </div>
        
        {/* Value Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Value
          </label>
          {renderValueInput()}
          {error && (
            <div className="mt-2 flex items-center space-x-2 text-red-600">
              <AlertCircle size={16} />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>
        
        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Change Comment (Optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Add a comment about this change..."
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y text-base min-h-20"
          />
        </div>

        {/* Type Guidelines */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Data Type Guidelines:</h4>
          <div className="text-xs text-blue-700 space-y-1">
            {dataType === 'boolean' && (
              <p><strong>Boolean:</strong> Accepts true/false, yes/no, on/off, 1/0</p>
            )}
            {dataType === 'number' && (
              <p><strong>Number:</strong> Must be a valid finite number (integers or decimals)</p>
            )}
            {dataType === 'string' && (
              <p><strong>String:</strong> Any text value</p>
            )}
            {dataType === 'object' && (
              <p><strong>Object:</strong> Enter key=value pairs, one per line</p>
            )}
            {dataType === 'array' && (
              <p><strong>Array:</strong> Enter array items, one per line</p>
            )}
            {dataType === 'null' && (
              <p><strong>Null:</strong> Represents an empty/null value</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={handleSave}
            disabled={!!error}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors min-h-11 text-base"
          >
            <Save size={16} />
            <span>Save Changes</span>
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors min-h-11 text-base"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}