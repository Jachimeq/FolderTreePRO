"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTreeStore } from "../store/useTreeStore";
import { classifyContent, generateFiles, loadFolderTree } from "../utils/classify";
import type { TreeNode } from "../types/tree";
import "./FolderTreeUI.css";

interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  folders: string[];
  tags?: Record<string, string[]>;
}

interface HistoryEntry {
  timestamp: number;
  action: string;
  nodeId?: string;
  details?: string;
}

interface TreeNodeWithCollapse extends TreeNode {
  collapsed?: boolean;
  children?: string[];
}

type AuditSeverity = 'info' | 'low' | 'medium' | 'high';

interface AuditFinding {
  id: string;
  title: string;
  severity: AuditSeverity;
  nodes: string[];
  suggestion: string;
  action?: 'select' | 'tag' | 'delete';
  tagValue?: string;
}

interface AuditConfig {
  deepNestingThreshold: number;
  artifactPatterns: string[];
  minSizeBytes: number;
  maxAgeMonths: number;
}

interface AutoOrganizeParams {
  groupBy: 'type' | 'date' | 'size' | 'tags';
  threshold: number;
}

interface BulkRenamePattern {
  find: string;
  replace: string;
  useRegex: boolean;
}

const normalizePath = (path?: string) => (path || '').replace(/\\/g, '/');

const STRUCTURE_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'nextjs-app',
    name: 'Next.js App Router',
    description: 'API routes, app router, components, lib, store, tests',
    folders: [
      'src/app',
      'src/app/api',
      'src/app/api/auth',
      'src/app/api/stripe',
      'src/components',
      'src/lib',
      'src/store',
      'src/utils',
      'public',
      'tests',
      'scripts'
    ],
    tags: {
      'src/app': ['app'],
      'src/components': ['ui'],
      'src/lib': ['data'],
      'src/store': ['state'],
      tests: ['quality'],
      scripts: ['ops']
    }
  },
  {
    id: 'python-package',
    name: 'Python Package',
    description: 'src layout with tests, docs, scripts, CI',
    folders: [
      'src',
      'src/package_name',
      'src/package_name/api',
      'src/package_name/services',
      'src/package_name/models',
      'tests',
      'docs',
      'scripts',
      'examples'
    ],
    tags: {
      src: ['code'],
      tests: ['quality'],
      docs: ['docs'],
      scripts: ['ops'],
      examples: ['samples']
    }
  },
  {
    id: 'react-library',
    name: 'React Component Library',
    description: 'Src/lib with components, stories, tests, build, demo app',
    folders: [
      'src',
      'src/components',
      'src/hooks',
      'src/styles',
      'src/utils',
      'stories',
      'tests',
      'dist',
      'scripts',
      'examples'
    ],
    tags: {
      'src/components': ['ui'],
      'src/hooks': ['hooks'],
      'src/utils': ['utils'],
      stories: ['docs'],
      tests: ['quality'],
      dist: ['artifacts'],
      scripts: ['ops'],
      examples: ['samples']
    }
  },
  {
    id: 'data-science',
    name: 'Data Science Workspace',
    description: 'Notebooks, data, models, experiments, reports',
    folders: [
      'notebooks',
      'data/raw',
      'data/processed',
      'data/external',
      'models',
      'src',
      'src/features',
      'src/pipelines',
      'experiments',
      'reports',
      'scripts'
    ],
    tags: {
      notebooks: ['exploration'],
      'data/raw': ['data'],
      'data/processed': ['data'],
      models: ['models'],
      experiments: ['experiments'],
      reports: ['docs'],
      scripts: ['ops']
    }
  },
  {
    id: 'unity-project',
    name: 'Unity Game Project',
    description: 'Assets, scenes, scripts, prefabs, resources',
    folders: [
      'Assets',
      'Assets/Scripts',
      'Assets/Prefabs',
      'Assets/Scenes',
      'Assets/Materials',
      'Assets/Textures',
      'Assets/Audio',
      'Assets/Animations',
      'Assets/Resources',
      'ProjectSettings',
      'Packages'
    ],
    tags: {
      'Assets/Scripts': ['code'],
      'Assets/Prefabs': ['prefabs'],
      'Assets/Scenes': ['scenes'],
      'Assets/Materials': ['assets'],
      'Assets/Audio': ['assets']
    }
  },
  {
    id: 'mobile-app',
    name: 'Mobile App (React Native)',
    description: 'Screens, components, navigation, services, assets',
    folders: [
      'src',
      'src/screens',
      'src/components',
      'src/navigation',
      'src/services',
      'src/store',
      'src/utils',
      'src/assets',
      'src/assets/images',
      'src/assets/fonts',
      'android',
      'ios',
      'tests'
    ],
    tags: {
      'src/screens': ['screens'],
      'src/components': ['ui'],
      'src/navigation': ['navigation'],
      'src/services': ['services'],
      'src/store': ['state'],
      tests: ['quality']
    }
  }
];

export default function FolderTreeUI() {
  const { tree, setTree, loadTree } = useTreeStore();
  const [undoRedoKey, setUndoRedoKey] = useState(0); // Force re-render on undo/redo
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
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());
  const [batchTagInput, setBatchTagInput] = useState("");
  
  // Advanced search filters
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [filterTags, setFilterTags] = useState<Set<string>>(new Set());
  const [filterRegex, setFilterRegex] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [searchPresets, setSearchPresets] = useState<Array<{name: string; filters: any}>>([]);
  const [templatePreview, setTemplatePreview] = useState<{templateId: string; missing: string[]; total: number} | null>(null);
  const [templateJson, setTemplateJson] = useState('');

  // Audit
  const [auditFindings, setAuditFindings] = useState<AuditFinding[]>([]);
  const [auditConfig, setAuditConfig] = useState<AuditConfig>({
    deepNestingThreshold: 6,
    artifactPatterns: ['node_modules', '.next', 'dist', 'build', 'coverage', 'tmp', 'temp', '.turbo', 'out'],
    minSizeBytes: 0,
    maxAgeMonths: 0
  });
  const [showAuditConfig, setShowAuditConfig] = useState(false);
  
  // Auto-organize
  const [autoOrganizeParams, setAutoOrganizeParams] = useState<AutoOrganizeParams>({
    groupBy: 'type',
    threshold: 5
  });
  
  // Bulk rename
  const [bulkRenamePattern, setBulkRenamePattern] = useState<BulkRenamePattern>({
    find: '',
    replace: '',
    useRegex: false
  });
  const [showBulkRename, setShowBulkRename] = useState(false);
  
  // Comparison mode
  const [comparisonTree, setComparisonTree] = useState<any>(null);
  const [showComparison, setShowComparison] = useState(false);
  
  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<any>({
    primaryColor: '#667eea',
    secondaryColor: '#764ba2',
    accentColor: '#f472b6',
    batchSize: 5,
    autoSave: true,
    aiModel: 'mistral',
    fontSize: 'normal',
    compactMode: false,
  });

  // Drag & Drop
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOverNode, setDragOverNode] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Load theme and data from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('foldertree-theme') === 'dark';
    setDarkMode(savedTheme);
    
    const savedFavorites = localStorage.getItem('foldertree-favorites');
    if (savedFavorites) setFavorites(new Set(JSON.parse(savedFavorites)));
    
    const savedHistory = localStorage.getItem('foldertree-history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    
    const savedSettings = localStorage.getItem('foldertree-settings');
    if (savedSettings) setSettings(JSON.parse(savedSettings));
    
    const savedPresets = localStorage.getItem('foldertree-presets');
    if (savedPresets) setSearchPresets(JSON.parse(savedPresets));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if ((e.key === 'z' || e.key === 'Z')) {
          e.preventDefault();
          if (e.shiftKey) {
            useTreeStore.getState().redo();
          } else {
            useTreeStore.getState().undo();
          }
          setUndoRedoKey(prev => prev + 1); // Force re-render
          setTree(useTreeStore.getState().tree); // Update local tree
        } else if (e.key === 'l' || e.key === 'L') {
          e.preventDefault();
          handleLoadTree();
        } else if (e.key === 'e' || e.key === 'E') {
          e.preventDefault();
          handleExportTree();
        } else if (e.shiftKey && (e.key === 'c' || e.key === 'C')) {
          e.preventDefault();
          classifyAll();
        } else if (e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          selectAll();
        }
      }
      if (e.key === 'Delete' && selectedNodes.size > 0) {
        e.preventDefault();
        const nodesToDelete = Array.from(selectedNodes);
        nodesToDelete.forEach(nodeId => deleteNode(nodeId));
      } else if (e.key === 'Escape' && isDragging) {
        setDraggedNode(null);
        setDragOverNode(null);
        setIsDragging(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodes, dirPath, darkMode]);

  // Toggle node collapse
  const toggleNodeCollapse = useCallback((nodeId: string) => {
    setCollapsedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
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
    const nodes = tree.items as any;
    const filtered: any = {};
    
    Object.entries(nodes).forEach(([key, node]: [string, any]) => {
      // Basic search term filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
          node.data.name?.toLowerCase().includes(term) ||
          node.data.tags?.some((tag: string) => tag.toLowerCase().includes(term)) ||
          node.data.path?.toLowerCase().includes(term);
        if (!matchesSearch) return;
      }
      
      // Regex filter
      if (filterRegex) {
        try {
          const regex = new RegExp(filterRegex);
          const matchesRegex = 
            regex.test(node.data.name || '') || 
            regex.test(node.data.path || '');
          if (!matchesRegex) return;
        } catch (e) {
          // Invalid regex, skip filter
        }
      }
      
      // Tag filters - must match ALL selected tags (AND operation)
      if (filterTags.size > 0) {
        const nodeTags = new Set(node.data.tags || []);
        const hasAllTags = Array.from(filterTags).every(tag => nodeTags.has(tag));
        if (!hasAllTags) return;
      }
      
      // Date range filter
      if (filterDateFrom || filterDateTo) {
        const nodeDate = node.data.modifiedDate ? new Date(node.data.modifiedDate) : new Date(0);
        if (filterDateFrom) {
          const fromDate = new Date(filterDateFrom);
          if (nodeDate < fromDate) return;
        }
        if (filterDateTo) {
          const toDate = new Date(filterDateTo);
          toDate.setHours(23, 59, 59, 999);
          if (nodeDate > toDate) return;
        }
      }
      
      filtered[key] = node;
    });
    
    return filtered;
  }, [tree.items, searchTerm, filterTags, filterRegex, filterDateFrom, filterDateTo]);

  const runAudit = useCallback(() => {
    const items = Object.entries(tree.items) as [string, any][];
    const findings: AuditFinding[] = [];
    const nameMap: Record<string, string[]> = {};
    const pathMap: Record<string, string> = {};

    items.forEach(([id, node]) => {
      const name = node.data.name || `(untitled-${id})`;
      nameMap[name] = nameMap[name] ? [...nameMap[name], id] : [id];
      if (node.data.path) {
        pathMap[node.data.path] = id;
      }
    });

    const duplicateGroups = Object.values(nameMap).filter(group => group.length > 1);
    const duplicateNodes = duplicateGroups.flat();
    if (duplicateNodes.length > 0) {
      findings.push({
        id: 'duplicates',
        title: 'Duplicate folder names',
        severity: 'medium',
        nodes: duplicateNodes,
        suggestion: 'Merge or rename duplicate folders',
        action: 'select'
      });
    }

    const untaggedNodes = items
      .filter(([_, node]) => !node.data.tags || node.data.tags.length === 0)
      .map(([id]) => id);
    if (untaggedNodes.length > 0) {
      findings.push({
        id: 'untagged',
        title: 'Untagged folders',
        severity: 'low',
        nodes: untaggedNodes,
        suggestion: 'Tag folders for faster discovery',
        action: 'tag',
        tagValue: 'needs-review'
      });
    }

    const tempNames = auditConfig.artifactPatterns;
    const artifactNodes = items
      .filter(([_, node]) => tempNames.some(name => (node.data.name || '').toLowerCase() === name.toLowerCase()))
      .map(([id]) => id);
    if (artifactNodes.length > 0) {
      findings.push({
        id: 'artifacts',
        title: 'Build/temporary artifacts',
        severity: 'high',
        nodes: artifactNodes,
        suggestion: 'Prune artifacts to reduce clutter',
        action: 'delete'
      });
    }

    const deepNodes = items
      .filter(([_, node]) => (node.data.path || '').split(/[\\/]/).filter(Boolean).length > auditConfig.deepNestingThreshold)
      .map(([id]) => id);
    if (deepNodes.length > 0) {
      findings.push({
        id: 'deep',
        title: 'Deeply nested folders',
        severity: 'medium',
        nodes: deepNodes,
        suggestion: 'Consider flattening deep paths',
        action: 'select'
      });
    }

    const orphanNodes: string[] = [];
    items.forEach(([id, node]) => {
      const path = node.data.path || '';
      const parts = path.split(/[\\/]/).filter(Boolean);
      if (parts.length > 1) {
        const parentPath = parts.slice(0, -1).join('/');
        if (parentPath && !pathMap[parentPath]) {
          orphanNodes.push(id);
        }
      }
    });
    if (orphanNodes.length > 0) {
      findings.push({
        id: 'orphans',
        title: 'Orphan folders',
        severity: 'low',
        nodes: orphanNodes,
        suggestion: 'Parent folder missing; consider relocating',
        action: 'select'
      });
    }

    setAuditFindings(findings);
    addToHistory('audit', undefined, `Audit found ${findings.length} items`);
  }, [tree.items, addToHistory, auditConfig]);

  const autoOrganize = useCallback(() => {
    const { groupBy, threshold } = autoOrganizeParams;
    const items = Object.entries(tree.items) as [string, any][];
    const newItems = { ...tree.items } as any;
    let organized = 0;

    if (groupBy === 'type') {
      const groups: Record<string, string[]> = {};
      items.forEach(([id, node]) => {
        const name = node.data.name || '';
        const ext = name.includes('.') ? name.split('.').pop()?.toLowerCase() || 'misc' : 'folders';
        if (!groups[ext]) groups[ext] = [];
        groups[ext].push(id);
      });

      Object.entries(groups).forEach(([type, nodeIds]) => {
        if (nodeIds.length >= threshold) {
          nodeIds.forEach(nodeId => {
            const node = newItems[nodeId];
            if (node && !node.data.tags?.includes(`type-${type}`)) {
              newItems[nodeId] = {
                ...node,
                data: { ...node.data, tags: [...(node.data.tags || []), `type-${type}`] }
              };
              organized++;
            }
          });
        }
      });
    } else if (groupBy === 'size') {
      items.forEach(([id, node]) => {
        const sizeTag = 'size-unknown';
        if (!node.data.tags?.includes(sizeTag)) {
          newItems[id] = {
            ...node,
            data: { ...node.data, tags: [...(node.data.tags || []), sizeTag] }
          };
          organized++;
        }
      });
    } else if (groupBy === 'tags') {
      const tagGroups: Record<string, string[]> = {};
      items.forEach(([id, node]) => {
        (node.data.tags || []).forEach((tag: string) => {
          if (!tagGroups[tag]) tagGroups[tag] = [];
          tagGroups[tag].push(id);
        });
      });
    }

    setTree({ ...tree, items: newItems });
    addToHistory('auto-organize', undefined, `Auto-organized ${organized} folders by ${groupBy}`);
  }, [tree, setTree, addToHistory, autoOrganizeParams]);

  const applyBulkRename = useCallback(() => {
    if (!bulkRenamePattern.find) {
      alert('Enter a find pattern');
      return;
    }

    const newItems = { ...tree.items } as any;
    let renamed = 0;

    Object.entries(tree.items).forEach(([id, node]: [string, any]) => {
      const oldName = node.data.name || '';
      let newName = oldName;

      if (bulkRenamePattern.useRegex) {
        try {
          const regex = new RegExp(bulkRenamePattern.find, 'g');
          newName = oldName.replace(regex, bulkRenamePattern.replace);
        } catch (e) {
          return;
        }
      } else {
        newName = oldName.replaceAll(bulkRenamePattern.find, bulkRenamePattern.replace);
      }

      if (newName !== oldName) {
        newItems[id] = {
          ...node,
          data: { ...node.data, name: newName }
        };
        renamed++;
      }
    });

    if (renamed > 0) {
      setTree({ ...tree, items: newItems });
      addToHistory('bulk-rename', undefined, `Renamed ${renamed} folders`);
      useTreeStore.getState().addHistory('other', `Bulk renamed ${renamed} folders`, undefined);
    } else {
      alert('No matches found');
    }
  }, [tree, setTree, addToHistory, bulkRenamePattern]);

  const loadComparisonTree = useCallback(async (dirPath: string) => {
    try {
      const nodes = await loadFolderTree(dirPath);
      const items: Record<string, TreeNode> = {};
      nodes.forEach((node: TreeNode) => {
        items[node.id] = node;
      });
      setComparisonTree({ items });
      setShowComparison(true);
      addToHistory('comparison', undefined, `Loaded comparison from ${dirPath}`);
    } catch (error) {
      alert("Error loading comparison tree: " + (error as Error).message);
    }
  }, [addToHistory]);

  const applyAuditFinding = useCallback((finding: AuditFinding) => {
    if (finding.action === 'select') {
      setSelectedNodes(new Set(finding.nodes));
      return;
    }

    if (finding.action === 'tag') {
      const tag = finding.tagValue || 'needs-review';
      const newItems = { ...tree.items } as any;
      finding.nodes.forEach(nodeId => {
        const node = newItems[nodeId];
        if (node) {
          const tags = node.data.tags || [];
          if (!tags.includes(tag)) {
            newItems[nodeId] = {
              ...node,
              data: { ...node.data, tags: [...tags, tag] }
            };
          }
        }
      });
      setTree({ ...tree, items: newItems });
      addToHistory('audit-tag', undefined, `Tagged ${finding.nodes.length} folders as ${tag}`);
      return;
    }

    if (finding.action === 'delete') {
      if (!confirm(`Delete ${finding.nodes.length} flagged folders from the tree?`)) return;
      const newItems = { ...tree.items } as any;
      finding.nodes.forEach(nodeId => {
        delete newItems[nodeId];
      });
      setTree({ ...tree, items: newItems });
      addToHistory('audit-delete', undefined, `Deleted ${finding.nodes.length} folders`);
    }
  }, [tree, setTree, addToHistory]);

  const moveNodeUnderTarget = useCallback((dragId: string, targetId: string) => {
    if (dragId === targetId) return;
    const items = tree.items as any;
    const dragNode = items[dragId];
    const targetNode = items[targetId];
    if (!dragNode || !targetNode) return;

    const dragPath = normalizePath(dragNode.data.path || dragNode.data.name || dragId);
    const targetPath = normalizePath(targetNode.data.path || targetNode.data.name || '');

    // Prevent moving a node into its own descendant
    if (targetPath && targetPath.startsWith(dragPath)) return;

    const newBase = targetPath ? `${targetPath}/${dragNode.data.name}` : dragNode.data.name;

    const updatedItems: any = { ...items };
    Object.entries(items).forEach(([id, node]: [string, any]) => {
      const nodePath = normalizePath(node.data.path || node.data.name || id);
      if (nodePath === dragPath || nodePath.startsWith(`${dragPath}/`)) {
        const suffix = nodePath.slice(dragPath.length);
        const updatedPath = `${newBase}${suffix}`;
        updatedItems[id] = {
          ...node,
          data: { ...node.data, path: updatedPath }
        };
      }
    });

    setTree({ ...tree, items: updatedItems });
    addToHistory('move', dragId, `Moved under ${targetNode.data.name}`);
    useTreeStore.getState().addHistory('other', `Moved ${dragNode.data.name} under ${targetNode.data.name}`, dragId);
  }, [tree, setTree, addToHistory]);

  const previewTemplate = useCallback((templateId: string) => {
    const template = STRUCTURE_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    const existingPaths = new Set(
      Object.values(tree.items as any).map((node: any) => node.data.path || node.data.name)
    );
    const missing = template.folders.filter(path => !existingPaths.has(path));
    setTemplatePreview({ templateId, missing, total: template.folders.length });
  }, [tree.items]);

  const applyTemplate = useCallback((templateId: string) => {
    const template = STRUCTURE_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    const existingPaths = new Set(
      Object.values(tree.items as any).map((node: any) => node.data.path || node.data.name)
    );
    const newItems = { ...tree.items } as any;
    let created = 0;

    template.folders.forEach(path => {
      if (!existingPaths.has(path)) {
        const id = `template-${templateId}-${path}`;
        newItems[id] = {
          id,
          data: {
            name: path.split(/[\\/]/).filter(Boolean).pop() || path,
            path,
            tags: template.tags?.[path] || ['template']
          }
        };
        created += 1;
      }
    });

    setTree({ ...tree, items: newItems });
    addToHistory('template', undefined, `Applied ${template.name} (${created} added)`);
    previewTemplate(templateId);
  }, [tree, setTree, addToHistory, previewTemplate]);

  const exportTemplates = useCallback(() => {
    const json = JSON.stringify(STRUCTURE_TEMPLATES, null, 2);
    setTemplateJson(json);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `templates-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const importTemplates = useCallback(() => {
    if (!templateJson.trim()) return;
    try {
      const parsed = JSON.parse(templateJson);
      if (!Array.isArray(parsed)) throw new Error('Invalid template JSON');
      parsed.forEach((tpl) => {
        if (tpl.id && !STRUCTURE_TEMPLATES.find(t => t.id === tpl.id)) {
          STRUCTURE_TEMPLATES.push(tpl as TemplateDefinition);
        }
      });
      alert('Templates imported (session only).');
    } catch (err) {
      alert('Import failed: ' + (err as Error).message);
    }
  }, [templateJson]);

  const exportApplyScript = useCallback(() => {
    if (auditFindings.length === 0 && !templatePreview) {
      alert('No audit findings or template preview to export');
      return;
    }

    let script = '# FolderTree PRO - Apply Plan Script\n';
    script += `# Generated: ${new Date().toISOString()}\n\n`;

    if (auditFindings.length > 0) {
      script += '# === Audit Actions ===\n\n';
      auditFindings.forEach(finding => {
        script += `# ${finding.title} (${finding.severity})\n`;
        script += `# Suggestion: ${finding.suggestion}\n`;
        script += `# Affected folders: ${finding.nodes.length}\n\n`;
        
        finding.nodes.forEach(nodeId => {
          const node = (tree.items as any)[nodeId];
          if (node) {
            const path = node.data.path || node.data.name;
            if (finding.action === 'delete') {
              script += `Remove-Item -Path "${path}" -Recurse -Force\n`;
            } else if (finding.action === 'tag') {
              script += `# Tag folder: ${path} with "${finding.tagValue}"\n`;
            }
          }
        });
        script += '\n';
      });
    }

    if (templatePreview && templatePreview.missing.length > 0) {
      script += '# === Template Missing Folders ===\n\n';
      const template = STRUCTURE_TEMPLATES.find(t => t.id === templatePreview.templateId);
      if (template) {
        script += `# Template: ${template.name}\n\n`;
        templatePreview.missing.forEach(path => {
          script += `New-Item -Path "${path}" -ItemType Directory -Force\n`;
        });
      }
    }

    script += '\n# End of script\n';

    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apply-plan-${Date.now()}.ps1`;
    a.click();
    URL.revokeObjectURL(url);
    addToHistory('export-script', undefined, 'Exported apply plan script');
  }, [auditFindings, templatePreview, tree.items, addToHistory]);

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
      const newTree = {
        ...tree,
        items: {
          ...tree.items,
          [nodeId]: {
            ...node,
            data: { ...node.data, tags }
          }
        }
      };
      setTree(newTree);
      addToHistory('classify', nodeId, `Tagged with: ${tags.join(', ')}`);
      useTreeStore.getState().addHistory('classify', `Tagged: ${tags.join(', ')}`, nodeId);
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

  const applyBatchTag = () => {
    if (!batchTagInput.trim() || selectedNodes.size === 0) {
      alert('Enter a tag and select folders first');
      return;
    }

    const tag = batchTagInput.trim();
    const newItems = { ...tree.items };

    Array.from(selectedNodes).forEach(nodeId => {
      const node = (newItems as any)[nodeId] as TreeNode;
      if (node) {
        const existingTags = node.data.tags || [];
        if (!existingTags.includes(tag)) {
          newItems[nodeId] = {
            ...node,
            data: { ...node.data, tags: [...existingTags, tag] }
          };
        }
      }
    });

    setTree({ ...tree, items: newItems });
    addToHistory('batch-tag', undefined, `Applied tag "${tag}" to ${selectedNodes.size} folders`);
    setBatchTagInput('');
  };

  const removeBatchTag = (tag: string) => {
    if (selectedNodes.size === 0) return;

    const newItems = { ...tree.items };

    Array.from(selectedNodes).forEach(nodeId => {
      const node = (newItems as any)[nodeId] as TreeNode;
      if (node?.data?.tags) {
        newItems[nodeId] = {
          ...node,
          data: { ...node.data, tags: node.data.tags.filter(t => t !== tag) }
        };
      }
    });

    setTree({ ...tree, items: newItems });
    addToHistory('batch-remove-tag', undefined, `Removed tag "${tag}" from ${selectedNodes.size} folders`);
  };

  // Build hierarchical tree (parent-child relationships)
  const hierarchicalTree = useMemo(() => {
    const nodes = filteredNodes as any;
    const rootNodes: string[] = [];
    const nodeMap: Record<string, string[]> = {};

    Object.entries(nodes).forEach(([id, node]: [string, any]) => {
      nodeMap[id] = [];
    });

    Object.entries(nodes).forEach(([id, node]: [string, any]) => {
      const path = (node.data.path || '').split(/[\\/]/);
      if (path.length <= 1) {
        rootNodes.push(id);
      } else {
        // Try to find parent
        let foundParent = false;
        for (const [otherId, otherNode] of Object.entries(nodes) as Array<[string, any]>) {
          if (otherId !== id) {
            const otherPath = (otherNode.data.path || '').split(/[\\/]/);
            if (otherPath.length === path.length - 1 && 
                path.slice(0, -1).join('/') === otherPath.join('/')) {
              nodeMap[otherId].push(id);
              foundParent = true;
              break;
            }
          }
        }
        if (!foundParent) {
          rootNodes.push(id);
        }
      }
    });

    return { rootNodes, nodeMap };
  }, [filteredNodes]);

  // Render node with children
  const renderNode = (nodeId: string, depth: number = 0): JSX.Element | null => {
    const node = (filteredNodes as any)[nodeId] as TreeNode;
    if (!node) return null;

    const children = hierarchicalTree.nodeMap[nodeId] || [];
    const isCollapsed = collapsedNodes.has(nodeId);

    return (
      <div key={nodeId}>
        <div
          className={`folder-node ${selectedNodes.has(nodeId) ? 'selected' : ''} ${
            classifyingNodes.has(nodeId) ? 'classifying' : ''
          } ${draggedNode === nodeId ? 'dragging' : ''} ${dragOverNode === nodeId ? 'drag-over' : ''} depth-${depth}`}
          draggable
          onDragStart={() => {
            setDraggedNode(nodeId);
            setIsDragging(true);
          }}
          onDragEnd={() => {
            setDraggedNode(null);
            setDragOverNode(null);
            setIsDragging(false);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverNode(nodeId);
          }}
          onDragLeave={() => setDragOverNode(null)}
          onDrop={(e) => {
            e.preventDefault();
            if (draggedNode && draggedNode !== nodeId) {
              moveNodeUnderTarget(draggedNode, nodeId);
            }
            setDragOverNode(null);
            setIsDragging(false);
          }}
        >
          <div className="node-header">
            {children.length > 0 && (
              <button
                className="collapse-btn"
                onClick={() => toggleNodeCollapse(nodeId)}
                title={isCollapsed ? 'Expand' : 'Collapse'}
              >
                {isCollapsed ? '▶' : '▼'}
              </button>
            )}
            <input
              type="checkbox"
              className="node-checkbox"
              checked={selectedNodes.has(nodeId)}
              onChange={() => toggleNodeSelection(nodeId)}
              aria-label={selectedNodes.has(nodeId) ? 'Deselect folder' : 'Select folder'}
              title={selectedNodes.has(nodeId) ? 'Deselect' : 'Select'}
            />
            <button
              className="favorite-btn"
              onClick={() => toggleFavorite(nodeId)}
              title={favorites.has(nodeId) ? 'Remove from favorites' : 'Add to favorites'}
            >
              {favorites.has(nodeId) ? '⭐' : '☆'}
            </button>
          </div>

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

          <div className="node-actions">
            <button
              className="control-button control-button-danger node-delete-btn"
              onClick={() => deleteNode(nodeId)}
            >
              🗑️ Delete
            </button>
          </div>
        </div>

        {!isCollapsed && children.length > 0 && (
          <div className="node-children">
            {children.map(childId => renderNode(childId, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleExportTree = async (format: 'json' | 'csv' | 'markdown' = 'json') => {
    try {
      let content = '';
      let filename = `tree-${Date.now()}`;
      let mimeType = 'application/json';

      if (format === 'json') {
        content = JSON.stringify(tree, null, 2);
        filename += '.json';
        mimeType = 'application/json';
      } else if (format === 'csv') {
        // Export as CSV
        const rows = [['Folder Name', 'Path', 'Tags', 'Modified Date']];
        Object.values(tree.items as any).forEach((node: any) => {
          rows.push([
            node.data.name || '',
            node.data.path || '',
            (node.data.tags || []).join(';'),
            node.data.modifiedDate ? new Date(node.data.modifiedDate).toISOString() : ''
          ]);
        });
        content = rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
        filename += '.csv';
        mimeType = 'text/csv';
      } else if (format === 'markdown') {
        // Export as Markdown
        content = '# Folder Structure Export\n\n';
        content += `Generated: ${new Date().toISOString()}\n\n`;
        content += `Total Folders: ${Object.keys(tree.items).length}\n\n`;
        content += '## Folders\n\n';
        
        Object.values(tree.items as any).forEach((node: any) => {
          const tags = node.data.tags?.length ? ` | **Tags:** ${node.data.tags.join(', ')}` : '';
          content += `- **${node.data.name}**\n`;
          content += `  - Path: \`${node.data.path}\`${tags}\n`;
        });
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      addToHistory('export', undefined, `Tree exported to ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Export error:", error);
      alert('Export failed: ' + (error as Error).message);
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
    const removedTag = node.data.tags?.[tagIndex] ?? 'unknown';
    const newTags = node.data.tags?.filter((_, i) => i !== tagIndex) ?? [];
    
    const newTree = {
      ...tree,
      items: {
        ...tree.items,
        [nodeId]: {
          ...node,
          data: { ...node.data, tags: newTags }
        }
      }
    };
    setTree(newTree);
    
    addToHistory('remove-tag', nodeId, removedTag);
    useTreeStore.getState().addHistory('tag', `Removed tag: ${removedTag}`, nodeId);
  };

  const deleteNode = (nodeId: string) => {
    const newItems = { ...tree.items };
    delete (newItems as any)[nodeId];
    const newTree = { ...tree, items: newItems };
    setTree(newTree);
    selectedNodes.delete(nodeId);
    addToHistory('delete', nodeId, 'Node deleted');
    useTreeStore.getState().addHistory('delete', `Deleted folder`, nodeId);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('foldertree-history');
  };

  // Advanced search functions
  const saveSearchPreset = (presetName: string) => {
    const newPreset = {
      name: presetName,
      filters: {
        filterTags: Array.from(filterTags),
        filterRegex,
        filterDateFrom,
        filterDateTo,
        searchTerm,
      }
    };
    const updated = searchPresets.filter(p => p.name !== presetName);
    updated.push(newPreset);
    setSearchPresets(updated);
    localStorage.setItem('foldertree-presets', JSON.stringify(updated));
  };

  const loadSearchPreset = (preset: any) => {
    setSearchTerm(preset.filters.searchTerm || '');
    setFilterTags(new Set(preset.filters.filterTags || []));
    setFilterRegex(preset.filters.filterRegex || '');
    setFilterDateFrom(preset.filters.filterDateFrom || '');
    setFilterDateTo(preset.filters.filterDateTo || '');
  };

  const deleteSearchPreset = (presetName: string) => {
    const updated = searchPresets.filter(p => p.name !== presetName);
    setSearchPresets(updated);
    localStorage.setItem('foldertree-presets', JSON.stringify(updated));
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterTags(new Set());
    setFilterRegex('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const updateSettings = (key: string, value: any) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    localStorage.setItem('foldertree-settings', JSON.stringify(updated));
    
    // Apply color settings to CSS variables
    if (key === 'primaryColor') {
      document.documentElement.style.setProperty('--primary', value);
    } else if (key === 'secondaryColor') {
      document.documentElement.style.setProperty('--secondary', value);
    } else if (key === 'accentColor') {
      document.documentElement.style.setProperty('--accent', value);
    }
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
          <button 
            key={`undo-${undoRedoKey}`}
            className="header-button" 
            onClick={() => {
              useTreeStore.getState().undo();
              setTree(useTreeStore.getState().tree);
              setUndoRedoKey(prev => prev + 1);
            }}
            disabled={!useTreeStore.getState().canUndo()}
            title="Undo (Ctrl+Z)"
          >
            ↶ Undo
          </button>
          <button 
            key={`redo-${undoRedoKey}`}
            className="header-button" 
            onClick={() => {
              useTreeStore.getState().redo();
              setTree(useTreeStore.getState().tree);
              setUndoRedoKey(prev => prev + 1);
            }}
            disabled={!useTreeStore.getState().canRedo()}
            title="Redo (Ctrl+Shift+Z)"
          >
            ↷ Redo
          </button>
          <button className="header-button" onClick={() => setShowStats(!showStats)}>
            {showStats ? '📊 Hide Stats' : '📊 Show Stats'}
          </button>
          <button className="header-button" onClick={() => setShowHistory(!showHistory)}>
            {showHistory ? '📜 Hide History' : '📜 Show History'}
          </button>
          <button className="header-button" onClick={() => setShowSettings(!showSettings)}>
            {showSettings ? '⚙️ Hide Settings' : '⚙️ Settings'}
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
            <h3>📜 Operation Timeline</h3>
            {history.length > 0 && (
              <button className="clear-history-btn" onClick={clearHistory}>
                Clear History
              </button>
            )}
          </div>
          <div className="history-list">
            {useTreeStore.getState().getHistory().length === 0 ? (
              <div className="empty-history">No operations yet</div>
            ) : (
              <div className="history-timeline">
                {useTreeStore.getState().getHistory().map((entry, idx) => {
                  const isCurrentIndex = idx === useTreeStore.getState().historyIndex;
                  const isFutureIndex = idx > useTreeStore.getState().historyIndex;
                  return (
                    <div 
                      key={idx} 
                      className={`history-timeline-entry ${isCurrentIndex ? 'current' : ''} ${isFutureIndex ? 'future' : ''}`}
                    >
                      <div className="timeline-marker"></div>
                      <div className="timeline-content">
                        <div className="timeline-time">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </div>
                        <div className="timeline-description">
                          {entry.description}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {history.length > 0 && (
              <>
                <hr className="history-divider" />
                <div className="history-list">
                  {history.map((entry, idx) => (
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
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="settings-panel">
          <div className="settings-header">
            <h3>⚙️ Settings & Preferences</h3>
            <button className="close-btn" onClick={() => setShowSettings(false)}>✕</button>
          </div>
          
          <div className="settings-grid">
            {/* Theme Colors */}
            <div className="settings-group">
              <label className="settings-label" htmlFor="primaryColor">Primary Color</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => updateSettings('primaryColor', e.target.value)}
                  className="color-input"
                  id="primaryColor"
                />
                <span className="color-value">{settings.primaryColor}</span>
              </div>
            </div>
            
            <div className="settings-group">
              <label className="settings-label" htmlFor="secondaryColor">Secondary Color</label>
              <div className="color-input-wrapper">
                <input
                  type="color"
                  value={settings.secondaryColor}
                  onChange={(e) => updateSettings('secondaryColor', e.target.value)}
                  className="color-input"
                  id="secondaryColor"
                />
                <span className="color-value">{settings.secondaryColor}</span>
              </div>
            </div>

            {/* AI Model */}
            <div className="settings-group">
              <label className="settings-label" htmlFor="aiModelSelect">AI Model</label>
              <select 
                value={settings.aiModel}
                onChange={(e) => updateSettings('aiModel', e.target.value)}
                className="settings-select"
                id="aiModelSelect"
              >
                <option value="mistral">Mistral (Local)</option>
                <option value="llama2">Llama 2 (Local)</option>
                <option value="neural-chat">Neural Chat (Local)</option>
              </select>
            </div>

            {/* Font Size */}
            <div className="settings-group">
              <label className="settings-label" htmlFor="fontSizeSelect">Font Size</label>
              <select 
                value={settings.fontSize}
                onChange={(e) => updateSettings('fontSize', e.target.value)}
                className="settings-select"
                id="fontSizeSelect"
              >
                <option value="small">Small</option>
                <option value="normal">Normal</option>
                <option value="large">Large</option>
              </select>
            </div>

            {/* Batch Size */}
            <div className="settings-group">
              <label className="settings-label" htmlFor="batchSizeInput">Batch Classification Size</label>
              <input
                type="number"
                min="1"
                max="20"
                value={settings.batchSize}
                onChange={(e) => updateSettings('batchSize', parseInt(e.target.value))}
                className="settings-input"
                id="batchSizeInput"
              />
            </div>

            {/* Toggles */}
            <div className="settings-group">
              <label className="settings-checkbox">
                <input
                  type="checkbox"
                  checked={settings.autoSave}
                  onChange={(e) => updateSettings('autoSave', e.target.checked)}
                />
                <span>Auto-save changes</span>
              </label>
            </div>

            <div className="settings-group">
              <label className="settings-checkbox">
                <input
                  type="checkbox"
                  checked={settings.compactMode}
                  onChange={(e) => updateSettings('compactMode', e.target.checked)}
                />
                <span>Compact mode</span>
              </label>
            </div>
          </div>

          <div className="settings-footer">
            <button 
              className="control-button control-button-secondary"
              onClick={() => {
                setSettings({
                  primaryColor: '#667eea',
                  secondaryColor: '#764ba2',
                  accentColor: '#f472b6',
                  batchSize: 5,
                  autoSave: true,
                  aiModel: 'mistral',
                  fontSize: 'normal',
                  compactMode: false,
                });
                localStorage.removeItem('foldertree-settings');
              }}
            >
              Reset to Defaults
            </button>
            <button 
              className="control-button control-button-primary"
              onClick={() => setShowSettings(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="tree-controls">
        {/* Audit Section */}
        <div className="control-section">
          <div className="section-title">🧹 Audit & Cleanup</div>
          <div className="button-group">
            <button
              className="control-button control-button-primary"
              onClick={runAudit}
            >
              Run Audit
            </button>
            <button
              className="control-button control-button-secondary"
              onClick={() => setShowAuditConfig(!showAuditConfig)}
            >
              ⚙️ Config
            </button>
            {auditFindings.length > 0 && (
              <>
                <button
                  className="control-button control-button-secondary"
                  onClick={() => setAuditFindings([])}
                >
                  Clear Findings
                </button>
                <button
                  className="control-button control-button-success"
                  onClick={exportApplyScript}
                >
                  📥 Export Script
                </button>
              </>
            )}
          </div>
            {showAuditConfig && (
            <div className="config-panel">
              <div className="config-group">
                <label htmlFor="deepNestingThreshold">Deep Nesting Threshold</label>
                <input
                  type="number"
                  min="3"
                  max="15"
                  value={auditConfig.deepNestingThreshold}
                  onChange={(e) => setAuditConfig({...auditConfig, deepNestingThreshold: parseInt(e.target.value)})}
                  className="control-input"
                  id="deepNestingThreshold"
                />
              </div>
              <div className="config-group">
                <label htmlFor="artifactPatterns">Artifact Patterns (comma-separated)</label>
                <input
                  type="text"
                  value={auditConfig.artifactPatterns.join(', ')}
                  onChange={(e) => setAuditConfig({...auditConfig, artifactPatterns: e.target.value.split(',').map(s => s.trim())})}
                  className="control-input"
                  id="artifactPatterns"
                />
              </div>
            </div>
          )}
          {auditFindings.length === 0 ? (
            <div className="muted-text">No findings yet. Run audit to surface issues.</div>
          ) : (
            <div className="audit-findings">
              {auditFindings.map(finding => (
                <div key={finding.id} className="audit-finding-card">
                  <div className="audit-finding-header">
                    <span className={`severity-badge severity-${finding.severity}`}>
                      {finding.severity.toUpperCase()}
                    </span>
                    <h4 className="audit-finding-title">{finding.title}</h4>
                  </div>
                  <p className="audit-finding-suggestion">{finding.suggestion}</p>
                  <div className="audit-finding-meta">
                    <span>{finding.nodes.length} folders</span>
                  </div>
                  {finding.action && (
                    <div className="audit-finding-actions">
                      <button
                        className="control-button control-button-primary"
                        onClick={() => applyAuditFinding(finding)}
                      >
                        {finding.action === 'select'
                          ? 'Select in tree'
                          : finding.action === 'tag'
                          ? 'Tag and mark'
                          : 'Delete flagged'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Templates Section */}
        <div className="control-section">
          <div className="section-title">🏗️ Structure Templates</div>
          <div className="button-group">
            <button
              className="control-button control-button-secondary"
              onClick={exportTemplates}
            >
              Export Templates
            </button>
            <button
              className="control-button control-button-secondary"
              onClick={importTemplates}
            >
              Import JSON
            </button>
          </div>
          <textarea
            className="control-input template-json-area"
            placeholder="Paste template JSON here to import..."
            value={templateJson}
            onChange={(e) => setTemplateJson(e.target.value)}
          />
          <div className="template-list">
            {STRUCTURE_TEMPLATES.map(template => (
              <div key={template.id} className="template-card">
                <div className="template-card-header">
                  <div className="template-name">{template.name}</div>
                  <div className="template-desc">{template.description}</div>
                </div>
                <div className="template-actions">
                  <button
                    className="control-button control-button-secondary"
                    onClick={() => previewTemplate(template.id)}
                  >
                    Preview
                  </button>
                  <button
                    className="control-button control-button-primary"
                    onClick={() => applyTemplate(template.id)}
                  >
                    Apply Missing
                  </button>
                </div>
                {templatePreview?.templateId === template.id && (
                  <div className="template-preview">
                    <div className="preview-summary">
                      Missing {templatePreview.missing.length} of {templatePreview.total}
                    </div>
                    {templatePreview.missing.length > 0 ? (
                      <ul className="preview-missing-list">
                        {templatePreview.missing.slice(0, 5).map(path => (
                          <li key={path}>{path}</li>
                        ))}
                        {templatePreview.missing.length > 5 && <li>...and more</li>}
                      </ul>
                    ) : (
                      <div className="preview-summary">Already aligned with this template</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Auto-Organize Section */}
        <div className="control-section">
          <div className="section-title">🤖 Auto-Organize</div>
            <div className="config-group">
              <label htmlFor="groupBySelect">Group By</label>
              <select
                value={autoOrganizeParams.groupBy}
                onChange={(e) => setAutoOrganizeParams({...autoOrganizeParams, groupBy: e.target.value as any})}
                className="settings-select"
                id="groupBySelect"
              >
              <option value="type">File Type</option>
              <option value="date">Date</option>
              <option value="size">Size</option>
              <option value="tags">Tags</option>
            </select>
          </div>
            <div className="config-group">
              <label htmlFor="thresholdInput">Threshold (min folders)</label>
              <input
                type="number"
                min="2"
                max="50"
                value={autoOrganizeParams.threshold}
                onChange={(e) => setAutoOrganizeParams({...autoOrganizeParams, threshold: parseInt(e.target.value)})}
                className="control-input"
                id="thresholdInput"
              />
          </div>
          <button
            className="control-button control-button-success"
            onClick={autoOrganize}
          >
            Apply Auto-Organize
          </button>
        </div>

        {/* Bulk Rename Section */}
        <div className="control-section">
          <div className="section-title">✏️ Bulk Rename</div>
          <button
            className="control-button control-button-secondary"
            onClick={() => setShowBulkRename(!showBulkRename)}
          >
            {showBulkRename ? 'Hide' : 'Show'} Rename Panel
          </button>
          {showBulkRename && (
            <div className="config-panel">
              <div className="config-group">
                <label>Find Pattern</label>
                <input
                  type="text"
                  value={bulkRenamePattern.find}
                  onChange={(e) => setBulkRenamePattern({...bulkRenamePattern, find: e.target.value})}
                  className="control-input"
                  placeholder="e.g., old_name"
                />
              </div>
              <div className="config-group">
                <label>Replace With</label>
                <input
                  type="text"
                  value={bulkRenamePattern.replace}
                  onChange={(e) => setBulkRenamePattern({...bulkRenamePattern, replace: e.target.value})}
                  className="control-input"
                  placeholder="e.g., new_name"
                />
              </div>
              <div className="config-group">
                <label className="settings-checkbox">
                  <input
                    type="checkbox"
                    checked={bulkRenamePattern.useRegex}
                    onChange={(e) => setBulkRenamePattern({...bulkRenamePattern, useRegex: e.target.checked})}
                  />
                  <span>Use Regular Expression</span>
                </label>
              </div>
              <button
                className="control-button control-button-primary"
                onClick={applyBulkRename}
                disabled={!bulkRenamePattern.find}
              >
                Apply Rename
              </button>
            </div>
          )}
        </div>

        {/* Comparison Mode Section */}
        <div className="control-section">
          <div className="section-title">🔍 Compare Trees</div>
          <input
            type="text"
            className="control-input"
            placeholder="Path to compare with..."
          />
          <button
            className="control-button control-button-secondary"
            onClick={() => {
              const input = document.querySelector('.control-section:last-of-type input') as HTMLInputElement;
              if (input?.value) loadComparisonTree(input.value);
            }}
          >
            Load for Comparison
          </button>
          {showComparison && comparisonTree && (
            <div className="muted-text">
              Comparison loaded: {Object.keys(comparisonTree.items).length} folders
              <button
                className="control-button control-button-secondary"
                onClick={() => { setShowComparison(false); setComparisonTree(null); }}
              >
                Clear
              </button>
            </div>
          )}
        </div>

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
              <div className="export-menu">
                <button className="control-button control-button-secondary">
                  📥 Export
                </button>
                <div className="export-options">
                  <button onClick={() => handleExportTree('json')} className="export-option">
                    📄 JSON
                  </button>
                  <button onClick={() => handleExportTree('csv')} className="export-option">
                    📊 CSV
                  </button>
                  <button onClick={() => handleExportTree('markdown')} className="export-option">
                    📝 Markdown
                  </button>
                </div>
              </div>
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

        {/* Batch Actions & Tags */}
        {selectedNodes.size > 0 && (
          <div className="control-section">
            <div className="section-title">✅ Batch Operations ({selectedNodes.size} Selected)</div>
            <div className="button-group">
              <input
                type="text"
                className="control-input batch-tag-input"
                placeholder="Enter tag to apply..."
                value={batchTagInput}
                onChange={(e) => setBatchTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && applyBatchTag()}
              />
              <button
                className="control-button control-button-primary"
                onClick={applyBatchTag}
              >
                Apply Tag
              </button>
              <button
                className="control-button control-button-primary"
                onClick={batchClassifySelected}
              >
                Classify Selected
              </button>
            </div>
            {/* Display common tags among selected */}
            {selectedNodes.size > 0 && (() => {
              const allTags = new Set<string>();
              Array.from(selectedNodes).forEach(nodeId => {
                const node = (tree.items as any)[nodeId] as TreeNode;
                node?.data?.tags?.forEach((tag: string) => allTags.add(tag));
              });
              return allTags.size > 0 ? (
                <div className="batch-tags-container">
                  {Array.from(allTags).map(tag => (
                    <button
                      key={tag}
                      className="tag tag-removable"
                      onClick={() => removeBatchTag(tag)}
                      title="Click to remove from all selected"
                    >
                      {tag} ✕
                    </button>
                  ))}
                </div>
              ) : null;
            })()}
            <div className="button-group batch-bottom-actions">
              <button className="control-button control-button-secondary" onClick={selectAll}>
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
        {(searchTerm || filterTags.size > 0 || filterRegex || filterDateFrom || filterDateTo) && (
          <button className="clear-search" onClick={clearAllFilters}>
            ✕ Clear All
          </button>
        )}
        <button 
          className="advanced-search-toggle"
          onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
          title="Advanced Search Filters"
        >
          ⚙️ Filters
        </button>
      </div>

      {/* Advanced Search Panel */}
      {showAdvancedSearch && (
        <div className="advanced-search-panel">
          <div className="advanced-search-header">
            <h3>🔎 Advanced Filters</h3>
            <button className="close-btn" onClick={() => setShowAdvancedSearch(false)}>✕</button>
          </div>
          
          <div className="filter-sections">
            {/* Regex Filter */}
            <div className="filter-group">
              <label className="filter-label">Regex Pattern</label>
              <input
                type="text"
                className="filter-input"
                placeholder="e.g., .*\.tsx$"
                value={filterRegex}
                onChange={(e) => setFilterRegex(e.target.value)}
              />
              <small className="filter-hint">Test regex pattern against folder names and paths</small>
            </div>

            {/* Date Range Filter */}
            <div className="filter-group">
              <label className="filter-label">Date Range</label>
              <div className="date-inputs">
                <input
                  type="date"
                  className="filter-input"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  placeholder="From"
                />
                <span className="date-separator">→</span>
                <input
                  type="date"
                  className="filter-input"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  placeholder="To"
                />
              </div>
            </div>

            {/* Tag Filter */}
            <div className="filter-group">
              <label className="filter-label">Filter by Tags</label>
              <div className="tag-filter-list">
                {Array.from(new Set(
                  Object.values(tree.items as any)
                    .flatMap((node: any) => node.data.tags || [])
                )).sort().map((tag: string) => (
                  <button
                    key={tag}
                    className={`tag-filter ${filterTags.has(tag) ? 'active' : ''}`}
                    onClick={() => {
                      const newTags = new Set(filterTags);
                      if (newTags.has(tag)) {
                        newTags.delete(tag);
                      } else {
                        newTags.add(tag);
                      }
                      setFilterTags(newTags);
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <small className="filter-hint">Selected tags: {filterTags.size > 0 ? Array.from(filterTags).join(', ') : 'None'}</small>
            </div>

            {/* Search Presets */}
            <div className="filter-group">
              <label className="filter-label">Search Presets</label>
              <div className="preset-controls">
                <input
                  type="text"
                  className="filter-input"
                  id="preset-name"
                  placeholder="Preset name..."
                />
                <button 
                  className="control-button control-button-primary"
                  onClick={() => {
                    const input = (document.getElementById('preset-name') as HTMLInputElement);
                    if (input.value) {
                      saveSearchPreset(input.value);
                      input.value = '';
                    }
                  }}
                >
                  Save Preset
                </button>
              </div>
              {searchPresets.length > 0 && (
                <div className="preset-list">
                  {searchPresets.map((preset, idx) => (
                    <div key={idx} className="preset-item">
                      <button 
                        className="preset-load"
                        onClick={() => loadSearchPreset(preset)}
                      >
                        📌 {preset.name}
                      </button>
                      <button
                        className="preset-delete"
                        onClick={() => deleteSearchPreset(preset.name)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="filter-actions">
            <button 
              className="control-button control-button-secondary"
              onClick={clearAllFilters}
            >
              Clear All Filters
            </button>
            <button 
              className="control-button control-button-secondary"
              onClick={() => setShowAdvancedSearch(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}

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
          {hierarchicalTree.rootNodes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📂</div>
              <h3 className="empty-title">No Folders Found</h3>
              <p className="empty-description">
                {searchTerm ? 'Try a different search term' : 'Load a directory to get started'}
              </p>
            </div>
          ) : (
            <div className="tree-root">
              {hierarchicalTree.rootNodes.map(nodeId => renderNode(nodeId, 0))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
