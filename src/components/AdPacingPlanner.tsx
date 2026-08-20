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

type MetricInput = {
  totalBudget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  targetCpc: number;
  targetCpm: number;
  targetCvr: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const toDate = (value: string): Date | null => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map((part) => Number.parseInt(part, 10));
  if (!year || !month || !day) return null;
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day, 0, 0, 0, 0);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const dayIndex = (date: Date): number => Math.floor(date.getTime() / DAY_MS);

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const safeNum = (value: string): number => {
  const normalized = value.replace(/,/g, '').trim();
  if (!normalized) return 0;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
};

const pct = (value: number) => `${(value * 100).toFixed(2)}%`;
const toMoney = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 2 });

const AdPacingPlanner: React.FC = () => {
  const now = new Date().toISOString().slice(0, 10);

  const [startDate, setStartDate] = useState(() => now);
  const [endDate, setEndDate] = useState(() => {
    const next = new Date();
    next.setDate(next.getDate() + 29);
    return next.toISOString().slice(0, 10);
  });
  const [asOfDate, setAsOfDate] = useState(now);
  const [totalBudgetInput, setTotalBudgetInput] = useState('20000');
  const [spentInput, setSpentInput] = useState('8600');
  const [impressionsInput, setImpressionsInput] = useState('1265000');
  const [clicksInput, setClicksInput] = useState('4800');
  const [conversionsInput, setConversionsInput] = useState('540');
  const [targetCpcInput, setTargetCpcInput] = useState('1.45');
  const [targetCpmInput, setTargetCpmInput] = useState('9.8');
  const [targetCvrInput, setTargetCvrInput] = useState('2.4');

  const metrics = useMemo<MetricInput>(() => ({
    totalBudget: safeNum(totalBudgetInput),
    spent: safeNum(spentInput),
    impressions: safeNum(impressionsInput),
    clicks: safeNum(clicksInput),
    conversions: safeNum(conversionsInput),
    targetCpc: safeNum(targetCpcInput),
    targetCpm: safeNum(targetCpmInput),
    targetCvr: safeNum(targetCvrInput) / 100,
  }), [totalBudgetInput, spentInput, impressionsInput, clicksInput, conversionsInput, targetCpcInput, targetCpmInput, targetCvrInput]);

  const pacing = useMemo(() => {
    const start = toDate(startDate);
    const end = toDate(endDate);
    const asOf = toDate(asOfDate);
    if (!start || !end || !asOf) {
      return {
        isValid: false,
        message: 'Use valid dates.',
        totalDays: 0,
        elapsedDays: 0,
        remainingDays: 0,
        idealSpentByAsOf: 0,
        paceVariance: 0,
        requiredDaily: 0,
        projectedEndAtCurrentRate: 0,
      } as const;
    }

    if (start.getTime() > end.getTime()) {
      return {
        isValid: false,
        message: 'Start date must be before end date.',
        totalDays: 0,
        elapsedDays: 0,
        remainingDays: 0,
        idealSpentByAsOf: 0,
        paceVariance: 0,
        requiredDaily: 0,
        projectedEndAtCurrentRate: 0,
      } as const;
    }

    const totalDays = dayIndex(end) - dayIndex(start) + 1;
    const elapsedDays = clamp(dayIndex(asOf) - dayIndex(start) + 1, 0, totalDays);
    const remainingDays = clamp(totalDays - elapsedDays, 0, totalDays);
    const burnRate = elapsedDays > 0 ? metrics.spent / elapsedDays : 0;
    const idealSpentByAsOf = totalDays > 0 ? (metrics.totalBudget * elapsedDays) / totalDays : 0;
    const paceVariance = metrics.spent - idealSpentByAsOf;
    const remainingBudget = Math.max(metrics.totalBudget - metrics.spent, 0);
    const requiredDaily = remainingDays > 0 ? remainingBudget / remainingDays : 0;
    const projectedEndAtCurrentRate = metrics.spent + burnRate * remainingDays;
    return {
      isValid: true,
      message: '',
      totalDays,
      elapsedDays,
      remainingDays,
      idealSpentByAsOf,
      paceVariance,
      requiredDaily,
      projectedEndAtCurrentRate,
      burnRate,
      remainingBudget,
    } as const;
  }, [asOfDate, endDate, metrics, startDate]);

  const projections = useMemo(() => {
    if (!pacing.isValid) {
      return {
        additionalClicks: 0,
        additionalImpressions: 0,
        projectedClicks: metrics.clicks,
        projectedImpressions: metrics.impressions,
        projectedConversions: metrics.conversions,
        finalCtr: 0,
        finalCvr: 0,
        finalCpc: 0,
      };
    }

    const additionalClicks = metrics.targetCpc > 0 ? pacing.remainingBudget / metrics.targetCpc : 0;
    const additionalImpressions = metrics.targetCpm > 0 ? (pacing.remainingBudget / metrics.targetCpm) * 1000 : 0;
    const projectedClicks = metrics.clicks + additionalClicks;
    const projectedImpressions = metrics.impressions + additionalImpressions;
    const projectedConversions = metrics.conversions + projectedClicks * metrics.targetCvr;

    const finalCtr = projectedImpressions > 0 ? projectedClicks / projectedImpressions : 0;
    const finalCpc = projectedClicks > 0 ? metrics.totalBudget / projectedClicks : 0;
    const finalCvr = projectedClicks > 0 ? projectedConversions / projectedClicks : 0;

    return {
      additionalClicks,
      additionalImpressions,
      projectedClicks,
      projectedImpressions,
      projectedConversions,
      finalCtr,
      finalCvr,
      finalCpc,
    };
  }, [metrics, pacing]);

  const flightStatus = useMemo(() => {
    if (!pacing.isValid) {
      return { label: 'Invalid', text: pacing.message };
    }

    if (pacing.paceVariance > metrics.totalBudget * 0.02) {
      return { label: 'Ahead of schedule', text: `Ahead of plan by ${toMoney(pacing.paceVariance)}` };
    }
    if (pacing.paceVariance < -metrics.totalBudget * 0.02) {
      return { label: 'Behind schedule', text: `Behind plan by ${toMoney(Math.abs(pacing.paceVariance))}` };
    }
    return { label: 'On pace', text: 'Very close to the target pacing line.' };
  }, [metrics.totalBudget, pacing]);

  const copyRecommendation = `${[
    'Ad Flight Pacing',
    `Flight: ${startDate} -> ${endDate}`,
    `Total budget: ${toMoney(metrics.totalBudget)}`,
    `Required daily now: ${toMoney(pacing.requiredDaily || 0)}`,
    `Status: ${flightStatus.label} (${flightStatus.text})`,
  ].join('\n')}`;

  return (
    <Box>
      <GridWrapper container spacing={2}>
        <GridWrapper item xs={12} lg={7}>
          <Paper elevation={1} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.2 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Ad Pacing Planner
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Evaluate flight progress, pacing gap, and end-date forecast using spend and target media KPIs.
            </Typography>

            <GridWrapper container spacing={1.2}>
              <GridWrapper item xs={12} md={4}>
                <TextField
                  label="Start date"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </GridWrapper>
              <GridWrapper item xs={12} md={4}>
                <TextField
                  label="End date"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </GridWrapper>
              <GridWrapper item xs={12} md={4}>
                <TextField
                  label="As of date"
                  type="date"
                  value={asOfDate}
                  onChange={(event) => setAsOfDate(event.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </GridWrapper>
            </GridWrapper>

            <GridWrapper container spacing={1.2}>
              <GridWrapper item xs={12} md={4}>
                <TextField
                  label="Total budget"
                  value={totalBudgetInput}
                  onChange={(event) => setTotalBudgetInput(event.target.value)}
                  fullWidth
                  helperText="Flight target budget"
                />
              </GridWrapper>
              <GridWrapper item xs={12} md={4}>
                <TextField
                  label="Spent"
                  value={spentInput}
                  onChange={(event) => setSpentInput(event.target.value)}
                  fullWidth
                  helperText="Spend as of date"
                />
              </GridWrapper>
              <GridWrapper item xs={12} md={4}>
                <TextField
                  label="Impressions"
                  value={impressionsInput}
                  onChange={(event) => setImpressionsInput(event.target.value)}
                  fullWidth
                  helperText="So far"
                />
              </GridWrapper>
              <GridWrapper item xs={12} md={4}>
                <TextField
                  label="Clicks"
                  value={clicksInput}
                  onChange={(event) => setClicksInput(event.target.value)}
                  fullWidth
                  helperText="So far"
                />
              </GridWrapper>
              <GridWrapper item xs={12} md={4}>
                <TextField
                  label="Conversions"
                  value={conversionsInput}
                  onChange={(event) => setConversionsInput(event.target.value)}
                  fullWidth
                  helperText="So far"
                />
              </GridWrapper>
            </GridWrapper>

            <GridWrapper container spacing={1.2}>
              <GridWrapper item xs={12} md={4}>
                <TextField
                  label="Target CPC"
                  value={targetCpcInput}
                  onChange={(event) => setTargetCpcInput(event.target.value)}
                  fullWidth
                  helperText="Projected final CPC"
                />
              </GridWrapper>
              <GridWrapper item xs={12} md={4}>
                <TextField
                  label="Target CPM"
                  value={targetCpmInput}
                  onChange={(event) => setTargetCpmInput(event.target.value)}
                  fullWidth
                  helperText="Projected final CPM"
                />
              </GridWrapper>
              <GridWrapper item xs={12} md={4}>
                <TextField
                  label="Target CVR (%)"
                  value={targetCvrInput}
                  onChange={(event) => setTargetCvrInput(event.target.value)}
                  fullWidth
                  helperText="Projected final conversion rate"
                />
              </GridWrapper>
            </GridWrapper>

            {!pacing.isValid && <Alert severity="error">{pacing.message}</Alert>}
          </Paper>
        </GridWrapper>

        <GridWrapper item xs={12} lg={5}>
          <Paper elevation={1} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.2 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Output
            </Typography>
            <Stack spacing={1}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total flight days
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {pacing.isValid ? pacing.totalDays : '—'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Days elapsed / remaining
                </Typography>
                <Typography variant="body1">
                  {pacing.isValid ? `${pacing.elapsedDays} / ${pacing.remainingDays}` : '—'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Remaining budget
                </Typography>
                <Typography variant="body1" fontWeight={600} sx={{ color: pacing.isValid && pacing.remainingDays < 3 ? 'warning.main' : undefined }}>
                  {pacing.isValid ? toMoney(pacing.remainingBudget) : '—'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Required avg spend per remaining day
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {pacing.isValid ? toMoney(pacing.requiredDaily) : '—'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Projected end spend @ current pace
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {pacing.isValid ? toMoney(pacing.projectedEndAtCurrentRate) : '—'}
                </Typography>
              </Box>
              <Alert severity={pacing.paceVariance > 0 ? 'success' : pacing.paceVariance < 0 ? 'error' : 'info'}>
                {flightStatus.label}: {flightStatus.text}
              </Alert>
              <Typography variant="body2" color="text.secondary">
                Ideal spend by date
              </Typography>
              <Typography variant="body1">
                {pacing.isValid ? toMoney(pacing.idealSpentByAsOf) : '—'}
              </Typography>
            </Stack>
          </Paper>
        </GridWrapper>
      </GridWrapper>

      <GridWrapper container spacing={2} sx={{ mt: 2 }}>
        <GridWrapper item xs={12}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
              Forecast To Flight End
            </Typography>
            <GridWrapper container spacing={1.2}>
              <GridWrapper item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 1.4 }}>
                  <Typography variant="caption" color="text.secondary">Additional clicks</Typography>
                  <Typography variant="h6">{Math.round(projections.additionalClicks).toLocaleString()}</Typography>
                </Paper>
              </GridWrapper>
              <GridWrapper item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 1.4 }}>
                  <Typography variant="caption" color="text.secondary">Additional impressions</Typography>
                  <Typography variant="h6">{Math.round(projections.additionalImpressions).toLocaleString()}</Typography>
                </Paper>
              </GridWrapper>
              <GridWrapper item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 1.4 }}>
                  <Typography variant="caption" color="text.secondary">Projected final CPC</Typography>
                  <Typography variant="h6">{projections.finalCpc > 0 ? toMoney(projections.finalCpc) : '—'}</Typography>
                </Paper>
              </GridWrapper>
              <GridWrapper item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 1.4 }}>
                  <Typography variant="caption" color="text.secondary">Projected CTR</Typography>
                  <Typography variant="h6">{pct(projections.finalCtr)}</Typography>
                </Paper>
              </GridWrapper>
              <GridWrapper item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 1.4 }}>
                  <Typography variant="caption" color="text.secondary">Projected CVR</Typography>
                  <Typography variant="h6">{pct(projections.finalCvr)}</Typography>
                </Paper>
              </GridWrapper>
              <GridWrapper item xs={12} md={4}>
                <Paper variant="outlined" sx={{ p: 1.4 }}>
                  <Typography variant="caption" color="text.secondary">Projected conversions</Typography>
                  <Typography variant="h6">{Math.round(projections.projectedConversions).toLocaleString()}</Typography>
                </Paper>
              </GridWrapper>
            </GridWrapper>
            <Alert severity="info" sx={{ mt: 1.5 }}>
              Forecast is a pacing approximation using target CPC/CPM/CVR and assumes steady delivery for the remaining days.
              Copy text:
              <span style={{ marginLeft: 4 }}>{copyRecommendation}</span>
            </Alert>
          </Paper>
        </GridWrapper>
      </GridWrapper>
    </Box>
  );
};

export default AdPacingPlanner;
