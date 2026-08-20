import React, { useCallback, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Divider,
  IconButton,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import {
  ContentCopy,
  Delete,
  Refresh,
} from '@mui/icons-material';
import GridWrapper from './GridWrapper';

const MAX_COUNT = 500;

const formatUuid = (value: string, withHyphens: boolean, upperCase: boolean) => {
  const normalized = withHyphens ? value : value.replace(/-/g, '');
  return upperCase ? normalized.toUpperCase() : normalized.toLowerCase();
};

const getRandomUuid = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0'));
  return `${hex[0]}${hex[1]}${hex[2]}${hex[3]}-${hex[4]}${hex[5]}-${hex[6]}${hex[7]}-${hex[8]}${hex[9]}-${hex[10]}${hex[11]}${hex[12]}${hex[13]}${hex[14]}${hex[15]}`;
};

const UuidGenerator: React.FC = () => {
  const theme = useTheme();
  const [countInput, setCountInput] = useState('10');
  const [withHyphens, setWithHyphens] = useState(true);
  const [upperCase, setUpperCase] = useState(false);
  const [uuids, setUuids] = useState<string[]>(() => Array.from({ length: 10 }, () => getRandomUuid()));
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const count = useMemo(() => {
    const parsed = Number.parseInt(countInput, 10);
    if (Number.isNaN(parsed)) return 1;
    return Math.min(MAX_COUNT, Math.max(1, parsed));
  }, [countInput]);

  const generateBatch = useCallback(() => {
    const next = Array.from({ length: count }, () => formatUuid(getRandomUuid(), withHyphens, upperCase));
    setUuids(next);
    setCopiedIndex(null);
  }, [count, withHyphens, upperCase]);

  const copyAll = async () => {
    if (uuids.length === 0) return;
    try {
      await navigator.clipboard.writeText(uuids.join('\n'));
    } catch (error) {
      console.error(error);
    }
  };

  const copySingle = async (value: string, index: number) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedIndex(index);
      window.setTimeout(() => setCopiedIndex(prev => (prev === index ? null : prev)), 1300);
    } catch (error) {
      console.error(error);
    }
  };

  const clear = () => {
    setUuids([]);
    setCopiedIndex(null);
  };

  return (
    <Box>
      <GridWrapper container spacing={2}>
        <GridWrapper item xs={12} md={4}>
          <Paper elevation={1} sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.2 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              生成参数
            </Typography>
            <TextField
              type="number"
              label="一次生成数量"
              value={countInput}
              onChange={(e) => setCountInput(e.target.value)}
              helperText={`最多 ${MAX_COUNT} 个`}
              inputProps={{ min: 1, max: MAX_COUNT }}
              fullWidth
            />
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Switch checked={withHyphens} onChange={(e) => setWithHyphens(e.target.checked)} />
                <Typography variant="body2" color="text.secondary">
                  带连字符
                </Typography>
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Switch checked={upperCase} onChange={(e) => setUpperCase(e.target.checked)} />
                <Typography variant="body2" color="text.secondary">
                  大写
                </Typography>
              </Stack>
            </Stack>
            <Button variant="contained" onClick={generateBatch} fullWidth>
              重新生成
            </Button>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button
                size="small"
                variant="outlined"
                onClick={copyAll}
                disabled={uuids.length === 0}
              >
                全部复制
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={clear}
                disabled={uuids.length === 0}
                startIcon={<Delete fontSize="small" />}
                color="error"
              >
                清空
              </Button>
            </Stack>
          </Paper>
        </GridWrapper>

        <GridWrapper item xs={12} md={8}>
          <Paper elevation={1} sx={{ p: 2, overflow: 'auto', maxHeight: 520 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                UUID 列表
              </Typography>
              <Typography variant="caption" color="text.secondary">
                格式: {withHyphens ? 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' : 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'}
              </Typography>
            </Stack>
            <Divider sx={{ mb: 1.25 }} />
            {uuids.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                点击“重新生成”开始生成 UUID。
              </Typography>
            ) : (
              <Stack spacing={0.75}>
                {uuids.map((item, index) => (
                  <Box key={`${item}-${index}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        flex: 1,
                        fontFamily: theme.typography.body2.fontFamily,
                        fontSize: '0.82rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item}
                    </Typography>
                    <Tooltip title={copiedIndex === index ? '已复制' : '复制'}>
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => copySingle(item, index)}
                          aria-label={`复制第 ${index + 1} 个 UUID`}
                        >
                          <ContentCopy sx={{ fontSize: 15 }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="刷新此项">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => {
                            const next = [...uuids];
                            next[index] = formatUuid(getRandomUuid(), withHyphens, upperCase);
                            setUuids(next);
                            setCopiedIndex(null);
                          }}
                          aria-label={`刷新第 ${index + 1} 个 UUID`}
                        >
                          <Refresh sx={{ fontSize: 15 }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </GridWrapper>
      </GridWrapper>
    </Box>
  );
};

export default UuidGenerator;
