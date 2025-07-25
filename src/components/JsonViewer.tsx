import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  Tooltip,
  Stack,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import GridWrapper from './GridWrapper';
import {
  ContentCopy,
  Clear,
  ExpandMore,
  Search,
  Visibility,
  VisibilityOff,
  FilterList
} from '@mui/icons-material';
import Editor from '@monaco-editor/react';

interface JsonNode {
  key: string;
  value: any;
  type: string;
  path: string;
  level: number;
}

const JsonViewer: React.FC = () => {
  const [jsonInput, setJsonInput] = useState('{\n  "user": {\n    "id": 123,\n    "name": "John Doe",\n    "email": "john@example.com",\n    "active": true,\n    "profile": {\n      "age": 30,\n      "city": "New York",\n      "hobbies": ["reading", "coding", "traveling"],\n      "preferences": {\n        "theme": "dark",\n        "notifications": true,\n        "language": "en"\n      }\n    },\n    "orders": [\n      {\n        "id": "order-1",\n        "date": "2024-01-15",\n        "total": 99.99,\n        "items": ["laptop", "mouse"]\n      },\n      {\n        "id": "order-2",\n        "date": "2024-02-20",\n        "total": 49.99,\n        "items": ["book"]\n      }\n    ]\n  }\n}');
  const [parsedJson, setParsedJson] = useState<any>(null);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'tree' | 'table' | 'raw'>('tree');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [filteredNodes, setFilteredNodes] = useState<JsonNode[]>([]);
  const [showOnlyMatches, setShowOnlyMatches] = useState(false);

  const parseJson = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonInput);
      setParsedJson(parsed);
      setError('');
      
      // Generate flat node structure for tree view
      const nodes = flattenJson(parsed);
      setFilteredNodes(nodes);
      
      // Auto-expand first level
      const firstLevelPaths = nodes.filter(node => node.level === 1).map(node => node.path);
      setExpandedNodes(new Set(firstLevelPaths));
    } catch (err: any) {
      setError(err.message || 'Invalid JSON');
      setParsedJson(null);
      setFilteredNodes([]);
    }
  }, [jsonInput]);

  const flattenJson = (obj: any, parentKey = '', level = 0): JsonNode[] => {
    const nodes: JsonNode[] = [];
    
    if (typeof obj === 'object' && obj !== null) {
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          const key = `[${index}]`;
          const path = parentKey ? `${parentKey}.${key}` : key;
          const type = Array.isArray(item) ? 'array' : typeof item;
          
          nodes.push({
            key,
            value: item,
            type,
            path,
            level
          });
          
          if (typeof item === 'object' && item !== null) {
            nodes.push(...flattenJson(item, path, level + 1));
          }
        });
      } else {
        Object.entries(obj).forEach(([key, value]) => {
          const path = parentKey ? `${parentKey}.${key}` : key;
          const type = Array.isArray(value) ? 'array' : typeof value;
          
          nodes.push({
            key,
            value,
            type,
            path,
            level
          });
          
          if (typeof value === 'object' && value !== null) {
            nodes.push(...flattenJson(value, path, level + 1));
          }
        });
      }
    }
    
    return nodes;
  };

  const filterNodes = useCallback(() => {
    if (!parsedJson) return;
    
    const allNodes = flattenJson(parsedJson);
    
    if (!searchTerm.trim()) {
      setFilteredNodes(allNodes);
      return;
    }
    
    const searchLower = searchTerm.toLowerCase();
    const matchingNodes = allNodes.filter(node => {
      const keyMatch = node.key.toLowerCase().includes(searchLower);
      const valueMatch = typeof node.value === 'string' && 
                        node.value.toLowerCase().includes(searchLower);
      const pathMatch = node.path.toLowerCase().includes(searchLower);
      
      return keyMatch || valueMatch || pathMatch;
    });
    
    if (showOnlyMatches) {
      setFilteredNodes(matchingNodes);
    } else {
      // Include parent nodes for context
      const pathsToInclude = new Set<string>();
      matchingNodes.forEach(node => {
        const pathParts = node.path.split('.');
        for (let i = 0; i < pathParts.length; i++) {
          pathsToInclude.add(pathParts.slice(0, i + 1).join('.'));
        }
      });
      
      const contextNodes = allNodes.filter(node => 
        pathsToInclude.has(node.path) || matchingNodes.includes(node)
      );
      
      setFilteredNodes(contextNodes);
    }
  }, [parsedJson, searchTerm, showOnlyMatches]);

  const toggleNode = (path: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedNodes(newExpanded);
  };

  const expandAll = () => {
    const allPaths = filteredNodes.map(node => node.path);
    setExpandedNodes(new Set(allPaths));
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const getValueDisplay = (value: any, type: string): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (type === 'string') return `"${value}"`;
    if (type === 'array') return `Array(${value.length})`;
    if (type === 'object') return `Object(${Object.keys(value).length})`;
    return String(value);
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'string': return '#4caf50';
      case 'number': return '#2196f3';
      case 'boolean': return '#ff9800';
      case 'array': return '#9c27b0';
      case 'object': return '#f44336';
      default: return '#666';
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const clearInput = () => {
    setJsonInput('');
    setParsedJson(null);
    setError('');
    setFilteredNodes([]);
    setSearchTerm('');
    setExpandedNodes(new Set());
  };

  useEffect(() => {
    if (jsonInput.trim()) {
      parseJson();
    }
  }, [jsonInput, parseJson]);

  useEffect(() => {
    filterNodes();
  }, [searchTerm, showOnlyMatches, parsedJson, filterNodes]);

  const renderTreeNode = (node: JsonNode, allNodes: JsonNode[]): React.ReactNode => {
    const hasChildren = typeof node.value === 'object' && node.value !== null;
    const isExpanded = expandedNodes.has(node.path);
    
    // Get direct children of this node
    const children = allNodes.filter(childNode => {
      const childPathParts = childNode.path.split('.');
      const nodePathParts = node.path.split('.');
      
      // Check if this child is a direct child (one level deeper)
      return childPathParts.length === nodePathParts.length + 1 &&
             childNode.path.startsWith(node.path + '.');
    });

    return (
      <Box key={node.path}>
        <Box
          sx={{
            ml: node.level * 2,
            py: 0.5,
            borderLeft: node.level > 0 ? '1px solid #ddd' : 'none',
            pl: node.level > 0 ? 2 : 0
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {hasChildren ? (
              <IconButton
                size="small"
                onClick={() => toggleNode(node.path)}
              >
                <ExpandMore
                  sx={{
                    transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                    transition: 'transform 0.2s'
                  }}
                />
              </IconButton>
            ) : (
              <Box sx={{ width: 32 }} /> // Spacer for alignment
            )}
            
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, color: '#333' }}
            >
              {node.key}:
            </Typography>
            
            <Chip
              label={node.type}
              size="small"
              sx={{
                backgroundColor: getTypeColor(node.type),
                color: 'white',
                fontSize: '10px',
                height: '20px'
              }}
            />
            
            <Typography
              variant="body2"
              sx={{
                color: getTypeColor(node.type),
                fontFamily: 'monospace',
                flex: 1
              }}
            >
              {getValueDisplay(node.value, node.type)}
            </Typography>
            
            <Tooltip title="Copy Value">
              <IconButton
                size="small"
                onClick={() => copyToClipboard(JSON.stringify(node.value, null, 2))}
              >
                <ContentCopy fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {/* Render children only if this node is expanded */}
        {hasChildren && isExpanded && (
          <Box>
            {children.map(child => renderTreeNode(child, allNodes))}
          </Box>
        )}
      </Box>
    );
  };

  const renderTreeView = () => {
    // Get root level nodes (level 0)
    const rootNodes = filteredNodes.filter(node => node.level === 0);
    
    return (
      <Box>
        {rootNodes.map(node => renderTreeNode(node, filteredNodes))}
      </Box>
    );
  };

  const renderTableView = () => {
    return (
      <TableContainer>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Path</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Key</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Value</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Level</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredNodes.map((node) => (
              <TableRow 
                key={node.path}
                sx={{ 
                  '&:nth-of-type(odd)': { backgroundColor: 'action.hover' },
                  '&:hover': { backgroundColor: 'action.selected' }
                }}
              >
                <TableCell sx={{ fontFamily: 'monospace', fontSize: '12px' }}>
                  {node.path}
                </TableCell>
                <TableCell sx={{ fontWeight: 500 }}>
                  {node.key}
                </TableCell>
                <TableCell>
                  <Chip
                    label={node.type}
                    size="small"
                    sx={{
                      backgroundColor: getTypeColor(node.type),
                      color: 'white',
                      fontSize: '10px',
                      height: '20px'
                    }}
                  />
                </TableCell>
                <TableCell sx={{ 
                  fontFamily: 'monospace', 
                  fontSize: '12px',
                  maxWidth: '200px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  <Tooltip title={getValueDisplay(node.value, node.type)} arrow>
                    <span style={{ color: getTypeColor(node.type) }}>
                      {getValueDisplay(node.value, node.type)}
                    </span>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Chip
                    label={node.level}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '10px', height: '20px' }}
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title="Copy Value">
                    <IconButton
                      size="small"
                      onClick={() => copyToClipboard(JSON.stringify(node.value, null, 2))}
                    >
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        JSON Viewer & Explorer
      </Typography>

      <GridWrapper container spacing={3}>
        <GridWrapper item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, height: '600px', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">JSON Input</Typography>
              <Stack direction="row" spacing={1}>
                <Tooltip title="Copy to Clipboard">
                  <IconButton onClick={() => copyToClipboard(jsonInput)} color="primary">
                    <ContentCopy />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Clear">
                  <IconButton onClick={clearInput} color="error">
                    <Clear />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
            
            <Box sx={{ flexGrow: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Editor
                height="100%"
                defaultLanguage="json"
                value={jsonInput}
                onChange={(value) => setJsonInput(value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  lineNumbers: 'on',
                  wordWrap: 'on'
                }}
              />
            </Box>
          </Paper>
        </GridWrapper>

        <GridWrapper item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, height: '600px', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">JSON Explorer</Typography>
              <Stack direction="row" spacing={1}>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <InputLabel>View</InputLabel>
                  <Select
                    value={viewMode}
                    label="View"
                    onChange={(e) => setViewMode(e.target.value as any)}
                  >
                    <MenuItem value="tree">Tree</MenuItem>
                    <MenuItem value="table">Table</MenuItem>
                    <MenuItem value="raw">Raw</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {parsedJson && (
              <>
                <Box sx={{ mb: 2 }}>
                  <TextField
                    size="small"
                    placeholder="Search keys, values, or paths..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                    fullWidth
                  />
                </Box>

                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <Button size="small" onClick={expandAll} startIcon={<Visibility />}>
                    Expand All
                  </Button>
                  <Button size="small" onClick={collapseAll} startIcon={<VisibilityOff />}>
                    Collapse All
                  </Button>
                  <Button
                    size="small"
                    onClick={() => setShowOnlyMatches(!showOnlyMatches)}
                    startIcon={<FilterList />}
                    variant={showOnlyMatches ? 'contained' : 'outlined'}
                  >
                    Matches Only
                  </Button>
                </Stack>
              </>
            )}
            
            <Box sx={{ flexGrow: 1, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1 }}>
              {parsedJson && viewMode === 'tree' && renderTreeView()}
              {parsedJson && viewMode === 'table' && renderTableView()}
              {parsedJson && viewMode === 'raw' && (
                <pre style={{ margin: 0, fontSize: '12px', lineHeight: 1.4 }}>
                  {JSON.stringify(parsedJson, null, 2)}
                </pre>
              )}
              {!parsedJson && !error && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
                  Enter valid JSON to explore
                </Box>
              )}
            </Box>
          </Paper>
        </GridWrapper>
      </GridWrapper>
    </Box>
  );
};

export default JsonViewer;
