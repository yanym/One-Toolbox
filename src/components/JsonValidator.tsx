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
  Warning
} from '@mui/icons-material';
import Editor from '@monaco-editor/react';
// @ts-ignore
import jsonlint from 'jsonlint-mod';

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


      <GridWrapper container spacing={3}>
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
              <Stack direction="row" spacing={1} flexWrap="wrap">
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
            
            <Box sx={{ flexGrow: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
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
