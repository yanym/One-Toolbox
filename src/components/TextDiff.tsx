import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Stack,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  FormControlLabel,
  Switch,
  useTheme,
} from '@mui/material';
import { ContentCopy, Clear, SwapHoriz } from '@mui/icons-material';
import { DiffEditor } from '@monaco-editor/react';

const LANGUAGES = [
  { value: 'plaintext', label: 'Text' },
  { value: 'json', label: 'JSON' },
  { value: 'javascript', label: 'JS' },
  { value: 'typescript', label: 'TS' },
  { value: 'python', label: 'Python' },
  { value: 'yaml', label: 'YAML' },
  { value: 'xml', label: 'XML' },
  { value: 'sql', label: 'SQL' },
  { value: 'markdown', label: 'Markdown' },
];

const TextDiff: React.FC = () => {
  const theme = useTheme();
  const [left, setLeft] = useState<string>(
    'The quick brown fox\njumps over the lazy dog.\nLine three stays.\nLine four here.'
  );
  const [right, setRight] = useState<string>(
    'The quick red fox\njumps over the lazy dog.\nLine three stays.\nLine four changed.\nLine five added.'
  );
  const [language, setLanguage] = useState<string>('plaintext');
  const [inlineView, setInlineView] = useState<boolean>(false);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState<boolean>(false);

  const stats = useMemo(() => {
    const leftLines = left.split('\n');
    const rightLines = right.split('\n');
    return {
      leftLines: leftLines.length,
      rightLines: rightLines.length,
      leftChars: left.length,
      rightChars: right.length,
      identical: left === right,
    };
  }, [left, right]);

  const copy = useCallback(async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch {}
  }, []);

  const swap = useCallback(() => {
    setLeft(right);
    setRight(left);
  }, [left, right]);

  const clearAll = () => {
    setLeft('');
    setRight('');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 600 }}>
          Text Diff
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <ToggleButtonGroup
            size="small"
            exclusive
            value={language}
            onChange={(_, v) => { if (v) setLanguage(v); }}
          >
            {LANGUAGES.map(l => (
              <ToggleButton key={l.value} value={l.value} sx={{ px: 1, py: 0.3, textTransform: 'none', fontSize: '0.75rem' }}>
                {l.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <FormControlLabel
            control={<Switch size="small" checked={inlineView} onChange={(e) => setInlineView(e.target.checked)} />}
            label={<Typography variant="caption">Inline</Typography>}
          />
          <FormControlLabel
            control={<Switch size="small" checked={ignoreWhitespace} onChange={(e) => setIgnoreWhitespace(e.target.checked)} />}
            label={<Typography variant="caption">Ignore WS</Typography>}
          />
          <Tooltip title="Swap sides">
            <IconButton size="small" onClick={swap}>
              <SwapHoriz />
            </IconButton>
          </Tooltip>
          <Tooltip title="Clear">
            <IconButton size="small" color="error" onClick={clearAll}>
              <Clear />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Chip size="small" variant="outlined" label={`Original: ${stats.leftLines} lines, ${stats.leftChars} chars`} />
        <Chip size="small" variant="outlined" color="primary" label={`Modified: ${stats.rightLines} lines, ${stats.rightChars} chars`} />
        {stats.identical && <Chip size="small" color="success" label="Identical" />}
      </Stack>

      <Paper elevation={1} sx={{ p: 1, height: 640, display: 'flex', flexDirection: 'column' }}>
        <Stack direction="row" spacing={1} sx={{ mb: 1, px: 1 }}>
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>Original</Typography>
            <Box sx={{ flexGrow: 1 }} />
            <Tooltip title="Copy original">
              <IconButton size="small" onClick={() => copy(left)}>
                <ContentCopy fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          {!inlineView && (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>Modified</Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Tooltip title="Copy modified">
                <IconButton size="small" onClick={() => copy(right)}>
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Stack>
        <Box sx={{ flexGrow: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
          <DiffEditor
            height="100%"
            language={language}
            original={left}
            modified={right}
            theme={theme.palette.mode === 'dark' ? 'vs-dark' : 'light'}
            onMount={(editor) => {
              const originalEditor = editor.getOriginalEditor();
              const modifiedEditor = editor.getModifiedEditor();
              originalEditor.onDidChangeModelContent(() => {
                setLeft(originalEditor.getValue());
              });
              modifiedEditor.onDidChangeModelContent(() => {
                setRight(modifiedEditor.getValue());
              });
            }}
            options={{
              renderSideBySide: !inlineView,
              ignoreTrimWhitespace: ignoreWhitespace,
              minimap: { enabled: false },
              fontSize: 13,
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              automaticLayout: true,
              originalEditable: true,
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
};

export default TextDiff;
