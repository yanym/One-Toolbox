import React, { useState } from 'react';
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
  Tabs,
  Tab,
  FormControlLabel,
  Switch
} from '@mui/material';
import GridWrapper from './GridWrapper';
import {
  ContentCopy,
  Clear,
  SwapHoriz,
  Code,
  TextFields,
  CleaningServices
} from '@mui/icons-material';
import Editor from '@monaco-editor/react';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`string-tabpanel-${index}`}
      aria-labelledby={`string-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const StringEscape: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [input, setInput] = useState('Hello "World"\nThis is a test string with special characters: \t\r\n\\backslash and /forward slash');
  const [output, setOutput] = useState('');
  const [escapeType, setEscapeType] = useState('json');
  const [error, setError] = useState('');
  const [removeNewlines, setRemoveNewlines] = useState(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const escapeString = () => {
    try {
      let processedInput = input;
      
      // Remove newlines if option is enabled
      if (removeNewlines) {
        processedInput = processedInput.replace(/\n/g, '');
      }

      let escaped = '';

      switch (escapeType) {
        case 'json':
          escaped = JSON.stringify(processedInput);
          break;
        case 'javascript':
          escaped = escapeJavaScript(processedInput);
          break;
        case 'html':
          escaped = escapeHtml(processedInput);
          break;
        case 'xml':
          escaped = escapeXml(processedInput);
          break;
        case 'url':
          escaped = encodeURIComponent(processedInput);
          break;
        case 'base64':
          escaped = btoa(processedInput);
          break;
        case 'regex':
          escaped = escapeRegex(processedInput);
          break;
        case 'csv':
          escaped = escapeCsv(processedInput);
          break;
        case 'sql':
          escaped = escapeSql(processedInput);
          break;
        default:
          escaped = processedInput;
      }

      setOutput(escaped);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Error escaping string');
      setOutput('');
    }
  };

  const unescapeString = () => {
    try {
      let unescaped = '';

      switch (escapeType) {
        case 'json':
          unescaped = JSON.parse(input);
          break;
        case 'javascript':
          unescaped = unescapeJavaScript(input);
          break;
        case 'html':
          unescaped = unescapeHtml(input);
          break;
        case 'xml':
          unescaped = unescapeXml(input);
          break;
        case 'url':
          unescaped = decodeURIComponent(input);
          break;
        case 'base64':
          unescaped = atob(input);
          break;
        case 'regex':
          unescaped = unescapeRegex(input);
          break;
        case 'csv':
          unescaped = unescapeCsv(input);
          break;
        case 'sql':
          unescaped = unescapeSql(input);
          break;
        default:
          unescaped = input;
      }

      // Remove newlines if option is enabled
      if (removeNewlines) {
        unescaped = unescaped.replace(/\n/g, '');
      }

      setOutput(unescaped);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Error unescaping string');
      setOutput('');
    }
  };

  const removeNewlinesOnly = () => {
    try {
      const cleaned = input.replace(/\n/g, '');
      setOutput(cleaned);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Error removing newlines');
      setOutput('');
    }
  };

  // Escape functions
  const escapeJavaScript = (str: string): string => {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
      .replace(/\b/g, '\\b')
      .replace(/\f/g, '\\f')
      .replace(/\v/g, '\\v')
      .replace(/\0/g, '\\0');
  };

  const escapeHtml = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const escapeXml = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const escapeRegex = (str: string): string => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const escapeCsv = (str: string): string => {
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const escapeSql = (str: string): string => {
    return str.replace(/'/g, "''");
  };

  // Unescape functions
  const unescapeJavaScript = (str: string): string => {
    return str
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\b/g, '\b')
      .replace(/\\f/g, '\f')
      .replace(/\\v/g, '\v')
      .replace(/\\0/g, '\0')
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\');
  };

  const unescapeHtml = (str: string): string => {
    return str
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
  };

  const unescapeXml = (str: string): string => {
    return str
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
  };

  const unescapeRegex = (str: string): string => {
    return str.replace(/\\(.)/g, '$1');
  };

  const unescapeCsv = (str: string): string => {
    if (str.startsWith('"') && str.endsWith('"')) {
      return str.slice(1, -1).replace(/""/g, '"');
    }
    return str;
  };

  const unescapeSql = (str: string): string => {
    return str.replace(/''/g, "'");
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const clearInput = () => {
    setInput('');
    setOutput('');
    setError('');
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        String Escape & Unescape Tool
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab icon={<Code />} label="Escape" iconPosition="start" />
          <Tab icon={<TextFields />} label="Unescape" iconPosition="start" />
          <Tab icon={<CleaningServices />} label="Clean Newlines" iconPosition="start" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <GridWrapper container spacing={3}>
          <GridWrapper item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 2, height: '600px', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Input String</Typography>
                <Stack direction="row" spacing={1}>
                  <Tooltip title="Copy to Clipboard">
                    <IconButton onClick={() => copyToClipboard(input)} color="primary">
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
                  defaultLanguage="text"
                  value={input}
                  onChange={(value) => setInput(value || '')}
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
                <Typography variant="h6">Escaped Output</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={escapeType}
                      label="Type"
                      onChange={(e) => setEscapeType(e.target.value)}
                    >
                      <MenuItem value="json">JSON</MenuItem>
                      <MenuItem value="javascript">JavaScript</MenuItem>
                      <MenuItem value="html">HTML</MenuItem>
                      <MenuItem value="xml">XML</MenuItem>
                      <MenuItem value="url">URL</MenuItem>
                      <MenuItem value="base64">Base64</MenuItem>
                      <MenuItem value="regex">Regex</MenuItem>
                      <MenuItem value="csv">CSV</MenuItem>
                      <MenuItem value="sql">SQL</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={removeNewlines}
                        onChange={(e) => setRemoveNewlines(e.target.checked)}
                        size="small"
                      />
                    }
                    label="Remove \\n"
                    sx={{ ml: 1 }}
                  />
                  <Button
                    variant="contained"
                    onClick={escapeString}
                    startIcon={<SwapHoriz />}
                  >
                    Escape
                  </Button>
                  <Tooltip title="Copy to Clipboard">
                    <IconButton onClick={() => copyToClipboard(output)} color="primary">
                      <ContentCopy />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              
              <Box sx={{ flexGrow: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Editor
                  height="100%"
                  defaultLanguage="text"
                  value={output}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    readOnly: true
                  }}
                />
              </Box>
            </Paper>
          </GridWrapper>
        </GridWrapper>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <GridWrapper container spacing={3}>
          <GridWrapper item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 2, height: '600px', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Escaped Input</Typography>
                <Stack direction="row" spacing={1}>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={escapeType}
                      label="Type"
                      onChange={(e) => setEscapeType(e.target.value)}
                    >
                      <MenuItem value="json">JSON</MenuItem>
                      <MenuItem value="javascript">JavaScript</MenuItem>
                      <MenuItem value="html">HTML</MenuItem>
                      <MenuItem value="xml">XML</MenuItem>
                      <MenuItem value="url">URL</MenuItem>
                      <MenuItem value="base64">Base64</MenuItem>
                      <MenuItem value="regex">Regex</MenuItem>
                      <MenuItem value="csv">CSV</MenuItem>
                      <MenuItem value="sql">SQL</MenuItem>
                    </Select>
                  </FormControl>
                  <Tooltip title="Copy to Clipboard">
                    <IconButton onClick={() => copyToClipboard(input)} color="primary">
                      <ContentCopy />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
              
              <Box sx={{ flexGrow: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Editor
                  height="100%"
                  defaultLanguage="text"
                  value={input}
                  onChange={(value) => setInput(value || '')}
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
                <Typography variant="h6">Unescaped Output</Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <FormControlLabel
                    control={
                      <Switch
                        checked={removeNewlines}
                        onChange={(e) => setRemoveNewlines(e.target.checked)}
                        size="small"
                      />
                    }
                    label="Remove \\n"
                    sx={{ ml: 1 }}
                  />
                  <Button
                    variant="contained"
                    onClick={unescapeString}
                    startIcon={<SwapHoriz />}
                  >
                    Unescape
                  </Button>
                  <Tooltip title="Copy to Clipboard">
                    <IconButton onClick={() => copyToClipboard(output)} color="primary">
                      <ContentCopy />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              
              <Box sx={{ flexGrow: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Editor
                  height="100%"
                  defaultLanguage="text"
                  value={output}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    readOnly: true
                  }}
                />
              </Box>
            </Paper>
          </GridWrapper>
        </GridWrapper>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <GridWrapper container spacing={3}>
          <GridWrapper item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 2, height: '600px', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Input with Newlines</Typography>
                <Stack direction="row" spacing={1}>
                  <Tooltip title="Copy to Clipboard">
                    <IconButton onClick={() => copyToClipboard(input)} color="primary">
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
                  defaultLanguage="text"
                  value={input}
                  onChange={(value) => setInput(value || '')}
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
                <Typography variant="h6">Cleaned Output</Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    onClick={removeNewlinesOnly}
                    startIcon={<CleaningServices />}
                    color="secondary"
                  >
                    Remove All \\n
                  </Button>
                  <Tooltip title="Copy to Clipboard">
                    <IconButton onClick={() => copyToClipboard(output)} color="primary">
                      <ContentCopy />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              
              <Box sx={{ flexGrow: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Editor
                  height="100%"
                  defaultLanguage="text"
                  value={output}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    readOnly: true
                  }}
                />
              </Box>
            </Paper>
          </GridWrapper>
        </GridWrapper>
      </TabPanel>
    </Box>
  );
};

export default StringEscape;
