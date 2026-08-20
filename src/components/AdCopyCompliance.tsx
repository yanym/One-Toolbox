import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Refresh } from '@mui/icons-material';
import GridWrapper from './GridWrapper';

type CopyField = {
  key: string;
  label: string;
  max: number;
  helper: string;
  rows?: number;
  multiline?: boolean;
};

type CopyRule = {
  id: string;
  title: string;
  description: string;
  fields: CopyField[];
};

const COPY_RULES: CopyRule[] = [
  {
    id: 'google-search',
    title: 'Google Search Ads',
    description: 'Responsive Search Ads field limits and best-practice checks.',
    fields: [
      { key: 'headline1', label: 'Headline 1', max: 30, helper: 'Google RSA headline', rows: 1 },
      { key: 'headline2', label: 'Headline 2', max: 30, helper: 'Google RSA headline', rows: 1 },
      { key: 'headline3', label: 'Headline 3', max: 30, helper: 'Google RSA headline', rows: 1 },
      { key: 'desc1', label: 'Description 1', max: 90, helper: 'Google RSA description', rows: 2, multiline: true },
      { key: 'desc2', label: 'Description 2', max: 90, helper: 'Google RSA description', rows: 2, multiline: true },
      { key: 'path1', label: 'Final URL Path 1', max: 15, helper: 'Display URL path segment', rows: 1 },
      { key: 'path2', label: 'Final URL Path 2', max: 15, helper: 'Display URL path segment', rows: 1 },
    ],
  },
  {
    id: 'meta-feed',
    title: 'Meta (Feed)',
    description: 'Facebook/Instagram ad primary text limits for feed placements.',
    fields: [
      { key: 'primary', label: 'Primary Text', max: 125, helper: 'Primary ad text', rows: 4, multiline: true },
      { key: 'headline', label: 'Headline', max: 40, helper: 'Ad headline', rows: 1 },
      { key: 'description', label: 'Description', max: 30, helper: 'Optional text under headline', rows: 2, multiline: true },
      { key: 'cta', label: 'Call to Action', max: 20, helper: 'Optional CTA phrase', rows: 1 },
    ],
  },
  {
    id: 'linkedin-feed',
    title: 'LinkedIn Ads',
    description: 'LinkedIn ad copy fields and practical character limits.',
    fields: [
      { key: 'headline', label: 'Headline', max: 150, helper: 'Ad title', rows: 2, multiline: true },
      { key: 'text', label: 'Ad Text', max: 600, helper: 'Primary text', rows: 6, multiline: true },
      { key: 'company', label: 'Company Name', max: 100, helper: 'Optional sponsor / brand name', rows: 1 },
      { key: 'cta', label: 'Call to Action', max: 20, helper: 'Optional CTA', rows: 1 },
    ],
  },
];

type FieldState = {
  key: string;
  value: string;
  limit: number;
  length: number;
  remaining: number;
  status: 'ok' | 'warning' | 'error';
  message: string;
};

const initialRuleState = (rule: CopyRule) =>
  Object.fromEntries(rule.fields.map(field => [field.key, '']));

const countChars = (value: string) => value.length;

const AdCopyCompliance: React.FC = () => {
  const [activeRuleId, setActiveRuleId] = useState('google-search');
  const [valuesByRule, setValuesByRule] = useState<Record<string, Record<string, string>>>(() => {
    const base: Record<string, Record<string, string>> = {};
    COPY_RULES.forEach(rule => {
      base[rule.id] = initialRuleState(rule);
    });
    return base;
  });
  const [copied, setCopied] = useState(false);

  const activeRule = useMemo(() => COPY_RULES.find(rule => rule.id === activeRuleId) || COPY_RULES[0], [activeRuleId]);
  const activeValues = valuesByRule[activeRule.id] ?? initialRuleState(activeRule);

  const fieldStates = useMemo<FieldState[]>(() => {
    return activeRule.fields.map(field => {
      const value = activeValues[field.key] ?? '';
      const length = countChars(value);
      const remaining = field.max - length;
      if (length > field.max) {
        return {
          key: field.key,
          value,
          limit: field.max,
          length,
          remaining,
          status: 'error',
          message: `Over limit by ${length - field.max}`,
        };
      }
      if (remaining <= 3) {
        return {
          key: field.key,
          value,
          limit: field.max,
          length,
          remaining,
          status: 'warning',
          message: `Within ${remaining} characters`,
        };
      }
      return {
        key: field.key,
        value,
        limit: field.max,
        length,
        remaining,
        status: 'ok',
        message: `Safe`,
      };
    });
  }, [activeRule, activeValues]);

  const summary = useMemo(() => {
    const warnings = fieldStates.filter(item => item.status !== 'ok').length;
    const errors = fieldStates.filter(item => item.status === 'error').length;
    const total = fieldStates.reduce((sum, item) => sum + item.length, 0);
    return { warnings, errors, total };
  }, [fieldStates]);

  const onValueChange = useCallback((key: string, value: string) => {
    setValuesByRule(prev => ({
      ...prev,
      [activeRule.id]: {
        ...(prev[activeRule.id] ?? initialRuleState(activeRule)),
        [key]: value,
      },
    }));
  }, [activeRule]);

  const onRuleChange = useCallback((nextRuleId: string) => {
    setActiveRuleId(nextRuleId);
  }, []);

  const resetRule = () => {
    setValuesByRule(prev => ({
      ...prev,
      [activeRule.id]: initialRuleState(activeRule),
    }));
  };

  const loadSample = () => {
    const next = initialRuleState(activeRule);
    activeRule.fields.forEach(field => {
      if (field.key.includes('headline')) {
        next[field.key] = 'Q2 Performance Sale';
      } else if (field.key.includes('desc')) {
        next[field.key] = 'Launch campaign and track high-intent users to grow signups.';
      } else if (field.key.includes('path')) {
        next[field.key] = 'promo';
      } else if (field.key === 'primary') {
        next[field.key] = 'Try our latest campaign optimization toolkit with reliable tracking and reporting.';
      } else if (field.key === 'cta') {
        next[field.key] = 'Learn More';
      } else if (field.key === 'company') {
        next[field.key] = 'Acme Platform';
      } else if (field.key === 'text') {
        next[field.key] = 'Advertisers get cleaner UTM workflows, better pacing insights, and faster debugging for ad measurement.';
      } else {
        next[field.key] = '';
      }
    });

    setValuesByRule(prev => ({
      ...prev,
      [activeRule.id]: next,
    }));
  };

  const copySummary = async () => {
    const lines = fieldStates.map(state => {
      const field = activeRule.fields.find(item => item.key === state.key);
      const label = field?.label || state.key;
      return `${label}: ${state.length}/${state.limit}`;
    });
    const text = [`${activeRule.title} Copy Check`, ...lines].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore copy errors
    }
  };

  const statusText = summary.errors > 0 ? 'Has errors' : summary.warnings > 0 ? 'Needs tuning' : 'All fields look safe';

  return (
    <Box>
      <GridWrapper container spacing={2}>
        <GridWrapper item xs={12} lg={7}>
          <Paper elevation={1} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} flexWrap="wrap">
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  Campaign Copy Compliance
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Check ads copy length against platform limits and avoid rejection risk.
                </Typography>
              </Box>
              <Select
                size="small"
                value={activeRule.id}
                onChange={(event) => onRuleChange(event.target.value)}
                sx={{ minWidth: 220 }}
              >
                {COPY_RULES.map(rule => (
                  <MenuItem key={rule.id} value={rule.id}>
                    {rule.title}
                  </MenuItem>
                ))}
              </Select>
            </Stack>

            <Alert severity="info" sx={{ mt: 0.5 }}>
              {activeRule.description}
            </Alert>

            <GridWrapper container spacing={1.2}>
              {activeRule.fields.map(field => {
                const state = fieldStates.find(item => item.key === field.key);
                const helper = `${state ? state.length : 0}/${field.max} chars`;
                const showWarning = state?.status === 'warning' && state.remaining >= 0;
                return (
                  <GridWrapper key={field.key} item xs={12}>
                    <TextField
                      fullWidth
                      label={field.label}
                      multiline={field.multiline}
                      minRows={field.rows ?? 1}
                      value={activeValues[field.key] ?? ''}
                      onChange={(event) => onValueChange(field.key, event.target.value)}
                      error={state?.status === 'error'}
                      helperText={state ? `${field.helper} · ${helper} · ${state.message}` : field.helper}
                      FormHelperTextProps={{
                        sx: { color: showWarning ? 'warning.main' : undefined },
                      }}
                      InputProps={{
                        sx: {
                          '& textarea': {
                            fontSize: '0.84rem',
                            lineHeight: 1.45,
                          },
                        },
                      }}
                    />
                  </GridWrapper>
                );
              })}
            </GridWrapper>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button size="small" variant="outlined" startIcon={<Refresh fontSize="small" />} onClick={resetRule}>
                Reset
              </Button>
              <Button size="small" variant="outlined" onClick={loadSample}>
                Load sample
              </Button>
              <Button size="small" variant="contained" onClick={copySummary}>
                {copied ? 'Copied' : 'Copy summary'}
              </Button>
            </Stack>
          </Paper>
        </GridWrapper>

        <GridWrapper item xs={12} lg={5}>
          <Paper elevation={1} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.2 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Check Summary
            </Typography>

            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
              <Chip
                label={`${summary.total} total characters`}
                variant="outlined"
                size="small"
              />
              <Chip
                label={`${statusText}`}
                color={summary.errors > 0 ? 'error' : summary.warnings > 0 ? 'warning' : 'success'}
                variant="outlined"
                size="small"
              />
              <Chip
                label={`${summary.warnings} warnings`}
                color={summary.warnings > 0 ? 'warning' : 'default'}
                variant="outlined"
                size="small"
              />
            </Box>

            <Alert severity={summary.errors > 0 ? 'error' : summary.warnings > 0 ? 'warning' : 'success'}>
              {summary.errors > 0
                ? 'Some fields exceed limits. Reduce character count before publishing.'
                : summary.warnings > 0
                  ? 'Some fields are close to the maximum. Keep room for punctuation or localization.'
                  : 'All fields are within limits.'}
            </Alert>

            <Paper variant="outlined" sx={{ p: 1.25 }}>
              <Typography variant="body2" sx={{ mb: 0.5 }} fontWeight={600}>
                Field health
              </Typography>
              <Stack spacing={0.7}>
                {fieldStates.map(fieldState => {
                  const field = activeRule.fields.find(item => item.key === fieldState.key);
                  const name = field?.label || fieldState.key;
                  return (
                    <Stack
                      key={fieldState.key}
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      spacing={1}
                    >
                      <Typography variant="body2" sx={{ minWidth: 150 }}>
                        {name}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          color: fieldState.status === 'error' ? 'error.main' : fieldState.status === 'warning' ? 'warning.main' : 'success.main',
                          wordBreak: 'break-all',
                        }}
                      >
                        {fieldState.length}/{fieldState.limit}
                      </Typography>
                    </Stack>
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

export default AdCopyCompliance;
