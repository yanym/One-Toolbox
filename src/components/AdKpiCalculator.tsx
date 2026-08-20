import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import GridWrapper from './GridWrapper';

const asNumber = (value: string): number | null => {
  const normalized = value.replace(/,/g, '').trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const fmt = (value: number | null, digits = 2) => {
  if (value === null || Number.isNaN(value) || !Number.isFinite(value)) return '—';
  return value.toFixed(digits);
};

const percent = (value: number | null, digits = 2) => {
  if (value === null || Number.isNaN(value) || !Number.isFinite(value)) return '—';
  return `${(value * 100).toFixed(digits)}%`;
};

const safe = (num: number | null, divisor: number | null) => {
  if (num === null || divisor === null || divisor <= 0) return null;
  return num / divisor;
};

const AdKpiCalculator: React.FC = () => {
  const [spendInput, setSpendInput] = useState('12000');
  const [impressionsInput, setImpressionsInput] = useState('1800000');
  const [clicksInput, setClicksInput] = useState('9500');
  const [conversionsInput, setConversionsInput] = useState('120');
  const [revenueInput, setRevenueInput] = useState('24000');

  const [targetBudgetInput, setTargetBudgetInput] = useState('5000');
  const [targetCpcInput, setTargetCpcInput] = useState('1.35');
  const [targetCpmInput, setTargetCpmInput] = useState('8.2');
  const [targetCvrInput, setTargetCvrInput] = useState('1.2');

  const metrics = useMemo(() => {
    const spend = asNumber(spendInput);
    const impressions = asNumber(impressionsInput);
    const clicks = asNumber(clicksInput);
    const conversions = asNumber(conversionsInput);
    const revenue = asNumber(revenueInput);

    const ctr = safe(clicks, impressions);
    const cpm = safe(spend, impressions) && impressions !== 0 ? safe(spend, impressions)! * 1000 : null;
    const cpc = safe(spend, clicks);
    const cpa = safe(spend, conversions);
    const cvr = safe(conversions, clicks);
    const rpc = safe(revenue, clicks);
    const roi = safe(revenue !== null ? (revenue - (spend || 0)) : null, spend);
    const targetCpc = asNumber(targetCpcInput);
    const targetCpm = asNumber(targetCpmInput);
    const targetCvr = asNumber(targetCvrInput);

    const targetBudget = asNumber(targetBudgetInput);
    const estCPCClicks = safe(targetBudget, targetCpc);
    const estCPMImpressions = safe(targetBudget, targetCpm) ? safe(targetBudget, targetCpm)! * 1000 : null;
    const estConversions = (targetBudget !== null && targetCpc !== null && targetCvr !== null && targetCvr > 0)
      ? (targetBudget / targetCpc) * (targetCvr / 100)
      : null;

    return {
      spend,
      impressions,
      clicks,
      conversions,
      revenue,
      ctr,
      cpm,
      cpc,
      cpa,
      cvr,
      rpc,
      roi,
      targetBudget,
      targetCvr,
      estCPCClicks,
      estCPMImpressions,
      estConversions,
    };
  }, [spendInput, impressionsInput, clicksInput, conversionsInput, revenueInput, targetBudgetInput, targetCpcInput, targetCpmInput, targetCvrInput]);

  return (
    <Box>
      <GridWrapper container spacing={2}>
        <GridWrapper item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.2 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Input Metrics
            </Typography>
            <GridWrapper container spacing={1.2}>
              <GridWrapper item xs={12} sm={6}>
                <TextField
                  label="Spend"
                  fullWidth
                  value={spendInput}
                  onChange={(e) => setSpendInput(e.target.value)}
                  helperText="Currency amount"
                />
              </GridWrapper>
              <GridWrapper item xs={12} sm={6}>
                <TextField
                  label="Impressions"
                  fullWidth
                  value={impressionsInput}
                  onChange={(e) => setImpressionsInput(e.target.value)}
                  helperText="Total served impressions"
                />
              </GridWrapper>
              <GridWrapper item xs={12} sm={6}>
                <TextField
                  label="Clicks"
                  fullWidth
                  value={clicksInput}
                  onChange={(e) => setClicksInput(e.target.value)}
                  helperText="Total clicks"
                />
              </GridWrapper>
              <GridWrapper item xs={12} sm={6}>
                <TextField
                  label="Conversions"
                  fullWidth
                  value={conversionsInput}
                  onChange={(e) => setConversionsInput(e.target.value)}
                  helperText="Leads / purchases / installs"
                />
              </GridWrapper>
              <GridWrapper item xs={12}>
                <TextField
                  label="Revenue (optional)"
                  fullWidth
                  value={revenueInput}
                  onChange={(e) => setRevenueInput(e.target.value)}
                  helperText="For ROAS/ROI"
                />
              </GridWrapper>
            </GridWrapper>
            <Alert severity="info" sx={{ mt: 1 }}>
              Inputs are accepted in raw number format; commas are ignored.
            </Alert>
          </Paper>
        </GridWrapper>

        <GridWrapper item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
              Performance Result
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2"><strong>CTR:</strong> {percent(metrics.ctr)}</Typography>
              <Typography variant="body2"><strong>CPM:</strong> {fmt(metrics.cpm)} ({fmt(metrics.spend)} / {fmt(metrics.impressions)} impressions * 1000)</Typography>
              <Typography variant="body2"><strong>CPC:</strong> {fmt(metrics.cpc)}</Typography>
              <Typography variant="body2"><strong>CPA:</strong> {fmt(metrics.cpa)}</Typography>
              <Typography variant="body2"><strong>CVR:</strong> {percent(metrics.cvr)}</Typography>
              <Typography variant="body2"><strong>RPC:</strong> {fmt(metrics.rpc)} (revenue / clicks)</Typography>
              <Typography variant="body2">
                <strong>ROI:</strong> {metrics.roi === null ? '—' : `${(metrics.roi * 100).toFixed(2)}%`}
              </Typography>
            </Stack>
          </Paper>
        </GridWrapper>

        <GridWrapper item xs={12}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
              Pacing / Forecast
            </Typography>
            <GridWrapper container spacing={1.2}>
              <GridWrapper item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Target budget"
                  value={targetBudgetInput}
                  onChange={(e) => setTargetBudgetInput(e.target.value)}
                  helperText="e.g. 10000"
                />
              </GridWrapper>
              <GridWrapper item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Target CPC"
                  value={targetCpcInput}
                  onChange={(e) => setTargetCpcInput(e.target.value)}
                  helperText="Expected avg cost per click"
                />
              </GridWrapper>
              <GridWrapper item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Target CPM"
                  value={targetCpmInput}
                  onChange={(e) => setTargetCpmInput(e.target.value)}
                  helperText="Expected avg cost per 1000 impressions"
                />
              </GridWrapper>
              <GridWrapper item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Target CVR (%)"
                  value={targetCvrInput}
                  onChange={(e) => setTargetCvrInput(e.target.value)}
                  helperText="e.g. 1.2 means 1.2%"
                />
              </GridWrapper>
            </GridWrapper>

            <Stack spacing={1.1} sx={{ mt: 1.5 }}>
              <Typography variant="body2">
                Estimated clicks from target budget + CPC: <strong>{fmt(metrics.estCPCClicks, 0)}</strong>
              </Typography>
              <Typography variant="body2">
                Estimated impressions from target budget + CPM: <strong>{Math.round(metrics.estCPMImpressions ?? 0).toLocaleString()}</strong>
              </Typography>
              <Typography variant="body2" color={metrics.targetCvr ? 'text.secondary' : 'text.disabled'}>
                Estimated conversions from budget + CPC + target CVR: <strong>{fmt(metrics.estConversions, 0)}</strong>
              </Typography>
            </Stack>

            <Alert severity="warning" sx={{ mt: 1.3 }}>
              KPI formula preview (for checks): CTR = clicks/impressions, CPC = spend/clicks, CPA = spend/conversions, CPM = spend/impressions*1000.
            </Alert>
          </Paper>
        </GridWrapper>
      </GridWrapper>
    </Box>
  );
};

export default AdKpiCalculator;
