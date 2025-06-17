import React from 'react';
import { Clock, Edit, MessageSquare, Plus, Trash2, FolderPlus, FolderMinus } from 'lucide-react';
import { IniChange } from '../types/ini';

interface ChangeLogProps {
  changes: IniChange[];
}

export function ChangeLog({ changes }: ChangeLogProps) {
  if (changes.length === 0) {
    return (
      <div className="bg-white h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-lg font-medium mb-2">No changes yet</p>
          <p>Modifications will appear here</p>
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
      case 'add_section':
        return <FolderPlus size={16} className="text-blue-600" />;
      case 'delete_section':
        return <FolderMinus size={16} className="text-red-600" />;
      default:
        return <Edit size={16} className="text-blue-600" />;
    }
  };

  const getChangeTitle = (change: IniChange) => {
    switch (change.type) {
      case 'add':
        return `Added key: ${change.key}`;
      case 'delete':
        return `Deleted key: ${change.key}`;
      case 'add_section':
        return `Added section: ${change.section}`;
      case 'delete_section':
        return `Deleted section: ${change.section}`;
      default:
        return `Modified: ${change.key}`;
    }
  };

  const getChangeDescription = (change: IniChange) => {
    switch (change.type) {
      case 'add_section':
        return 'New section created';
      case 'delete_section':
        return change.oldValue;
      default:
        return `${change.section || 'Root'} / ${change.key}`;
    }
  };

  return (
    <div className="bg-white h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Change Log ({changes.length})
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {changes.map((change) => (
          <div
            key={change.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getChangeIcon(change.type)}
                <span className="font-medium text-gray-900">
                  {getChangeTitle(change)}
                </span>
              </div>
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Clock size={12} />
                <span>{change.timestamp.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="text-sm text-gray-600 mb-2">
              {getChangeDescription(change)}
            </div>
            
            {(change.type === 'modify' || change.type === 'add' || change.type === 'delete') && (
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  {change.oldValue && (
                    <div>
                      <span className="text-gray-600">Old Value:</span>
                      <p className="font-mono text-xs bg-gray-50 p-2 rounded mt-1 break-all">
                        {change.oldValue}
                      </p>
                    </div>
                  )}
                  {change.newValue && (
                    <div>
                      <span className="text-gray-600">
                        {change.type === 'add' ? 'Value:' : 'New Value:'}
                      </span>
                      <p className={`font-mono text-xs p-2 rounded mt-1 break-all ${
                        change.type === 'add' ? 'bg-green-50' : 'bg-green-50'
                      }`}>
                        {change.newValue}
                      </p>
                    </div>
                  )}
                </div>
                
                {change.comment && (
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="flex items-center space-x-2 mb-1">
                      <MessageSquare size={14} className="text-blue-600" />
                      <span className="text-blue-800 font-medium">Comment</span>
                    </div>
                    <p className="text-blue-700 text-sm">{change.comment}</p>
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