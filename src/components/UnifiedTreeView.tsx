import React, { useState, useMemo } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Folder, 
  FolderOpen, 
  File,
  FileText,
  Database,
  Code,
  Plus, 
  Trash2,
  MoreVertical,
  Search,
  Edit2,
  Check,
  X,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react';
import { UnifiedNode, FileType } from '../types/unified';

interface UnifiedTreeViewProps {
  data: UnifiedNode;
  fileType: FileType;
  selectedNode: string | null;
  searchQuery: string;
  expandedPaths: Set<string>;
  onNodeSelect: (path: string) => void;
  onToggleExpanded: (path: string) => void;
  onAddNode: (parentPath: string, key: string, value: any, type: string) => void;
  onDeleteNode: (path: string) => void;
  onUpdateNode: (path: string, newValue: any) => void;
}

export function UnifiedTreeView({
  data,
  fileType,
  selectedNode,
  searchQuery,
  expandedPaths,
  onNodeSelect,
  onToggleExpanded,
  onAddNode,
  onDeleteNode,
  onUpdateNode
}: UnifiedTreeViewProps) {
  const [showAddNode, setShowAddNode] = useState<string | null>(null);
  const [newNodeData, setNewNodeData] = useState({
    key: '',
    value: '',
    type: 'string'
  });
  const [nodeMenuOpen, setNodeMenuOpen] = useState<string | null>(null);
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState('');
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [showModifiedOnly, setShowModifiedOnly] = useState(false);

  // Get appropriate icon for file type
  const getFileTypeIcon = (type: FileType) => {
    switch (type) {
      case 'json':
        return <Code size={16} className="text-yellow-600" />;
      case 'xml':
        return <Database size={16} className="text-green-600" />;
      case 'ini':
        return <FileText size={16} className="text-blue-600" />;
      default:
        return <File size={16} className="text-gray-600" />;
    }
  };

  // Get node icon based on type and state
  const getNodeIcon = (node: UnifiedNode, isExpanded: boolean) => {
    if (node.children && node.children.length > 0) {
      return isExpanded ? (
        <FolderOpen size={16} className="text-blue-600" />
      ) : (
        <Folder size={16} className="text-blue-600" />
      );
    }
    return getFileTypeIcon(fileType);
  };

  // Filter nodes based on search and modified filter
  const filteredData = useMemo(() => {
    const effectiveQuery = localSearchQuery.trim() || searchQuery.trim();
    
    function filterNode(node: UnifiedNode): UnifiedNode | null {
      // Apply modified filter
      if (showModifiedOnly && !node.metadata?.isModified && 
          (!node.children || !node.children.some(child => hasModifiedDescendant(child)))) {
        return null;
      }

      // Apply search filter
      if (effectiveQuery) {
        const matchesSearch = node.key.toLowerCase().includes(effectiveQuery.toLowerCase()) ||
                            (node.value && String(node.value).toLowerCase().includes(effectiveQuery.toLowerCase()));
        
        const hasMatchingChildren = node.children?.some(child => filterNode(child) !== null);
        
        if (!matchesSearch && !hasMatchingChildren) {
          return null;
        }
      }

      // Filter children recursively
      const filteredChildren = node.children?.map(child => filterNode(child)).filter(Boolean) as UnifiedNode[];
      
      return {
        ...node,
        children: filteredChildren
      };
    }

    return filterNode(data) || data;
  }, [data, searchQuery, localSearchQuery, showModifiedOnly]);

  function hasModifiedDescendant(node: UnifiedNode): boolean {
    if (node.metadata?.isModified) return true;
    return node.children?.some(child => hasModifiedDescendant(child)) || false;
  }

  const modifiedCount = useMemo(() => {
    function countModified(node: UnifiedNode): number {
      let count = node.metadata?.isModified ? 1 : 0;
      if (node.children) {
        count += node.children.reduce((sum, child) => sum + countModified(child), 0);
      }
      return count;
    }
    return countModified(data);
  }, [data]);

  const handleAddNode = (parentPath: string) => {
    if (newNodeData.key.trim() && newNodeData.value.trim()) {
      onAddNode(parentPath, newNodeData.key.trim(), newNodeData.value.trim(), newNodeData.type);
      setNewNodeData({ key: '', value: '', type: 'string' });
      setShowAddNode(null);
    }
  };

  const handleDeleteNode = (path: string) => {
    if (window.confirm('Are you sure you want to delete this node and all its children?')) {
      onDeleteNode(path);
      setNodeMenuOpen(null);
    }
  };

  const renderNode = (node: UnifiedNode, depth: number = 0): React.ReactNode => {
    const isExpanded = expandedPaths.has(node.path);
    const isSelected = selectedNode === node.path;
    const hasChildren = node.children && node.children.length > 0;
    const isEditing = editingNode === node.path;
    const isModified = node.metadata?.isModified;

    return (
      <div key={node.path} className="select-none">
        <div className="flex items-center justify-between group">
          {isEditing ? (
            <div className="flex items-center space-x-2 flex-1 p-2" style={{ paddingLeft: `${depth * 20 + 8}px` }}>
              {hasChildren && (
                <ChevronRight size={16} className="text-gray-500" />
              )}
              {getNodeIcon(node, isExpanded)}
              <input
                type="text"
                value={editingKey}
                onChange={(e) => setEditingKey(e.target.value)}
                className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-11 text-base"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    // Handle rename logic here
                    setEditingNode(null);
                  }
                  if (e.key === 'Escape') setEditingNode(null);
                }}
                autoFocus
              />
              <button
                onClick={() => setEditingNode(null)}
                className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors min-h-11 min-w-11 flex items-center justify-center"
                title="Save"
              >
                <Check size={14} />
              </button>
              <button
                onClick={() => setEditingNode(null)}
                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors min-h-11 min-w-11 flex items-center justify-center"
                title="Cancel"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                if (hasChildren) {
                  onToggleExpanded(node.path);
                } else {
                  onNodeSelect(node.path);
                }
              }}
              className={`flex items-center space-x-2 flex-1 p-2 text-left hover:bg-gray-50 rounded-lg transition-colors min-h-11 ${
                isSelected ? 'bg-blue-100 border border-blue-200' : ''
              } ${isModified ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''}`}
              style={{ paddingLeft: `${depth * 20 + 8}px` }}
            >
              {hasChildren && (
                isExpanded ? (
                  <ChevronDown size={16} className="text-gray-500" />
                ) : (
                  <ChevronRight size={16} className="text-gray-500" />
                )
              )}
              {getNodeIcon(node, isExpanded)}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {node.key}
                  {node.type && node.type !== 'object' && (
                    <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-1 rounded">
                      {node.type}
                    </span>
                  )}
                </div>
                {!hasChildren && node.value !== null && node.value !== undefined && (
                  <div className="text-xs text-gray-500 truncate">
                    {String(node.value)}
                  </div>
                )}
              </div>
              {isModified && (
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              )}
            </button>
          )}

          {!isEditing && (
            <button
              onClick={() => setNodeMenuOpen(nodeMenuOpen === node.path ? null : node.path)}
              className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity min-h-11 min-w-11 flex items-center justify-center"
            >
              <MoreVertical size={14} />
            </button>
          )}

          {nodeMenuOpen === node.path && (
            <div className="absolute right-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
              {hasChildren && (
                <button
                  onClick={() => {
                    setShowAddNode(node.path);
                    setNodeMenuOpen(null);
                  }}
                  className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 min-h-11"
                >
                  <Plus size={14} />
                  <span>Add Child</span>
                </button>
              )}
              <button
                onClick={() => {
                  setEditingNode(node.path);
                  setEditingKey(node.key);
                  setNodeMenuOpen(null);
                }}
                className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 min-h-11"
              >
                <Edit2 size={14} />
                <span>Rename</span>
              </button>
              <button
                onClick={() => handleDeleteNode(node.path)}
                className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 min-h-11"
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>

        {/* Add Node Form */}
        {showAddNode === node.path && (
          <div className="ml-6 mt-2 p-3 bg-green-50 rounded-lg">
            <div className="space-y-2">
              <input
                type="text"
                value={newNodeData.key}
                onChange={(e) => setNewNodeData(prev => ({ ...prev, key: e.target.value }))}
                placeholder="Key name"
                className="w-full px-2 py-1 text-sm border border-green-200 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent min-h-11 text-base"
              />
              <input
                type="text"
                value={newNodeData.value}
                onChange={(e) => setNewNodeData(prev => ({ ...prev, value: e.target.value }))}
                placeholder="Value"
                className="w-full px-2 py-1 text-sm border border-green-200 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent min-h-11 text-base"
              />
              <select
                value={newNodeData.type}
                onChange={(e) => setNewNodeData(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-2 py-1 text-sm border border-green-200 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent min-h-11 text-base"
              >
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="object">Object</option>
                <option value="array">Array</option>
              </select>
            </div>
            <div className="flex space-x-2 mt-2">
              <button
                onClick={() => handleAddNode(node.path)}
                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors min-h-11"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddNode(null);
                  setNewNodeData({ key: '', value: '', type: 'string' });
                }}
                className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors min-h-11"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Render children */}
        {isExpanded && hasChildren && (
          <div className="ml-4">
            {node.children!.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-2 sm:p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center space-x-2">
            {getFileTypeIcon(fileType)}
            <span>{fileType.toUpperCase()} Structure</span>
          </h2>
          <button
            onClick={() => setShowAddNode(data.path)}
            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors min-h-11 min-w-11 flex items-center justify-center"
            title="Add Node"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Modified Items Filter */}
        {modifiedCount > 0 && (
          <div className="mb-3">
            <button
              onClick={() => setShowModifiedOnly(!showModifiedOnly)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full min-h-11 ${
                showModifiedOnly
                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                  : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              {showModifiedOnly ? <EyeOff size={16} /> : <Eye size={16} />}
              <span>{showModifiedOnly ? 'Show All' : 'Show Modified Only'}</span>
              <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${
                showModifiedOnly ? 'bg-yellow-200 text-yellow-800' : 'bg-yellow-100 text-yellow-700'
              }`}>
                {modifiedCount}
              </span>
            </button>
          </div>
        )}

        {/* Local Search */}
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Filter nodes..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 min-h-11 text-base"
          />
          {localSearchQuery && (
            <button
              onClick={() => setLocalSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center min-h-11 min-w-11"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      <div className="p-2">
        {renderNode(filteredData)}
      </div>
    </div>
  );
}