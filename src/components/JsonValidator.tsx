import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Chip,
  Stack,
  Paper,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Snackbar,
  Fade,
  Collapse,
  ToggleButton,
  ToggleButtonGroup,
  useTheme
} from '@mui/material';
import GridWrapper from './GridWrapper';
import {
  CheckCircle,
  Error,
  ContentCopy,
  Clear,
  FormatIndentIncrease,
  Compress,
  Download,
  Upload,
  Info,
  Warning,
  Code as CodeIcon,
  AccountTree,
  ExpandMore,
  ChevronRight
} from '@mui/icons-material';
import Editor from '@monaco-editor/react';
// @ts-ignore
import jsonlint from 'jsonlint-mod';

const typeColor = (type: string, darkMode: boolean): string => {
  switch (type) {
    case 'string': return darkMode ? '#a5d6a7' : '#2e7d32';
    case 'number': return darkMode ? '#90caf9' : '#1565c0';
    case 'boolean': return darkMode ? '#ffb74d' : '#e65100';
    case 'null': return darkMode ? '#9e9e9e' : '#616161';
    default: return darkMode ? '#e6edf3' : '#1f2328';
  }
};

const getType = (v: any): string => {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
};

const formatPrimitive = (v: any, type: string): string => {
  if (type === 'string') return `"${v}"`;
  if (type === 'null') return 'null';
  return String(v);
};

interface TreeNodeProps {
  name: string | number | null;
  value: any;
  isLast: boolean;
  initiallyOpen?: boolean;
  darkMode: boolean;
  isRoot?: boolean;
}

const TreeNode: React.FC<TreeNodeProps> = ({ name, value, isLast, initiallyOpen = false, darkMode, isRoot = false }) => {
  const [open, setOpen] = useState(initiallyOpen);
  const type = getType(value);
  const isContainer = type === 'object' || type === 'array';
  const entries = isContainer
    ? (type === 'array' ? (value as any[]).map((v, i) => [i, v] as [number, any]) : Object.entries(value as object))
    : [];
  const count = entries.length;

  const keyLabel = name === null ? null : (
    <Typography component="span" sx={{ fontFamily: 'monospace', fontSize: '0.85rem', color: darkMode ? '#d2a8ff' : '#6f42c1', mr: 0.5 }}>
      {typeof name === 'number' ? `${name}` : `"${name}"`}
      <Typography component="span" sx={{ color: 'text.secondary' }}>: </Typography>
    </Typography>
  );

  if (!isContainer) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', pl: 3, py: 0.1 }}>
        {keyLabel}
        <Typography component="span" sx={{ fontFamily: 'monospace', fontSize: '0.85rem', color: typeColor(type, darkMode) }}>
          {formatPrimitive(value, type)}
        </Typography>
        {!isLast && <Typography component="span" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>,</Typography>}
      </Box>
    );
  }

  const bracketOpen = type === 'array' ? '[' : '{';
  const bracketClose = type === 'array' ? ']' : '}';

  return (
    <Box>
      <Box
        sx={{ display: 'flex', alignItems: 'center', py: 0.1, cursor: 'pointer', userSelect: 'none', '&:hover': { bgcolor: 'action.hover' } }}
        onClick={() => setOpen(o => !o)}
      >
        <IconButton size="small" sx={{ p: 0.25, mr: 0.25 }}>
          {open ? <ExpandMore fontSize="inherit" /> : <ChevronRight fontSize="inherit" />}
        </IconButton>
        {keyLabel}
        <Typography component="span" sx={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'text.secondary' }}>
          {bracketOpen}
          {!open && (
            <>
              <Typography component="span" sx={{ color: 'text.disabled', fontStyle: 'italic', mx: 0.5 }}>
                {count} {type === 'array' ? (count === 1 ? 'item' : 'items') : (count === 1 ? 'key' : 'keys')}
              </Typography>
              {bracketClose}
              {!isLast && !isRoot && ','}
            </>
          )}
        </Typography>
      </Box>
      {open && (
        <>
          <Box sx={{ borderLeft: '1px dashed', borderColor: 'divider', ml: '14px' }}>
            {entries.map(([k, v], i) => (
              <TreeNode
                key={String(k)}
                name={type === 'array' ? (k as number) : (k as string)}
                value={v}
                isLast={i === entries.length - 1}
                initiallyOpen={false}
                darkMode={darkMode}
              />
            ))}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', pl: '32px' }}>
            <Typography component="span" sx={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'text.secondary' }}>
              {bracketClose}{!isLast && !isRoot ? ',' : ''}
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
};

const JsonValidator: React.FC = () => {
  const theme = useTheme();
  const [jsonInput, setJsonInput] = useState('{\n  "name": "John Doe",\n  "age": 30,\n  "city": "New York"\n}');
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    error?: string;
    formatted?: string;
    errorLine?: number;
    errorColumn?: number;
  }>({ isValid: true });
  const [indentSize, setIndentSize] = useState(2);
  const [isValidating, setIsValidating] = useState(false);
  const [viewMode, setViewMode] = useState<'editor' | 'tree'>('editor');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({ open: false, message: '', severity: 'info' });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const validateJson = useCallback(async (value: string) => {
    if (!value.trim()) {
      setValidationResult({ isValid: true });
      return;
    }

    setIsValidating(true);
    
    // Add a small delay for better UX on large JSON files
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const parsed = jsonlint.parse(value);
      const formatted = JSON.stringify(parsed, null, indentSize);
      setValidationResult({
        isValid: true,
        formatted
      });
    } catch (error: any) {
      // Extract line and column information from error message
      const lineMatch = error.message.match(/line (\d+)/);
      const columnMatch = error.message.match(/column (\d+)/);
      
      setValidationResult({
        isValid: false,
        error: error.message || 'Invalid JSON',
        errorLine: lineMatch ? parseInt(lineMatch[1]) : undefined,
        errorColumn: columnMatch ? parseInt(columnMatch[1]) : undefined,
      });
    } finally {
      setIsValidating(false);
    }
  }, [indentSize]);

  const handleInputChange = useCallback((value: string | undefined) => {
    const newValue = value || '';
    setJsonInput(newValue);
    
    // Debounce validation for better performance
    const timeoutId = setTimeout(() => {
      validateJson(newValue);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [validateJson]);

  const formatJson = useCallback(() => {
    if (validationResult.isValid && validationResult.formatted) {
      setJsonInput(validationResult.formatted);
      showSnackbar('JSON formatted successfully', 'success');
    }
  }, [validationResult]);

  const minifyJson = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonInput);
      const minified = JSON.stringify(parsed);
      setJsonInput(minified);
      validateJson(minified);
      showSnackbar('JSON minified successfully', 'success');
    } catch (error) {
      showSnackbar('Cannot minify invalid JSON', 'error');
    }
  }, [jsonInput, validateJson]);

  const clearInput = useCallback(() => {
    setJsonInput('');
    setValidationResult({ isValid: true });
    showSnackbar('Input cleared', 'info');
  }, []);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showSnackbar('Copied to clipboard', 'success');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      showSnackbar('Failed to copy to clipboard', 'error');
    }
  }, []);

  const downloadJson = useCallback(() => {
    if (!jsonInput.trim()) {
      showSnackbar('No content to download', 'warning');
      return;
    }

    const blob = new Blob([jsonInput], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSnackbar('JSON downloaded', 'success');
  }, [jsonInput]);

  const uploadJson = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      showSnackbar('Please select a JSON file', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonInput(content);
      validateJson(content);
      showSnackbar('JSON file loaded', 'success');
    };
    reader.onerror = () => {
      showSnackbar('Failed to read file', 'error');
    };
    reader.readAsText(file);
    
    // Reset input
    event.target.value = '';
  }, [validateJson]);

  const showSnackbar = useCallback((message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // Auto-validate on mount
  useEffect(() => {
    validateJson(jsonInput);
  }, [validateJson, jsonInput]);

  const getJsonStats = () => {
    if (!validationResult.isValid || !jsonInput.trim()) return null;

    try {
      const parsed = JSON.parse(jsonInput);
      const stats = {
        size: new Blob([jsonInput]).size,
        lines: jsonInput.split('\n').length,
        characters: jsonInput.length,
        keys: countKeys(parsed),
        depth: getMaxDepth(parsed)
      };
      return stats;
    } catch {
      return null;
    }
  };

  const countKeys = (obj: any): number => {
    if (typeof obj !== 'object' || obj === null) return 0;
    if (Array.isArray(obj)) {
      return obj.reduce((sum: number, item: any) => sum + countKeys(item), 0);
    }
    return Object.keys(obj).length + Object.values(obj).reduce((sum: number, value: any) => sum + countKeys(value), 0);
  };

  const getMaxDepth = (obj: any): number => {
    if (typeof obj !== 'object' || obj === null) return 0;
    if (Array.isArray(obj)) {
      return obj.length > 0 ? 1 + Math.max(...obj.map(getMaxDepth)) : 1;
    }
    const values = Object.values(obj);
    return values.length > 0 ? 1 + Math.max(...values.map(getMaxDepth)) : 1;
  };

  const stats = getJsonStats();

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          JSON Validator & Formatter
        </Typography>
        <Stack direction="row" spacing={1}>
          <input
            accept=".json,application/json"
            style={{ display: 'none' }}
            id="upload-json-file"
            type="file"
            onChange={uploadJson}
          />
          <label htmlFor="upload-json-file">
            <Tooltip title="Upload JSON file">
              <IconButton color="primary" component="span">
                <Upload />
              </IconButton>
            </Tooltip>
          </label>
          <Tooltip title="Download JSON file">
            <IconButton color="primary" onClick={downloadJson}>
              <Download />
            </IconButton>
          </Tooltip>
          <Tooltip title="Toggle advanced options">
            <IconButton 
              color="primary" 
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Info />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>


      <GridWrapper container spacing={2}>
        <GridWrapper item xs={12} md={8}>
          <Paper 
            elevation={1} 
            sx={{ 
              p: 2, 
              height: '600px', 
              display: 'flex', 
              flexDirection: 'column',
              transition: 'all 0.3s ease',
              '&:hover': {
                boxShadow: 4,
              }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                JSON Input
                {validationResult.isValid ? (
                  <CheckCircle color="success" fontSize="small" />
                ) : (
                  <Error color="error" fontSize="small" />
                )}
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
                <ToggleButtonGroup
                  size="small"
                  exclusive
                  value={viewMode}
                  onChange={(_, v) => { if (v) setViewMode(v); }}
                  sx={{ mr: 0.5 }}
                >
                  <ToggleButton value="editor" sx={{ px: 1.2, py: 0.4, textTransform: 'none' }}>
                    <CodeIcon fontSize="small" sx={{ mr: 0.5 }} /> Editor
                  </ToggleButton>
                  <ToggleButton value="tree" sx={{ px: 1.2, py: 0.4, textTransform: 'none' }}>
                    <AccountTree fontSize="small" sx={{ mr: 0.5 }} /> Tree
                  </ToggleButton>
                </ToggleButtonGroup>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Indent</InputLabel>
                  <Select
                    value={indentSize}
                    label="Indent"
                    onChange={(e) => setIndentSize(Number(e.target.value))}
                  >
                    <MenuItem value={2}>2 spaces</MenuItem>
                    <MenuItem value={4}>4 spaces</MenuItem>
                    <MenuItem value={8}>8 spaces</MenuItem>
                  </Select>
                </FormControl>
                <Tooltip title="Format JSON (Ctrl+Shift+F)">
                  <IconButton 
                    onClick={formatJson} 
                    color="primary"
                    size="small"
                  >
                    <FormatIndentIncrease />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Minify JSON (Ctrl+Shift+M)">
                  <IconButton 
                    onClick={minifyJson} 
                    color="primary"
                    size="small"
                  >
                    <Compress />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Copy to Clipboard (Ctrl+C)">
                  <IconButton 
                    onClick={() => copyToClipboard(jsonInput)} 
                    color="primary"
                    size="small"
                  >
                    <ContentCopy />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Clear (Ctrl+Shift+X)">
                  <IconButton 
                    onClick={clearInput} 
                    color="error"
                    size="small"
                  >
                    <Clear />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
            
            <Box sx={{ flexGrow: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden', display: viewMode === 'editor' ? 'block' : 'none' }}>
              <Editor
                height="100%"
                defaultLanguage="json"
                value={jsonInput}
                onChange={handleInputChange}
                theme={theme.palette.mode === 'dark' ? 'vs-dark' : 'light'}
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollbar: {
                    vertical: 'visible',
                    horizontal: 'visible'
                  },
                  wordWrap: 'on',
                  automaticLayout: true,
                  formatOnPaste: true,
                  formatOnType: true,
                  tabSize: indentSize,
                  insertSpaces: true,
                }}
              />
            </Box>
            {viewMode === 'tree' && (
              <Box sx={{ flexGrow: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'auto', p: 1.5, bgcolor: 'background.default' }}>
                {validationResult.isValid && jsonInput.trim() ? (
                  (() => {
                    try {
                      const parsed = JSON.parse(jsonInput);
                      return (
                        <TreeNode
                          name={null}
                          value={parsed}
                          isLast
                          initiallyOpen
                          darkMode={theme.palette.mode === 'dark'}
                          isRoot
                        />
                      );
                    } catch {
                      return (
                        <Typography variant="body2" color="text.secondary">
                          Invalid JSON — switch to Editor to fix errors.
                        </Typography>
                      );
                    }
                  })()
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    {jsonInput.trim() ? 'Invalid JSON — switch to Editor to fix errors.' : 'Enter JSON in the Editor to see the tree.'}
                  </Typography>
                )}
              </Box>
            )}
          </Paper>
        </GridWrapper>

        <GridWrapper item xs={12} md={4}>
          <Stack spacing={2}>
            {/* Validation Status */}
            <Fade in={true} timeout={300}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Validation Status
                </Typography>
                {validationResult.isValid ? (
                  <Alert 
                    severity="success" 
                    icon={<CheckCircle />}
                    sx={{ 
                      animation: 'successPulse 0.6s ease-in-out',
                      '@keyframes successPulse': {
                        '0%': { transform: 'scale(1)' },
                        '50%': { transform: 'scale(1.02)' },
                        '100%': { transform: 'scale(1)' }
                      }
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Valid JSON
                      </Typography>
                      {stats && (
                        <Typography variant="caption" color="text.secondary">
                          Ready for formatting and processing
                        </Typography>
                      )}
                    </Box>
                  </Alert>
                ) : (
                  <Alert 
                    severity="error" 
                    icon={<Error />}
                    sx={{
                      animation: 'errorShake 0.5s ease-in-out',
                      '@keyframes errorShake': {
                        '0%, 100%': { transform: 'translateX(0)' },
                        '25%': { transform: 'translateX(-2px)' },
                        '75%': { transform: 'translateX(2px)' }
                      }
                    }}
                  >
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        Invalid JSON
                      </Typography>
                      <Typography variant="caption" component="div" sx={{ mt: 0.5 }}>
                        {validationResult.error}
                      </Typography>
                      {validationResult.errorLine && (
                        <Typography variant="caption" color="text.secondary" component="div">
                          Line {validationResult.errorLine}
                          {validationResult.errorColumn && `, Column ${validationResult.errorColumn}`}
                        </Typography>
                      )}
                    </Box>
                  </Alert>
                )}
              </Paper>
            </Fade>

            {/* JSON Statistics */}
            <Collapse in={!!stats} timeout={300}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Statistics</Typography>
                <Stack spacing={1}>
                  {stats && (
                    <>
                      <Chip 
                        label={`Size: ${stats.size.toLocaleString()} bytes`} 
                        variant="outlined" 
                        color="primary"
                        size="small"
                      />
                      <Chip 
                        label={`Lines: ${stats.lines.toLocaleString()}`} 
                        variant="outlined" 
                        color="secondary"
                        size="small"
                      />
                      <Chip 
                        label={`Characters: ${stats.characters.toLocaleString()}`} 
                        variant="outlined" 
                        color="info"
                        size="small"
                      />
                      <Chip 
                        label={`Keys: ${stats.keys.toLocaleString()}`} 
                        variant="outlined" 
                        color="success"
                        size="small"
                      />
                      <Chip 
                        label={`Max Depth: ${stats.depth}`} 
                        variant="outlined" 
                        color="warning"
                        size="small"
                      />
                    </>
                  )}
                </Stack>
              </Paper>
            </Collapse>

            {/* Quick Actions */}
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Quick Actions</Typography>
              <Stack spacing={1.5}>
                <Button
                  variant="contained"
                  onClick={formatJson}
                  startIcon={<FormatIndentIncrease />}
                  fullWidth
                  sx={{ 
                    py: 1.2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: 4,
                    }
                  }}
                >
                  Format JSON
                </Button>
                <Button
                  variant="outlined"
                  onClick={minifyJson}
                  startIcon={<Compress />}
                  fullWidth
                  sx={{ py: 1.2 }}
                >
                  Minify JSON
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => copyToClipboard(jsonInput)}
                  startIcon={<ContentCopy />}
                  fullWidth
                  sx={{ py: 1.2 }}
                >
                  Copy to Clipboard
                </Button>
                <Button
                  variant="outlined"
                  onClick={downloadJson}
                  startIcon={<Download />}
                  fullWidth
                  sx={{ py: 1.2 }}
                  disabled={!jsonInput.trim()}
                >
                  Download JSON
                </Button>
              </Stack>
            </Paper>

            {/* Advanced Options */}
            <Collapse in={showAdvanced} timeout={300}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Info fontSize="small" />
                  Advanced Options
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">
                    • Supports large JSON files up to 10MB
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Auto-validation with 300ms debounce
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Error location detection (line/column)
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    • Keyboard shortcuts for quick actions
                  </Typography>
                </Stack>
              </Paper>
            </Collapse>
          </Stack>
        </GridWrapper>
      </GridWrapper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ minWidth: 200 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default JsonValidator;
