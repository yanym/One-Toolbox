import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ContentCopy,
  OpenInNew,
  Link,
  Refresh,
} from '@mui/icons-material';
import GridWrapper from './GridWrapper';

type UtmFields = {
  source: string;
  medium: string;
  campaign: string;
  term: string;
  content: string;
  id: string;
};

const FIELD_LIST: Array<{ key: keyof UtmFields; label: string; placeholder: string }> = [
  { key: 'source', label: 'utm_source', placeholder: 'google | facebook | tiktok | email' },
  { key: 'medium', label: 'utm_medium', placeholder: 'cpc | display | social | referral' },
  { key: 'campaign', label: 'utm_campaign', placeholder: 'summer_promo_2026_q3' },
  { key: 'term', label: 'utm_term', placeholder: 'audience=lookalike' },
  { key: 'content', label: 'utm_content', placeholder: 'adset_a | creative_b' },
  { key: 'id', label: 'utm_id', placeholder: 'tracking_id_123' },
];

const parseCustomParams = (raw: string) => {
  const params: Record<string, string> = {};
  const lines = raw
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const tokenized = line.split('&');
    for (const token of tokenized) {
      const item = token.trim();
      if (!item.includes('=')) continue;
      const [k, ...rest] = item.split('=');
      const key = k.trim();
      if (!key) continue;
      try {
        params[key] = decodeURIComponent(rest.join('=').trim());
      } catch {
        params[key] = rest.join('=').trim();
      }
    }
  }

  return params;
};

const parseUrl = (input: string): URL | null => {
  try {
    return input.trim().includes('://')
      ? new URL(input.trim())
      : new URL(`https://${input.trim()}`);
  } catch {
    return null;
  }
};

const asText = (value: string) => value.trim() || '—';
const UTM_STORAGE_KEYS: Array<keyof UtmFields> = ['source', 'medium', 'campaign', 'term', 'content', 'id'];

const UtmCampaignBuilder: React.FC = () => {
  const [baseUrl, setBaseUrl] = useState('https://example.com/landing');
  const [fields, setFields] = useState<UtmFields>({
    source: 'google',
    medium: 'cpc',
    campaign: '',
    term: '',
    content: '',
    id: '',
  });
  const [custom, setCustom] = useState('experiment=A\nplacement=feed');
  const [resultUrl, setResultUrl] = useState('');
  const [parseInput, setParseInput] = useState('');
  const [error, setError] = useState('');

  const generatedCandidates = useMemo(() => {
    if (!baseUrl.trim()) return '';
    const base = parseUrl(baseUrl);
    if (!base) return '';

    const query = new URLSearchParams(base.search);
    UTM_STORAGE_KEYS.forEach(key => {
      const value = fields[key].trim();
      if (value) {
        query.set(`utm_${key === 'id' ? 'id' : key}`, value);
      } else {
        query.delete(`utm_${key === 'id' ? 'id' : key}`);
      }
    });
    Object.entries(parseCustomParams(custom)).forEach(([k, v]) => {
      if (k) query.set(k, v);
    });

    const url = new URL(base);
    url.search = query.toString();
    if (!baseUrl.trim().includes('://')) {
      // strip fake base domain used for local parsing
      return `${url.pathname}${url.search}${url.hash}`;
    }

    return url.toString();
  }, [baseUrl, custom, fields]);

  const parseAndLoad = () => {
    setError('');
    const parsed = parseUrl(parseInput) || parseUrl(baseUrl);
    if (!parsed) {
      setError('Invalid URL format. Add http/https or a path like /landing?x=1.');
      return;
    }

    const nextFields = { ...fields };
    UTM_STORAGE_KEYS.forEach((key) => {
      const utmKey = `utm_${key === 'id' ? 'id' : key}`;
      nextFields[key] = parsed.searchParams.get(utmKey) || '';
    });

    const remaining: string[] = [];
    parsed.searchParams.forEach((value, key) => {
      if (!key.startsWith('utm_')) {
        remaining.push(`${key}=${value}`);
      }
    });
    setCustom(remaining.join('\n'));
    setFields(nextFields);
    setResultUrl(parsed.toString());
  };

  const regenerate = () => {
    setError('');
    if (!generatedCandidates) {
      setError('Base URL is invalid. Use a valid URL or a path starting with /.');
      return;
    }
    setResultUrl(generatedCandidates);
  };

  const clearBuilder = () => {
    setFields({ source: '', medium: '', campaign: '', term: '', content: '', id: '' });
    setCustom('');
    setResultUrl('');
  };

  const copy = async () => {
    if (!resultUrl) return;
    try {
      await navigator.clipboard.writeText(resultUrl);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Box>
      <GridWrapper container spacing={2}>
        <GridWrapper item xs={12} lg={7}>
          <Paper elevation={1} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Campaign URL Builder
            </Typography>
            <TextField
              fullWidth
              label="Base URL"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://example.com/landing or /landing"
              helperText="Absolute URL or app path"
            />
            <GridWrapper container spacing={1.5}>
              {FIELD_LIST.map(item => (
                <GridWrapper key={item.key} item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={item.label}
                    placeholder={item.placeholder}
                    value={fields[item.key]}
                    onChange={(e) => setFields(prev => ({ ...prev, [item.key]: e.target.value }))}
                  />
                </GridWrapper>
              ))}
            </GridWrapper>
            <TextField
              fullWidth
              multiline
              minRows={4}
              label="Custom query params (key=value)"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              helperText="Each row can be key=value; multiple on one row can also use &"
            />
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button variant="contained" onClick={regenerate} startIcon={<Link sx={{ fontSize: 18 }} />}>
                Build URL
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setResultUrl(generatedCandidates || parseUrl(baseUrl)?.toString() || '');
                }}
                startIcon={<Refresh sx={{ fontSize: 18 }} />}
              >
                Preview
              </Button>
              <Button
                variant="outlined"
                onClick={clearBuilder}
                color="warning"
                startIcon={<Refresh sx={{ fontSize: 18 }} />}
              >
                Reset
              </Button>
            </Stack>

            <Paper variant="outlined" sx={{ p: 1.25, mt: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                Quick parse existing URL
              </Typography>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Paste full URL to extract fields"
                value={parseInput}
                onChange={(e) => setParseInput(e.target.value)}
                helperText="Paste with query string; fields are auto-filled."
              />
              <Button sx={{ mt: 1 }} size="small" onClick={parseAndLoad}>
                Parse into builder
              </Button>
            </Paper>
          </Paper>
        </GridWrapper>

        <GridWrapper item xs={12} lg={5}>
          <Paper elevation={1} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.2, minHeight: '100%' }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Result
            </Typography>
            <TextField
              fullWidth
              label="Generated URL"
              value={resultUrl}
              onChange={(e) => setResultUrl(e.target.value)}
              multiline
              minRows={5}
            />
            <Stack direction="row" spacing={1}>
              <Button size="small" variant="contained" onClick={copy} disabled={!resultUrl}>
                <ContentCopy sx={{ mr: 0.5, fontSize: 16 }} />
                Copy
              </Button>
              <Tooltip title={resultUrl ? 'Open in new tab' : 'Generate first'}>
                <span>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => resultUrl && window.open(resultUrl, '_blank')}
                    disabled={!resultUrl}
                  >
                    <OpenInNew sx={{ fontSize: 16 }} />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>

            {!!resultUrl && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.7 }}>
                  Decoded view
                </Typography>
                <Stack spacing={0.4}>
                  {FIELD_LIST.map(item => (
                    <Box key={item.key} sx={{ display: 'flex', gap: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 95 }}>
                        {item.label}
                      </Typography>
                      <Typography variant="body2">{asText(fields[item.key])}</Typography>
                    </Box>
                  ))}
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 95 }}>
                      base
                    </Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      {baseUrl || '—'}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}
            {error && <Alert severity="error" sx={{ mt: 1.5 }}>{error}</Alert>}
          </Paper>
        </GridWrapper>
      </GridWrapper>
    </Box>
  );
};

export default UtmCampaignBuilder;
