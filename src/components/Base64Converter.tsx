import React, { useState, useCallback } from 'react';
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
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import GridWrapper from './GridWrapper';
import {
  SwapVert,
  ContentCopy,
  Clear,
  Info
} from '@mui/icons-material';
import Editor from '@monaco-editor/react';

const Base64Converter: React.FC = () => {
  const [inputText, setInputText] = useState('Hello, World!');
  const [outputText, setOutputText] = useState('SGVsbG8sIFdvcmxkIQ==');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [error, setError] = useState<string>('');

  const isValidBase64 = (str: string): boolean => {
    try {
      return btoa(atob(str)) === str;
    } catch (err) {
      return false;
    }
  };

  const convertText = useCallback((text: string, currentMode: 'encode' | 'decode') => {
    if (!text.trim()) {
      setOutputText('');
      setError('');
      return;
    }

    try {
      if (currentMode === 'encode') {
        const encoded = btoa(unescape(encodeURIComponent(text)));
        setOutputText(encoded);
        setError('');
      } else {
        if (!isValidBase64(text)) {
          throw new Error('Invalid Base64 string');
        }
        const decoded = decodeURIComponent(escape(atob(text)));
        setOutputText(decoded);
        setError('');
      }
    } catch (err: any) {
      setError(err.message || 'Conversion failed');
      setOutputText('');
    }
  }, []);

  const handleInputChange = (value: string | undefined) => {
    const newValue = value || '';
    setInputText(newValue);
    convertText(newValue, mode);
  };

  const handleModeChange = (event: React.MouseEvent<HTMLElement>, newMode: 'encode' | 'decode' | null) => {
    if (newMode !== null) {
      setMode(newMode);
      convertText(inputText, newMode);
    }
  };

  const swapInputOutput = () => {
    const temp = inputText;
    setInputText(outputText);
    setOutputText(temp);
    setMode(mode === 'encode' ? 'decode' : 'encode');
    convertText(outputText, mode === 'encode' ? 'decode' : 'encode');
  };

  const clearInput = () => {
    setInputText('');
    setOutputText('');
    setError('');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const getTextStats = (text: string) => {
    if (!text) return null;
    
    return {
      size: new TextEncoder().encode(text).length,
      lines: text.split('\n').length,
      characters: text.length,
      words: text.trim().split(/\s+/).filter(word => word.length > 0).length
    };
  };

  const inputStats = getTextStats(inputText);
  const outputStats = getTextStats(outputText);

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Base64 Encoder & Decoder
      </Typography>

      <GridWrapper container spacing={3}>
        <GridWrapper item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, height: '600px', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                {mode === 'encode' ? 'Text Input' : 'Base64 Input'}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Tooltip title="Swap Input/Output">
                  <IconButton onClick={swapInputOutput} color="primary">
                    <SwapVert />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Copy to Clipboard">
                  <IconButton onClick={() => copyToClipboard(inputText)} color="primary">
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
                value={inputText}
                onChange={handleInputChange}
                theme="vs-dark"
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
                  wordWrap: 'on'
                }}
              />
            </Box>
          </Paper>
        </GridWrapper>

        <GridWrapper item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, height: '600px', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                {mode === 'encode' ? 'Base64 Output' : 'Text Output'}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Tooltip title="Copy to Clipboard">
                  <IconButton 
                    onClick={() => copyToClipboard(outputText)} 
                    color="primary"
                    disabled={!outputText}
                  >
                    <ContentCopy />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
            
            <Box sx={{ flexGrow: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Editor
                height="100%"
                defaultLanguage="text"
                value={outputText}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollbar: {
                    vertical: 'visible',
                    horizontal: 'visible'
                  },
                  wordWrap: 'on'
                }}
              />
            </Box>
          </Paper>
        </GridWrapper>

        <GridWrapper item xs={12}>
          <Stack spacing={2}>
            {/* Mode Selection */}
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Conversion Mode</Typography>
              <ToggleButtonGroup
                value={mode}
                exclusive
                onChange={handleModeChange}
                aria-label="conversion mode"
                fullWidth
              >
                <ToggleButton value="encode" aria-label="encode">
                  Encode (Text → Base64)
                </ToggleButton>
                <ToggleButton value="decode" aria-label="decode">
                  Decode (Base64 → Text)
                </ToggleButton>
              </ToggleButtonGroup>
            </Paper>

            {/* Error Display */}
            {error && (
              <Paper elevation={1} sx={{ p: 2 }}>
                <Alert severity="error">
                  {error}
                </Alert>
              </Paper>
            )}

            {/* Statistics */}
            <GridWrapper container spacing={2}>
              {inputStats && (
                <GridWrapper item xs={12} md={6}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>Input Statistics</Typography>
                    <Stack spacing={1}>
                      <Chip label={`Size: ${inputStats.size} bytes`} variant="outlined" />
                      <Chip label={`Lines: ${inputStats.lines}`} variant="outlined" />
                      <Chip label={`Characters: ${inputStats.characters}`} variant="outlined" />
                      <Chip label={`Words: ${inputStats.words}`} variant="outlined" />
                    </Stack>
                  </Paper>
                </GridWrapper>
              )}

              {outputStats && (
                <GridWrapper item xs={12} md={6}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>Output Statistics</Typography>
                    <Stack spacing={1}>
                      <Chip label={`Size: ${outputStats.size} bytes`} variant="outlined" />
                      <Chip label={`Lines: ${outputStats.lines}`} variant="outlined" />
                      <Chip label={`Characters: ${outputStats.characters}`} variant="outlined" />
                      <Chip label={`Words: ${outputStats.words}`} variant="outlined" />
                    </Stack>
                  </Paper>
                </GridWrapper>
              )}
            </GridWrapper>

            {/* Quick Actions */}
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Quick Actions</Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button
                  variant="contained"
                  onClick={swapInputOutput}
                  startIcon={<SwapVert />}
                >
                  Swap Input/Output
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => copyToClipboard(inputText)}
                  startIcon={<ContentCopy />}
                >
                  Copy Input
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => copyToClipboard(outputText)}
                  startIcon={<ContentCopy />}
                  disabled={!outputText}
                >
                  Copy Output
                </Button>
              </Stack>
            </Paper>

            {/* Info */}
            <Paper elevation={1} sx={{ p: 2 }}>
              <Alert severity="info" icon={<Info />}>
                Base64 encoding converts binary data to ASCII text format. It's commonly used for 
                encoding data in emails, URLs, and web applications. The encoded data is about 33% 
                larger than the original.
              </Alert>
            </Paper>
          </Stack>
        </GridWrapper>
      </GridWrapper>
    </Box>
  );
};

export default Base64Converter;
