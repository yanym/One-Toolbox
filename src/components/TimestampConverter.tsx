import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Stack,
  Alert,
  TextField,
  Button,
  Chip,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import { ContentCopy, AccessTime, Refresh } from '@mui/icons-material';

interface ParsedTime {
  ms: number;
  inputFormat: string;
}

type FormatKey = 'unix_s' | 'unix_ms' | 'iso8601' | 'utc' | 'tz_pt' | 'tz_ct' | 'tz_et' | 'relative';

interface OutputRow {
  key: FormatKey;
  label: string;
  description: string;
  value: string;
}

function parseAny(raw: string): ParsedTime {
  const s = raw.trim();
  if (!s) throw new Error('Empty input');

  // Strip commas, spaces, and underscores from numeric-looking input
  const sanitized = s.replace(/[,\s_]/g, '');

  if (/^-?\d+(\.\d+)?$/.test(sanitized)) {
    const n = parseFloat(sanitized);
    const abs = Math.abs(n);
    if (abs < 1e10)  return { ms: Math.round(n * 1000),       inputFormat: 'Unix seconds' };
    if (abs < 1e13)  return { ms: Math.round(n),              inputFormat: 'Unix milliseconds' };
    if (abs < 1e16)  return { ms: Math.round(n / 1000),       inputFormat: 'Unix microseconds' };
                     return { ms: Math.round(n / 1_000_000),  inputFormat: 'Unix nanoseconds' };
  }

  const ts = Date.parse(s);
  if (!isNaN(ts)) {
    const isIso = /^\d{4}-\d{2}-\d{2}/.test(s);
    return { ms: ts, inputFormat: isIso ? 'ISO 8601' : 'Date string' };
  }

  throw new Error('Unrecognized format. Try a Unix timestamp (s/ms/µs/ns) or an ISO 8601 date string.');
}

function formatRelative(ms: number): string {
  const diffMs = ms - Date.now();
  const abs = Math.abs(diffMs);
  const future = diffMs > 0;
  const units: [number, string][] = [
    [1000 * 60 * 60 * 24 * 365, 'year'],
    [1000 * 60 * 60 * 24 * 30,  'month'],
    [1000 * 60 * 60 * 24 * 7,   'week'],
    [1000 * 60 * 60 * 24,       'day'],
    [1000 * 60 * 60,             'hour'],
    [1000 * 60,                  'minute'],
    [1000,                       'second'],
  ];
  for (const [threshold, unit] of units) {
    if (abs >= threshold) {
      const count = Math.round(abs / threshold);
      return future ? `in ${count} ${unit}${count !== 1 ? 's' : ''}` : `${count} ${unit}${count !== 1 ? 's' : ''} ago`;
    }
  }
  return 'just now';
}

function formatTz(ms: number, tz: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(ms));
}

function buildRows(ms: number): OutputRow[] {
  const d = new Date(ms);
  return [
    { key: 'unix_s',   label: 'Unix (seconds)',      description: 'Standard Unix timestamp',      value: String(Math.floor(ms / 1000)) },
    { key: 'unix_ms',  label: 'Unix (milliseconds)', description: 'JavaScript Date.now() / Java', value: String(ms) },
    { key: 'iso8601',  label: 'ISO 8601',            description: 'Standard interchange format',  value: d.toISOString() },
    { key: 'utc',      label: 'UTC',                 description: 'Coordinated Universal Time',   value: d.toUTCString() },
    { key: 'tz_pt',    label: 'Pacific Time',        description: 'America/Los_Angeles (PT)',      value: formatTz(ms, 'America/Los_Angeles') },
    { key: 'tz_ct',    label: 'Central Time',        description: 'America/Chicago (CT)',          value: formatTz(ms, 'America/Chicago') },
    { key: 'tz_et',    label: 'Eastern Time',        description: 'America/New_York (ET)',         value: formatTz(ms, 'America/New_York') },
    { key: 'relative', label: 'Relative',            description: 'From now',                     value: formatRelative(ms) },
  ];
}

const TimestampConverter: React.FC = () => {
  const theme = useTheme();
  const darkMode = theme.palette.mode === 'dark';

  const [nowMs, setNowMs] = useState(() => Date.now());
  const [input, setInput] = useState(() => String(Date.now()));
  const [parsed, setParsed] = useState<ParsedTime | null>(() => ({ ms: Date.now(), inputFormat: 'Unix milliseconds' }));
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  // Tick the live clock every second
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const parse = useCallback((raw: string) => {
    try {
      setParsed(parseAny(raw));
      setError('');
    } catch (err: any) {
      setParsed(null);
      setError(err.message);
    }
  }, []);

  useEffect(() => { parse(input); }, [input, parse]);

  const useNow = () => setInput(String(Date.now()));

  const copyToClipboard = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {}
  };

  const rows = parsed ? buildRows(parsed.ms) : [];

  return (
    <Box>
      {/* Live current time */}
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 2,
          bgcolor: darkMode ? alpha(theme.palette.primary.main, 0.06) : alpha(theme.palette.primary.main, 0.04),
          borderColor: alpha(theme.palette.primary.main, 0.2),
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap gap={1}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.68rem' }}>
              Current Time
            </Typography>
            <Stack direction="row" alignItems="baseline" spacing={1}>
              <Typography variant="h6" sx={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1.15rem', color: 'primary.main', lineHeight: 1.3 }}>
                {String(Math.floor(nowMs / 1000))}
              </Typography>
              <Typography variant="caption" sx={{ color: 'primary.main', opacity: 0.7, fontSize: '0.72rem', fontWeight: 600 }}>
                10-digit · Unix seconds
              </Typography>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
              {new Date(nowMs).toISOString()}
            </Typography>
          </Box>
          <Tooltip title="Use current timestamp">
            <Button
              variant="contained"
              size="small"
              onClick={useNow}
              startIcon={<Refresh sx={{ fontSize: 16 }} />}
              disableElevation
            >
              Use Current
            </Button>
          </Tooltip>
        </Stack>
      </Paper>

      {/* Input */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
          <TextField
            size="small"
            label="Timestamp or date string"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="e.g. 1700000000, 1700000000000, 2024-01-15T10:30:00Z"
            sx={{ flex: 1, minWidth: 280 }}
            error={!!error}
            inputProps={{ style: { fontFamily: 'monospace', fontSize: '0.875rem' } }}
          />
        </Stack>
        {parsed && (
          <Box sx={{ mt: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTime sx={{ fontSize: 14, color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              Detected as <strong>{parsed.inputFormat}</strong>
            </Typography>
          </Box>
        )}
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Output rows */}
      {rows.length > 0 && (
        <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
          <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: darkMode ? alpha('#fff', 0.02) : alpha('#000', 0.02) }}>
            <Typography variant="body2" fontWeight={600}>All Formats</Typography>
          </Box>
          {rows.map((row, i) => (
            <React.Fragment key={row.key}>
              {i > 0 && <Divider />}
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  '&:hover': { bgcolor: darkMode ? alpha('#fff', 0.02) : alpha('#000', 0.015) },
                }}
              >
                <Box sx={{ width: 180, flexShrink: 0 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ fontSize: '0.82rem' }}>
                    {row.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
                    {row.description}
                  </Typography>
                </Box>
                <Typography
                  variant="body2"
                  sx={{ flex: 1, fontFamily: 'monospace', fontSize: '0.82rem', wordBreak: 'break-all', color: 'text.primary' }}
                >
                  {row.value}
                </Typography>
                <Tooltip title={copied === row.key ? 'Copied!' : 'Copy'}>
                  <IconButton
                    size="small"
                    onClick={() => copyToClipboard(row.value, row.key)}
                    sx={{ color: copied === row.key ? 'success.main' : 'text.secondary', flexShrink: 0 }}
                  >
                    <ContentCopy sx={{ fontSize: 15 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </React.Fragment>
          ))}
        </Paper>
      )}

      {/* Quick reference */}
      <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block', mb: 1 }}>
          Supported input formats
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {[
            '1700000000',
            '1700000000000',
            '2024-01-15T10:30:00Z',
            '2024-01-15',
            'Jan 15 2024 10:30:00',
          ].map(ex => (
            <Chip
              key={ex}
              label={ex}
              size="small"
              variant="outlined"
              onClick={() => setInput(ex)}
              sx={{ fontFamily: 'monospace', fontSize: '0.7rem', cursor: 'pointer' }}
            />
          ))}
        </Stack>
      </Paper>
    </Box>
  );
};

export default TimestampConverter;
