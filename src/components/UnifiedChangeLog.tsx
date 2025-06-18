import React from 'react';
import { Clock, Edit, MessageSquare, Plus, Trash2, FolderPlus, FolderMinus } from 'lucide-react';
import { Change } from '../types/unified';

interface UnifiedChangeLogProps {
  changes: Change[];
}

export function UnifiedChangeLog({ changes }: UnifiedChangeLogProps) {
  if (changes.length === 0) {
    return (
      <div className="bg-white h-full flex items-center justify-center p-4">
        <div className="text-center text-gray-500 max-w-md">
          <p className="text-base sm:text-lg font-medium mb-2">No changes yet</p>
          <p className="text-sm sm:text-base">Modifications will appear here</p>
        </div>
      </div>
    );
  }

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'add':
        return <Plus size={16} className="text-green-600" />;
      case 'delete':
        return <Trash2 size={16} className="text-red-600" />;
      case 'add_node':
        return <FolderPlus size={16} className="text-blue-600" />;
      case 'delete_node':
        return <FolderMinus size={16} className="text-red-600" />;
      default:
        return <Edit size={16} className="text-blue-600" />;
    }
  };

  const getChangeTitle = (change: Change) => {
    switch (change.type) {
      case 'add':
        return `Added: ${change.path}`;
      case 'delete':
        return `Deleted: ${change.path}`;
      case 'add_node':
        return `Added node: ${change.path}`;
      case 'delete_node':
        return `Deleted node: ${change.path}`;
      default:
        return `Modified: ${change.path}`;
    }
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  return (
    <div className="bg-white h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">
          Change Log ({changes.length})
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {changes.map((change) => (
          <div
            key={change.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="flex items-center space-x-2 min-w-0 flex-1">
                {getChangeIcon(change.type)}
                <span className="font-medium text-gray-900 text-sm sm:text-base break-all">
                  {getChangeTitle(change)}
                </span>
              </div>
              <div className="flex items-center space-x-1 text-xs text-gray-500 flex-shrink-0">
                <Clock size={12} />
                <span className="whitespace-nowrap">
                  {change.timestamp.toLocaleString()}
                </span>
              </div>
            </div>
            
            <div className="text-sm text-gray-600 mb-2 break-all font-mono text-xs bg-gray-50 p-2 rounded">
              Path: {change.path}
            </div>
            
            {(change.type === 'modify' || change.type === 'add' || change.type === 'delete') && (
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {change.oldValue !== null && change.oldValue !== undefined && (
                    <div>
                      <span className="text-gray-600 font-medium">Old Value:</span>
                      <pre className="font-mono text-xs bg-red-50 p-2 rounded mt-1 break-all overflow-x-auto">
                        {formatValue(change.oldValue)}
                      </pre>
                    </div>
                  )}
                  {change.newValue !== null && change.newValue !== undefined && (
                    <div>
                      <span className="text-gray-600 font-medium">
                        {change.type === 'add' ? 'Value:' : 'New Value:'}
                      </span>
                      <pre className="font-mono text-xs bg-green-50 p-2 rounded mt-1 break-all overflow-x-auto">
                        {formatValue(change.newValue)}
                      </pre>
                    </div>
                  )}
                </div>
                
                {change.comment && (
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="flex items-center space-x-2 mb-1">
                      <MessageSquare size={14} className="text-blue-600" />
                      <span className="text-blue-800 font-medium">Comment</span>
                    </div>
                    <p className="text-blue-700 text-sm break-words">{change.comment}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}