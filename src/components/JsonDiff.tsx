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
  Chip,
  useTheme,
  alpha
} from '@mui/material';
import {
  ContentCopy,
  Clear,
  CompareArrows,
  SwapHoriz,
  Add,
  Remove,
  Edit as EditIcon
} from '@mui/icons-material';
import Editor from '@monaco-editor/react';
import * as jsondiffpatch from 'jsondiffpatch';

interface DiffEntry {
  path: string;
  type: 'added' | 'modified' | 'deleted';
  oldValue?: any;
  newValue?: any;
}

const JsonDiff: React.FC = () => {
  const theme = useTheme();
  const darkMode = theme.palette.mode === 'dark';

  const [leftJson, setLeftJson] = useState('{\n  "name": "John Doe",\n  "age": 30,\n  "city": "New York",\n  "hobbies": ["reading", "coding"]\n}');
  const [rightJson, setRightJson] = useState('{\n  "name": "John Smith",\n  "age": 32,\n  "city": "New York",\n  "hobbies": ["reading", "gaming", "traveling"]\n}');
  const [diffEntries, setDiffEntries] = useState<DiffEntry[]>([]);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<{ added: number; modified: number; deleted: number; unchanged: number } | null>(null);

  const calculateDiff = useCallback(() => {
    try {
      const left = JSON.parse(leftJson);
      const right = JSON.parse(rightJson);

      const instance = jsondiffpatch.create({
        objectHash: (obj: any) => obj.id || obj._id || obj.name || JSON.stringify(obj),
        arrays: { detectMove: true, includeValueOnMove: false },
      });

      const delta = instance.diff(left, right);
      const entries: DiffEntry[] = [];

      const traverse = (obj: any, path: string[] = []) => {
        if (!obj || typeof obj !== 'object') return;
        Object.keys(obj).forEach(key => {
          const value = obj[key];
          const currentPath = [...path, key].join('.');
          if (Array.isArray(value)) {
            if (value.length === 1) {
              entries.push({ path: currentPath, type: 'added', newValue: value[0] });
            } else if (value.length === 2) {
              entries.push({ path: currentPath, type: 'modified', oldValue: value[0], newValue: value[1] });
            } else if (value.length === 3 && value[2] === 0) {
              entries.push({ path: currentPath, type: 'deleted', oldValue: value[0] });
            }
          } else if (typeof value === 'object') {
            traverse(value, [...path, key]);
          }
        });
      };

      if (delta) {
        traverse(delta);
        const leftProps = countProperties(left);
        const rightProps = countProperties(right);
        const modified = entries.filter(e => e.type === 'modified').length;
        setStats({
          added: entries.filter(e => e.type === 'added').length,
          modified,
          deleted: entries.filter(e => e.type === 'deleted').length,
          unchanged: Math.max(0, Math.min(leftProps, rightProps) - modified),
        });
      } else {
        setStats({ added: 0, modified: 0, deleted: 0, unchanged: countProperties(left) });
      }

      setDiffEntries(entries);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Invalid JSON in one or both inputs');
      setDiffEntries([]);
      setStats(null);
    }
  }, [leftJson, rightJson]);

  const countProperties = (obj: any): number => {
    if (typeof obj !== 'object' || obj === null) return 0;
    if (Array.isArray(obj)) return obj.reduce((s: number, i: any) => s + countProperties(i), 0);
    return Object.keys(obj).length + Object.values(obj).reduce((s: number, v: any) => s + countProperties(v), 0);
  };

  const swapInputs = () => {
    setLeftJson(rightJson);
    setRightJson(leftJson);
  };

  const clearInputs = () => {
    setLeftJson('');
    setRightJson('');
    setDiffEntries([]);
    setError('');
    setStats(null);
  };

  const copyToClipboard = async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch {}
  };

  useEffect(() => {
    const t = setTimeout(() => {
      if (leftJson.trim() && rightJson.trim()) calculateDiff();
    }, 500);
    return () => clearTimeout(t);
  }, [leftJson, rightJson, calculateDiff]);

  const formatValue = (v: any) => {
    if (typeof v === 'string') return `"${v}"`;
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  };

  const DiffIcon = ({ type }: { type: 'added' | 'modified' | 'deleted' }) => {
    const config = {
      added: { icon: <Add sx={{ fontSize: 14 }} />, color: theme.palette.success.main, bg: alpha(theme.palette.success.main, 0.12) },
      modified: { icon: <EditIcon sx={{ fontSize: 14 }} />, color: theme.palette.warning.main, bg: alpha(theme.palette.warning.main, 0.12) },
      deleted: { icon: <Remove sx={{ fontSize: 14 }} />, color: theme.palette.error.main, bg: alpha(theme.palette.error.main, 0.12) },
    };
    const c = config[type];
    return (
      <Box sx={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: c.bg, color: c.color, flexShrink: 0 }}>
        {c.icon}
      </Box>
    );
  };

  return (
    <Box>
      {/* Editors */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Left */}
        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid`, borderColor: 'divider' }}>
            <Typography variant="body2" fontWeight={600}>Original</Typography>
            <Tooltip title="Copy"><IconButton size="small" onClick={() => copyToClipboard(leftJson)}><ContentCopy sx={{ fontSize: 16 }} /></IconButton></Tooltip>
          </Box>
          <Box sx={{ height: 320 }}>
            <Editor height="100%" defaultLanguage="json" value={leftJson} onChange={(v) => setLeftJson(v || '')} theme={darkMode ? 'vs-dark' : 'light'} options={{ minimap: { enabled: false }, scrollBeyondLastLine: false, fontSize: 13, lineNumbers: 'on', wordWrap: 'on', padding: { top: 8 } }} />
          </Box>
        </Paper>

        {/* Swap */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Tooltip title="Swap">
            <IconButton onClick={swapInputs} size="small" sx={{ border: `1px solid`, borderColor: 'divider' }}>
              <SwapHoriz sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Right */}
        <Paper variant="outlined" sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid`, borderColor: 'divider' }}>
            <Typography variant="body2" fontWeight={600}>Modified</Typography>
            <Tooltip title="Copy"><IconButton size="small" onClick={() => copyToClipboard(rightJson)}><ContentCopy sx={{ fontSize: 16 }} /></IconButton></Tooltip>
          </Box>
          <Box sx={{ height: 320 }}>
            <Editor height="100%" defaultLanguage="json" value={rightJson} onChange={(v) => setRightJson(v || '')} theme={darkMode ? 'vs-dark' : 'light'} options={{ minimap: { enabled: false }, scrollBeyondLastLine: false, fontSize: 13, lineNumbers: 'on', wordWrap: 'on', padding: { top: 8 } }} />
          </Box>
        </Paper>
      </Box>

      {/* Actions */}
      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <Button variant="contained" size="small" onClick={calculateDiff} startIcon={<CompareArrows />}>Compare</Button>
        <Button variant="outlined" size="small" onClick={clearInputs} startIcon={<Clear />}>Clear</Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Stats */}
      {stats && (
        <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
          <Chip size="small" label={`${stats.added} added`} sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main, fontWeight: 600 }} />
          <Chip size="small" label={`${stats.modified} changed`} sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: theme.palette.warning.main, fontWeight: 600 }} />
          <Chip size="small" label={`${stats.deleted} removed`} sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: theme.palette.error.main, fontWeight: 600 }} />
          <Chip size="small" label={`${stats.unchanged} unchanged`} variant="outlined" />
        </Stack>
      )}

      {/* Diff results — friendly card list */}
      {diffEntries.length > 0 && (
        <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
          <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid`, borderColor: 'divider', bgcolor: darkMode ? alpha('#fff', 0.02) : alpha('#000', 0.02) }}>
            <Typography variant="body2" fontWeight={600}>
              {diffEntries.length} difference{diffEntries.length !== 1 ? 's' : ''} found
            </Typography>
          </Box>
          <Box sx={{ maxHeight: 460, overflow: 'auto' }}>
            {diffEntries.map((entry, i) => (
              <Box
                key={i}
                sx={{
                  px: 2,
                  py: 1.5,
                  display: 'flex',
                  gap: 1.5,
                  alignItems: 'flex-start',
                  borderBottom: i < diffEntries.length - 1 ? `1px solid` : 'none',
                  borderColor: 'divider',
                  '&:hover': { bgcolor: darkMode ? alpha('#fff', 0.02) : alpha('#000', 0.015) },
                }}
              >
                <DiffIcon type={entry.type} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.8rem', color: 'text.primary', mb: 0.3 }}>
                    {entry.path}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography component="span" sx={{
                      fontSize: '0.8rem',
                      fontFamily: 'monospace',
                      color: entry.type === 'added' ? 'text.disabled' : theme.palette.error.main,
                      bgcolor: entry.type === 'added' ? 'transparent' : alpha(theme.palette.error.main, 0.08),
                      px: entry.type === 'added' ? 0 : 0.8,
                      py: 0.2,
                      borderRadius: 1,
                    }}>
                      {entry.type === 'added' ? '—' : formatValue(entry.oldValue)}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>&rarr;</Typography>
                    <Typography component="span" sx={{
                      fontSize: '0.8rem',
                      fontFamily: 'monospace',
                      color: entry.type === 'deleted' ? 'text.disabled' : theme.palette.success.main,
                      bgcolor: entry.type === 'deleted' ? 'transparent' : alpha(theme.palette.success.main, 0.08),
                      px: entry.type === 'deleted' ? 0 : 0.8,
                      py: 0.2,
                      borderRadius: 1,
                    }}>
                      {entry.type === 'deleted' ? '—' : formatValue(entry.newValue)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Paper>
      )}

      {stats && diffEntries.length === 0 && !error && (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">No differences found — the JSONs are identical.</Typography>
        </Paper>
      )}
    </Box>
  );
};

export default JsonDiff;
