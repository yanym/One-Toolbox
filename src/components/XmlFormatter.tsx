import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Chip,
  Stack,
  Paper,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import GridWrapper from './GridWrapper';
import {
  CheckCircle,
  Error as ErrorIcon,
  ContentCopy,
  Clear,
  FormatIndentIncrease,
  Compress
} from '@mui/icons-material';
import Editor from '@monaco-editor/react';

const XmlFormatter: React.FC = () => {
  const [xmlInput, setXmlInput] = useState('<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <person>\n    <name>John Doe</name>\n    <age>30</age>\n    <city>New York</city>\n  </person>\n</root>');
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    error?: string;
    formatted?: string;
  }>({ isValid: true });
  const [indentSize, setIndentSize] = useState(2);

  const formatXml = (xml: string, indent: number = 2): string => {
    const PADDING = ' '.repeat(indent);
    let formatted = '';
    let level = 0;
    
    // Remove existing formatting
    const cleaned = xml.replace(/>\s*</g, '><').trim();
    
    // Split by tags
    const tokens = cleaned.split(/(<[^>]*>)/);
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i].trim();
      if (!token) continue;
      
      if (token.startsWith('</')) {
        // Closing tag - decrease level first, then add
        level = Math.max(0, level - 1);
        formatted += PADDING.repeat(level) + token + '\n';
      } else if (token.startsWith('<') && token.endsWith('/>')) {
        // Self-closing tag
        formatted += PADDING.repeat(level) + token + '\n';
      } else if (token.startsWith('<')) {
        // Opening tag
        formatted += PADDING.repeat(level) + token + '\n';
        level++;
      } else {
        // Text content
        if (token.length > 0) {
          formatted += PADDING.repeat(level) + token + '\n';
        }
      }
    }
    
    return formatted.trim();
  };

  const minifyXml = (xml: string): string => {
    return xml
      .replace(/>\s+</g, '><')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const validateXml = useCallback((value: string) => {
    if (!value.trim()) {
      setValidationResult({ isValid: true });
      return;
    }

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(value, 'text/xml');
      
      const parseError = xmlDoc.getElementsByTagName('parsererror');
      if (parseError.length > 0) {
        const errorText = parseError[0]?.textContent || 'Invalid XML';
        throw new Error(errorText);
      }
      
      const formatted = formatXml(value, indentSize);
      setValidationResult({
        isValid: true,
        formatted
      });
    } catch (error: any) {
      setValidationResult({
        isValid: false,
        error: error.message || 'Invalid XML'
      });
    }
  }, [indentSize]);

  const handleInputChange = (value: string | undefined) => {
    const newValue = value || '';
    setXmlInput(newValue);
    validateXml(newValue);
  };

  const handleFormatXml = () => {
    if (validationResult.isValid && validationResult.formatted) {
      setXmlInput(validationResult.formatted);
    }
  };

  const handleMinifyXml = () => {
    try {
      const minified = minifyXml(xmlInput);
      setXmlInput(minified);
      validateXml(minified);
    } catch (error) {
      // Error will be shown by validation
    }
  };

  const clearInput = () => {
    setXmlInput('');
    setValidationResult({ isValid: true });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const getXmlStats = () => {
    if (!validationResult.isValid || !xmlInput.trim()) return null;

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlInput, 'text/xml');
      
      const getAllElements = (node: Node): Element[] => {
        const elements: Element[] = [];
        if (node.nodeType === Node.ELEMENT_NODE) {
          elements.push(node as Element);
        }
        for (let i = 0; i < node.childNodes.length; i++) {
          elements.push(...getAllElements(node.childNodes[i]));
        }
        return elements;
      };

      const elements = getAllElements(xmlDoc);
      const attributes = elements.reduce((sum, el) => sum + el.attributes.length, 0);
      
      const stats = {
        size: new TextEncoder().encode(xmlInput).length,
        lines: xmlInput.split('\n').length,
        characters: xmlInput.length,
        elements: elements.length,
        attributes: attributes
      };
      return stats;
    } catch {
      return null;
    }
  };

  const stats = getXmlStats();

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        XML Formatter & Validator
      </Typography>

      <GridWrapper container spacing={3}>
        <GridWrapper item xs={12} md={8}>
          <Paper elevation={1} sx={{ p: 2, height: '600px', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">XML Input</Typography>
              <Stack direction="row" spacing={1}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Indent</InputLabel>
                  <Select
                    value={indentSize}
                    label="Indent"
                    onChange={(e) => setIndentSize(Number(e.target.value))}
                  >
                    <MenuItem value={2}>2 spaces</MenuItem>
                    <MenuItem value={4}>4 spaces</MenuItem>
                    <MenuItem value={8}>8 spaces</MenuItem>
                  </Select>
                </FormControl>
                <Tooltip title="Format XML">
                  <IconButton 
                    onClick={handleFormatXml} 
                    disabled={!validationResult.isValid}
                    color="primary"
                  >
                    <FormatIndentIncrease />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Minify XML">
                  <IconButton 
                    onClick={handleMinifyXml} 
                    disabled={!validationResult.isValid}
                    color="primary"
                  >
                    <Compress />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Copy to Clipboard">
                  <IconButton onClick={() => copyToClipboard(xmlInput)} color="primary">
                    <ContentCopy />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Clear">
                  <IconButton onClick={clearInput} color="error">
                    <Clear />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
            
            <Box sx={{ flexGrow: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Editor
                height="100%"
                defaultLanguage="xml"
                value={xmlInput}
                onChange={handleInputChange}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollbar: {
                    vertical: 'visible',
                    horizontal: 'visible'
                  },
                  wordWrap: 'on'
                }}
              />
            </Box>
          </Paper>
        </GridWrapper>

        <GridWrapper item xs={12} md={4}>
          <Stack spacing={2}>
            {/* Validation Status */}
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Validation Status</Typography>
              {validationResult.isValid ? (
                <Alert severity="success" icon={<CheckCircle />}>
                  Valid XML
                </Alert>
              ) : (
                <Alert severity="error" icon={<ErrorIcon />}>
                  {validationResult.error}
                </Alert>
              )}
            </Paper>

            {/* XML Statistics */}
            {stats && (
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>Statistics</Typography>
                <Stack spacing={1}>
                  <Chip label={`Size: ${stats.size} bytes`} variant="outlined" />
                  <Chip label={`Lines: ${stats.lines}`} variant="outlined" />
                  <Chip label={`Characters: ${stats.characters}`} variant="outlined" />
                  <Chip label={`Elements: ${stats.elements}`} variant="outlined" />
                  <Chip label={`Attributes: ${stats.attributes}`} variant="outlined" />
                </Stack>
              </Paper>
            )}

            {/* Quick Actions */}
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Quick Actions</Typography>
              <Stack spacing={1}>
                <Button
                  variant="contained"
                  onClick={handleFormatXml}
                  disabled={!validationResult.isValid}
                  startIcon={<FormatIndentIncrease />}
                  fullWidth
                >
                  Format XML
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleMinifyXml}
                  disabled={!validationResult.isValid}
                  startIcon={<Compress />}
                  fullWidth
                >
                  Minify XML
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => copyToClipboard(xmlInput)}
                  startIcon={<ContentCopy />}
                  fullWidth
                >
                  Copy to Clipboard
                </Button>
              </Stack>
            </Paper>
          </Stack>
        </GridWrapper>
      </GridWrapper>
    </Box>
  );
};

export default XmlFormatter;
