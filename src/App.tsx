import React, { useState, useMemo, useCallback } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Tabs,
  Tab,
  Paper,
  IconButton,
  Tooltip,
  Fade,
  useMediaQuery
} from '@mui/material';
import {
  Code,
  CompareArrows,
  Transform,
  Visibility,
  TextFields,
  DarkMode,
  LightMode,
  DataObject,
  Security,
  Storage,
  Build
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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`json-tabpanel-${index}`}
      aria-labelledby={`json-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `json-tab-${index}`,
    'aria-controls': `json-tabpanel-${index}`,
  };
}

function App() {
  const [tabValue, setTabValue] = useState(0);
  const [darkMode, setDarkMode] = useState(() => {
    // Initialize from localStorage or default to dark mode
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return JSON.parse(saved);
    }
    // Default to dark mode instead of system preference
    return true;
  });

  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = useMemo(() => createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: darkMode ? '#90caf9' : '#1976d2',
        light: darkMode ? '#bbdefb' : '#42a5f5',
        dark: darkMode ? '#64b5f6' : '#1565c0',
      },
      secondary: {
        main: darkMode ? '#f48fb1' : '#d32f2f',
        light: darkMode ? '#f8bbd9' : '#f44336',
        dark: darkMode ? '#f06292' : '#c62828',
      },
      background: {
        default: darkMode ? '#0a0a0a' : '#f8f9fa',
        paper: darkMode ? '#1a1a1a' : '#ffffff',
      },
      text: {
        primary: darkMode ? '#ffffff' : '#212121',
        secondary: darkMode ? '#b0b0b0' : '#757575',
      },
      divider: darkMode ? '#333333' : '#e0e0e0',
      action: {
        hover: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
        selected: darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: {
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h5: {
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      h6: {
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      body1: {
        lineHeight: 1.6,
      },
      body2: {
        lineHeight: 1.5,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarWidth: 'thin',
            scrollbarColor: darkMode ? '#555 #333' : '#ccc #f5f5f5',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundImage: 'none',
            boxShadow: darkMode 
              ? '0 4px 20px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2)'
              : '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.1)',
            transition: 'box-shadow 0.3s ease-in-out, transform 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: darkMode
                ? '0 8px 30px rgba(0, 0, 0, 0.4), 0 2px 6px rgba(0, 0, 0, 0.3)'
                : '0 8px 30px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.15)',
            },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.95rem',
            minHeight: 64,
            padding: '12px 20px',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
              transform: 'translateY(-1px)',
            },
            '&.Mui-selected': {
              fontWeight: 700,
              color: darkMode ? '#90caf9' : '#1976d2',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            textTransform: 'none',
            fontWeight: 600,
            padding: '10px 24px',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            },
          },
          contained: {
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            '&:hover': {
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'scale(1.05)',
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: darkMode 
              ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
              : 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 500,
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            fontWeight: 500,
          },
        },
      },
    },
  }), [darkMode]);

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  }, []);

  const toggleDarkMode = useCallback(() => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', JSON.stringify(newDarkMode));
  }, [darkMode]);

  // Keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
          event.preventDefault();
          const tabIndex = parseInt(event.key) - 1;
          if (tabIndex >= 0 && tabIndex < 8) {
            setTabValue(tabIndex);
          }
          break;
        case 'd':
          event.preventDefault();
          toggleDarkMode();
          break;
      }
    }
  }, [toggleDarkMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box 
        sx={{ 
          flexGrow: 1, 
          minHeight: '100vh', 
          bgcolor: 'background.default',
          background: darkMode 
            ? 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)'
            : 'linear-gradient(135deg, #f8f9fa 0%, #f0f2f5 100%)',
        }}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        className={`json-toolkit-app ${darkMode ? 'dark-mode' : ''}`}
      >
        <AppBar position="static" elevation={0}>
          <Toolbar sx={{ minHeight: 72 }}>
            <Build sx={{ mr: 2, fontSize: 28 }} />
            <Typography 
              variant="h5" 
              component="div" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(45deg, #ffffff 30%, #e3f2fd 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em',
                mr: 2
              }}
            >
              JSON Toolkit
            </Typography>
            <Box 
              component="a" 
              href="https://github.com/yanym/One-Toolbox" 
              target="_blank" 
              rel="noopener noreferrer"
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                mr: 1,
                transition: 'transform 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.05)'
                }
              }}
            >
              <Box
                component="img"
                src="https://img.shields.io/github/stars/yanym/One-Toolbox?style=social"
                alt="GitHub stars"
                sx={{
                  height: 20,
                  filter: darkMode ? 'invert(1)' : 'none',
                }}
              />
            </Box>
            <Box sx={{ flexGrow: 1 }} />
            <Tooltip 
              title={
                <Box>
                  <Typography variant="body2">
                    {darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Ctrl/Cmd + D
                  </Typography>
                </Box>
              }
            >
              <IconButton 
                color="inherit" 
                onClick={toggleDarkMode}
                sx={{ 
                  ml: 1,
                  p: 1.5,
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    transform: 'rotate(180deg)',
                  }
                }}
              >
                <Fade in={darkMode} timeout={300}>
                  <LightMode sx={{ position: 'absolute' }} />
                </Fade>
                <Fade in={!darkMode} timeout={300}>
                  <DarkMode sx={{ position: 'absolute' }} />
                </Fade>
              </IconButton>
            </Tooltip>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ mt: 4, mb: 4, px: { xs: 2, sm: 3 } }}>
          <Paper 
            elevation={0} 
            sx={{ 
              bgcolor: 'background.paper',
              borderRadius: 3,
              overflow: 'hidden',
              border: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`,
              background: darkMode
                ? 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 100%)'
                : 'linear-gradient(145deg, #ffffff 0%, #f5f7fa 100%)',
            }}
          >
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label="JSON toolkit tabs (Use Ctrl/Cmd + 1-8 for quick navigation)"
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{ 
                  px: 2,
                  '& .MuiTabs-indicator': {
                    height: 3,
                    borderRadius: '3px 3px 0 0',
                    background: darkMode
                      ? 'linear-gradient(90deg, #90caf9 0%, #64b5f6 100%)'
                      : 'linear-gradient(90deg, #1976d2 0%, #1565c0 100%)',
                  },
                  '& .MuiTabs-scrollButtons': {
                    '&.Mui-disabled': {
                      opacity: 0.3,
                    },
                  },
                }}
              >
                <Tab
                  icon={<Code />}
                  label="JSON Formatter"
                  {...a11yProps(0)}
                  iconPosition="start"
                />
                <Tab
                  icon={<Transform />}
                  label="JSON Serializer"
                  {...a11yProps(1)}
                  iconPosition="start"
                />
                <Tab
                  icon={<CompareArrows />}
                  label="JSON Diff"
                  {...a11yProps(2)}
                  iconPosition="start"
                />
                <Tab
                  icon={<Visibility />}
                  label="JSON Viewer"
                  {...a11yProps(3)}
                  iconPosition="start"
                />
                <Tab
                  icon={<TextFields />}
                  label="String Escape"
                  {...a11yProps(4)}
                  iconPosition="start"
                />
                <Tab
                  icon={<DataObject />}
                  label="XML Formatter"
                  {...a11yProps(5)}
                  iconPosition="start"
                />
                <Tab
                  icon={<Security />}
                  label="Base64 Converter"
                  {...a11yProps(6)}
                  iconPosition="start"
                />
                <Tab
                  icon={<Storage />}
                  label="Protobuf Converter"
                  {...a11yProps(7)}
                  iconPosition="start"
                />
              </Tabs>
            </Box>

            <Fade in={true} timeout={300}>
              <Box>
                <TabPanel value={tabValue} index={0}>
                  <JsonValidator />
                </TabPanel>
                <TabPanel value={tabValue} index={1}>
                  <JsonSerializer />
                </TabPanel>
                <TabPanel value={tabValue} index={2}>
                  <JsonDiff />
                </TabPanel>
                <TabPanel value={tabValue} index={3}>
                  <JsonViewer />
                </TabPanel>
                <TabPanel value={tabValue} index={4}>
                  <StringEscape />
                </TabPanel>
                <TabPanel value={tabValue} index={5}>
                  <XmlFormatter />
                </TabPanel>
                <TabPanel value={tabValue} index={6}>
                  <Base64Converter />
                </TabPanel>
                <TabPanel value={tabValue} index={7}>
                  <ProtobufConverter />
                </TabPanel>
              </Box>
            </Fade>
          </Paper>
        </Container>

        {/* Keyboard shortcuts help */}
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            left: 16,
            zIndex: 1000,
            opacity: 0.7,
            transition: 'opacity 0.3s ease',
            '&:hover': { opacity: 1 },
          }}
        >
          <Tooltip
            title={
              <Box sx={{ p: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Keyboard Shortcuts
                </Typography>
                <Typography variant="caption" component="div">
                  Ctrl/Cmd + 1-8: Switch tabs
                </Typography>
                <Typography variant="caption" component="div">
                  Ctrl/Cmd + D: Toggle theme
                </Typography>
              </Box>
            }
            placement="top-start"
          >
            <Paper
              sx={{
                p: 1,
                bgcolor: 'background.paper',
                border: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`,
                borderRadius: 2,
                cursor: 'help',
              }}
            >
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                ⌨️ Shortcuts
              </Typography>
            </Paper>
          </Tooltip>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
