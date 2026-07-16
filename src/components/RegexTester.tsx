import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Stack,
  Alert,
  TextField,
  FormControlLabel,
  Checkbox,
  Chip,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import GridWrapper from './GridWrapper';
import { ContentCopy, Clear } from '@mui/icons-material';

interface MatchInfo {
  match: string;
  index: number;
  groups: string[];
  namedGroups: Record<string, string>;
}

const PRESETS: { label: string; pattern: string; flags: string; sample: string }[] = [
  { label: 'Email', pattern: '[\\w.+-]+@[\\w-]+\\.[\\w.-]+', flags: 'g', sample: 'Contact: alice@example.com or bob@test.co.uk' },
  { label: 'URL', pattern: 'https?://[^\\s)]+', flags: 'g', sample: 'Docs at https://example.com/path and http://test.io' },
  { label: 'IPv4', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', flags: 'g', sample: 'server 192.168.1.1 and 10.0.0.255' },
  { label: 'UUID', pattern: '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}', flags: 'gi', sample: 'id=550e8400-e29b-41d4-a716-446655440000' },
];

const REGEX_WORKER_SOURCE = `
self.onmessage = function(event) {
  var pattern = event.data.pattern;
  var flags = event.data.flags;
  var input = event.data.input;
  var limit = event.data.limit;
  try {
    var regex = new RegExp(pattern, flags.indexOf('g') >= 0 ? flags : flags + 'g');
    var matches = [];
    var match;
    while ((match = regex.exec(input)) !== null && matches.length < limit) {
      matches.push({
        match: match[0],
        index: match.index,
        groups: Array.prototype.slice.call(match, 1).map(function(value) { return value === undefined ? '' : value; }),
        namedGroups: match.groups || {}
      });
      if (match.index === regex.lastIndex) regex.lastIndex++;
    }
    self.postMessage({ matches: matches, truncated: matches.length === limit });
  } catch (error) {
    self.postMessage({ error: error && error.message ? error.message : 'Invalid regular expression' });
  }
};
`;

const MAX_MATCHES = 1000;
const REGEX_TIMEOUT_MS = 800;

const RegexTester: React.FC = () => {
  const theme = useTheme();
  const [pattern, setPattern] = useState<string>('(\\w+)@(\\w+\\.\\w+)');
  const [flags, setFlags] = useState<Set<string>>(new Set(['g']));
  const [testString, setTestString] = useState<string>(
    'Contact: alice@example.com, bob@test.co.uk, support@mysite.org'
  );
  const [matches, setMatches] = useState<MatchInfo[]>([]);
  const [error, setError] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [truncated, setTruncated] = useState(false);

  const toggleFlag = (f: string) => {
    setFlags(prev => {
      const n = new Set(prev);
      if (n.has(f)) n.delete(f);
      else n.add(f);
      return n;
    });
  };

  const flagsStr = useMemo(() => Array.from(flags).sort().join(''), [flags]);

  useEffect(() => {
    if (!pattern) {
      setMatches([]);
      setError('');
      setIsTesting(false);
      setTruncated(false);
      return;
    }

    let worker: Worker | null = null;
    let workerUrl = '';
    let timeoutId = 0;
    const startId = window.setTimeout(() => {
      workerUrl = URL.createObjectURL(new Blob([REGEX_WORKER_SOURCE], { type: 'text/javascript' }));
      worker = new Worker(workerUrl);
      setIsTesting(true);
      setError('');

      timeoutId = window.setTimeout(() => {
        worker?.terminate();
        setMatches([]);
        setTruncated(false);
        setIsTesting(false);
        setError(`Pattern exceeded ${REGEX_TIMEOUT_MS} ms and was stopped.`);
      }, REGEX_TIMEOUT_MS);

      worker.onmessage = event => {
        window.clearTimeout(timeoutId);
        setIsTesting(false);
        if (event.data.error) {
          setError(event.data.error);
          setMatches([]);
          setTruncated(false);
        } else {
          setError('');
          setMatches(event.data.matches);
          setTruncated(event.data.truncated);
        }
        worker?.terminate();
      };

      worker.postMessage({ pattern, flags: flagsStr, input: testString, limit: MAX_MATCHES });
    }, 120);

    return () => {
      window.clearTimeout(startId);
      window.clearTimeout(timeoutId);
      worker?.terminate();
      if (workerUrl) URL.revokeObjectURL(workerUrl);
    };
  }, [flagsStr, pattern, testString]);

  const highlighted = useMemo(() => {
    if (matches.length === 0 || error) return null;
    const parts: Array<{ text: string; match: boolean }> = [];
    let cursor = 0;
    for (const m of matches) {
      if (m.index > cursor) parts.push({ text: testString.slice(cursor, m.index), match: false });
      parts.push({ text: m.match, match: true });
      cursor = m.index + m.match.length;
    }
    if (cursor < testString.length) parts.push({ text: testString.slice(cursor), match: false });
    return parts;
  }, [matches, testString, error]);

  const copyToClipboard = useCallback(async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch {}
  }, []);

  const loadPreset = (p: typeof PRESETS[0]) => {
    setPattern(p.pattern);
    setFlags(new Set(p.flags.split('')));
    setTestString(p.sample);
  };

  const clearAll = () => {
    setPattern('');
    setTestString('');
  };

  const highlightBg = theme.palette.mode === 'dark' ? alpha('#ffd54f', 0.35) : alpha('#ffc107', 0.45);

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Regex Tester
      </Typography>

      <GridWrapper container spacing={2}>
        <GridWrapper item xs={12} md={7}>
          <Paper elevation={1} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Pattern</Typography>
                <Box sx={{ flexGrow: 1 }} />
                <Tooltip title="Copy pattern">
                  <IconButton size="small" onClick={() => copyToClipboard(pattern)}>
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Clear">
                  <IconButton size="small" color="error" onClick={clearAll}>
                    <Clear fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
              <TextField
                fullWidth
                size="small"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="Enter regex pattern…"
                error={!!error}
                InputProps={{
                  sx: { fontFamily: 'monospace', fontSize: '0.9rem' },
                  startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary', fontFamily: 'monospace' }}>/</Typography>,
                  endAdornment: (
                    <Typography sx={{ ml: 0.5, color: 'text.secondary', fontFamily: 'monospace' }}>
                      /{flagsStr}
                    </Typography>
                  ),
                }}
              />
              <Stack direction="row" spacing={0.5} sx={{ mt: 1, flexWrap: 'wrap' }}>
                {['g', 'i', 'm', 's', 'u', 'y'].map(f => (
                  <FormControlLabel
                    key={f}
                    control={
                      <Checkbox
                        size="small"
                        checked={flags.has(f)}
                        onChange={() => toggleFlag(f)}
                      />
                    }
                    label={<Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{f}</Typography>}
                    sx={{ mr: 0.5 }}
                  />
                ))}
              </Stack>
            </Box>

            {error && (
              <Alert severity="error" sx={{ py: 0.5 }}>
                {error}
              </Alert>
            )}

            <Divider />

            <Box>
              <Stack direction="row" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Test String</Typography>
                <Box sx={{ flexGrow: 1 }} />
                <Typography variant="caption" color="text.secondary">
                  {isTesting ? 'Testing…' : `${matches.length}${truncated ? '+' : ''} match${matches.length === 1 ? '' : 'es'}`}
                </Typography>
              </Stack>
              <TextField
                fullWidth
                multiline
                minRows={6}
                maxRows={12}
                value={testString}
                onChange={(e) => setTestString(e.target.value)}
                placeholder="Enter text to test against the pattern…"
                InputProps={{ sx: { fontFamily: 'monospace', fontSize: '0.85rem' } }}
              />
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Highlighted Matches</Typography>
              <Box
                sx={{
                  p: 1.5,
                  minHeight: 80,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.default',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {highlighted ? (
                  highlighted.map((p, i) =>
                    p.match ? (
                      <Box key={i} component="span" sx={{ bgcolor: highlightBg, px: '2px', borderRadius: '2px' }}>
                        {p.text}
                      </Box>
                    ) : (
                      <React.Fragment key={i}>{p.text}</React.Fragment>
                    )
                  )
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'inherit' }}>
                    {error ? 'Fix the pattern to see matches.' : 'No matches.'}
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>
        </GridWrapper>

        <GridWrapper item xs={12} md={5}>
          <Stack spacing={2}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Presets</Typography>
              <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5 }}>
                {PRESETS.map(p => (
                  <Chip
                    key={p.label}
                    label={p.label}
                    onClick={() => loadPreset(p)}
                    size="small"
                    variant="outlined"
                  />
                ))}
              </Stack>
            </Paper>

            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Match Details ({matches.length}{truncated ? '+' : ''})
              </Typography>
              {truncated && (
                <Alert severity="info" sx={{ mb: 1, py: 0.25 }}>
                  Showing the first {MAX_MATCHES.toLocaleString()} matches.
                </Alert>
              )}
              <Box sx={{ maxHeight: 420, overflow: 'auto' }}>
                {matches.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No matches found.</Typography>
                ) : (
                  <Stack spacing={1}>
                    {matches.map((m, i) => (
                      <Box
                        key={i}
                        sx={{
                          p: 1,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.06 : 0.04),
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Chip label={`#${i + 1}`} size="small" color="primary" sx={{ height: 20 }} />
                          <Typography variant="caption" color="text.secondary">idx {m.index}</Typography>
                        </Stack>
                        <Typography
                          variant="body2"
                          sx={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all', mt: 0.5 }}
                        >
                          {m.match}
                        </Typography>
                        {m.groups.length > 0 && (
                          <Box sx={{ mt: 0.5 }}>
                            {m.groups.map((g, gi) => (
                              <Typography
                                key={gi}
                                variant="caption"
                                sx={{ fontFamily: 'monospace', display: 'block', color: 'text.secondary' }}
                              >
                                ${gi + 1}: <Box component="span" sx={{ color: 'text.primary' }}>{g || '∅'}</Box>
                              </Typography>
                            ))}
                          </Box>
                        )}
                        {Object.keys(m.namedGroups).length > 0 && (
                          <Box sx={{ mt: 0.5 }}>
                            {Object.entries(m.namedGroups).map(([name, val]) => (
                              <Typography
                                key={name}
                                variant="caption"
                                sx={{ fontFamily: 'monospace', display: 'block', color: 'text.secondary' }}
                              >
                                ?&lt;{name}&gt;: <Box component="span" sx={{ color: 'text.primary' }}>{val || '∅'}</Box>
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
            </Paper>
          </Stack>
        </GridWrapper>
      </GridWrapper>
    </Box>
  );
};

export default RegexTester;
