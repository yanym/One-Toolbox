import React, { useState, useCallback, useMemo } from 'react';
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
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import GridWrapper from './GridWrapper';
import { ContentCopy, Clear, SwapVert, ExpandMore, ChevronRight } from '@mui/icons-material';
import Editor from '@monaco-editor/react';

// ── Param parsing helpers ────────────────────────────────────────────────────

function extractQueryString(text: string): string {
  const t = text.trim();
  try {
    const url = new URL(t);
    return url.search.slice(1);
  } catch {
    return t.startsWith('?') ? t.slice(1) : t;
  }
}

// Parse "foo[bar][baz]" → ["foo", "bar", "baz"], "foo" → ["foo"]
function parseKeyPath(key: string): string[] {
  const bracketIdx = key.indexOf('[');
  if (bracketIdx === -1) return [key];
  const parts: string[] = [key.slice(0, bracketIdx)];
  const re = /\[([^\]]*)\]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(key.slice(bracketIdx))) !== null) parts.push(m[1]);
  return parts;
}

function setDeep(target: unknown, path: string[], value: string): unknown {
  if (path.length === 0) return value;
  const [head, ...tail] = path;

  if (head === '') {
    // Empty [] → append to array
    const arr = Array.isArray(target) ? target : [];
    arr.push(tail.length === 0 ? value : setDeep(undefined, tail, value));
    return arr;
  }

  const obj: Record<string, unknown> = (target && typeof target === 'object' && !Array.isArray(target))
    ? target as Record<string, unknown>
    : {};
  obj[head] = setDeep(obj[head], tail, value);
  return obj;
}

function parseNestedParams(text: string): Record<string, unknown> | null {
  try {
    const qs = extractQueryString(text);
    if (!qs) return null;
    const pairs = qs.split('&').filter(Boolean);
    if (pairs.length === 0) return null;

    let result: Record<string, unknown> = {};
    for (const pair of pairs) {
      const eqIdx = pair.indexOf('=');
      const rawKey = eqIdx === -1 ? pair : pair.slice(0, eqIdx);
      const rawVal = eqIdx === -1 ? '' : pair.slice(eqIdx + 1);
      try {
        const key = decodeURIComponent(rawKey);
        const val = decodeURIComponent(rawVal.replace(/\+/g, ' '));
        const path = parseKeyPath(key);
        if (path.length === 1) {
          const k = path[0];
          if (k in result) {
            result[k] = Array.isArray(result[k]) ? [...(result[k] as unknown[]), val] : [result[k], val];
          } else {
            result[k] = val;
          }
        } else {
          const [first, ...rest] = path;
          result = { ...result, [first]: setDeep(result[first], rest, val) };
        }
      } catch { /* skip malformed pair */ }
    }
    return Object.keys(result).length > 0 ? result : null;
  } catch {
    return null;
  }
}

// ── Param tree renderer ──────────────────────────────────────────────────────

interface ParamNodeProps {
  name: string;
  value: unknown;
  depth: number;
  darkMode: boolean;
  onCopy: (v: string) => void;
  copied: string | null;
}

const ParamNode: React.FC<ParamNodeProps> = ({ name, value, depth, darkMode, onCopy, copied }) => {
  const [open, setOpen] = useState(true);
  const theme = useTheme();
  const isObject = value !== null && typeof value === 'object';
  const entries = isObject ? Object.entries(value as Record<string, unknown>) : [];
  const copyKey = `${depth}-${name}`;
  const strVal = isObject ? JSON.stringify(value) : String(value);

  return (
    <Box sx={{ pl: depth > 0 ? 2.5 : 0 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          py: 0.6,
          px: 1,
          borderRadius: 1,
          '&:hover': { bgcolor: darkMode ? alpha('#fff', 0.04) : alpha('#000', 0.03) },
        }}
      >
        {isObject ? (
          <IconButton size="small" onClick={() => setOpen(o => !o)} sx={{ p: 0.2, color: 'text.secondary' }}>
            {open ? <ExpandMore sx={{ fontSize: 16 }} /> : <ChevronRight sx={{ fontSize: 16 }} />}
          </IconButton>
        ) : (
          <Box sx={{ width: 24, flexShrink: 0 }} />
        )}

        <Typography
          component="span"
          sx={{
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: depth === 0 ? 'primary.main' : Array.isArray((value as unknown)) ? 'warning.main' : 'text.primary',
            flexShrink: 0,
          }}
        >
          {name}
        </Typography>

        {isObject ? (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
            {Array.isArray(value) ? `[${entries.length}]` : `{${entries.length}}`}
          </Typography>
        ) : (
          <>
            <Typography component="span" sx={{ color: 'text.secondary', fontSize: '0.8rem', mx: 0.3 }}>
              =
            </Typography>
            <Typography
              component="span"
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                color: theme.palette.success.main,
                bgcolor: alpha(theme.palette.success.main, 0.08),
                px: 0.8,
                py: 0.1,
                borderRadius: 1,
                wordBreak: 'break-all',
              }}
            >
              {strVal}
            </Typography>
          </>
        )}

        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title={copied === copyKey ? 'Copied!' : 'Copy value'}>
          <IconButton
            size="small"
            onClick={() => onCopy(strVal)}
            sx={{ color: copied === copyKey ? 'success.main' : 'text.disabled', p: 0.3, opacity: 0.7 }}
          >
            <ContentCopy sx={{ fontSize: 13 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {isObject && open && entries.map(([k, v]) => (
        <ParamNode key={k} name={k} value={v} depth={depth + 1} darkMode={darkMode} onCopy={onCopy} copied={copied} />
      ))}
    </Box>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

const UrlEncoderDecoder: React.FC = () => {
  const theme = useTheme();
  const darkMode = theme.palette.mode === 'dark';
  const [input, setInput] = useState('https://example.com/search?q=hello world&filter[category]=books&filter[price][min]=10&filter[price][max]=50&tags[]=fiction&tags[]=sci-fi');
  const [output, setOutput] = useState(() => encodeURIComponent('https://example.com/search?q=hello world&filter[category]=books&filter[price][min]=10&filter[price][max]=50&tags[]=fiction&tags[]=sci-fi'));
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const convert = useCallback((text: string, currentMode: 'encode' | 'decode') => {
    if (!text.trim()) { setOutput(''); setError(''); return; }
    try {
      setOutput(currentMode === 'encode' ? encodeURIComponent(text) : decodeURIComponent(text));
      setError('');
    } catch (err: any) {
      setError(err.message || 'Conversion failed');
      setOutput('');
    }
  }, []);

  const handleInputChange = (v: string | undefined) => {
    const val = v || '';
    setInput(val);
    convert(val, mode);
  };

  const handleModeChange = (_: unknown, v: 'encode' | 'decode' | null) => {
    if (!v) return;
    setMode(v);
    convert(input, v);
  };

  const swapInputOutput = () => {
    const newMode = mode === 'encode' ? 'decode' : 'encode';
    setMode(newMode);
    setInput(output);
    convert(output, newMode);
  };

  const copyToClipboard = async (text: string, key?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      if (key) {
        setCopied(key);
        setTimeout(() => setCopied(null), 1500);
      }
    } catch {}
  };

  // Parse params from the decoded/plain side
  const plainText = mode === 'encode' ? input : output;
  const parsedParams = useMemo(() => parseNestedParams(plainText), [plainText]);

  return (
    <Box>
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
          <ToggleButtonGroup value={mode} exclusive onChange={handleModeChange} size="small">
            <ToggleButton value="encode">Encode</ToggleButton>
            <ToggleButton value="decode">Decode</ToggleButton>
          </ToggleButtonGroup>
          <Tooltip title="Swap inputs">
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
              <Typography variant="body2" fontWeight={600}>
                {mode === 'encode' ? 'Plain Text' : 'Encoded URL'}
              </Typography>
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Copy">
                  <IconButton size="small" onClick={() => copyToClipboard(input)}>
                    <ContentCopy sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Clear">
                  <IconButton size="small" color="error" onClick={() => { setInput(''); setOutput(''); setError(''); }}>
                    <Clear sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
            <Box sx={{ height: 300 }}>
              <Editor
                height="100%"
                defaultLanguage="text"
                value={input}
                onChange={handleInputChange}
                theme={darkMode ? 'vs-dark' : 'light'}
                options={{ minimap: { enabled: false }, scrollBeyondLastLine: false, fontSize: 13, wordWrap: 'on', padding: { top: 8 } }}
              />
            </Box>
          </Paper>
        </GridWrapper>

        <GridWrapper item xs={12} md={6}>
          <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2" fontWeight={600}>
                {mode === 'encode' ? 'Encoded URL' : 'Plain Text'}
              </Typography>
              <Tooltip title="Copy">
                <IconButton size="small" onClick={() => copyToClipboard(output)} disabled={!output}>
                  <ContentCopy sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Box>
            <Box sx={{ height: 300 }}>
              <Editor
                height="100%"
                defaultLanguage="text"
                value={output}
                theme={darkMode ? 'vs-dark' : 'light'}
                options={{ readOnly: true, minimap: { enabled: false }, scrollBeyondLastLine: false, fontSize: 13, wordWrap: 'on', padding: { top: 8 } }}
              />
            </Box>
          </Paper>
        </GridWrapper>
      </GridWrapper>

      {/* Parsed parameters */}
      {parsedParams && (
        <Paper variant="outlined" sx={{ mt: 2, overflow: 'hidden' }}>
          <Box
            sx={{
              px: 2, py: 1.5,
              borderBottom: '1px solid', borderColor: 'divider',
              bgcolor: darkMode ? alpha('#fff', 0.02) : alpha('#000', 0.02),
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography variant="body2" fontWeight={600}>Parsed Parameters</Typography>
              <Typography variant="caption" color="text.secondary">
                {Object.keys(parsedParams).length} top-level key{Object.keys(parsedParams).length !== 1 ? 's' : ''} · nested objects and arrays are expandable
              </Typography>
            </Box>
            <Tooltip title="Copy as JSON">
              <IconButton size="small" onClick={() => copyToClipboard(JSON.stringify(parsedParams, null, 2))}>
                <ContentCopy sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
          </Box>
          <Box sx={{ p: 1, maxHeight: 400, overflow: 'auto' }}>
            {Object.entries(parsedParams).map(([k, v], i, arr) => (
              <React.Fragment key={k}>
                <ParamNode
                  name={k}
                  value={v}
                  depth={0}
                  darkMode={darkMode}
                  onCopy={(val) => copyToClipboard(val, `param-${k}`)}
                  copied={copied}
                />
                {i < arr.length - 1 && <Divider sx={{ my: 0.3, opacity: 0.5 }} />}
              </React.Fragment>
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default UrlEncoderDecoder;
