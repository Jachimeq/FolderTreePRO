"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTreeStore } from "../store/useTreeStore";
import { classifyContent, generateFiles } from "../utils/classify";
import type { TreeNode } from "../types/tree";
import "./FolderTreeUI_new.css";

interface HistoryEntry {
  timestamp: number;
  action: string;
  nodeId?: string;
  details?: string;
}

export default function FolderTreeUI() {
  const { tree, setTree, loadTree } = useTreeStore();
  const [isClassifyingAll, setIsClassifyingAll] = useState(false);
  const [classifyingNodes, setClassifyingNodes] = useState<Set<string>>(new Set());
  const [dirPath, setDirPath] = useState("C:\\Users\\Qwe\\Desktop");
  const [useOpenAI, setUseOpenAI] = useState(false);
  const [genPrompt, setGenPrompt] = useState("");
  const [genBasePath, setGenBasePath] = useState("C:/Projects/FolderTreePRO_Auto");
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [showStats, setShowStats] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  // Load theme and data from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('foldertree-theme') === 'dark';
    setDarkMode(savedTheme);
    
    const savedFavorites = localStorage.getItem('foldertree-favorites');
    if (savedFavorites) setFavorites(new Set(JSON.parse(savedFavorites)));
    
    const savedHistory = localStorage.getItem('foldertree-history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  // Save theme preference
  const toggleTheme = useCallback(() => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('foldertree-theme', newMode ? 'dark' : 'light');
  }, [darkMode]);

  // Save favorites
  useEffect(() => {
    localStorage.setItem('foldertree-favorites', JSON.stringify(Array.from(favorites)));
  }, [favorites]);

  // Save history
  useEffect(() => {
    localStorage.setItem('foldertree-history', JSON.stringify(history));
  }, [history]);

  const addToHistory = useCallback((action: string, nodeId?: string, details?: string) => {
    setHistory(prev => [
      { timestamp: Date.now(), action, nodeId, details },
      ...prev
    ].slice(0, 50));
  }, []);

  const toggleFavorite = useCallback((nodeId: string) => {
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const toggleNodeSelection = useCallback((nodeId: string) => {
    setSelectedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedNodes(new Set(Object.keys(tree.items)));
  }, [tree.items]);

  const clearSelection = useCallback(() => {
    setSelectedNodes(new Set());
  }, []);

  // Statistics
  const stats = useMemo(() => {
    const nodes = Object.values(tree.items) as TreeNode[];
    const taggedCount = nodes.filter(n => (n.data.tags?.length ?? 0) > 0).length;
    const totalTags = nodes.reduce((sum, n) => sum + (n.data.tags?.length ?? 0), 0);
    
    return {
      totalFolders: nodes.length,
      taggedFolders: taggedCount,
      totalTags,
      favorited: favorites.size,
      tagPercentage: nodes.length > 0 ? Math.round((taggedCount / nodes.length) * 100) : 0
    };
  }, [tree.items, favorites]);

  // Filter nodes based on search
  const filteredNodes = useMemo(() => {
    if (!searchTerm) return tree.items;
    
    const nodes = tree.items as any;
    const filtered: any = {};
    const term = searchTerm.toLowerCase();
    
    Object.entries(nodes).forEach(([key, node]: [string, any]) => {
      if (
        node.data.name?.toLowerCase().includes(term) ||
        node.data.tags?.some((tag: string) => tag.toLowerCase().includes(term)) ||
        node.data.path?.toLowerCase().includes(term)
      ) {
        filtered[key] = node;
      }
    });
    
    return filtered;
  }, [tree.items, searchTerm]);

  const handleLoadTree = async () => {
    try {
      await loadTree(dirPath);
      addToHistory('load', undefined, `Loaded from ${dirPath}`);
    } catch (error) {
      alert("Error loading tree: " + (error as Error).message);
    }
  };

  const handleClassify = async (nodeId: string) => {
    const node = (tree.items as any)[nodeId] as TreeNode;
    if (!node?.data?.name) return;

    setClassifyingNodes(prev => new Set([...prev, nodeId]));
    try {
      const tags = await classifyContent(node.data.name);
      setTree({
        ...tree,
        items: {
          ...tree.items,
          [nodeId]: {
            ...node,
            data: { ...node.data, tags }
          }
        }
      });
      addToHistory('classify', nodeId, `Tagged with: ${tags.join(', ')}`);
    } catch (error) {
      console.error("Classification error:", error);
    } finally {
      setClassifyingNodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(nodeId);
        return newSet;
      });
    }
  };

  const classifyAll = async () => {
    setIsClassifyingAll(true);
    const nodes = Object.entries(tree.items) as [string, TreeNode][];
    
    for (const [nodeId, node] of nodes) {
      if (node?.data?.name && (!node.data.tags || node.data.tags.length === 0)) {
        await handleClassify(nodeId);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    setIsClassifyingAll(false);
    addToHistory('classify-all', undefined, `Classified ${nodes.length} folders`);
  };

  const batchClassifySelected = async () => {
    if (selectedNodes.size === 0) return;
    
    const nodes = Array.from(selectedNodes);
    for (const nodeId of nodes) {
      await handleClassify(nodeId);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    addToHistory('batch-classify', undefined, `Classified ${nodes.length} selected folders`);
    clearSelection();
  };

  const handleExportTree = async () => {
    try {
      const data = JSON.stringify(tree, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tree-${Date.now()}.json`;
      a.click();
      addToHistory('export', undefined, 'Tree exported to JSON');
    } catch (error) {
      console.error("Export error:", error);
    }
  };

  const handleLoadTreeFromFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      const data = JSON.parse(content);
      setTree(data);
      addToHistory('import', undefined, 'Tree imported from JSON');
    } catch (error) {
      alert("Error importing tree: " + (error as Error).message);
    }
  };

  const handleGenerateFiles = async () => {
    if (!genPrompt) {
      alert("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    try {
      await generateFiles(genPrompt, genBasePath);
      addToHistory('generate', undefined, `Generated files at ${genBasePath}`);
      alert("Files generated successfully!");
    } catch (error) {
      alert("Error generating files: " + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const clearTree = () => {
    if (confirm("Are you sure you want to clear the entire tree?")) {
      setTree({ items: {} });
      addToHistory('clear', undefined, 'Tree cleared');
    }
  };

  const removeTag = (nodeId: string, tagIndex: number) => {
    const node = (tree.items as any)[nodeId] as TreeNode;
    const newTags = node.data.tags?.filter((_, i) => i !== tagIndex) ?? [];
    
    setTree({
      ...tree,
      items: {
        ...tree.items,
        [nodeId]: {
          ...node,
          data: { ...node.data, tags: newTags }
        }
      }
    });
    
    addToHistory('remove-tag', nodeId, node.data.tags?.[tagIndex] ?? 'unknown');
  };

  const deleteNode = (nodeId: string) => {
    const newItems = { ...tree.items };
    delete (newItems as any)[nodeId];
    setTree({ ...tree, items: newItems });
    selectedNodes.delete(nodeId);
    addToHistory('delete', nodeId, 'Node deleted');
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('foldertree-history');
  };

  return (
    <div className={`folder-tree-container ${darkMode ? 'dark' : ''}`}>
      {/* Header */}
      <div className="app-header">
        <h1 className="app-title">📂 FolderTree PRO</h1>
        <div className="header-controls">
          <button className="header-button" onClick={toggleTheme}>
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
          <button className="header-button" onClick={() => setShowStats(!showStats)}>
            {showStats ? '📊 Hide Stats' : '📊 Show Stats'}
          </button>
          <button className="header-button" onClick={() => setShowHistory(!showHistory)}>
            {showHistory ? '📜 Hide History' : '📜 Show History'}
          </button>
        </div>
      </div>

      {/* Statistics Dashboard */}
      {showStats && (
        <div className="stats-dashboard">
          <div className="stat-item">
            <div className="stat-icon">📁</div>
            <div>
              <div className="stat-value">{stats.totalFolders}</div>
              <div className="stat-label">Total Folders</div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">🏷️</div>
            <div>
              <div className="stat-value">{stats.totalTags}</div>
              <div className="stat-label">Total Tags</div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">✨</div>
            <div>
              <div className="stat-value">{stats.tagPercentage}%</div>
              <div className="stat-label">Tagged</div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">⭐</div>
            <div>
              <div className="stat-value">{stats.favorited}</div>
              <div className="stat-label">Favorites</div>
            </div>
          </div>
        </div>
      )}

      {/* History Panel */}
      {showHistory && (
        <div className="history-panel">
          <div className="history-header">
            <h3>📜 Activity History</h3>
            {history.length > 0 && (
              <button className="clear-history-btn" onClick={clearHistory}>
                Clear History
              </button>
            )}
          </div>
          <div className="history-list">
            {history.length === 0 ? (
              <div className="empty-history">No activity yet</div>
            ) : (
              history.map((entry, idx) => (
                <div key={idx} className="history-entry">
                  <div className="history-time">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </div>
                  <div>
                    <div className="history-action">
                      {entry.action.replace('-', ' ').toUpperCase()}
                    </div>
                    {entry.details && (
                      <div className="history-details">{entry.details}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="tree-controls">
        {/* Load & Export Section */}
        <div className="control-section">
          <div className="section-title">📂 Tree Management</div>
          <div className="control-group">
            <input
              type="text"
              className="control-input"
              placeholder="Enter directory path..."
              value={dirPath}
              onChange={(e) => setDirPath(e.target.value)}
            />
            <div className="button-group">
              <button className="control-button control-button-primary" onClick={handleLoadTree}>
                Load Tree
              </button>
              <button className="control-button control-button-secondary" onClick={handleExportTree}>
                Export JSON
              </button>
              <label className="control-button control-button-secondary">
                Import JSON
                <input
                  type="file"
                  accept=".json"
                  onChange={handleLoadTreeFromFile}
                  className="hidden-input"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Classification Section */}
        <div className="control-section">
          <div className="section-title">🤖 AI Classification</div>
          <div className="button-group">
            <button
              className="control-button control-button-success"
              onClick={() => {
                const firstUnclassified = Object.entries(tree.items).find(
                  ([_, node]: [string, any]) => !node.data.tags || node.data.tags.length === 0
                );
                if (firstUnclassified) handleClassify(firstUnclassified[0]);
              }}
              disabled={isClassifyingAll || classifyingNodes.size > 0}
            >
              {isClassifyingAll ? 'Classifying...' : 'Classify Next'}
            </button>
            <button
              className="control-button control-button-success"
              onClick={classifyAll}
              disabled={isClassifyingAll || Object.keys(tree.items).length === 0}
            >
              {isClassifyingAll ? 'Classifying All...' : 'Classify All'}
            </button>
            {selectedNodes.size > 0 && (
              <button
                className="control-button control-button-primary"
                onClick={batchClassifySelected}
              >
                Tag {selectedNodes.size} Selected
              </button>
            )}
          </div>
        </div>

        {/* Generate Files Section */}
        <div className="control-section">
          <div className="section-title">🔨 Generate Files</div>
          <input
            type="text"
            className="control-input"
            placeholder="Describe the structure you want to generate..."
            value={genPrompt}
            onChange={(e) => setGenPrompt(e.target.value)}
          />
          <input
            type="text"
            className="control-input"
            placeholder="Base path for generated files..."
            value={genBasePath}
            onChange={(e) => setGenBasePath(e.target.value)}
          />
          <button
            className="control-button control-button-success"
            onClick={handleGenerateFiles}
            disabled={isGenerating || !genPrompt}
          >
            {isGenerating ? 'Generating...' : 'Generate Structure'}
          </button>
        </div>

        {/* Batch Actions */}
        {selectedNodes.size > 0 && (
          <div className="control-section">
            <div className="section-title">✅ Batch Actions</div>
            <div className="button-group">
              <button className="control-button control-button-primary" onClick={selectAll}>
                Select All ({Object.keys(tree.items).length})
              </button>
              <button className="control-button control-button-secondary" onClick={clearSelection}>
                Clear Selection
              </button>
              <button className="control-button control-button-danger" onClick={clearTree}>
                Clear Tree
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="search-section">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search folders, tags, or paths..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button className="clear-search" onClick={() => setSearchTerm('')}>
            ✕
          </button>
        )}
      </div>

      {/* Tree Display */}
      <div className="tree-display">
        <div className="tree-header">
          <div>
            <h2 className="tree-title">
              {searchTerm ? `Search Results: ${Object.keys(filteredNodes).length}` : 'Folder Structure'}
            </h2>
            <p className="tree-subtitle">AI-powered folder organization and classification</p>
          </div>
          <div className="tree-stats">
            <div className="stat-badge">📁 {stats.totalFolders} folders</div>
            <div className="stat-badge">🏷️ {stats.totalTags} tags</div>
            <div className="stat-badge">✅ {selectedNodes.size} selected</div>
          </div>
        </div>

        <div className="tree-content">
          {Object.keys(filteredNodes).length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📂</div>
              <h3 className="empty-title">No Folders Found</h3>
              <p className="empty-description">
                {searchTerm ? 'Try a different search term' : 'Load a directory to get started'}
              </p>
            </div>
          ) : (
            Object.entries(filteredNodes).map(([nodeId, node]: [string, any]) => (
              <div
                key={nodeId}
                className={`folder-node ${selectedNodes.has(nodeId) ? 'selected' : ''} ${
                  classifyingNodes.has(nodeId) ? 'classifying' : ''
                }`}
              >
                {/* Node Header with Checkbox and Favorite */}
                <div className="node-header">
                  <input
                    type="checkbox"
                    className="node-checkbox"
                    checked={selectedNodes.has(nodeId)}
                    onChange={() => toggleNodeSelection(nodeId)}
                    title="Select folder"
                    aria-label="Select folder"
                  />
                  <button
                    className="favorite-btn"
                    onClick={() => toggleFavorite(nodeId)}
                    title={favorites.has(nodeId) ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {favorites.has(nodeId) ? '⭐' : '☆'}
                  </button>
                </div>

                {/* Node Content */}
                <div className="node-content">
                  <div className="node-info">
                    <div className="node-icon">📁</div>
                    <div className="node-details">
                      <div className="node-name">{node.data.name}</div>
                      <div className="node-path">{node.data.path}</div>
                    </div>
                  </div>
                  <button
                    className={`classify-btn ${classifyingNodes.has(nodeId) ? 'classifying' : ''}`}
                    onClick={() => handleClassify(nodeId)}
                    disabled={classifyingNodes.has(nodeId) || isClassifyingAll}
                  >
                    {classifyingNodes.has(nodeId) ? '⏳ Tagging...' : '🏷️ Tag'}
                  </button>
                </div>

                {/* Tags */}
                {node.data.tags && node.data.tags.length > 0 && (
                  <div className="tags-container">
                    {node.data.tags.map((tag: string, idx: number) => (
                      <div key={idx} className="tag">
                        {tag}
                        <button
                          className="tag-remove"
                          onClick={() => removeTag(nodeId, idx)}
                          title="Remove tag"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Delete Button */}
                <div className="node-actions">
                  <button
                    className="control-button control-button-danger node-delete-btn"
                    onClick={() => deleteNode(nodeId)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
