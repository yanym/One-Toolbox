import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import {
  Box,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  ChevronRight,
  Close,
  ContentCopy,
  KeyboardArrowDown,
  KeyboardArrowUp,
  OpenInFull,
  UnfoldLess,
} from '@mui/icons-material';

type JsonType = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';

interface JsonNode {
  id: string;
  parentId: string | null;
  key: string;
  path: string;
  level: number;
  type: JsonType;
  value: any;
  summary: string;
  searchable: string;
  isContainer: boolean;
}

interface PendingJsonNode {
  value: any;
  id: string;
  parentId: string | null;
  key: string;
  path: string;
  level: number;
}

interface JsonViewerProps {
  data: any;
  sourceSize?: number;
  height?: number | string;
}

const ROW_HEIGHT = 34;
const SEARCH_BATCH_SIZE = 5000;
const INDEX_BATCH_SIZE = 10000;

const getType = (value: any): JsonType => {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value as JsonType;
};

const getSummary = (value: any, type: JsonType): string => {
  if (type === 'object') return `{${Object.keys(value).length}}`;
  if (type === 'array') return `[${value.length}]`;
  if (type === 'string') {
    const serialized = JSON.stringify(value);
    return serialized.length > 500 ? `${serialized.slice(0, 500)}…` : serialized;
  }
  if (type === 'null') return 'null';
  return String(value);
};

const escapePointerToken = (value: string) => value.replace(/~/g, '~0').replace(/\//g, '~1');

const indexNode = (current: PendingJsonNode, nodes: JsonNode[], stack: PendingJsonNode[]) => {
    const type = getType(current.value);
    const isContainer = type === 'object' || type === 'array';
    const summary = getSummary(current.value, type);

    nodes.push({
      ...current,
      type,
      summary,
      isContainer,
      searchable: `${current.key}\n${current.path}`.toLocaleLowerCase(),
    });

    if (!isContainer) return;

    const entries = type === 'array'
      ? current.value.map((value: any, index: number) => [String(index), value] as const)
      : Object.entries(current.value);

    for (let index = entries.length - 1; index >= 0; index--) {
      const [key, value] = entries[index];
      const pointerKey = escapePointerToken(key);
      const isArrayItem = type === 'array';
      stack.push({
        value,
        id: `${current.id}/${pointerKey}`,
        parentId: current.id,
        key: isArrayItem ? `[${key}]` : key,
        path: isArrayItem ? `${current.path}[${key}]` : `${current.path}.${key}`,
        level: current.level + 1,
      });
    }
};

const JsonViewer: React.FC<JsonViewerProps> = ({ data, sourceSize = 0, height = 620 }) => {
  const theme = useTheme();
  const resolvedHeight = typeof height === 'number' ? `${height}px` : height;
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const scrollTopRef = useRef(0);
  const matchSourceRef = useRef<JsonNode[] | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => new Set(['$']));
  const [searchTerm, setSearchTerm] = useState('');
  const [matchIndexes, setMatchIndexes] = useState<number[]>([]);
  const [activeMatch, setActiveMatch] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [pendingScrollId, setPendingScrollId] = useState<string | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(400);
  const [nodes, setNodes] = useState<JsonNode[]>([]);
  const [isIndexing, setIsIndexing] = useState(false);
  const [theaterOpen, setTheaterOpen] = useState(false);

  useEffect(() => {
    if (!theaterOpen) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setTheaterOpen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [theaterOpen]);

  useEffect(() => {
    let cancelled = false;
    let timer = 0;
    if (data === undefined) {
      setNodes([]);
      setIsIndexing(false);
      return;
    }

    const indexedNodes: JsonNode[] = [];
    const stack: PendingJsonNode[] = [{
      value: data,
      id: '$',
      parentId: null,
      key: 'root',
      path: '$',
      level: 0,
    }];
    setNodes([]);
    setIsIndexing(true);

    const processBatch = () => {
      let processed = 0;
      while (stack.length > 0 && processed < INDEX_BATCH_SIZE) {
        indexNode(stack.pop()!, indexedNodes, stack);
        processed++;
      }

      if (cancelled) return;
      if (stack.length > 0) {
        timer = window.setTimeout(processBatch, 0);
      } else {
        setNodes(indexedNodes);
        setIsIndexing(false);
      }
    };

    timer = window.setTimeout(processBatch, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [data]);

  const nodeById = useMemo(() => new Map(nodes.map(node => [node.id, node])), [nodes]);
  const isLarge = nodes.length > 10000 || sourceSize > 2_000_000;
  const nodeMatches = useCallback((node: JsonNode, query: string) => {
    if (node.searchable.includes(query)) return true;
    if (node.isContainer) return false;
    return String(node.value).toLocaleLowerCase().includes(query);
  }, []);

  useEffect(() => {
    matchSourceRef.current = null;
    setExpandedNodes(new Set(['$']));
    setSearchTerm('');
    setMatchIndexes([]);
    setActiveMatch(-1);
    setScrollTop(0);
    if (viewportRef.current) viewportRef.current.scrollTop = 0;
  }, [data]);

  useLayoutEffect(() => {
    const element = viewportRef.current;
    if (!element) return;

    const updateHeight = () => setViewportHeight(element.clientHeight);
    element.scrollTop = scrollTopRef.current;
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    return () => observer.disconnect();
  }, [theaterOpen]);

  useEffect(() => {
    const query = searchTerm.trim().toLocaleLowerCase();
    let cancelled = false;
    let cursor = 0;
    const matches: number[] = [];

    if (!query) {
      setMatchIndexes([]);
      setActiveMatch(-1);
      setIsSearching(false);
      return;
    }

    if (isIndexing) {
      setIsSearching(true);
      return;
    }

    setIsSearching(true);
    const scanBatch = () => {
      const end = Math.min(cursor + SEARCH_BATCH_SIZE, nodes.length);
      for (; cursor < end; cursor++) {
        if (nodeMatches(nodes[cursor], query)) matches.push(cursor);
      }

      if (cancelled) return;
      if (cursor < nodes.length) {
        window.setTimeout(scanBatch, 0);
      } else {
        matchSourceRef.current = nodes;
        setMatchIndexes(matches);
        setActiveMatch(matches.length > 0 ? 0 : -1);
        setIsSearching(false);
      }
    };

    const timer = window.setTimeout(scanBatch, 120);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isIndexing, nodeMatches, nodes, searchTerm]);

  const revealNode = useCallback((node: JsonNode) => {
    setExpandedNodes(previous => {
      const next = new Set(previous);
      let parentId = node.parentId;
      while (parentId) {
        next.add(parentId);
        parentId = nodeById.get(parentId)?.parentId || null;
      }
      return next;
    });
    setPendingScrollId(node.id);
  }, [nodeById]);

  useEffect(() => {
    if (matchSourceRef.current !== nodes || activeMatch < 0 || matchIndexes[activeMatch] === undefined) return;
    revealNode(nodes[matchIndexes[activeMatch]]);
  }, [activeMatch, matchIndexes, nodes, revealNode]);

  const visibleNodes = useMemo(() => {
    const visible: JsonNode[] = [];
    let hiddenBelowLevel: number | null = null;

    for (const node of nodes) {
      if (hiddenBelowLevel !== null) {
        if (node.level > hiddenBelowLevel) continue;
        hiddenBelowLevel = null;
      }

      visible.push(node);
      if (node.isContainer && !expandedNodes.has(node.id)) {
        hiddenBelowLevel = node.level;
      }
    }

    return visible;
  }, [expandedNodes, nodes]);

  useEffect(() => {
    if (!pendingScrollId || !viewportRef.current) return;
    const rowIndex = visibleNodes.findIndex(node => node.id === pendingScrollId);
    if (rowIndex < 0) return;

    const target = Math.max(0, rowIndex * ROW_HEIGHT - viewportHeight / 2 + ROW_HEIGHT / 2);
    viewportRef.current.scrollTo({ top: target, behavior: 'smooth' });
    setPendingScrollId(null);
  }, [pendingScrollId, viewportHeight, visibleNodes]);

  const activeNodeId = matchSourceRef.current === nodes && activeMatch >= 0
    ? nodes[matchIndexes[activeMatch]]?.id
    : null;
  const query = searchTerm.trim().toLocaleLowerCase();
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 8);
  const endIndex = Math.min(
    visibleNodes.length,
    Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + 8,
  );
  const renderedNodes = visibleNodes.slice(startIndex, endIndex);

  const toggleNode = useCallback((id: string) => {
    setExpandedNodes(previous => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const moveMatch = useCallback((direction: 1 | -1) => {
    if (matchIndexes.length === 0) return;
    setActiveMatch(current => {
      const base = current < 0 ? 0 : current;
      return (base + direction + matchIndexes.length) % matchIndexes.length;
    });
  }, [matchIndexes.length]);

  const copyValue = useCallback(async (node: JsonNode) => {
    const text = node.isContainer ? JSON.stringify(node.value, null, 2) : String(node.value);
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  }, []);

  const valueColor = (type: JsonType) => {
    if (type === 'string') return theme.palette.mode === 'dark' ? '#8ec07c' : '#22863a';
    if (type === 'number') return theme.palette.mode === 'dark' ? '#79c0ff' : '#005cc5';
    if (type === 'boolean') return theme.palette.mode === 'dark' ? '#d2a8ff' : '#6f42c1';
    if (type === 'null') return 'text.secondary';
    return 'text.secondary';
  };

  const nodeTypeTag = (node: JsonNode) => {
    if (!node.isContainer) return null;
    return node.type === 'array'
      ? <Typography component="span" sx={{ mr: 0.6, color: 'text.secondary', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{'[ ]'}</Typography>
      : <Typography component="span" sx={{ mr: 0.6, color: 'text.secondary', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{'{ }'}</Typography>;
  };

  const viewer = (
      <Paper
      data-json-theater={theaterOpen ? 'true' : 'false'}
      variant="outlined"
      sx={{
        height: theaterOpen ? '100dvh' : resolvedHeight,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        ...(theaterOpen && {
          position: 'fixed',
          inset: 0,
          width: '100vw',
          maxWidth: 'none',
          zIndex: theme.zIndex.modal,
          border: 0,
          borderRadius: 0,
          bgcolor: 'background.paper',
        }),
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ sm: 'center' }}
        spacing={1}
        sx={{
          px: 1.5,
          py: 1.25,
          borderBottom: '1px solid',
          borderColor: 'divider',
          position: 'sticky',
          top: 0,
          zIndex: 2,
          bgcolor: 'background.paper',
        }}
      >
        <Box sx={{ minWidth: 145 }}>
          <Typography variant="body2" fontWeight={600}>Explorer</Typography>
          <Typography variant="caption" color="text.secondary">
            {isIndexing ? 'Indexing…' : `${nodes.length.toLocaleString()} nodes`}
            {sourceSize > 0 ? ` · ${(sourceSize / 1024).toLocaleString(undefined, { maximumFractionDigits: 1 })} KB` : ''}
            {isLarge ? ' · large JSON mode' : ''}
          </Typography>
        </Box>

        <TextField
          size="small"
          value={searchTerm}
          onChange={event => setSearchTerm(event.target.value)}
          autoComplete="off"
          onKeyDown={event => {
            if (event.key === 'Enter') {
              event.preventDefault();
              moveMatch(event.shiftKey ? -1 : 1);
            }
          }}
          placeholder="Find key, value, or path"
          sx={{ flex: 1, minWidth: 180 }}
          inputProps={{ 'aria-label': 'Find in JSON' }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Typography data-json-match-count variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                  {isSearching ? 'Searching…' : query ? `${activeMatch >= 0 ? activeMatch + 1 : 0}/${matchIndexes.length}` : ''}
                </Typography>
                <Tooltip title="Previous match (Shift+Enter)">
                  <span>
                    <IconButton aria-label="Previous JSON match" size="small" disabled={matchIndexes.length === 0} onClick={() => moveMatch(-1)}>
                      <KeyboardArrowUp fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
                <Tooltip title="Next match (Enter)">
                  <span>
                    <IconButton aria-label="Next JSON match" size="small" disabled={matchIndexes.length === 0} onClick={() => moveMatch(1)}>
                      <KeyboardArrowDown fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </InputAdornment>
            ),
          }}
        />

        <Stack direction="row" spacing={0.5} alignItems="center">
          <Tooltip title="Collapse all">
            <IconButton aria-label="Collapse JSON tree" size="small" onClick={() => setExpandedNodes(new Set(['$']))}>
              <UnfoldLess fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={theaterOpen ? 'Close theater mode (Esc)' : 'Open theater mode'}>
            <IconButton
              aria-label={theaterOpen ? 'Close JSON theater mode' : 'Open JSON theater mode'}
              size="small"
              onClick={() => setTheaterOpen(previous => !previous)}
            >
              {theaterOpen ? <Close fontSize="small" /> : <OpenInFull fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      <Box
        ref={viewportRef}
        data-json-viewport
        onScroll={event => {
          scrollTopRef.current = event.currentTarget.scrollTop;
          setScrollTop(event.currentTarget.scrollTop);
        }}
        sx={{ flex: 1, minHeight: 0, overflow: 'auto', position: 'relative', fontFamily: 'monospace' }}
      >
                {nodes.length === 0 && (
          <Stack alignItems="center" justifyContent="center" sx={{ position: 'absolute', inset: 0 }}>
            <Typography variant="body2" color="text.secondary">
              {isIndexing ? 'Indexing JSON…' : 'Enter valid JSON to explore'}
            </Typography>
          </Stack>
        )}
        <Box sx={{ height: visibleNodes.length * ROW_HEIGHT, position: 'relative', minWidth: '100%' }}>
          {renderedNodes.map((node, offset) => {
            const rowIndex = startIndex + offset;
            const isExpanded = expandedNodes.has(node.id);
            const isCurrent = node.id === activeNodeId;
            const isMatch = !!query && nodeMatches(node, query);

            return (
              <Box
                key={node.id}
                data-json-node-row
                data-json-node-id={node.id}
                data-json-active={isCurrent ? 'true' : undefined}
                sx={{
                  position: 'absolute',
                  top: rowIndex * ROW_HEIGHT,
                  left: 0,
                  right: 0,
                  height: ROW_HEIGHT,
                  display: 'flex',
                  alignItems: 'center',
                  pl: `${8 + node.level * 16}px`,
                  gap: 0.5,
                  pr: 0.5,
                  bgcolor: isCurrent
                    ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.24 : 0.13)
                    : isMatch
                      ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.1 : 0.06)
                      : 'transparent',
                  borderBottom: '1px solid',
                  borderColor: alpha(theme.palette.divider, 0.45),
                  '&:hover': {
                    bgcolor: isCurrent ? undefined : 'action.hover',
                    '& .copy-json-value': { opacity: 1 },
                  },
                  }}
                >
                {nodeTypeTag(node)}
                {node.isContainer ? (
                  <IconButton aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${node.path}`} size="small" onClick={() => toggleNode(node.id)} sx={{ width: 24, height: 24, mr: 0.5 }}>
                    <ChevronRight
                      sx={{
                        fontSize: 18,
                        transform: isExpanded ? 'rotate(90deg)' : 'none',
                        transition: 'transform 120ms ease',
                      }}
                    />
                  </IconButton>
                ) : (
                  <Box sx={{ width: 28, flexShrink: 0 }} />
                )}

                <Tooltip title={node.path} enterDelay={250}>
                  <Typography component="span" sx={{ fontFamily: 'inherit', fontSize: '0.78rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {node.key}
                  </Typography>
                </Tooltip>
                <Typography component="span" color="text.secondary" sx={{ mx: 0.75, fontFamily: 'inherit', fontSize: '0.78rem' }}>
                  {node.isContainer ? '' : ':'}
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    minWidth: 0,
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontFamily: 'inherit',
                    fontSize: '0.78rem',
                    color: valueColor(node.type),
                  }}
                >
                  {node.summary}
                </Typography>
                <Tooltip title="Copy value">
                  <IconButton
                    className="copy-json-value"
                    aria-label={`Copy ${node.path}`}
                    size="small"
                    onClick={() => copyValue(node)}
                    sx={{ opacity: { xs: 1, sm: 0 }, width: 26, height: 26, flexShrink: 0 }}
                  >
                    <ContentCopy sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Paper>
  );

  return theaterOpen ? createPortal(viewer, document.body) : viewer;
};

export default JsonViewer;
