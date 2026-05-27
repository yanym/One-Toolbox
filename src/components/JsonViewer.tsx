import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  Tooltip,
  Stack,
  Alert,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  useTheme
} from '@mui/material';
import GridWrapper from './GridWrapper';
import {
  ContentCopy,
  Clear,
  Close,
  ExpandMore,
  OpenInFull,
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
  parentPath: string | null;
  level: number;
}

interface JsonViewerProps {
  value?: string;
  onChange?: (value: string) => void;
  showInput?: boolean;
  title?: string;
  height?: number | string;
  compact?: boolean;
}

const DEFAULT_JSON = '{\n  "user": {\n    "id": 123,\n    "name": "John Doe",\n    "email": "john@example.com",\n    "active": true,\n    "profile": {\n      "age": 30,\n      "city": "New York",\n      "hobbies": ["reading", "coding", "traveling"],\n      "preferences": {\n        "theme": "dark",\n        "notifications": true,\n        "language": "en"\n      }\n    },\n    "orders": [\n      {\n        "id": "order-1",\n        "date": "2024-01-15",\n        "total": 99.99,\n        "items": ["laptop", "mouse"]\n      },\n      {\n        "id": "order-2",\n        "date": "2024-02-20",\n        "total": 49.99,\n        "items": ["book"]\n      }\n    ]\n  }\n}';

const getJsonType = (value: any): string => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
};

const JsonViewer: React.FC<JsonViewerProps> = ({
  value,
  onChange,
  showInput = true,
  title = 'JSON Viewer & Explorer',
  height = 600,
  compact = false,
}) => {
  const theme = useTheme();
  const darkMode = theme.palette.mode === 'dark';
  const isControlled = value !== undefined;
  const [localJsonInput, setLocalJsonInput] = useState(DEFAULT_JSON);
  const jsonInput = isControlled ? value : localJsonInput;
  const [parsedJson, setParsedJson] = useState<any>(null);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'tree' | 'table' | 'raw'>('tree');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [filteredNodes, setFilteredNodes] = useState<JsonNode[]>([]);
  const [showOnlyMatches, setShowOnlyMatches] = useState(false);
  const [theaterOpen, setTheaterOpen] = useState(false);

  const setJsonInput = useCallback((nextValue: string) => {
    if (onChange) {
      onChange(nextValue);
    } else {
      setLocalJsonInput(nextValue);
    }
  }, [onChange]);

  const flattenJson = useCallback((obj: any, parentPath = '', level = 0): JsonNode[] => {
    const nodes: JsonNode[] = [];

    if (typeof obj !== 'object' || obj === null) {
      return [{
        key: 'value',
        value: obj,
        type: obj === null ? 'null' : typeof obj,
        path: 'value',
        parentPath: null,
        level
      }];
    }
    
    if (typeof obj === 'object' && obj !== null) {
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          const key = `[${index}]`;
          const path = parentPath ? `${parentPath}${key}` : key;
          const type = getJsonType(item);
          
          nodes.push({
            key,
            value: item,
            type,
            path,
            parentPath: parentPath || null,
            level
          });
          
          if (typeof item === 'object' && item !== null) {
            nodes.push(...flattenJson(item, path, level + 1));
          }
        });
      } else {
        Object.entries(obj).forEach(([key, value]) => {
          const path = parentPath ? `${parentPath}.${key}` : key;
          const type = getJsonType(value);
          
          nodes.push({
            key,
            value,
            type,
            path,
            parentPath: parentPath || null,
            level
          });
          
          if (typeof value === 'object' && value !== null) {
            nodes.push(...flattenJson(value, path, level + 1));
          }
        });
      }
    }
    
    return nodes;
  }, []);

  const parseJson = useCallback(() => {
    if (!jsonInput.trim()) {
      setParsedJson(null);
      setError('');
      setFilteredNodes([]);
      setExpandedNodes(new Set());
      return;
    }

    try {
      const parsed = JSON.parse(jsonInput);
      setParsedJson(parsed);
      setError('');

      const nodes = flattenJson(parsed);
      setFilteredNodes(nodes);
      setExpandedNodes(new Set(nodes.filter(node => node.level <= 1 && typeof node.value === 'object' && node.value !== null).map(node => node.path)));
    } catch (err: any) {
      setError(err.message || 'Invalid JSON');
      setParsedJson(null);
      setFilteredNodes([]);
    }
  }, [flattenJson, jsonInput]);

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
      const valueDisplay = getValueDisplay(node.value, node.type).toLowerCase();
      const valueMatch = valueDisplay.includes(searchLower);
      const pathMatch = node.path.toLowerCase().includes(searchLower);
      
      return keyMatch || valueMatch || pathMatch;
    });
    
    if (showOnlyMatches) {
      setFilteredNodes(matchingNodes);
    } else {
      // Include parent nodes for context
      const pathsToInclude = new Set<string>();
      const nodeByPath = new Map(allNodes.map(node => [node.path, node]));
      matchingNodes.forEach(node => {
        pathsToInclude.add(node.path);

        let parentPath = node.parentPath;
        while (parentPath) {
          pathsToInclude.add(parentPath);
          parentPath = nodeByPath.get(parentPath)?.parentPath || null;
        }
      });
      
      const contextNodes = allNodes.filter(node => pathsToInclude.has(node.path));
      setFilteredNodes(contextNodes);
    }
  }, [flattenJson, parsedJson, searchTerm, showOnlyMatches]);

  const stats = useMemo(() => {
    if (!parsedJson) return null;

    return {
      nodes: flattenJson(parsedJson).length,
      rootType: Array.isArray(parsedJson) ? 'array' : typeof parsedJson,
      size: new Blob([jsonInput]).size,
    };
  }, [flattenJson, jsonInput, parsedJson]);

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
      case 'null': return '#8b949e';
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
    parseJson();
  }, [parseJson]);

  useEffect(() => {
    filterNodes();
  }, [searchTerm, showOnlyMatches, parsedJson, filterNodes]);

  const renderTreeNode = (node: JsonNode, allNodes: JsonNode[]): React.ReactNode => {
    const hasChildren = typeof node.value === 'object' && node.value !== null;
    const isExpanded = expandedNodes.has(node.path);
    
    const children = allNodes.filter(childNode => childNode.parentPath === node.path);
    const isMatch = !!searchTerm.trim() && (
      node.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getValueDisplay(node.value, node.type).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <Box key={node.path}>
        <Box
          sx={{
            ml: node.level * 2,
            py: 0.5,
            borderLeft: node.level > 0 ? '1px solid' : 'none',
            borderColor: node.level > 0 ? 'divider' : undefined,
            pl: node.level > 0 ? 2 : 0,
            bgcolor: isMatch ? 'action.selected' : 'transparent',
            borderRadius: 1,
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
              sx={{ fontWeight: 500, color: 'text.primary' }}
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
                flex: 1,
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
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
      {title && (
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          {title}
        </Typography>
      )}

      <GridWrapper container spacing={2}>
        {showInput && (
        <GridWrapper item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, height, display: 'flex', flexDirection: 'column' }}>
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
                theme={darkMode ? 'vs-dark' : 'light'}
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
        )}

        <GridWrapper item xs={12} md={showInput ? 6 : 12}>
          <Paper elevation={showInput ? 1 : 0} variant={showInput ? 'elevation' : 'outlined'} sx={{ p: compact ? 1.5 : 2, height, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: compact ? 'flex-start' : 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="h6">JSON Explorer</Typography>
                {stats && (
                  <Typography variant="caption" color="text.secondary">
                    {stats.nodes.toLocaleString()} nodes &middot; {stats.rootType} &middot; {stats.size.toLocaleString()} bytes
                  </Typography>
                )}
              </Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Tooltip title="Open theater mode">
                  <IconButton
                    size="small"
                    onClick={() => setTheaterOpen(true)}
                    sx={{ border: '1px solid', borderColor: 'divider' }}
                  >
                    <OpenInFull fontSize="small" />
                  </IconButton>
                </Tooltip>
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  size="small"
                  onChange={(_, nextMode) => {
                    if (nextMode) setViewMode(nextMode);
                  }}
                >
                  <ToggleButton value="tree">Tree</ToggleButton>
                  <ToggleButton value="table">Table</ToggleButton>
                  <ToggleButton value="raw">Raw</ToggleButton>
                </ToggleButtonGroup>
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

                <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }} useFlexGap>
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

      <Dialog
        fullScreen
        open={theaterOpen}
        onClose={() => setTheaterOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: 'background.default',
            backgroundImage: 'none',
          }
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 3, py: 1.5 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="h6">JSON Explorer</Typography>
              {stats && (
                <Typography variant="caption" color="text.secondary">
                  {stats.nodes.toLocaleString()} nodes &middot; {stats.rootType} &middot; {stats.size.toLocaleString()} bytes
                </Typography>
              )}
            </Box>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              size="small"
              onChange={(_, nextMode) => {
                if (nextMode) setViewMode(nextMode);
              }}
            >
              <ToggleButton value="tree">Tree</ToggleButton>
              <ToggleButton value="table">Table</ToggleButton>
              <ToggleButton value="raw">Raw</ToggleButton>
            </ToggleButtonGroup>
            <Tooltip title="Close theater mode">
              <IconButton onClick={() => setTheaterOpen(false)}>
                <Close />
              </IconButton>
            </Tooltip>
          </Stack>
        </DialogTitle>

        <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
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

              <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }} useFlexGap>
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

          <Paper
            variant="outlined"
            sx={{
              flex: 1,
              minHeight: 0,
              overflow: 'auto',
              p: 2,
              bgcolor: 'background.paper',
            }}
          >
            {parsedJson && viewMode === 'tree' && renderTreeView()}
            {parsedJson && viewMode === 'table' && renderTableView()}
            {parsedJson && viewMode === 'raw' && (
              <pre style={{ margin: 0, fontSize: '13px', lineHeight: 1.5 }}>
                {JSON.stringify(parsedJson, null, 2)}
              </pre>
            )}
            {!parsedJson && !error && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
                Enter valid JSON to explore
              </Box>
            )}
          </Paper>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default JsonViewer;
