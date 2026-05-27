import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import {
  ContentCopy,
  Clear,
  Key,
  Schedule,
  VerifiedUser,
} from '@mui/icons-material';
import Editor from '@monaco-editor/react';
import GridWrapper from './GridWrapper';

const SAMPLE_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkphbmUgRG9lIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzE2MjM5MDIyLCJleHAiOjE4OTM0NTYwMDB9.signature';

interface DecodedJwt {
  header: Record<string, any>;
  payload: Record<string, any>;
  signature: string;
  error?: string;
}

const decodeBase64Url = (value: string): string => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

const parseJwt = (token: string): DecodedJwt => {
  const parts = token.trim().split('.');

  if (parts.length < 2) {
    return {
      header: {},
      payload: {},
      signature: '',
      error: 'JWTs should have at least header and payload segments.',
    };
  }

  try {
    return {
      header: JSON.parse(decodeBase64Url(parts[0])),
      payload: JSON.parse(decodeBase64Url(parts[1])),
      signature: parts[2] || '',
    };
  } catch (error: any) {
    return {
      header: {},
      payload: {},
      signature: parts[2] || '',
      error: error.message || 'Unable to decode JWT.',
    };
  }
};

const formatJson = (value: Record<string, any>) => JSON.stringify(value, null, 2);

const formatNumericDate = (value: any): string => {
  if (typeof value !== 'number') return 'Not set';
  return new Date(value * 1000).toLocaleString();
};

const getExpirationState = (payload: Record<string, any>) => {
  if (typeof payload.exp !== 'number') {
    return { label: 'No exp claim', color: 'default' as const };
  }

  return payload.exp * 1000 < Date.now()
    ? { label: 'Expired', color: 'error' as const }
    : { label: 'Active', color: 'success' as const };
};

const JwtDecoder: React.FC = () => {
  const theme = useTheme();
  const darkMode = theme.palette.mode === 'dark';
  const [token, setToken] = useState(SAMPLE_TOKEN);
  const decoded = useMemo(() => parseJwt(token), [token]);
  const expirationState = useMemo(() => getExpirationState(decoded.payload), [decoded.payload]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  const clearToken = () => {
    setToken('');
  };

  return (
    <Box>
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
          <Chip icon={<VerifiedUser />} label={decoded.header.alg || 'Unknown alg'} color="primary" variant="outlined" />
          <Chip icon={<Key />} label={decoded.header.typ || 'JWT'} variant="outlined" />
          <Chip icon={<Schedule />} label={expirationState.label} color={expirationState.color} variant="outlined" />
        </Stack>
      </Paper>

      <Alert severity="info" sx={{ mb: 2 }}>
        Decoding is local and read-only. This tool does not verify the token signature.
      </Alert>

      {decoded.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {decoded.error}
        </Alert>
      )}

      <GridWrapper container spacing={2}>
        <GridWrapper item xs={12} md={5}>
          <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="body2" fontWeight={600}>JWT Input</Typography>
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="Copy token">
                  <IconButton size="small" onClick={() => copyToClipboard(token)} disabled={!token}>
                    <ContentCopy sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Clear">
                  <IconButton size="small" color="error" onClick={clearToken}>
                    <Clear sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
            <Box sx={{ height: 480 }}>
              <Editor
                height="100%"
                defaultLanguage="text"
                value={token}
                onChange={(value) => setToken(value || '')}
                theme={darkMode ? 'vs-dark' : 'light'}
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 13,
                  lineNumbers: 'off',
                  wordWrap: 'on',
                  padding: { top: 10 },
                }}
              />
            </Box>
          </Paper>
        </GridWrapper>

        <GridWrapper item xs={12} md={7}>
          <Stack spacing={2}>
            <GridWrapper container spacing={2}>
              <GridWrapper item xs={12} md={6}>
                <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
                  <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" fontWeight={600}>Header</Typography>
                    <Tooltip title="Copy header JSON">
                      <IconButton size="small" onClick={() => copyToClipboard(formatJson(decoded.header))} disabled={!!decoded.error}>
                        <ContentCopy sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <Box sx={{ height: 220 }}>
                    <Editor
                      height="100%"
                      defaultLanguage="json"
                      value={formatJson(decoded.header)}
                      theme={darkMode ? 'vs-dark' : 'light'}
                      options={{ readOnly: true, minimap: { enabled: false }, scrollBeyondLastLine: false, fontSize: 13, lineNumbers: 'off', wordWrap: 'on' }}
                    />
                  </Box>
                </Paper>
              </GridWrapper>

              <GridWrapper item xs={12} md={6}>
                <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
                  <Typography variant="body2" fontWeight={600} gutterBottom>Claims</Typography>
                  <Stack spacing={1}>
                    <Chip label={`Subject: ${decoded.payload.sub || 'Not set'}`} variant="outlined" />
                    <Chip label={`Issuer: ${decoded.payload.iss || 'Not set'}`} variant="outlined" />
                    <Chip label={`Audience: ${decoded.payload.aud || 'Not set'}`} variant="outlined" />
                    <Chip label={`Issued: ${formatNumericDate(decoded.payload.iat)}`} variant="outlined" />
                    <Chip label={`Expires: ${formatNumericDate(decoded.payload.exp)}`} color={expirationState.color} variant="outlined" />
                  </Stack>
                </Paper>
              </GridWrapper>
            </GridWrapper>

            <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
              <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" fontWeight={600}>Payload</Typography>
                <Tooltip title="Copy payload JSON">
                  <IconButton size="small" onClick={() => copyToClipboard(formatJson(decoded.payload))} disabled={!!decoded.error}>
                    <ContentCopy sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box sx={{ height: 240 }}>
                <Editor
                  height="100%"
                  defaultLanguage="json"
                  value={formatJson(decoded.payload)}
                  theme={darkMode ? 'vs-dark' : 'light'}
                  options={{ readOnly: true, minimap: { enabled: false }, scrollBeyondLastLine: false, fontSize: 13, lineNumbers: 'on', wordWrap: 'on' }}
                />
              </Box>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="body2" fontWeight={600}>Signature</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', overflowWrap: 'anywhere', flex: 1 }}>
                  {decoded.signature || 'No signature segment'}
                </Typography>
                <Button size="small" startIcon={<ContentCopy />} onClick={() => copyToClipboard(decoded.signature)} disabled={!decoded.signature}>
                  Copy
                </Button>
              </Stack>
            </Paper>
          </Stack>
        </GridWrapper>
      </GridWrapper>
    </Box>
  );
};

export default JwtDecoder;
