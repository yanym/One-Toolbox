import React, { useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { Clear, ContentCopy, RestartAlt } from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const SAMPLE_MARKDOWN = `# Markdown Preview

Write **Markdown** on the left and see the rendered result on the right.

## GitHub-flavored Markdown

- [x] Live preview
- [x] Tables
- [ ] Ship the next idea

| Tool | Status |
| --- | --- |
| Timestamp converter | Ready |
| Markdown previewer | Ready |

> Everything stays in your browser.

\`\`\`ts
const timestamp = Date.now();
console.log(new Date(timestamp).toISOString());
\`\`\`
`;

const MarkdownPreviewer: React.FC = () => {
  const theme = useTheme();
  const [markdown, setMarkdown] = useState(SAMPLE_MARKDOWN);
  const [copied, setCopied] = useState(false);

  const copyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Typography variant="body2" color="text.secondary">
          GitHub-flavored Markdown with tables, task lists, links, quotes, and fenced code.
        </Typography>
        <Stack direction="row" spacing={0.5}>
          <Tooltip title={copied ? 'Copied!' : 'Copy Markdown'}>
            <IconButton size="small" onClick={copyMarkdown} color={copied ? 'success' : 'default'}>
              <ContentCopy fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Restore sample">
            <IconButton size="small" onClick={() => setMarkdown(SAMPLE_MARKDOWN)}>
              <RestartAlt fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Clear">
            <IconButton size="small" color="error" onClick={() => setMarkdown('')}>
              <Clear fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) minmax(0, 1fr)' },
          gap: 2,
          minHeight: 620,
        }}
      >
        <Paper variant="outlined" sx={{ display: 'flex', flexDirection: 'column', minHeight: { xs: 420, lg: 620 }, overflow: 'hidden' }}>
          <Box sx={{ px: 2, py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" fontWeight={600}>Markdown</Typography>
          </Box>
          <TextField
            multiline
            fullWidth
            value={markdown}
            onChange={event => setMarkdown(event.target.value)}
            placeholder="Type Markdown here..."
            variant="standard"
            InputProps={{
              disableUnderline: true,
              sx: {
                alignItems: 'flex-start',
                height: '100%',
                p: 2,
                fontFamily: 'monospace',
                fontSize: '0.86rem',
                lineHeight: 1.6,
              },
            }}
            sx={{
              flex: 1,
              '& .MuiInputBase-root': { height: '100%' },
              '& textarea': { height: '100% !important', overflow: 'auto !important' },
            }}
          />
        </Paper>

        <Paper variant="outlined" sx={{ minHeight: { xs: 420, lg: 620 }, overflow: 'hidden' }}>
          <Box sx={{ px: 2, py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" fontWeight={600}>Preview</Typography>
          </Box>
          <Box
            sx={{
              p: 2.5,
              height: { xs: 420, lg: 568 },
              overflow: 'auto',
              lineHeight: 1.65,
              '& h1, & h2, & h3, & h4': { lineHeight: 1.25, mt: 2.5, mb: 1 },
              '& h1:first-of-type, & h2:first-of-type': { mt: 0 },
              '& h1': { fontSize: '1.8rem', pb: 1, borderBottom: '1px solid', borderColor: 'divider' },
              '& h2': { fontSize: '1.4rem', pb: 0.75, borderBottom: '1px solid', borderColor: 'divider' },
              '& h3': { fontSize: '1.15rem' },
              '& p': { my: 1.25 },
              '& a': { color: 'primary.main' },
              '& blockquote': {
                m: 0,
                my: 1.5,
                pl: 2,
                color: 'text.secondary',
                borderLeft: '4px solid',
                borderColor: 'primary.main',
              },
              '& code': {
                px: 0.6,
                py: 0.2,
                borderRadius: 0.75,
                bgcolor: theme.palette.mode === 'dark' ? '#21262d' : '#eff1f3',
                fontSize: '0.85em',
              },
              '& pre': {
                p: 2,
                overflow: 'auto',
                borderRadius: 1,
                bgcolor: theme.palette.mode === 'dark' ? '#0d1117' : '#f6f8fa',
                border: '1px solid',
                borderColor: 'divider',
              },
              '& pre code': { p: 0, bgcolor: 'transparent' },
              '& table': { width: '100%', borderCollapse: 'collapse', my: 2 },
              '& th, & td': { p: 1, border: '1px solid', borderColor: 'divider', textAlign: 'left' },
              '& th': { bgcolor: theme.palette.action.hover, fontWeight: 700 },
              '& img': { maxWidth: '100%' },
              '& ul, & ol': { pl: 3 },
              '& input[type="checkbox"]': { mr: 0.75 },
            }}
          >
            {markdown.trim() ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
            ) : (
              <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }} spacing={1}>
                <Typography color="text.secondary">Preview is empty</Typography>
                <Button size="small" onClick={() => setMarkdown(SAMPLE_MARKDOWN)}>Load sample</Button>
              </Stack>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default MarkdownPreviewer;
