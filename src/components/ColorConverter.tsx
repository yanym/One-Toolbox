import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Stack,
  TextField,
  Slider,
  Chip,
  Divider,
  Alert,
  useTheme,
} from '@mui/material';
import GridWrapper from './GridWrapper';
import { ContentCopy } from '@mui/icons-material';

// ── Color math ──────────────────────────────────────────────────────────────

interface RGBA { r: number; g: number; b: number; a: number; }
interface HSL { h: number; s: number; l: number; }

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function parseColor(input: string): RGBA | null {
  const s = input.trim().toLowerCase();
  if (!s) return null;

  // hex #rgb, #rgba, #rrggbb, #rrggbbaa
  const hex = s.match(/^#?([0-9a-f]{3,8})$/);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split('').map(c => c + c).join('') + 'ff';
    else if (h.length === 4) h = h.split('').map(c => c + c).join('');
    else if (h.length === 6) h = h + 'ff';
    else if (h.length !== 8) return null;
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: parseInt(h.slice(6, 8), 16) / 255,
    };
  }

  const rgb = s.match(/^rgba?\(\s*([\d.]+)\s*[, ]\s*([\d.]+)\s*[, ]\s*([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/);
  if (rgb) {
    const a = rgb[4] ? (rgb[4].endsWith('%') ? parseFloat(rgb[4]) / 100 : parseFloat(rgb[4])) : 1;
    return {
      r: clamp(Math.round(parseFloat(rgb[1])), 0, 255),
      g: clamp(Math.round(parseFloat(rgb[2])), 0, 255),
      b: clamp(Math.round(parseFloat(rgb[3])), 0, 255),
      a: clamp(a, 0, 1),
    };
  }

  const hsl = s.match(/^hsla?\(\s*([\d.]+)(?:deg)?\s*[, ]\s*([\d.]+)%\s*[, ]\s*([\d.]+)%(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/);
  if (hsl) {
    const a = hsl[4] ? (hsl[4].endsWith('%') ? parseFloat(hsl[4]) / 100 : parseFloat(hsl[4])) : 1;
    const rgb = hslToRgb({
      h: parseFloat(hsl[1]),
      s: parseFloat(hsl[2]),
      l: parseFloat(hsl[3]),
    });
    return { ...rgb, a: clamp(a, 0, 1) };
  }
  return null;
}

function rgbToHsl({ r, g, b }: Omit<RGBA, 'a'>): HSL {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = (gn - bn) / d + (gn < bn ? 6 : 0); break;
      case gn: h = (bn - rn) / d + 2; break;
      case bn: h = (rn - gn) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb({ h, s, l }: HSL): Omit<RGBA, 'a'> {
  const hn = ((h % 360) + 360) % 360 / 360;
  const sn = clamp(s, 0, 100) / 100;
  const ln = clamp(l, 0, 100) / 100;
  if (sn === 0) {
    const v = Math.round(ln * 255);
    return { r: v, g: v, b: v };
  }
  const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
  const p = 2 * ln - q;
  const hue2rgb = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return {
    r: Math.round(hue2rgb(hn + 1 / 3) * 255),
    g: Math.round(hue2rgb(hn) * 255),
    b: Math.round(hue2rgb(hn - 1 / 3) * 255),
  };
}

const toHex = ({ r, g, b, a }: RGBA, withAlpha = false): string => {
  const hex = (v: number) => v.toString(16).padStart(2, '0');
  return '#' + hex(r) + hex(g) + hex(b) + (withAlpha && a < 1 ? hex(Math.round(a * 255)) : '');
};

// WCAG relative luminance
const relLuminance = ({ r, g, b }: RGBA): number => {
  const [rs, gs, bs] = [r, g, b].map(v => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

const contrastRatio = (a: RGBA, b: RGBA): number => {
  const la = relLuminance(a), lb = relLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
};

// ── Component ───────────────────────────────────────────────────────────────

const ColorConverter: React.FC = () => {
  const theme = useTheme();
  const [input, setInput] = useState<string>('#4361ee');
  const [rgba, setRgba] = useState<RGBA>({ r: 67, g: 97, b: 238, a: 1 });
  const [error, setError] = useState<string>('');

  const handleInputChange = (v: string) => {
    setInput(v);
    const parsed = parseColor(v);
    if (parsed) {
      setRgba(parsed);
      setError('');
    } else if (v.trim()) {
      setError('Unrecognized color format');
    } else {
      setError('');
    }
  };

  const updateRgba = (next: RGBA) => {
    setRgba(next);
    setInput(toHex(next, next.a < 1));
    setError('');
  };

  const hsl = useMemo(() => rgbToHsl(rgba), [rgba]);

  const hex = useMemo(() => toHex(rgba), [rgba]);
  const hexAlpha = useMemo(() => toHex(rgba, true), [rgba]);
  const rgbStr = useMemo(
    () => rgba.a < 1
      ? `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a.toFixed(2)})`
      : `rgb(${rgba.r}, ${rgba.g}, ${rgba.b})`,
    [rgba]
  );
  const hslStr = useMemo(
    () => rgba.a < 1
      ? `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${rgba.a.toFixed(2)})`
      : `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
    [hsl, rgba.a]
  );

  const whiteContrast = useMemo(() => contrastRatio(rgba, { r: 255, g: 255, b: 255, a: 1 }), [rgba]);
  const blackContrast = useMemo(() => contrastRatio(rgba, { r: 0, g: 0, b: 0, a: 1 }), [rgba]);

  const wcagRating = (ratio: number): { label: string; color: 'success' | 'warning' | 'error' } => {
    if (ratio >= 7) return { label: 'AAA', color: 'success' };
    if (ratio >= 4.5) return { label: 'AA', color: 'success' };
    if (ratio >= 3) return { label: 'AA Large', color: 'warning' };
    return { label: 'Fail', color: 'error' };
  };

  const copy = useCallback(async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch {}
  }, []);

  const onHslChange = (key: keyof HSL, val: number) => {
    const newHsl = { ...hsl, [key]: val };
    const newRgb = hslToRgb(newHsl);
    updateRgba({ ...newRgb, a: rgba.a });
  };

  const swatchTextColor = whiteContrast >= blackContrast ? '#ffffff' : '#000000';

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Color Converter
      </Typography>

      <GridWrapper container spacing={2}>
        <GridWrapper item xs={12} md={5}>
          <Paper elevation={1} sx={{ p: 2 }}>
            <Box
              sx={{
                height: 140,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                background: `
                  linear-gradient(45deg, #ccc 25%, transparent 25%),
                  linear-gradient(-45deg, #ccc 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, #ccc 75%),
                  linear-gradient(-45deg, transparent 75%, #ccc 75%)
                `,
                backgroundSize: '16px 16px',
                backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                overflow: 'hidden',
                mb: 2,
              }}
            >
              <Box
                sx={{
                  height: '100%',
                  bgcolor: `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography sx={{ color: swatchTextColor, fontFamily: 'monospace', fontWeight: 600 }}>
                  {hex.toUpperCase()}
                </Typography>
              </Box>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
              <TextField
                type="color"
                value={hex}
                onChange={(e) => handleInputChange(e.target.value)}
                sx={{ width: 56, '& input': { p: 0.5, height: 36, cursor: 'pointer' } }}
              />
              <TextField
                fullWidth
                size="small"
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="#hex, rgb(…), hsl(…)"
                error={!!error}
                helperText={error || ' '}
                InputProps={{ sx: { fontFamily: 'monospace' } }}
              />
            </Stack>

            <Divider sx={{ my: 1 }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>RGB</Typography>
            {(['r', 'g', 'b'] as const).map(ch => (
              <Stack key={ch} direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                <Typography sx={{ width: 20, fontFamily: 'monospace', fontSize: '0.85rem' }}>{ch.toUpperCase()}</Typography>
                <Slider
                  size="small"
                  value={rgba[ch]}
                  min={0}
                  max={255}
                  onChange={(_, v) => updateRgba({ ...rgba, [ch]: v as number })}
                />
                <TextField
                  size="small"
                  type="number"
                  value={rgba[ch]}
                  onChange={(e) => updateRgba({ ...rgba, [ch]: clamp(parseInt(e.target.value) || 0, 0, 255) })}
                  inputProps={{ min: 0, max: 255 }}
                  sx={{ width: 80 }}
                />
              </Stack>
            ))}

            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
              <Typography sx={{ width: 20, fontFamily: 'monospace', fontSize: '0.85rem' }}>A</Typography>
              <Slider
                size="small"
                value={rgba.a}
                min={0}
                max={1}
                step={0.01}
                onChange={(_, v) => updateRgba({ ...rgba, a: v as number })}
              />
              <TextField
                size="small"
                type="number"
                value={rgba.a}
                onChange={(e) => updateRgba({ ...rgba, a: clamp(parseFloat(e.target.value) || 0, 0, 1) })}
                inputProps={{ min: 0, max: 1, step: 0.01 }}
                sx={{ width: 80 }}
              />
            </Stack>

            <Divider sx={{ my: 1 }} />

            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>HSL</Typography>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
              <Typography sx={{ width: 20, fontFamily: 'monospace', fontSize: '0.85rem' }}>H</Typography>
              <Slider size="small" value={hsl.h} min={0} max={360} onChange={(_, v) => onHslChange('h', v as number)} />
              <TextField size="small" type="number" value={hsl.h} onChange={(e) => onHslChange('h', clamp(parseInt(e.target.value) || 0, 0, 360))} sx={{ width: 80 }} />
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
              <Typography sx={{ width: 20, fontFamily: 'monospace', fontSize: '0.85rem' }}>S</Typography>
              <Slider size="small" value={hsl.s} min={0} max={100} onChange={(_, v) => onHslChange('s', v as number)} />
              <TextField size="small" type="number" value={hsl.s} onChange={(e) => onHslChange('s', clamp(parseInt(e.target.value) || 0, 0, 100))} sx={{ width: 80 }} />
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography sx={{ width: 20, fontFamily: 'monospace', fontSize: '0.85rem' }}>L</Typography>
              <Slider size="small" value={hsl.l} min={0} max={100} onChange={(_, v) => onHslChange('l', v as number)} />
              <TextField size="small" type="number" value={hsl.l} onChange={(e) => onHslChange('l', clamp(parseInt(e.target.value) || 0, 0, 100))} sx={{ width: 80 }} />
            </Stack>
          </Paper>
        </GridWrapper>

        <GridWrapper item xs={12} md={7}>
          <Stack spacing={2}>
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>Formats</Typography>
              <Stack spacing={1}>
                {[
                  { label: 'HEX', value: hex },
                  { label: 'HEX+Alpha', value: hexAlpha },
                  { label: 'RGB', value: rgbStr },
                  { label: 'HSL', value: hslStr },
                  { label: 'CSS var', value: `--color: ${hex};` },
                ].map(f => (
                  <Stack key={f.label} direction="row" spacing={1} alignItems="center">
                    <Chip label={f.label} size="small" sx={{ minWidth: 90, fontFamily: 'monospace' }} />
                    <Box
                      sx={{
                        flexGrow: 1,
                        p: 1,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'background.default',
                        fontFamily: 'monospace',
                        fontSize: '0.85rem',
                      }}
                    >
                      {f.value}
                    </Box>
                    <Tooltip title="Copy">
                      <IconButton size="small" onClick={() => copy(f.value)}>
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                ))}
              </Stack>
            </Paper>

            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
                WCAG Contrast
              </Typography>
              <Stack spacing={1}>
                {[
                  { label: 'On white', bg: '#ffffff', fg: '#000000', ratio: whiteContrast, swatchBg: '#ffffff' },
                  { label: 'On black', bg: '#000000', fg: '#ffffff', ratio: blackContrast, swatchBg: '#000000' },
                ].map(c => {
                  const rating = wcagRating(c.ratio);
                  return (
                    <Stack key={c.label} direction="row" spacing={1} alignItems="center">
                      <Box
                        sx={{
                          minWidth: 120,
                          px: 1.5,
                          py: 1,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: c.swatchBg,
                          color: `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`,
                          fontFamily: 'monospace',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          textAlign: 'center',
                        }}
                      >
                        Sample
                      </Box>
                      <Typography variant="body2" sx={{ minWidth: 80 }}>{c.label}</Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', minWidth: 60 }}>
                        {c.ratio.toFixed(2)}:1
                      </Typography>
                      <Chip label={rating.label} color={rating.color} size="small" />
                    </Stack>
                  );
                })}
              </Stack>
              <Alert severity="info" sx={{ mt: 1.5, py: 0.5 }}>
                AA: 4.5:1 (normal), 3:1 (large). AAA: 7:1 (normal), 4.5:1 (large).
              </Alert>
            </Paper>
          </Stack>
        </GridWrapper>
      </GridWrapper>
    </Box>
  );
};

export default ColorConverter;
