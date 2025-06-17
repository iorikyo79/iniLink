import { useState, useCallback } from 'react';
import { EditorState, IniData, IniKey, IniChange } from '../types/ini';
import { parseIniFile, serializeIniData } from '../utils/iniParser';

export function useIniEditor() {
  const [state, setState] = useState<EditorState>({
    data: null,
    changes: [],
    selectedKey: null,
    searchQuery: '',
    isDirty: false,
    history: [],
    historyIndex: -1,
  });

  const loadFile = useCallback(async (file: File) => {
    try {
      const content = await file.text();
      const data = parseIniFile(content, file.name);
      
      setState(prev => ({
        ...prev,
        data,
        changes: [],
        selectedKey: null,
        isDirty: false,
        history: [data],
        historyIndex: 0,
      }));
    } catch (error) {
      throw error;
    }
  }, []);

  const addToHistory = useCallback((newData: IniData) => {
    setState(prev => {
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(newData);
      return {
        ...prev,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, []);

  const updateKey = useCallback((section: string, key: string, newValue: string, comment?: string) => {
    setState(prev => {
      if (!prev.data) return prev;

      const newData = { ...prev.data };
      newData.sections = newData.sections.map(sec => {
        if (sec.name === section) {
          return {
            ...sec,
            keys: sec.keys.map(k => {
              if (k.key === key) {
                const isModified = k.originalValue !== newValue;
                return {
                  ...k,
                  value: newValue,
                  isModified,
                  comment: isModified ? comment : undefined,
                };
              }
              return k;
            }),
          };
        }
        return sec;
      });

      // Update changes
      const existingChangeIndex = prev.changes.findIndex(
        c => c.section === section && c.key === key
      );

      let newChanges = [...prev.changes];
      const targetKey = newData.sections
        .find(s => s.name === section)
        ?.keys.find(k => k.key === key);

      if (targetKey && targetKey.isModified) {
        const change: IniChange = {
          id: `${section}-${key}-${Date.now()}`,
          timestamp: new Date(),
          section,
          key,
          oldValue: targetKey.originalValue,
          newValue,
          comment,
          type: 'modify',
        };

        if (existingChangeIndex >= 0) {
          newChanges[existingChangeIndex] = change;
        } else {
          newChanges.push(change);
        }
      } else if (existingChangeIndex >= 0) {
        // Remove change if value reverted to original
        newChanges.splice(existingChangeIndex, 1);
      }

      // Add to history
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(newData);

      return {
        ...prev,
        data: newData,
        changes: newChanges,
        isDirty: newChanges.length > 0,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, []);

  const addSection = useCallback((sectionName: string) => {
    setState(prev => {
      if (!prev.data || prev.data.sections.some(s => s.name === sectionName)) {
        return prev;
      }

      const newData = { ...prev.data };
      const newSection = {
        name: sectionName,
        keys: [],
        isExpanded: true,
      };

      newData.sections = [...newData.sections, newSection];

      const change: IniChange = {
        id: `section-${sectionName}-${Date.now()}`,
        timestamp: new Date(),
        section: sectionName,
        key: '',
        oldValue: '',
        newValue: '',
        type: 'add_section',
      };

      const newChanges = [...prev.changes, change];
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(newData);

      return {
        ...prev,
        data: newData,
        changes: newChanges,
        isDirty: true,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, []);

  const deleteSection = useCallback((sectionName: string) => {
    setState(prev => {
      if (!prev.data) return prev;

      const sectionToDelete = prev.data.sections.find(s => s.name === sectionName);
      if (!sectionToDelete) return prev;

      const newData = { ...prev.data };
      newData.sections = newData.sections.filter(s => s.name !== sectionName);

      const change: IniChange = {
        id: `delete-section-${sectionName}-${Date.now()}`,
        timestamp: new Date(),
        section: sectionName,
        key: '',
        oldValue: `Section with ${sectionToDelete.keys.length} keys`,
        newValue: '',
        type: 'delete_section',
      };

      const newChanges = [...prev.changes, change];
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(newData);

      return {
        ...prev,
        data: newData,
        changes: newChanges,
        isDirty: true,
        selectedKey: prev.selectedKey?.section === sectionName ? null : prev.selectedKey,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, []);

  const renameSection = useCallback((oldName: string, newName: string) => {
    setState(prev => {
      if (!prev.data || !prev.data.sections.some(s => s.name === oldName)) {
        return prev;
      }

      const newData = { ...prev.data };
      newData.sections = newData.sections.map(section => {
        if (section.name === oldName) {
          return {
            ...section,
            name: newName,
            keys: section.keys.map(key => ({
              ...key,
              section: newName,
            })),
          };
        }
        return section;
      });

      const change: IniChange = {
        id: `rename-section-${oldName}-${Date.now()}`,
        timestamp: new Date(),
        section: newName,
        key: '',
        oldValue: oldName,
        newValue: newName,
        type: 'modify',
      };

      const newChanges = [...prev.changes, change];
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(newData);

      return {
        ...prev,
        data: newData,
        changes: newChanges,
        isDirty: true,
        selectedKey: prev.selectedKey?.section === oldName ? 
          { ...prev.selectedKey, section: newName } : prev.selectedKey,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, []);

  const addKey = useCallback((section: string, key: string, value: string, type: 'string' | 'number' | 'boolean' = 'string') => {
    setState(prev => {
      if (!prev.data) return prev;

      const sectionExists = prev.data.sections.some(s => s.name === section);
      if (!sectionExists) return prev;

      const keyExists = prev.data.sections
        .find(s => s.name === section)
        ?.keys.some(k => k.key === key);
      if (keyExists) return prev;

      const newData = { ...prev.data };
      newData.sections = newData.sections.map(sec => {
        if (sec.name === section) {
          const newKey: IniKey = {
            key,
            value,
            originalValue: '',
            section,
            type,
            isModified: true,
          };

          return {
            ...sec,
            keys: [...sec.keys, newKey],
          };
        }
        return sec;
      });

      const change: IniChange = {
        id: `add-${section}-${key}-${Date.now()}`,
        timestamp: new Date(),
        section,
        key,
        oldValue: '',
        newValue: value,
        type: 'add',
      };

      const newChanges = [...prev.changes, change];
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(newData);

      return {
        ...prev,
        data: newData,
        changes: newChanges,
        isDirty: true,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, []);

  const deleteKey = useCallback((section: string, key: string) => {
    setState(prev => {
      if (!prev.data) return prev;

      const keyToDelete = prev.data.sections
        .find(s => s.name === section)
        ?.keys.find(k => k.key === key);
      if (!keyToDelete) return prev;

      const newData = { ...prev.data };
      newData.sections = newData.sections.map(sec => {
        if (sec.name === section) {
          return {
            ...sec,
            keys: sec.keys.filter(k => k.key !== key),
          };
        }
        return sec;
      });

      const change: IniChange = {
        id: `delete-${section}-${key}-${Date.now()}`,
        timestamp: new Date(),
        section,
        key,
        oldValue: keyToDelete.value,
        newValue: '',
        type: 'delete',
      };

      const newChanges = [...prev.changes, change];
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(newData);

      return {
        ...prev,
        data: newData,
        changes: newChanges,
        isDirty: true,
        selectedKey: prev.selectedKey?.key === key && prev.selectedKey?.section === section ? null : prev.selectedKey,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, []);

  const renameKey = useCallback((section: string, oldKey: string, newKey: string) => {
    setState(prev => {
      if (!prev.data) return prev;

      const keyToRename = prev.data.sections
        .find(s => s.name === section)
        ?.keys.find(k => k.key === oldKey);
      if (!keyToRename) return prev;

      const newData = { ...prev.data };
      newData.sections = newData.sections.map(sec => {
        if (sec.name === section) {
          return {
            ...sec,
            keys: sec.keys.map(k => {
              if (k.key === oldKey) {
                return {
                  ...k,
                  key: newKey,
                  isModified: true,
                };
              }
              return k;
            }),
          };
        }
        return sec;
      });

      const change: IniChange = {
        id: `rename-key-${section}-${oldKey}-${Date.now()}`,
        timestamp: new Date(),
        section,
        key: newKey,
        oldValue: oldKey,
        newValue: newKey,
        type: 'modify',
      };

      const newChanges = [...prev.changes, change];
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      newHistory.push(newData);

      return {
        ...prev,
        data: newData,
        changes: newChanges,
        isDirty: true,
        selectedKey: prev.selectedKey?.key === oldKey && prev.selectedKey?.section === section ? 
          { ...prev.selectedKey, key: newKey } : prev.selectedKey,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    });
  }, []);

  const selectKey = useCallback((key: IniKey | null) => {
    setState(prev => ({ ...prev, selectedKey: key }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const toggleSection = useCallback((sectionName: string) => {
    setState(prev => {
      if (!prev.data) return prev;

      const newData = { ...prev.data };
      newData.sections = newData.sections.map(section => {
        if (section.name === sectionName) {
          return { ...section, isExpanded: !section.isExpanded };
        }
        return section;
      });

      return { ...prev, data: newData };
    });
  }, []);

  const undo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex > 0) {
        const newIndex = prev.historyIndex - 1;
        const data = prev.history[newIndex];
        
        // Recalculate changes
        const changes: IniChange[] = [];
        data.sections.forEach(section => {
          section.keys.forEach(key => {
            if (key.isModified) {
              changes.push({
                id: `${section.name}-${key.key}-${Date.now()}`,
                timestamp: new Date(),
                section: section.name,
                key: key.key,
                oldValue: key.originalValue,
                newValue: key.value,
                comment: key.comment,
                type: 'modify',
              });
            }
          });
        });

        return {
          ...prev,
          data,
          changes,
          isDirty: changes.length > 0,
          historyIndex: newIndex,
        };
      }
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    setState(prev => {
      if (prev.historyIndex < prev.history.length - 1) {
        const newIndex = prev.historyIndex + 1;
        const data = prev.history[newIndex];
        
        // Recalculate changes
        const changes: IniChange[] = [];
        data.sections.forEach(section => {
          section.keys.forEach(key => {
            if (key.isModified) {
              changes.push({
                id: `${section.name}-${key.key}-${Date.now()}`,
                timestamp: new Date(),
                section: section.name,
                key: key.key,
                oldValue: key.originalValue,
                newValue: key.value,
                comment: key.comment,
                type: 'modify',
              });
            }
          });
        });

        return {
          ...prev,
          data,
          changes,
          isDirty: changes.length > 0,
          historyIndex: newIndex,
        };
      }
      return prev;
    });
  }, []);

  const exportData = useCallback(() => {
    if (!state.data) return null;
    return serializeIniData(state.data);
  }, [state.data]);

  const reset = useCallback(() => {
    setState({
      data: null,
      changes: [],
      selectedKey: null,
      searchQuery: '',
      isDirty: false,
      history: [],
      historyIndex: -1,
    });
  }, []);

  return {
    state,
    loadFile,
    updateKey,
    addSection,
    deleteSection,
    renameSection,
    addKey,
    deleteKey,
    renameKey,
    selectKey,
    setSearchQuery,
    toggleSection,
    undo,
    redo,
    exportData,
    reset,
    canUndo: state.historyIndex > 0,
    canRedo: state.historyIndex < state.history.length - 1,
  };
}