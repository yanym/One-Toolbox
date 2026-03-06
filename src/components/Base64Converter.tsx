import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Stack,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
  alpha
} from '@mui/material';
import GridWrapper from './GridWrapper';
import {
  SwapVert,
  ContentCopy,
  Clear,
} from '@mui/icons-material';
import Editor from '@monaco-editor/react';

const Base64Converter: React.FC = () => {
  const theme = useTheme();
  const darkMode = theme.palette.mode === 'dark';
  const [inputText, setInputText] = useState('Hello, World!');
  const [outputText, setOutputText] = useState('SGVsbG8sIFdvcmxkIQ==');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [error, setError] = useState('');

  const convertText = useCallback((text: string, currentMode: 'encode' | 'decode') => {
    if (!text.trim()) { setOutputText(''); setError(''); return; }
    try {
      if (currentMode === 'encode') {
        setOutputText(btoa(unescape(encodeURIComponent(text))));
      } else {
        const bytes = Uint8Array.from(atob(text.trim()), c => c.charCodeAt(0));
        setOutputText(new TextDecoder().decode(bytes));
      }
      setError('');
    } catch (err: any) { setError(err.message || 'Conversion failed'); setOutputText(''); }
  }, []);

  const handleInputChange = (v: string | undefined) => { const val = v || ''; setInputText(val); convertText(val, mode); };
  const handleModeChange = (_: any, v: 'encode' | 'decode' | null) => { if (v) { setMode(v); convertText(inputText, v); } };
  const swapInputOutput = () => { const t = inputText; setInputText(outputText); setOutputText(t); const newMode = mode === 'encode' ? 'decode' : 'encode'; setMode(newMode); convertText(outputText, newMode); };
  const copyToClipboard = async (text: string) => { try { await navigator.clipboard.writeText(text); } catch {} };

  const getSize = (text: string) => text ? new TextEncoder().encode(text).length : 0;

  return (
    <Box>
      {/* Controls */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
          <ToggleButtonGroup value={mode} exclusive onChange={handleModeChange} size="small">
            <ToggleButton value="encode">Encode (Text &rarr; Base64)</ToggleButton>
            <ToggleButton value="decode">Decode (Base64 &rarr; Text)</ToggleButton>
          </ToggleButtonGroup>
          <Tooltip title="Swap">
            <IconButton size="small" onClick={swapInputOutput} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <SwapVert sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <GridWrapper container spacing={2}>
        <GridWrapper item xs={12} md={6}>
          <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" fontWeight={600}>{mode === 'encode' ? 'Text Input' : 'Base64 Input'}</Typography>
                <Typography variant="caption" color="text.secondary">{getSize(inputText).toLocaleString()} bytes</Typography>
              </Box>
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Copy"><IconButton size="small" onClick={() => copyToClipboard(inputText)}><ContentCopy sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                <Tooltip title="Clear"><IconButton size="small" color="error" onClick={() => { setInputText(''); setOutputText(''); setError(''); }}><Clear sx={{ fontSize: 16 }} /></IconButton></Tooltip>
              </Stack>
            </Box>
            <Box sx={{ height: 420 }}>
              <Editor height="100%" defaultLanguage="text" value={inputText} onChange={handleInputChange} theme={darkMode ? 'vs-dark' : 'light'} options={{ minimap: { enabled: false }, scrollBeyondLastLine: false, fontSize: 13, lineNumbers: 'on', wordWrap: 'on', padding: { top: 8 } }} />
            </Box>
          </Paper>
        </GridWrapper>
        <GridWrapper item xs={12} md={6}>
          <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" fontWeight={600}>{mode === 'encode' ? 'Base64 Output' : 'Text Output'}</Typography>
                <Typography variant="caption" color="text.secondary">{getSize(outputText).toLocaleString()} bytes</Typography>
              </Box>
              <Tooltip title="Copy"><IconButton size="small" onClick={() => copyToClipboard(outputText)} disabled={!outputText}><ContentCopy sx={{ fontSize: 16 }} /></IconButton></Tooltip>
            </Box>
            <Box sx={{ height: 420 }}>
              <Editor height="100%" defaultLanguage="text" value={outputText} theme={darkMode ? 'vs-dark' : 'light'} options={{ readOnly: true, minimap: { enabled: false }, scrollBeyondLastLine: false, fontSize: 13, lineNumbers: 'on', wordWrap: 'on', padding: { top: 8 } }} />
            </Box>
          </Paper>
        </GridWrapper>
      </GridWrapper>
    </Box>
  );
};

export default Base64Converter;
