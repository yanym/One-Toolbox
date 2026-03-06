import React, { useState, useMemo, useCallback } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Box,
  Paper,
  IconButton,
  Tooltip,
  Fade,
  useMediaQuery,
  TextField,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Drawer,
  Chip,
  Divider,
  alpha
} from '@mui/material';
import {
  Code,
  CompareArrows,
  Transform,
  AccountTree,
  TextFields,
  DarkMode,
  LightMode,
  DataObject,
  Security,
  Storage,
  Search,
  Menu as MenuIcon,
  Build,
  Link,
  Schedule,
} from '@mui/icons-material';
import './App.css';
import JsonValidator from './components/JsonValidator';
import JsonSerializer from './components/JsonSerializer';
import JsonDiff from './components/JsonDiff';
import JsonViewer from './components/JsonViewer';
import StringEscape from './components/StringEscape';
import XmlFormatter from './components/XmlFormatter';
import Base64Converter from './components/Base64Converter';
import ProtobufConverter from './components/ProtobufConverter';
import UrlEncoderDecoder from './components/UrlEncoderDecoder';
import TimestampConverter from './components/TimestampConverter';

interface ToolConfig {
  id: string;
  label: string;
  shortLabel: string;
  icon: React.ReactElement;
  category: 'json' | 'text' | 'encoding';
  description: string;
  component: React.ReactNode;
}

const DRAWER_WIDTH = 280;

function App() {
  const [activeToolId, setActiveToolId] = useState('json-formatter');
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return JSON.parse(saved);
    return true;
  });

  const isMobile = useMediaQuery('(max-width:960px)');

  const tools: ToolConfig[] = useMemo(() => [
    {
      id: 'json-formatter',
      label: 'JSON Formatter',
      shortLabel: 'Format',
      icon: <Code />,
      category: 'json',
      description: 'Validate, format, and minify JSON',
      component: <JsonValidator />,
    },
    {
      id: 'json-diff',
      label: 'JSON Diff',
      shortLabel: 'Diff',
      icon: <CompareArrows />,
      category: 'json',
      description: 'Compare two JSON objects visually',
      component: <JsonDiff />,
    },
    {
      id: 'json-viewer',
      label: 'JSON Viewer',
      shortLabel: 'View',
      icon: <AccountTree />,
      category: 'json',
      description: 'Explore JSON as an interactive tree',
      component: <JsonViewer />,
    },
    {
      id: 'json-serializer',
      label: 'JSON Serializer',
      shortLabel: 'Serialize',
      icon: <Transform />,
      category: 'json',
      description: 'Convert JSON to code in multiple languages',
      component: <JsonSerializer />,
    },
    {
      id: 'string-escape',
      label: 'String Escape',
      shortLabel: 'Escape',
      icon: <TextFields />,
      category: 'text',
      description: 'Escape and unescape strings',
      component: <StringEscape />,
    },
    {
      id: 'xml-formatter',
      label: 'XML Formatter',
      shortLabel: 'XML',
      icon: <DataObject />,
      category: 'text',
      description: 'Format and validate XML documents',
      component: <XmlFormatter />,
    },
    {
      id: 'base64',
      label: 'Base64 Converter',
      shortLabel: 'Base64',
      icon: <Security />,
      category: 'encoding',
      description: 'Encode and decode Base64 strings',
      component: <Base64Converter />,
    },
    {
      id: 'protobuf',
      label: 'Protobuf Converter',
      shortLabel: 'Protobuf',
      icon: <Storage />,
      category: 'encoding',
      description: 'Encode and decode Protocol Buffers',
      component: <ProtobufConverter />,
    },
    {
      id: 'url-encoder',
      label: 'URL Encoder/Decoder',
      shortLabel: 'URL',
      icon: <Link />,
      category: 'encoding',
      description: 'Encode and decode URL components',
      component: <UrlEncoderDecoder />,
    },
    {
      id: 'timestamp',
      label: 'Timestamp Converter',
      shortLabel: 'Timestamp',
      icon: <Schedule />,
      category: 'text',
      description: 'Convert Unix timestamps across all formats',
      component: <TimestampConverter />,
    },
  ], []);

  const categories = [
    { id: 'json', label: 'JSON Tools' },
    { id: 'text', label: 'Text & Markup' },
    { id: 'encoding', label: 'Encoding' },
  ] as const;

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return tools;
    const q = searchQuery.toLowerCase();
    return tools.filter(t =>
      t.label.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    );
  }, [tools, searchQuery]);

  const activeTool = tools.find(t => t.id === activeToolId) || tools[0];

  const theme = useMemo(() => createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: darkMode ? '#7c9eff' : '#4361ee',
        light: darkMode ? '#a7bfff' : '#6b83f2',
        dark: darkMode ? '#5a7de6' : '#2d47d0',
      },
      secondary: {
        main: darkMode ? '#ff7eb3' : '#e63946',
      },
      background: {
        default: darkMode ? '#0d1117' : '#f6f8fa',
        paper: darkMode ? '#161b22' : '#ffffff',
      },
      text: {
        primary: darkMode ? '#e6edf3' : '#1f2328',
        secondary: darkMode ? '#8b949e' : '#656d76',
      },
      divider: darkMode ? '#30363d' : '#d0d7de',
    },
    typography: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
      h5: { fontWeight: 600, letterSpacing: '-0.01em' },
      h6: { fontWeight: 600, letterSpacing: '-0.01em', fontSize: '1rem' },
      body2: { lineHeight: 1.5 },
    },
    shape: { borderRadius: 10 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarWidth: 'thin',
            scrollbarColor: darkMode ? '#484f58 #0d1117' : '#d0d7de #f6f8fa',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderRadius: 12,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 600,
            padding: '8px 20px',
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 500,
            fontSize: '0.75rem',
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            fontWeight: 500,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            marginBottom: 2,
            '&.Mui-selected': {
              fontWeight: 600,
            },
          },
        },
      },
    },
  }), [darkMode]);

  const toggleDarkMode = useCallback(() => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
  }, [darkMode]);

  const handleToolSelect = useCallback((toolId: string) => {
    setActiveToolId(toolId);
    setMobileDrawerOpen(false);
  }, []);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey) {
      const num = parseInt(event.key);
      if (num >= 1 && num <= tools.length) {
        event.preventDefault();
        setActiveToolId(tools[num - 1].id);
      }
      if (event.key === 'd') {
        event.preventDefault();
        toggleDarkMode();
      }
      if (event.key === 'k') {
        event.preventDefault();
        document.getElementById('tool-search-input')?.focus();
      }
    }
  }, [toggleDarkMode, tools]);

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 1.5 }}>
      {/* Search */}
      <TextField
        id="tool-search-input"
        size="small"
        placeholder="Search tools..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ fontSize: 18, color: 'text.secondary' }} />
            </InputAdornment>
          ),
          sx: {
            borderRadius: 2,
            fontSize: '0.875rem',
            bgcolor: darkMode ? alpha('#ffffff', 0.04) : alpha('#000000', 0.03),
          }
        }}
      />

      {/* Tool list by category */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {categories.map(cat => {
          const catTools = filteredTools.filter(t => t.category === cat.id);
          if (catTools.length === 0) return null;
          return (
            <Box key={cat.id} sx={{ mb: 2 }}>
              <Typography
                variant="overline"
                sx={{
                  px: 1.5,
                  mb: 0.5,
                  display: 'block',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  color: 'text.secondary',
                }}
              >
                {cat.label}
              </Typography>
              <List dense disablePadding>
                {catTools.map(tool => (
                  <ListItemButton
                    key={tool.id}
                    selected={activeToolId === tool.id}
                    onClick={() => handleToolSelect(tool.id)}
                    sx={{
                      px: 1.5,
                      py: 0.8,
                      gap: 1,
                      '&.Mui-selected': {
                        bgcolor: darkMode ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.primary.main, 0.08),
                        color: 'primary.main',
                        '& .MuiListItemIcon-root': { color: 'primary.main' },
                        '&:hover': {
                          bgcolor: darkMode ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.primary.main, 0.12),
                        },
                      },
                      '&:hover': {
                        bgcolor: darkMode ? alpha('#ffffff', 0.06) : alpha('#000000', 0.04),
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 0, color: 'text.secondary', fontSize: 20 }}>
                      {tool.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={tool.label}
                      primaryTypographyProps={{
                        fontSize: '0.85rem',
                        fontWeight: activeToolId === tool.id ? 600 : 400,
                      }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Box>
          );
        })}
      </Box>

      {/* Bottom shortcuts hint */}
      <Divider sx={{ my: 1 }} />
      <Box sx={{ px: 1, py: 0.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
          {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+1-9 switch tools &middot; {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+K search &middot; {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+D theme
        </Typography>
      </Box>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {/* Sidebar — permanent on desktop, drawer on mobile */}
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileDrawerOpen}
            onClose={() => setMobileDrawerOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              '& .MuiDrawer-paper': {
                width: DRAWER_WIDTH,
                bgcolor: 'background.paper',
                borderRight: `1px solid`,
                borderColor: 'divider',
              },
            }}
          >
            {/* Mobile drawer header */}
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Build sx={{ fontSize: 22, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
                One Toolbox
              </Typography>
            </Box>
            <Divider />
            {drawerContent}
          </Drawer>
        ) : (
          <Box
            sx={{
              width: DRAWER_WIDTH,
              flexShrink: 0,
              borderRight: `1px solid`,
              borderColor: 'divider',
              bgcolor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Desktop sidebar header */}
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Build sx={{ fontSize: 22, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem' }}>
                One Toolbox
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Tooltip title={darkMode ? 'Light mode' : 'Dark mode'}>
                <IconButton size="small" onClick={toggleDarkMode} sx={{ color: 'text.secondary' }}>
                  {darkMode ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
                </IconButton>
              </Tooltip>
            </Box>
            <Divider />
            {drawerContent}
          </Box>
        )}

        {/* Main content */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Top bar (mobile only shows hamburger + tool name) */}
          {isMobile && (
            <AppBar
              position="sticky"
              elevation={0}
              sx={{
                bgcolor: 'background.paper',
                borderBottom: `1px solid`,
                borderColor: 'divider',
                color: 'text.primary',
              }}
            >
              <Toolbar sx={{ minHeight: 56 }}>
                <IconButton
                  edge="start"
                  onClick={() => setMobileDrawerOpen(true)}
                  sx={{ mr: 1.5 }}
                >
                  <MenuIcon />
                </IconButton>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {activeTool.icon}
                  <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                    {activeTool.label}
                  </Typography>
                </Box>
                <Box sx={{ flexGrow: 1 }} />
                <Tooltip title={darkMode ? 'Light mode' : 'Dark mode'}>
                  <IconButton size="small" onClick={toggleDarkMode}>
                    {darkMode ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
                  </IconButton>
                </Tooltip>
              </Toolbar>
            </AppBar>
          )}

          {/* Tool header (desktop) */}
          {!isMobile && (
            <Box sx={{
              px: 4,
              pt: 3,
              pb: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
            }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: darkMode ? alpha(theme.palette.primary.main, 0.12) : alpha(theme.palette.primary.main, 0.08),
                color: 'primary.main',
              }}>
                {activeTool.icon}
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontSize: '1.25rem', lineHeight: 1.3 }}>
                  {activeTool.label}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  {activeTool.description}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Tool content */}
          <Box sx={{
            flexGrow: 1,
            p: isMobile ? 2 : 3,
            px: isMobile ? 2 : 4,
            overflow: 'auto',
          }}>
            <Fade in={true} timeout={200} key={activeToolId}>
              <Box>{activeTool.component}</Box>
            </Fade>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
