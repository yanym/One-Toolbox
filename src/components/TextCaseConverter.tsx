import React, { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { ContentCopy, Refresh } from '@mui/icons-material';
import GridWrapper from './GridWrapper';

const splitWords = (value: string): string[] => {
  const raw = value.trim();
  if (!raw) return [];
  return raw
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_\-\.]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map(v => v.toLowerCase());
};

const toCamelCase = (value: string) => {
  const words = splitWords(value);
  if (!words.length) return '';
  return words[0] + words.slice(1).map(word => `${word[0].toUpperCase()}${word.slice(1)}`).join('');
};

const toPascalCase = (value: string) => {
  const words = splitWords(value);
  if (!words.length) return '';
  return words.map(word => `${word[0].toUpperCase()}${word.slice(1)}`).join('');
};

const toSnakeCase = (value: string) => {
  const words = splitWords(value);
  if (!words.length) return '';
  return words.join('_');
};

const toKebabCase = (value: string) => splitWords(value).join('-');
const toScreamingSnakeCase = (value: string) => toSnakeCase(value).toUpperCase();

const toTitleCase = (value: string) => {
  const words = splitWords(value);
  if (!words.length) return '';
  return words.map(word => `${word[0].toUpperCase()}${word.slice(1)}`).join(' ');
};

const toSentenceCase = (value: string) => {
  const lower = value.trim().replace(/\s+/g, ' ').toLowerCase();
  if (!lower) return '';
  return `${lower[0].toUpperCase()}${lower.slice(1)}`;
};

const toDotCase = (value: string) => splitWords(value).join('.');

const converters = [
  { label: 'camelCase', key: 'camel', transform: toCamelCase },
  { label: 'PascalCase', key: 'pascal', transform: toPascalCase },
  { label: 'snake_case', key: 'snake', transform: toSnakeCase },
  { label: 'kebab-case', key: 'kebab', transform: toKebabCase },
  { label: 'SCREAMING_SNAKE', key: 'screaming', transform: toScreamingSnakeCase },
  { label: 'Title Case', key: 'title', transform: toTitleCase },
  { label: 'Sentence case', key: 'sentence', transform: toSentenceCase },
  { label: 'dot.case', key: 'dot', transform: toDotCase },
  { label: 'UPPER_CASE', key: 'upper', transform: (value: string) => splitWords(value).join('_').toUpperCase() },
  { label: 'lower_case', key: 'lower', transform: (value: string) => splitWords(value).join('_').toLowerCase() },
];

const EXAMPLES = [
  'my sample json key',
  'first_name/last_name',
  'parseAPIResponse',
  '  USER PROFILE ID ',
];

const TextCaseConverter: React.FC = () => {
  const theme = useTheme();
  const [input, setInput] = useState('sample_input_name');

  const results = useMemo(() => {
    const map: Record<string, string> = {};
    converters.forEach(({ key, transform }) => {
      map[key] = transform(input);
    });
    return map;
  }, [input]);

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {}
  };

  const reset = () => setInput('');

  return (
    <Box>
      <GridWrapper container spacing={2}>
        <GridWrapper item xs={12} md={5}>
          <Paper elevation={1} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Input
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={6}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste text or identifier"
              InputProps={{
                style: { fontFamily: theme.typography.fontFamily },
              }}
            />
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {EXAMPLES.map(item => (
                <Chip
                  key={item}
                  size="small"
                  label={item}
                  variant="outlined"
                  onClick={() => setInput(item)}
                  sx={{ fontSize: '0.72rem' }}
                />
              ))}
              <Button size="small" startIcon={<Refresh sx={{ fontSize: 15 }} />} onClick={reset}>
                Clear
              </Button>
            </Stack>
          </Paper>
        </GridWrapper>

        <GridWrapper item xs={12} md={7}>
          <Paper elevation={1} sx={{ p: 2, overflow: 'hidden' }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
              Case Variants
            </Typography>
            <Box>
              {converters.map((converter, index) => {
                const value = results[converter.key];
                return (
                  <Box key={converter.key}>
                    {index > 0 && <Divider sx={{ my: 1 }} />}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, py: 0.5 }}>
                      <Box sx={{ minWidth: 140 }}>
                        <Typography variant="body2" color="text.secondary">
                          {converter.label}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.82rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {value || '—'}
                        </Typography>
                      </Box>
                      <Tooltip title="Copy">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => copy(value)}
                            disabled={!value}
                            aria-label={`Copy ${converter.label}`}
                          >
                            <ContentCopy sx={{ fontSize: 15 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </GridWrapper>
      </GridWrapper>
    </Box>
  );
};

export default TextCaseConverter;
