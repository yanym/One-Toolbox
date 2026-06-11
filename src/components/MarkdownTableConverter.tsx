import React, { ChangeEvent, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  ArrowBack,
  ArrowForward,
  ContentCopy,
  Download,
  FileUpload,
  RestartAlt,
} from '@mui/icons-material';
import * as XLSX from 'xlsx';

type TableData = string[][];

const SAMPLE_DATA: TableData = [
  ['Name', 'Role', 'Location', 'Active'],
  ['Ada Lovelace', 'Engineer', 'London', 'Yes'],
  ['Grace Hopper', 'Computer Scientist', 'New York', 'Yes'],
  ['Edsger Dijkstra', 'Researcher', 'Nuenen', 'No'],
];

function escapeMarkdownCell(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\r?\n/g, '<br>');
}

function tableToMarkdown(rows: TableData): string {
  if (!rows.length) return '';
  const width = Math.max(...rows.map(row => row.length), 1);
  const normalized = rows.map(row => Array.from({ length: width }, (_, index) => String(row[index] ?? '')));
  const header = normalized[0];
  const body = normalized.slice(1);
  const renderRow = (row: string[]) => `| ${row.map(escapeMarkdownCell).join(' | ')} |`;

  return [
    renderRow(header),
    renderRow(header.map(() => '---')),
    ...body.map(renderRow),
  ].join('\n');
}

function splitMarkdownRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  const cells: string[] = [];
  let current = '';
  let escaped = false;

  for (const char of trimmed) {
    if (escaped) {
      current += char;
      escaped = false;
    } else if (char === '\\') {
      escaped = true;
    } else if (char === '|') {
      cells.push(current.trim().replace(/<br\s*\/?>/gi, '\n'));
      current = '';
    } else {
      current += char;
    }
  }

  cells.push(current.trim().replace(/<br\s*\/?>/gi, '\n'));
  return cells;
}

function markdownToTable(markdown: string): TableData {
  const lines = markdown
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.includes('|'));

  if (lines.length < 2) {
    throw new Error('Add a Markdown table with a header row and separator row.');
  }

  const rows = lines.map(splitMarkdownRow);
  const separatorIndex = rows.findIndex(row =>
    row.length > 0 && row.every(cell => /^:?-{3,}:?$/.test(cell.trim()))
  );

  if (separatorIndex < 1) {
    throw new Error('The Markdown table needs a separator row such as | --- | --- |.');
  }

  return [rows[separatorIndex - 1], ...rows.slice(separatorIndex + 1)];
}

function tableToTabText(rows: TableData): string {
  return rows.map(row => row.join('\t')).join('\n');
}

function parseCsv(value: string): TableData {
  const rows: TableData = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < value.length; index++) {
    const char = value[index];
    const next = value[index + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(cell);
      cell = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

function tabTextToTable(value: string): TableData {
  const lines = value.split(/\r?\n/).filter((line, index, all) => line.length > 0 || index < all.length - 1);
  if (!lines.length) return [];

  if (lines.some(line => line.includes('\t'))) {
    return lines.map(line => line.split('\t'));
  }

  return parseCsv(value);
}

const MarkdownTableConverter: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialMarkdown = tableToMarkdown(SAMPLE_DATA);
  const [sheetText, setSheetText] = useState(tableToTabText(SAMPLE_DATA));
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [fileName, setFileName] = useState('toolbox-table');
  const [message, setMessage] = useState<{ severity: 'success' | 'error'; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const markdownTable = useMemo(() => {
    try {
      return { rows: markdownToTable(markdown), error: '' };
    } catch (error: any) {
      return { rows: [] as TableData, error: error.message as string };
    }
  }, [markdown]);

  const sheetStats = useMemo(() => {
    try {
      const rows = tabTextToTable(sheetText);
      return { rows: rows.length, columns: Math.max(0, ...rows.map(row => row.length)) };
    } catch {
      return { rows: 0, columns: 0 };
    }
  }, [sheetText]);

  const convertSheetToMarkdown = () => {
    try {
      const rows = tabTextToTable(sheetText);
      if (!rows.length) throw new Error('Paste spreadsheet cells or import a workbook first.');
      setMarkdown(tableToMarkdown(rows));
      setMessage({ severity: 'success', text: `Converted ${rows.length} rows to Markdown.` });
    } catch (error: any) {
      setMessage({ severity: 'error', text: error.message });
    }
  };

  const convertMarkdownToSheet = () => {
    try {
      const rows = markdownToTable(markdown);
      setSheetText(tableToTabText(rows));
      setMessage({ severity: 'success', text: `Converted ${rows.length} rows to spreadsheet data.` });
    } catch (error: any) {
      setMessage({ severity: 'error', text: error.message });
    }
  };

  const importWorkbook = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      let rows: TableData;
      let sheetName = 'Imported data';

      if (/\.(xlsx|xls)$/i.test(file.name)) {
        const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', raw: false });
        sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' }) as TableData;
      } else {
        const text = await file.text();
        rows = file.name.toLowerCase().endsWith('.tsv')
          ? text.split(/\r?\n/).filter(Boolean).map(row => row.split('\t'))
          : parseCsv(text);
      }

      if (!rows.length) throw new Error('The first worksheet is empty.');

      setSheetText(tableToTabText(rows));
      setMarkdown(tableToMarkdown(rows));
      setFileName(file.name.replace(/\.[^.]+$/, '') || 'toolbox-table');
      setMessage({ severity: 'success', text: `Imported "${sheetName}" with ${rows.length} rows.` });
    } catch (error: any) {
      setMessage({ severity: 'error', text: error.message || 'Could not read that spreadsheet.' });
    }
  };

  const downloadExcel = () => {
    try {
      const rows = markdownToTable(markdown);
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Table');
      XLSX.writeFile(workbook, `${fileName.trim() || 'toolbox-table'}.xlsx`);
      setMessage({ severity: 'success', text: 'Excel workbook downloaded.' });
    } catch (error: any) {
      setMessage({ severity: 'error', text: error.message });
    }
  };

  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const reset = () => {
    setSheetText(tableToTabText(SAMPLE_DATA));
    setMarkdown(initialMarkdown);
    setFileName('toolbox-table');
    setMessage(null);
  };

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={1.5} sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <input
            ref={fileInputRef}
            hidden
            type="file"
            accept=".xlsx,.xls,.csv,.tsv"
            onChange={importWorkbook}
          />
          <Button variant="contained" size="small" startIcon={<FileUpload />} onClick={() => fileInputRef.current?.click()}>
            Import Excel / CSV
          </Button>
          <Button variant="outlined" size="small" startIcon={<Download />} onClick={downloadExcel} disabled={!!markdownTable.error}>
            Download XLSX
          </Button>
          <TextField
            size="small"
            value={fileName}
            onChange={event => setFileName(event.target.value)}
            aria-label="Export filename"
            sx={{ width: 190 }}
            InputProps={{ endAdornment: <Typography variant="caption" color="text.secondary">.xlsx</Typography> }}
          />
        </Stack>
        <Tooltip title="Restore sample table">
          <IconButton size="small" onClick={reset}>
            <RestartAlt />
          </IconButton>
        </Tooltip>
      </Stack>

      {message && <Alert severity={message.severity} onClose={() => setMessage(null)} sx={{ mb: 2 }}>{message.text}</Alert>}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) auto minmax(0, 1fr)' },
          gap: 1.5,
          alignItems: 'stretch',
        }}
      >
        <Paper variant="outlined" sx={{ overflow: 'hidden', minHeight: 390 }}>
          <Box sx={{ px: 2, py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="body2" fontWeight={600}>Spreadsheet cells</Typography>
                <Typography variant="caption" color="text.secondary">Paste directly from Excel or Sheets</Typography>
              </Box>
              <Chip size="small" variant="outlined" label={`${sheetStats.rows} x ${sheetStats.columns}`} />
            </Stack>
          </Box>
          <TextField
            multiline
            fullWidth
            value={sheetText}
            onChange={event => setSheetText(event.target.value)}
            placeholder={'Name\tRole\nAda\tEngineer'}
            variant="standard"
            InputProps={{
              disableUnderline: true,
              sx: { alignItems: 'flex-start', p: 2, fontFamily: 'monospace', fontSize: '0.82rem', lineHeight: 1.6 },
            }}
            sx={{ '& textarea': { minHeight: '315px !important', whiteSpace: 'pre', overflow: 'auto !important' } }}
          />
        </Paper>

        <Stack
          direction={{ xs: 'row', lg: 'column' }}
          justifyContent="center"
          alignItems="center"
          spacing={1}
        >
          <Tooltip title="Spreadsheet to Markdown">
            <IconButton color="primary" onClick={convertSheetToMarkdown} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <ArrowForward sx={{ display: { xs: 'none', lg: 'block' } }} />
              <ArrowBack sx={{ display: { xs: 'block', lg: 'none' }, transform: 'rotate(-90deg)' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Markdown to spreadsheet">
            <IconButton color="primary" onClick={convertMarkdownToSheet} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <ArrowBack sx={{ display: { xs: 'none', lg: 'block' } }} />
              <ArrowForward sx={{ display: { xs: 'block', lg: 'none' }, transform: 'rotate(90deg)' }} />
            </IconButton>
          </Tooltip>
        </Stack>

        <Paper variant="outlined" sx={{ overflow: 'hidden', minHeight: 390 }}>
          <Box sx={{ px: 2, py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="body2" fontWeight={600}>Markdown table</Typography>
                <Typography variant="caption" color={markdownTable.error ? 'error' : 'text.secondary'}>
                  {markdownTable.error || `${markdownTable.rows.length} rows ready`}
                </Typography>
              </Box>
              <Tooltip title={copied ? 'Copied!' : 'Copy Markdown'}>
                <IconButton size="small" onClick={copyMarkdown} color={copied ? 'success' : 'default'}>
                  <ContentCopy fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
          <TextField
            multiline
            fullWidth
            value={markdown}
            onChange={event => setMarkdown(event.target.value)}
            placeholder="| Column | Column |"
            variant="standard"
            error={!!markdownTable.error}
            InputProps={{
              disableUnderline: true,
              sx: { alignItems: 'flex-start', p: 2, fontFamily: 'monospace', fontSize: '0.82rem', lineHeight: 1.6 },
            }}
            sx={{ '& textarea': { minHeight: '315px !important', whiteSpace: 'pre', overflow: 'auto !important' } }}
          />
        </Paper>
      </Box>

      {!markdownTable.error && markdownTable.rows.length > 0 && (
        <Paper variant="outlined" sx={{ mt: 2, overflow: 'auto' }}>
          <Box sx={{ px: 2, py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" fontWeight={600}>Table preview</Typography>
          </Box>
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
            <Box component="thead">
              <Box component="tr">
                {markdownTable.rows[0].map((cell, index) => (
                  <Box component="th" key={index} sx={{ px: 1.5, py: 1, textAlign: 'left', borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover', fontSize: '0.8rem' }}>
                    {cell}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box component="tbody">
              {markdownTable.rows.slice(1).map((row, rowIndex) => (
                <Box component="tr" key={rowIndex}>
                  {markdownTable.rows[0].map((_, cellIndex) => (
                    <Box component="td" key={cellIndex} sx={{ px: 1.5, py: 1, borderBottom: '1px solid', borderColor: 'divider', fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
                      {row[cellIndex] ?? ''}
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default MarkdownTableConverter;
