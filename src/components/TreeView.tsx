import React, { useState, useMemo } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Folder, 
  FolderOpen, 
  Key, 
  Plus, 
  Trash2,
  MoreVertical,
  Search,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Edit2,
  Check,
  X,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react';
import { IniSection, IniKey, ValidationError } from '../types/ini';

interface TreeViewProps {
  sections: IniSection[];
  selectedKey: IniKey | null;
  searchQuery: string;
  validationErrors?: ValidationError[];
  onKeySelect: (key: IniKey) => void;
  onToggleSection: (sectionName: string) => void;
  onAddSection: (sectionName: string) => void;
  onDeleteSection: (sectionName: string) => void;
  onRenameSection: (oldName: string, newName: string) => void;
  onAddKey: (section: string, key: string, value: string, type: 'string' | 'number' | 'boolean') => void;
  onDeleteKey: (section: string, key: string) => void;
  onRenameKey: (section: string, oldKey: string, newKey: string) => void;
}

interface SearchResult {
  section: IniSection;
  matchedKeys: IniKey[];
  sectionMatches: boolean;
}

export function TreeView({ 
  sections, 
  selectedKey, 
  searchQuery, 
  validationErrors = [],
  onKeySelect, 
  onToggleSection,
  onAddSection,
  onDeleteSection,
  onRenameSection,
  onAddKey,
  onDeleteKey,
  onRenameKey
}: TreeViewProps) {
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [showAddKey, setShowAddKey] = useState<string | null>(null);
  const [newKeyData, setNewKeyData] = useState({
    key: '',
    value: '',
    type: 'string' as 'string' | 'number' | 'boolean'
  });
  const [sectionMenuOpen, setSectionMenuOpen] = useState<string | null>(null);
  const [keyMenuOpen, setKeyMenuOpen] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingSectionName, setEditingSectionName] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingKeyName, setEditingKeyName] = useState('');
  
  // Local search state for the tree view
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  
  // Modified items filter state
  const [showModifiedOnly, setShowModifiedOnly] = useState(false);

  // Count modified items
  const modifiedItemsCount = useMemo(() => {
    return sections.reduce((count, section) => {
      return count + section.keys.filter(key => key.isModified).length;
    }, 0);
  }, [sections]);

  // Enhanced search functionality - combines global search with local tree search and modified filter
  const searchResults = useMemo((): SearchResult[] => {
    // Use local search query if available, otherwise use global search query
    const effectiveQuery = localSearchQuery.trim() || searchQuery.trim();
    
    let filteredSections = sections;
    
    // Apply modified filter first if enabled
    if (showModifiedOnly) {
      filteredSections = sections.map(section => ({
        ...section,
        keys: section.keys.filter(key => key.isModified)
      })).filter(section => section.keys.length > 0); // Only show sections with modified keys
    }
    
    if (!effectiveQuery) {
      return filteredSections.map(section => ({
        section: {
          ...section,
          // Auto-expand sections when showing modified only
          isExpanded: showModifiedOnly ? true : section.isExpanded
        },
        matchedKeys: section.keys,
        sectionMatches: false
      }));
    }

    const query = effectiveQuery.toLowerCase();
    const results: SearchResult[] = [];

    filteredSections.forEach(section => {
      // For local filter (section-only), only check section names
      if (localSearchQuery.trim()) {
        const sectionMatches = section.name.toLowerCase().includes(query);
        
        if (sectionMatches) {
          results.push({
            section: {
              ...section,
              // Auto-expand sections with matches
              isExpanded: true
            },
            matchedKeys: section.keys, // Show ALL keys when section matches
            sectionMatches: true
          });
        }
      } else {
        // For global search, check both sections and keys
        const sectionMatches = section.name.toLowerCase().includes(query);
        const matchedKeys = section.keys.filter(key => 
          key.key.toLowerCase().includes(query) ||
          key.value.toLowerCase().includes(query) ||
          key.type.toLowerCase().includes(query)
        );

        // Include section if it matches or has matching keys
        if (sectionMatches || matchedKeys.length > 0) {
          results.push({
            section: {
              ...section,
              // Auto-expand sections with matches
              isExpanded: sectionMatches || matchedKeys.length > 0 ? true : section.isExpanded
            },
            matchedKeys: sectionMatches ? section.keys : matchedKeys,
            sectionMatches
          });
        }
      }
    });

    return results;
  }, [sections, searchQuery, localSearchQuery, showModifiedOnly]);

  // Get validation errors for specific section/key
  const getValidationErrors = (sectionName: string, keyName?: string) => {
    return validationErrors.filter(error => {
      if (keyName) {
        return error.section === sectionName && error.key === keyName;
      }
      return error.section === sectionName && !error.key;
    });
  };

  // Get error icon based on severity
  const getErrorIcon = (severity: 'error' | 'warning') => {
    switch (severity) {
      case 'error':
        return <XCircle size={14} className="text-red-500" />;
      case 'warning':
        return <AlertTriangle size={14} className="text-yellow-500" />;
      default:
        return <AlertCircle size={14} className="text-gray-500" />;
    }
  };

  // Highlight matching text
  const highlightText = (text: string, query: string) => {
    const effectiveQuery = localSearchQuery.trim() || query.trim();
    if (!effectiveQuery) return text;
    
    const regex = new RegExp(`(${effectiveQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  const handleAddSection = () => {
    if (newSectionName.trim()) {
      onAddSection(newSectionName.trim());
      setNewSectionName('');
      setShowAddSection(false);
    }
  };

  const handleAddKey = (sectionName: string) => {
    if (newKeyData.key.trim() && newKeyData.value.trim()) {
      onAddKey(sectionName, newKeyData.key.trim(), newKeyData.value.trim(), newKeyData.type);
      setNewKeyData({ key: '', value: '', type: 'string' });
      setShowAddKey(null);
    }
  };

  const handleDeleteSection = (sectionName: string) => {
    if (window.confirm(`Are you sure you want to delete section "${sectionName}" and all its keys?`)) {
      onDeleteSection(sectionName);
      setSectionMenuOpen(null);
    }
  };

  const handleDeleteKey = (sectionName: string, keyName: string) => {
    if (window.confirm(`Are you sure you want to delete key "${keyName}"?`)) {
      onDeleteKey(sectionName, keyName);
      setKeyMenuOpen(null);
    }
  };

  const handleStartEditSection = (sectionName: string) => {
    setEditingSection(sectionName);
    setEditingSectionName(sectionName);
    setSectionMenuOpen(null);
  };

  const handleSaveEditSection = () => {
    if (editingSection && editingSectionName.trim() && editingSectionName !== editingSection) {
      // Check if new section name already exists
      const exists = sections.some(s => s.name === editingSectionName.trim());
      if (exists) {
        alert('A section with this name already exists');
        return;
      }
      onRenameSection(editingSection, editingSectionName.trim());
    }
    setEditingSection(null);
    setEditingSectionName('');
  };

  const handleCancelEditSection = () => {
    setEditingSection(null);
    setEditingSectionName('');
  };

  const handleStartEditKey = (sectionName: string, keyName: string) => {
    setEditingKey(`${sectionName}-${keyName}`);
    setEditingKeyName(keyName);
    setKeyMenuOpen(null);
  };

  const handleSaveEditKey = (sectionName: string, oldKeyName: string) => {
    if (editingKeyName.trim() && editingKeyName !== oldKeyName) {
      // Check if new key name already exists in the section
      const section = sections.find(s => s.name === sectionName);
      const exists = section?.keys.some(k => k.key === editingKeyName.trim());
      if (exists) {
        alert('A key with this name already exists in this section');
        return;
      }
      onRenameKey(sectionName, oldKeyName, editingKeyName.trim());
    }
    setEditingKey(null);
    setEditingKeyName('');
  };

  const handleCancelEditKey = () => {
    setEditingKey(null);
    setEditingKeyName('');
  };

  const totalMatchedKeys = searchResults.reduce((sum, result) => sum + result.matchedKeys.length, 0);
  const totalMatchedSections = searchResults.filter(result => result.sectionMatches).length;
  const totalErrors = validationErrors.filter(e => e.severity === 'error').length;
  const totalWarnings = validationErrors.filter(e => e.severity === 'warning').length;
  const effectiveQuery = localSearchQuery.trim() || searchQuery.trim();

  return (
    <div className="bg-white border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">INI Structure</h2>
          <button
            onClick={() => setShowAddSection(true)}
            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
            title="Add Section"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Modified Items Filter Button */}
        {modifiedItemsCount > 0 && (
          <div className="mb-3">
            <button
              onClick={() => setShowModifiedOnly(!showModifiedOnly)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full ${
                showModifiedOnly
                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                  : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
              }`}
              title={showModifiedOnly ? 'Show all items' : 'Show only modified items'}
            >
              {showModifiedOnly ? (
                <EyeOff size={16} />
              ) : (
                <Eye size={16} />
              )}
              <span>
                {showModifiedOnly ? 'Show All' : 'Show Modified Only'}
              </span>
              <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-medium ${
                showModifiedOnly 
                  ? 'bg-yellow-200 text-yellow-800' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {modifiedItemsCount}
              </span>
            </button>
          </div>
        )}

        {/* Local Search Bar for Tree View - Section Filter Only */}
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Filter sections..."
            value={localSearchQuery}
            onChange={(e) => setLocalSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
          />
          {localSearchQuery && (
            <button
              onClick={() => setLocalSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        
        {/* Validation Summary */}
        {validationErrors.length > 0 && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 text-sm">
              <AlertCircle size={16} className="text-red-600" />
              <span className="font-medium text-red-800">Validation Issues:</span>
            </div>
            <div className="mt-1 text-xs text-red-700">
              {totalErrors > 0 && <span className="mr-3">{totalErrors} error{totalErrors !== 1 ? 's' : ''}</span>}
              {totalWarnings > 0 && <span>{totalWarnings} warning{totalWarnings !== 1 ? 's' : ''}</span>}
            </div>
          </div>
        )}
        
        {/* Enhanced Search Results Summary */}
        {(effectiveQuery || showModifiedOnly) && (
          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2 text-sm text-blue-800">
              {showModifiedOnly && !effectiveQuery ? (
                <Eye size={14} />
              ) : localSearchQuery ? (
                <Filter size={14} />
              ) : (
                <Search size={14} />
              )}
              <span className="font-medium">
                {showModifiedOnly && !effectiveQuery ? 'Modified Items Filter:' :
                 localSearchQuery ? 'Section Filter:' : 'Global Search:'}
              </span>
            </div>
            <div className="mt-1 text-xs text-blue-700">
              {showModifiedOnly && !effectiveQuery ? (
                // Modified items filter results
                <>
                  Showing {totalMatchedKeys} modified key{totalMatchedKeys !== 1 ? 's' : ''}
                  {searchResults.length > 0 && ` in ${searchResults.length} section${searchResults.length !== 1 ? 's' : ''}`}
                </>
              ) : localSearchQuery ? (
                // Section filter results
                <>
                  Found {searchResults.length} section{searchResults.length !== 1 ? 's' : ''}
                  {totalMatchedKeys > 0 && ` with ${totalMatchedKeys} key${totalMatchedKeys !== 1 ? 's' : ''}`}
                  {showModifiedOnly && ' (modified only)'}
                </>
              ) : (
                // Global search results
                <>
                  Found {totalMatchedKeys} key{totalMatchedKeys !== 1 ? 's' : ''}
                  {totalMatchedSections > 0 && ` and ${totalMatchedSections} section${totalMatchedSections !== 1 ? 's' : ''}`}
                  {searchResults.length > 0 && ` in ${searchResults.length} section${searchResults.length !== 1 ? 's' : ''}`}
                  {showModifiedOnly && ' (modified only)'}
                </>
              )}
            </div>
            <div className="flex space-x-2 mt-1">
              {localSearchQuery && (
                <button
                  onClick={() => setLocalSearchQuery('')}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Clear filter
                </button>
              )}
              {showModifiedOnly && (
                <button
                  onClick={() => setShowModifiedOnly(false)}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Show all items
                </button>
              )}
            </div>
          </div>
        )}
        
        {showAddSection && (
          <div className="mb-3 p-3 bg-blue-50 rounded-lg">
            <input
              type="text"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              placeholder="Section name"
              className="w-full px-2 py-1 text-sm border border-blue-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleAddSection()}
              autoFocus
            />
            <div className="flex space-x-2 mt-2">
              <button
                onClick={handleAddSection}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddSection(false);
                  setNewSectionName('');
                }}
                className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-2">
        {searchResults.map((result) => {
          const sectionErrors = getValidationErrors(result.section.name);
          const hasErrors = sectionErrors.some(e => e.severity === 'error');
          const hasWarnings = sectionErrors.some(e => e.severity === 'warning');
          const isEditingThisSection = editingSection === result.section.name;
          
          return (
            <div key={result.section.name} className="mb-2">
              <div className="flex items-center justify-between group">
                {isEditingThisSection ? (
                  <div className="flex items-center space-x-2 flex-1 p-2">
                    <ChevronRight size={16} className="text-gray-500" />
                    <Folder size={16} className="text-blue-600" />
                    <input
                      type="text"
                      value={editingSectionName}
                      onChange={(e) => setEditingSectionName(e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') handleSaveEditSection();
                        if (e.key === 'Escape') handleCancelEditSection();
                      }}
                      autoFocus
                    />
                    <button
                      onClick={handleSaveEditSection}
                      className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                      title="Save"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={handleCancelEditSection}
                      className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                      title="Cancel"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onToggleSection(result.section.name)}
                    className={`flex items-center space-x-2 flex-1 p-2 text-left hover:bg-gray-50 rounded-lg transition-colors ${
                      result.sectionMatches ? 'bg-yellow-50' : ''
                    } ${
                      hasErrors ? 'bg-red-50 border-l-4 border-red-400' : 
                      hasWarnings ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''
                    }`}
                  >
                    {result.section.isExpanded ? (
                      <ChevronDown size={16} className="text-gray-500" />
                    ) : (
                      <ChevronRight size={16} className="text-gray-500" />
                    )}
                    {result.section.isExpanded ? (
                      <FolderOpen size={16} className="text-blue-600" />
                    ) : (
                      <Folder size={16} className="text-blue-600" />
                    )}
                    <span className="font-medium text-gray-900">
                      {highlightText(result.section.name, effectiveQuery)} ({result.matchedKeys.length})
                    </span>
                    {result.sectionMatches && effectiveQuery && (
                      <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">
                        Section Match
                      </span>
                    )}
                    {showModifiedOnly && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                        Modified
                      </span>
                    )}
                    {/* Error indicators */}
                    {hasErrors && (
                      <div className="flex items-center space-x-1">
                        {getErrorIcon('error')}
                        <span className="text-xs text-red-600 bg-red-100 px-1 rounded">
                          {sectionErrors.filter(e => e.severity === 'error').length}
                        </span>
                      </div>
                    )}
                    {hasWarnings && !hasErrors && (
                      <div className="flex items-center space-x-1">
                        {getErrorIcon('warning')}
                        <span className="text-xs text-yellow-600 bg-yellow-100 px-1 rounded">
                          {sectionErrors.filter(e => e.severity === 'warning').length}
                        </span>
                      </div>
                    )}
                  </button>
                )}
                
                {!isEditingThisSection && (
                  <div className="relative">
                    <button
                      onClick={() => setSectionMenuOpen(sectionMenuOpen === result.section.name ? null : result.section.name)}
                      className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical size={14} />
                    </button>
                    
                    {sectionMenuOpen === result.section.name && (
                      <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
                        <button
                          onClick={() => {
                            setShowAddKey(result.section.name);
                            setSectionMenuOpen(null);
                          }}
                          className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Plus size={14} />
                          <span>Add Key</span>
                        </button>
                        <button
                          onClick={() => handleStartEditSection(result.section.name)}
                          className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Edit2 size={14} />
                          <span>Rename</span>
                        </button>
                        <button
                          onClick={() => handleDeleteSection(result.section.name)}
                          className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Section validation errors */}
              {result.section.isExpanded && sectionErrors.length > 0 && (
                <div className="ml-6 mt-1 space-y-1">
                  {sectionErrors.map((error, index) => (
                    <div key={index} className={`p-2 rounded text-xs ${
                      error.severity === 'error' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      <div className="flex items-center space-x-1">
                        {getErrorIcon(error.severity)}
                        <span className="font-medium">{error.type.replace('_', ' ').toUpperCase()}</span>
                      </div>
                      <p className="mt-1">{error.message}</p>
                    </div>
                  ))}
                </div>
              )}
              
              {showAddKey === result.section.name && (
                <div className="ml-6 mt-2 p-3 bg-green-50 rounded-lg">
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newKeyData.key}
                      onChange={(e) => setNewKeyData(prev => ({ ...prev, key: e.target.value }))}
                      placeholder="Key name"
                      className="w-full px-2 py-1 text-sm border border-green-200 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={newKeyData.value}
                      onChange={(e) => setNewKeyData(prev => ({ ...prev, value: e.target.value }))}
                      placeholder="Value"
                      className="w-full px-2 py-1 text-sm border border-green-200 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <select
                      value={newKeyData.type}
                      onChange={(e) => setNewKeyData(prev => ({ ...prev, type: e.target.value as 'string' | 'number' | 'boolean' }))}
                      className="w-full px-2 py-1 text-sm border border-green-200 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                    </select>
                  </div>
                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={() => handleAddKey(result.section.name)}
                      className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => {
                        setShowAddKey(null);
                        setNewKeyData({ key: '', value: '', type: 'string' });
                      }}
                      className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              
              {result.section.isExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  {result.matchedKeys.map((key) => {
                    // For local filter, don't highlight keys since we're only filtering sections
                    // For global search, highlight matching keys
                    const keyMatches = !localSearchQuery.trim() && effectiveQuery && (
                      key.key.toLowerCase().includes(effectiveQuery.toLowerCase()) ||
                      key.value.toLowerCase().includes(effectiveQuery.toLowerCase()) ||
                      key.type.toLowerCase().includes(effectiveQuery.toLowerCase())
                    );
                    
                    const keyErrors = getValidationErrors(result.section.name, key.key);
                    const keyHasErrors = keyErrors.some(e => e.severity === 'error') || !!key.error;
                    const keyHasWarnings = keyErrors.some(e => e.severity === 'warning');
                    const isEditingThisKey = editingKey === `${result.section.name}-${key.key}`;
                    
                    return (
                      <div key={`${result.section.name}-${key.key}`}>
                        <div className="flex items-center justify-between group">
                          {isEditingThisKey ? (
                            <div className="flex items-center space-x-2 flex-1 p-2">
                              <Key size={14} className="text-gray-500" />
                              <input
                                type="text"
                                value={editingKeyName}
                                onChange={(e) => setEditingKeyName(e.target.value)}
                                className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') handleSaveEditKey(result.section.name, key.key);
                                  if (e.key === 'Escape') handleCancelEditKey();
                                }}
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveEditKey(result.section.name, key.key)}
                                className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                                title="Save"
                              >
                                <Check size={12} />
                              </button>
                              <button
                                onClick={handleCancelEditKey}
                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                title="Cancel"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => onKeySelect(key)}
                              className={`flex items-center space-x-2 flex-1 p-2 text-left rounded-lg transition-colors ${
                                selectedKey?.key === key.key && selectedKey?.section === key.section
                                  ? 'bg-blue-100 border border-blue-200'
                                  : 'hover:bg-gray-50'
                              } ${
                                key.isModified ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''
                              } ${
                                keyHasErrors ? 'bg-red-50 border-l-4 border-red-400' : 
                                keyHasWarnings ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''
                              } ${
                                keyMatches && effectiveQuery ? 'ring-2 ring-yellow-200' : ''
                              }`}
                            >
                              <Key size={14} className="text-gray-500" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {/* Only highlight for global search, not local filter */}
                                  {localSearchQuery.trim() ? key.key : highlightText(key.key, effectiveQuery)}
                                  {key.type !== 'string' && (
                                    <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-1 rounded">
                                      {localSearchQuery.trim() ? key.type : highlightText(key.type, effectiveQuery)}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-gray-500 truncate">
                                  {localSearchQuery.trim() ? key.value : highlightText(key.value, effectiveQuery)}
                                </div>
                              </div>
                              {key.isModified && (
                                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                              )}
                              {keyHasErrors && (
                                <div className="flex items-center space-x-1">
                                  {getErrorIcon('error')}
                                </div>
                              )}
                              {keyHasWarnings && !keyHasErrors && (
                                <div className="flex items-center space-x-1">
                                  {getErrorIcon('warning')}
                                </div>
                              )}
                              {keyMatches && effectiveQuery && (
                                <span className="text-xs bg-yellow-200 text-yellow-800 px-1 py-0.5 rounded">
                                  Match
                                </span>
                              )}
                            </button>
                          )}
                          
                          {!isEditingThisKey && (
                            <button
                              onClick={() => setKeyMenuOpen(keyMenuOpen === `${result.section.name}-${key.key}` ? null : `${result.section.name}-${key.key}`)}
                              className="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical size={12} />
                            </button>
                          )}
                          
                          {keyMenuOpen === `${result.section.name}-${key.key}` && (
                            <div className="absolute right-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-24">
                              <button
                                onClick={() => handleStartEditKey(result.section.name, key.key)}
                                className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Edit2 size={12} />
                                <span>Rename</span>
                              </button>
                              <button
                                onClick={() => handleDeleteKey(result.section.name, key.key)}
                                className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 size={12} />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {/* Key validation errors */}
                        {(keyErrors.length > 0 || key.error) && (
                          <div className="ml-8 mt-1 space-y-1">
                            {key.error && (
                              <div className="p-2 bg-red-100 text-red-800 rounded text-xs">
                                <div className="flex items-center space-x-1">
                                  {getErrorIcon('error')}
                                  <span className="font-medium">VALUE ERROR</span>
                                </div>
                                <p className="mt-1">{key.error}</p>
                              </div>
                            )}
                            {keyErrors.map((error, index) => (
                              <div key={index} className={`p-2 rounded text-xs ${
                                error.severity === 'error' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                <div className="flex items-center space-x-1">
                                  {getErrorIcon(error.severity)}
                                  <span className="font-medium">{error.type.replace('_', ' ').toUpperCase()}</span>
                                </div>
                                <p className="mt-1">{error.message}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        
        {searchResults.length === 0 && (effectiveQuery || showModifiedOnly) && (
          <div className="text-center py-8 text-gray-500">
            {showModifiedOnly && !effectiveQuery ? (
              <Eye size={24} className="mx-auto mb-2 text-gray-400" />
            ) : localSearchQuery ? (
              <Filter size={24} className="mx-auto mb-2 text-gray-400" />
            ) : (
              <Search size={24} className="mx-auto mb-2 text-gray-400" />
            )}
            <p className="text-lg font-medium mb-1">No results found</p>
            <p className="text-sm">
              {showModifiedOnly && !effectiveQuery ? 
                'No modified items found' :
                localSearchQuery ? 
                  `No sections match "${effectiveQuery}"${showModifiedOnly ? ' in modified items' : ''}` : 
                  `No sections or keys match "${effectiveQuery}"${showModifiedOnly ? ' in modified items' : ''}`
              }
            </p>
            <div className="mt-2 space-x-2">
              {localSearchQuery && (
                <button
                  onClick={() => setLocalSearchQuery('')}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Clear filter
                </button>
              )}
              {showModifiedOnly && (
                <button
                  onClick={() => setShowModifiedOnly(false)}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Show all items
                </button>
              )}
            </div>
          </div>
        )}
        
        {searchResults.length === 0 && !effectiveQuery && !showModifiedOnly && sections.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg font-medium mb-1">No data loaded</p>
            <p className="text-sm">Upload an INI file to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}