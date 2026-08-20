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

type SegmentRule = {
  label: string;
  required: boolean;
  pattern: string;
  hint: string;
};

type NamingPreset = {
  id: string;
  title: string;
  separator: string;
  sample: string;
  segmentRules: SegmentRule[];
};

const PRESETS: NamingPreset[] = [
  {
    id: 'ad-standard',
    title: 'Platform_Campaign_Geo_Objective_Date',
    separator: '_',
    sample: 'google_search_q3_us_leads_20260801',
    segmentRules: [
      { label: 'platform', required: true, pattern: '^[a-z]{2,16}$', hint: 'lowercase letters, 2-16 chars' },
      { label: 'campaign', required: true, pattern: '.{2,30}', hint: '2-30 chars campaign token' },
      { label: 'geo', required: true, pattern: '^[a-z]{2}(?:-[a-z]{2})?$', hint: 'country or locale code, e.g. us or us-en' },
      { label: 'objective', required: true, pattern: '^[a-z0-9]+$', hint: 'lowercase and numbers' },
      { label: 'date', required: true, pattern: '^\\d{8}$', hint: 'yyyyMMdd' },
    ],
  },
  {
    id: 'ad-objective-first',
    title: 'platform-objective-aud-geo-date',
    separator: '-',
    sample: 'meta-awareness-remarketing-ca-20260801',
    segmentRules: [
      { label: 'platform', required: true, pattern: '^[a-z]{2,16}$', hint: 'lowercase letters, 2-16 chars' },
      { label: 'objective', required: true, pattern: '^[a-z0-9]+$', hint: 'lowercase and numbers' },
      { label: 'aud', required: true, pattern: '^[a-z0-9]{2,20}$', hint: 'audience token only' },
      { label: 'geo', required: true, pattern: '^[a-z]{2}(?:-[a-z]{2})?$', hint: 'country or locale code' },
      { label: 'date', required: true, pattern: '^\\d{8}$', hint: 'yyyyMMdd' },
    ],
  },
  {
    id: 'lightweight',
    title: 'platform-campaign-id-date',
    separator: '-',
    sample: 'tt-cpc-core-20260801',
    segmentRules: [
      { label: 'platform', required: true, pattern: '^[a-z]{2,10}$', hint: 'lowercase letters, 2-10 chars' },
      { label: 'campaign', required: true, pattern: '.{2,24}', hint: '2-24 chars campaign token' },
      { label: 'id', required: true, pattern: '^[a-z0-9]{3,16}$', hint: 'campaign id or test code' },
      { label: 'date', required: true, pattern: '^\\d{8}$', hint: 'yyyyMMdd' },
    ],
  },
];

type ParseIssue = {
  line: number;
  source: string;
  issues: string[];
  segments: string[];
};

const safeRegExp = (pattern: string) => {
  try {
    return new RegExp(pattern, 'i');
  } catch {
    return null;
  }
};

const dedupeName = (value: string, separator: string) => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, separator)
    .replace(/[^a-z0-9\-_.]/g, '')
    .replace(new RegExp(`\\${separator}{2,}`, 'g'), separator);
};

const CampaignNamingLinter: React.FC = () => {
  const [presetId, setPresetId] = useState('ad-standard');
  const [namesInput, setNamesInput] = useState('google_search_q3_us_leads_20260801\nmeta-awareness-remarketing-ca-20260801\ntt-cpc-core-20260732');
  const [maxLength, setMaxLength] = useState('64');
  const [allowUppercase, setAllowUppercase] = useState(false);

  const preset = useMemo(() => PRESETS.find(item => item.id === presetId) || PRESETS[0], [presetId]);
  const maxLen = Number.parseInt(maxLength, 10);
  const rawNames = useMemo(() => namesInput.split(/\r?\n/).map(item => item.trim()).filter(Boolean), [namesInput]);

  const parsed: ParseIssue[] = useMemo(() => {
    const results: ParseIssue[] = [];
    const seen = new Set<string>();

    rawNames.forEach((name, index) => {
      const line = index + 1;
      const raw = name.trim();
      const issues: string[] = [];
      const segs = raw.split(preset.separator).filter(Boolean);

      if (!allowUppercase && /[A-Z]/.test(raw)) {
        issues.push('Contains uppercase characters');
      }

      const maxLenNumber = Number.isFinite(maxLen) ? maxLen : 64;
      if (raw.length > maxLenNumber) {
        issues.push(`Length ${raw.length} > ${maxLenNumber}`);
      }

      if (raw !== dedupeName(raw, preset.separator)) {
        issues.push('Contains invalid characters or repeated separators');
      }

      if (segs.length !== preset.segmentRules.length) {
        issues.push(`Expected ${preset.segmentRules.length} segments, got ${segs.length}`);
      }

      preset.segmentRules.forEach((rule, ruleIndex) => {
        const value = segs[ruleIndex];
        const reg = safeRegExp(rule.pattern);
        if (rule.required && !value) {
          issues.push(`Missing ${rule.label}`);
          return;
        }
        if (value && reg && !reg.test(value)) {
          issues.push(`${rule.label} format invalid`);
        }
      });

      const normalized = raw.toLowerCase();
      if (seen.has(normalized)) {
        issues.push('Duplicated name');
      } else {
        seen.add(normalized);
      }

      results.push({
        line,
        source: raw,
        issues,
        segments: segs,
      });
    });

    return results;
  }, [allowUppercase, maxLen, preset, rawNames]);

  const stats = useMemo(() => {
    const valid = parsed.filter(item => item.issues.length === 0).length;
    const invalid = parsed.filter(item => item.issues.length > 0).length;
    const duplicates = parsed.filter(item => item.issues.includes('Duplicated name')).length;
    return { valid, invalid, total: parsed.length, duplicates };
  }, [parsed]);

  const copySuggested = async () => {
    const suggest = parsed
      .map((item) => dedupeName(item.source, preset.separator))
      .filter(Boolean)
      .join('\n');
    try {
      await navigator.clipboard.writeText(suggest);
    } catch {
      // ignore copy failures
    }
  };

  return (
    <Box>
      <GridWrapper container spacing={2}>
        <GridWrapper item xs={12} lg={7}>
          <Paper elevation={1} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.2 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Campaign Naming Linter
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Check naming rules, catch inconsistent campaign IDs, and enforce your own naming conventions.
            </Typography>

            <GridWrapper container spacing={1.2}>
              <GridWrapper item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Naming preset"
                  value={presetId}
                  onChange={(event) => setPresetId(event.target.value)}
                  SelectProps={{ native: true }}
                >
                  {PRESETS.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </TextField>
              </GridWrapper>
              <GridWrapper item xs={12} md={3}>
                <TextField
                  label="Max name length"
                  fullWidth
                  value={maxLength}
                  onChange={(event) => setMaxLength(event.target.value)}
                  inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                />
              </GridWrapper>
              <GridWrapper item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Separator"
                  value={preset.separator}
                  disabled
                  helperText="Defined by preset"
                />
              </GridWrapper>
            </GridWrapper>

            <TextField
              label="Name list (one per line)"
              placeholder="google_search_q3_us_leads_20260801"
              value={namesInput}
              onChange={(event) => setNamesInput(event.target.value)}
              fullWidth
              multiline
              minRows={8}
              helperText="Paste campaign/ad group names for batch validation."
            />
            <GridWrapper container spacing={1.2} alignItems="center">
              <GridWrapper item xs={12} md={4}>
                <Chip
                  label={allowUppercase ? 'Allow uppercase' : 'Lowercase required'}
                  color={allowUppercase ? 'default' : 'primary'}
                  onClick={() => setAllowUppercase(prev => !prev)}
                  size="small"
                  sx={{ width: '100%', justifyContent: 'center' }}
                />
              </GridWrapper>
              <GridWrapper item xs={12} md={8}>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip label={`Sample: ${preset.sample}`} size="small" variant="outlined" color="default" />
                  <Chip
                    label="Copy suggested names"
                    size="small"
                    color="primary"
                    variant="outlined"
                    onClick={copySuggested}
                    icon={<span />}
                    sx={{ cursor: 'pointer' }}
                  />
                  <Chip
                    label="Reset input"
                    size="small"
                    color="secondary"
                    variant="outlined"
                    onClick={() => setNamesInput('')}
                  />
                </Stack>
              </GridWrapper>
            </GridWrapper>

            <Alert severity="info" sx={{ mt: 1 }}>
              Current pattern: <strong>{preset.segmentRules.map((segment, index) => segment.label).join(` ${preset.separator} `)}</strong>
              . Example: <strong>{preset.sample}</strong>
            </Alert>
          </Paper>
        </GridWrapper>

        <GridWrapper item xs={12} lg={5}>
          <Paper elevation={1} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.2 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Validation Result
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label={`Total: ${stats.total}`} size="small" />
              <Chip label={`Valid: ${stats.valid}`} color="success" size="small" variant="outlined" />
              <Chip label={`Invalid: ${stats.invalid}`} color="error" size="small" variant="outlined" />
              <Chip label={`Duplicate: ${stats.duplicates}`} size="small" />
            </Stack>
            <Paper variant="outlined" sx={{ p: 1, maxHeight: 410, overflow: 'auto' }}>
              <Stack spacing={1}>
                {parsed.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Paste names to see rule check results.
                  </Typography>
                )}
                {parsed.map(item => {
                  const isValid = item.issues.length === 0;
                  return (
                    <Box key={`${item.line}-${item.source}`} sx={{ p: 1, borderRadius: 1, border: isValid ? '1px solid transparent' : '1px dashed', borderColor: 'divider', bgcolor: isValid ? 'transparent' : 'action.hover' }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                        <Typography variant="body2" fontWeight={600}>
                          Line {item.line}
                        </Typography>
                        <Chip label={isValid ? 'pass' : 'fail'} size="small" color={isValid ? 'success' : 'error'} />
                      </Stack>
                      <Typography variant="caption" sx={{ display: 'block', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                        {item.source}
                      </Typography>

                      {!isValid && (
                        <Stack direction="row" spacing={0.8} flexWrap="wrap" sx={{ mt: 0.7 }}>
                          {item.issues.map((issue, idx) => (
                            <Chip
                              key={`${item.line}-${issue}-${idx}`}
                              label={issue}
                              size="small"
                              color="error"
                              variant="outlined"
                            />
                          ))}
                        </Stack>
                      )}
                      <Stack direction="row" spacing={0.6} flexWrap="wrap" sx={{ mt: 0.8 }}>
                        {item.segments.map((segment, segmentIndex) => {
                          const rule = preset.segmentRules[segmentIndex];
                          const label = rule?.label ?? `part${segmentIndex + 1}`;
                          return (
                            <Chip
                              key={`${item.line}-${label}`}
                              size="small"
                              variant="outlined"
                              label={`${label}: ${segment || '—'}`}
                              sx={{ fontFamily: 'monospace' }}
                            />
                          );
                        })}
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            </Paper>
          </Paper>
        </GridWrapper>
      </GridWrapper>
    </Box>
  );
};

export default CampaignNamingLinter;
