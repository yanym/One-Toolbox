import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import GridWrapper from './GridWrapper';

type ParsedMap = Record<string, string[]>;

const TRACKING_DEFINITIONS: Record<string, string> = {
  gclid: 'Google Ads click identifier',
  fbclid: 'Meta click identifier',
  ttclid: 'TikTok click identifier',
  msclkid: 'Microsoft click identifier',
  dclid: 'Google Display Network click identifier',
  bicid: 'Bid manager / internal id',
  adid: 'Mobile ad id hint',
  sscmp: 'Source/medium campaign fingerprint',
  utm_source: 'Campaign source',
  utm_medium: 'Campaign medium',
  utm_campaign: 'Campaign name',
  utm_term: 'Campaign keyword',
  utm_content: 'Campaign creative',
  utm_id: 'Campaign id',
  twclid: 'Twitter/X click identifier',
  li_fat_id: 'LinkedIn click identifier',
};

const COMMON_KEYS = new Set(Object.keys(TRACKING_DEFINITIONS));

const addPair = (store: ParsedMap, key: string, value: string) => {
  const normalized = key.trim().toLowerCase();
  if (!normalized) return;
  if (!store[normalized]) store[normalized] = [];
  store[normalized].push(value);
};

const safeDecode = (input: string) => {
  try {
    return decodeURIComponent(input);
  } catch {
    return input;
  }
};

const parseFromUrl = (raw: string): ParsedMap => {
  const map: ParsedMap = {};
  try {
    const normalized = raw.trim();
    if (!normalized) return map;
    const withProtocol = normalized.includes('://') ? normalized : `https://example.com${normalized.startsWith('/') ? '' : '/'}${normalized}`;
    const url = new URL(withProtocol);
    url.searchParams.forEach((value, key) => {
      addPair(map, key, value);
    });
    const hash = url.hash.replace(/^#/, '');
    if (hash && hash.includes('=')) {
      hash.split(/[&;]/).forEach((item) => {
        const [k, v = ''] = item.split('=');
        if (k) addPair(map, k, safeDecode(v || ''));
      });
    }
  } catch {
    return {};
  }
  return map;
};

const parsePairs = (raw: string): ParsedMap => {
  const map: ParsedMap = {};
  const trimmed = raw.trim();
  if (!trimmed) return map;

  const chunks = trimmed.split(/[\n&;]/).map(item => item.trim()).filter(Boolean);
  chunks.forEach((chunk) => {
    const pair = chunk.split('=');
    if (pair.length >= 2) {
      const key = pair[0].trim();
      const value = safeDecode(pair.slice(1).join('=').trim());
      addPair(map, key, value);
    }
  });

  return map;
};

const parseInput = (raw: string): ParsedMap => {
  const asUrl = parseFromUrl(raw);
  if (Object.keys(asUrl).length > 0) return asUrl;
  const asPairs = parsePairs(raw);
  if (Object.keys(asPairs).length > 0) return asPairs;

  try {
    const maybeJson = JSON.parse(raw);
    if (maybeJson && typeof maybeJson === 'object') {
      const map: ParsedMap = {};
      Object.entries(maybeJson).forEach(([key, value]) => {
        if (value == null) return;
        addPair(map, key, String(value));
      });
      return map;
    }
  } catch {
    // ignore
  }

  return {};
};

const toLineList = (entries: ParsedMap): Array<{ key: string; value: string }> => {
  return Object.entries(entries).flatMap(([k, values]) => values.map(v => ({ key: k, value: v })));
};

const AdTrackingInspector: React.FC = () => {
  const [rawInput, setRawInput] = useState('https://example.com/landing?utm_source=google&utm_medium=cpc&gclid=ABC123&fbclid=DEF456&utm_campaign=q3_promo');
  const parsed = useMemo(() => parseInput(rawInput), [rawInput]);
  const detected = useMemo(() => Object.entries(parsed).filter(([k]) => COMMON_KEYS.has(k.toLowerCase())), [parsed]);
  const lines = useMemo(() => toLineList(parsed), [parsed]);

  const hasData = lines.length > 0;

  const jsonOutput = useMemo(() => {
    const obj: Record<string, string | string[]> = {};
    Object.entries(parsed).forEach(([k, values]) => {
      obj[k] = values.length <= 1 ? values[0] || '' : values;
    });
    return JSON.stringify(obj, null, 2);
  }, [parsed]);

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonOutput);
    } catch {}
  };

  return (
    <Box>
      <GridWrapper container spacing={2}>
        <GridWrapper item xs={12} lg={7}>
          <Paper elevation={1} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.2 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Parse ad tracking params
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={8}
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder="Paste URL, query string, query params, headers, or JSON"
              helperText="Supports key=value, &/; separators, URL query, or JSON object"
            />
            <Typography variant="body2" color="text.secondary">
              Common ad IDs recognized: gclid, fbclid, msclkid, ttclid, dclid, twclid, li_fat_id.
            </Typography>
            <Stack direction="row" spacing={1}>
              <Typography variant="body2" fontWeight={600}>
                Parsed keys:
              </Typography>
              <Typography variant="body2">{lines.length}</Typography>
            </Stack>

            {!hasData && (
              <Alert severity="warning">
                No parseable key-value pairs yet. Paste a URL or query string first.
              </Alert>
            )}
            {hasData && (
              <Paper variant="outlined" sx={{ p: 1.5, mt: 0.5 }}>
                <Typography variant="subtitle2" sx={{ mb: 0.7 }}>
                  Recognized tracking signals
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {detected.length ? detected.map(([key, values]) => (
                    <Chip
                      key={key}
                      label={`${key}: ${values.join(', ')}`}
                      color="success"
                      size="small"
                      variant="outlined"
                    />
                  )) : (
                    <Typography variant="body2" color="text.secondary">
                      No known tracking IDs found.
                    </Typography>
                  )}
                </Stack>
              </Paper>
            )}
          </Paper>
        </GridWrapper>

        <GridWrapper item xs={12} lg={5}>
          <Paper elevation={1} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.2 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Parsed Map
            </Typography>

            <Paper variant="outlined" sx={{ p: 1.5, minHeight: 180, bgcolor: 'transparent' }}>
              {hasData ? (
                <Box sx={{ maxHeight: 320, overflow: 'auto' }}>
                  {lines.map((item, index) => {
                    const normalized = item.key.toLowerCase();
                    const desc = TRACKING_DEFINITIONS[normalized];
                    return (
                      <Box key={`${item.key}-${index}`} sx={{ py: 0.4 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {item.key}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {desc || 'Custom parameter'}
                        </Typography>
                        <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                          {item.value}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Parsed key-value list will appear here.
                </Typography>
              )}
            </Paper>

            {hasData && (
              <TextField
                fullWidth
                multiline
                minRows={8}
                value={jsonOutput}
                InputProps={{
                  readOnly: true,
                }}
              />
            )}
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip
                size="small"
                label="Copy JSON"
                onClick={copyJson}
                color="primary"
                variant="outlined"
              />
            </Stack>
          </Paper>
        </GridWrapper>
      </GridWrapper>
    </Box>
  );
};

export default AdTrackingInspector;
