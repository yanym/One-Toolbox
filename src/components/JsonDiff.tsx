import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  Tooltip,
  Stack,
  Alert,
  Chip,
  Divider
} from '@mui/material';
import {
  ContentCopy,
  Clear,
  CompareArrows,
  SwapHoriz
} from '@mui/icons-material';
import Editor from '@monaco-editor/react';
import * as jsondiffpatch from 'jsondiffpatch';

const JsonDiff: React.FC = () => {
  const [leftJson, setLeftJson] = useState('{\n  "name": "John Doe",\n  "age": 30,\n  "city": "New York",\n  "hobbies": ["reading", "coding"]\n}');
  const [rightJson, setRightJson] = useState('{\n  "name": "John Smith",\n  "age": 32,\n  "city": "New York",\n  "hobbies": ["reading", "gaming", "traveling"]\n}');
  const [diffResult, setDiffResult] = useState<any>(null);
  const [diffHtml, setDiffHtml] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState<{
    added: number;
    modified: number;
    deleted: number;
    unchanged: number;
  } | null>(null);

  const calculateDiff = useCallback(() => {
    try {
      const left = JSON.parse(leftJson);
      const right = JSON.parse(rightJson);
      
      // Create jsondiffpatch instance
      const instance = jsondiffpatch.create({
        objectHash: function(obj: any) {
          return obj.id || obj._id || obj.name || JSON.stringify(obj);
        },
        arrays: {
          detectMove: true,
          includeValueOnMove: false
        }
      });
      
      const delta = instance.diff(left, right);
      setDiffResult(delta);
      
      if (delta) {
        // Create a visual diff display
        const html = createVisualDiff(left, right, delta);
        setDiffHtml(html);
        
        // Calculate statistics
        const diffStats = calculateDiffStats(delta, left, right);
        setStats(diffStats);
      } else {
        setDiffHtml('<div style="text-align: center; color: #666; font-style: italic; padding: 20px;">No differences found</div>');
        setStats({ added: 0, modified: 0, deleted: 0, unchanged: countProperties(left) });
      }
      
      setError('');
    } catch (err: any) {
      setError(err.message || 'Invalid JSON in one or both inputs');
      setDiffResult(null);
      setDiffHtml('');
      setStats(null);
    }
  }, [leftJson, rightJson]);

  const createVisualDiff = (left: any, right: any, delta: any): string => {
    const formatValue = (value: any): string => {
      if (typeof value === 'string') {
        return `"${value}"`;
      }
      return JSON.stringify(value, null, 2);
    };

    const renderDiff = (obj: any, path: string[] = []): string => {
      let html = '<ul style="margin: 0; padding-left: 20px; list-style: none;">';
      
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        const currentPath = [...path, key];
        const pathStr = currentPath.join('.');
        
        if (Array.isArray(value)) {
          if (value.length === 1) {
            // Added
            html += `<li style="background-color: #d4edda; padding: 4px 8px; margin: 2px 0; border-radius: 3px;">
              <span style="color: #155724; font-weight: bold;">+ ${pathStr}:</span> 
              <span style="color: #155724;">${formatValue(value[0])}</span>
            </li>`;
          } else if (value.length === 2) {
            // Modified
            html += `<li style="background-color: #fff3cd; padding: 4px 8px; margin: 2px 0; border-radius: 3px;">
              <span style="color: #856404; font-weight: bold;">~ ${pathStr}:</span><br/>
              <span style="color: #721c24; text-decoration: line-through; background-color: #f8d7da; padding: 2px 4px; border-radius: 3px; margin-right: 8px;">${formatValue(value[0])}</span>
              <span style="color: #155724; background-color: #c3e6cb; padding: 2px 4px; border-radius: 3px;">${formatValue(value[1])}</span>
            </li>`;
          } else if (value.length === 3 && value[2] === 0) {
            // Deleted
            html += `<li style="background-color: #f8d7da; padding: 4px 8px; margin: 2px 0; border-radius: 3px;">
              <span style="color: #721c24; font-weight: bold;">- ${pathStr}:</span> 
              <span style="color: #721c24; text-decoration: line-through;">${formatValue(value[0])}</span>
            </li>`;
          }
        } else if (typeof value === 'object' && value !== null) {
          html += `<li style="margin: 4px 0;">
            <span style="color: #0066cc; font-weight: bold;">${pathStr}:</span>
            ${renderDiff(value, currentPath)}
          </li>`;
        }
      });
      
      html += '</ul>';
      return html;
    };

    if (!delta || Object.keys(delta).length === 0) {
      return '<div style="text-align: center; color: #666; font-style: italic; padding: 20px;">No differences found</div>';
    }

    return `<div style="font-family: Consolas, Monaco, 'Courier New', monospace; font-size: 13px; line-height: 1.6;">
      ${renderDiff(delta)}
    </div>`;
  };

  const calculateDiffStats = (delta: any, left: any, right: any) => {
    let added = 0;
    let modified = 0;
    let deleted = 0;
    
    const traverse = (obj: any, path: string[] = []) => {
      if (!obj || typeof obj !== 'object') return;
      
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        
        if (Array.isArray(value)) {
          if (value.length === 1) {
            // Added
            added++;
          } else if (value.length === 2) {
            // Modified
            modified++;
          } else if (value.length === 3 && value[2] === 0) {
            // Deleted
            deleted++;
          }
        } else if (typeof value === 'object' && value !== null) {
          traverse(value, [...path, key]);
        }
      });
    };
    
    if (delta) {
      traverse(delta);
    }
    
    const leftProps = countProperties(left);
    const rightProps = countProperties(right);
    const unchanged = Math.max(0, Math.min(leftProps, rightProps) - modified);
    
    return { added, modified, deleted, unchanged };
  };

  const countProperties = (obj: any): number => {
    if (typeof obj !== 'object' || obj === null) return 0;
    if (Array.isArray(obj)) {
      return obj.reduce((sum: number, item: any) => sum + countProperties(item), 0);
    }
    return Object.keys(obj).length + Object.values(obj).reduce((sum: number, value: any) => sum + countProperties(value), 0);
  };

  const swapInputs = () => {
    const temp = leftJson;
    setLeftJson(rightJson);
    setRightJson(temp);
  };

  const clearInputs = () => {
    setLeftJson('');
    setRightJson('');
    setDiffResult(null);
    setDiffHtml('');
    setError('');
    setStats(null);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const copyDiffAsJson = () => {
    if (diffResult) {
      copyToClipboard(JSON.stringify(diffResult, null, 2));
    }
  };

  useEffect(() => {
    // Auto-calculate diff when inputs change
    const timeoutId = setTimeout(() => {
      if (leftJson.trim() && rightJson.trim()) {
        calculateDiff();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [leftJson, rightJson, calculateDiff]);

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        JSON Diff Compare
      </Typography>

      {/* Input Section */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        {/* Left JSON Input */}
        <Paper elevation={1} sx={{ flex: 1, p: 2, height: '400px', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" color="primary">Original JSON</Typography>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Copy to Clipboard">
                <IconButton onClick={() => copyToClipboard(leftJson)} color="primary" size="small">
                  <ContentCopy />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
          
          <Box sx={{ flexGrow: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Editor
              height="100%"
              defaultLanguage="json"
              value={leftJson}
              onChange={(value) => setLeftJson(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                lineNumbers: 'on',
                wordWrap: 'on'
              }}
            />
          </Box>
        </Paper>

        {/* Swap Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
          <Tooltip title="Swap JSONs">
            <IconButton onClick={swapInputs} color="primary" size="large">
              <SwapHoriz />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Right JSON Input */}
        <Paper elevation={1} sx={{ flex: 1, p: 2, height: '400px', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" color="secondary">Modified JSON</Typography>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Copy to Clipboard">
                <IconButton onClick={() => copyToClipboard(rightJson)} color="primary" size="small">
                  <ContentCopy />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>
          
          <Box sx={{ flexGrow: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Editor
              height="100%"
              defaultLanguage="json"
              value={rightJson}
              onChange={(value) => setRightJson(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                lineNumbers: 'on',
                wordWrap: 'on'
              }}
            />
          </Box>
        </Paper>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          onClick={calculateDiff}
          startIcon={<CompareArrows />}
          size="large"
        >
          Compare JSONs
        </Button>
        <Button
          variant="outlined"
          onClick={clearInputs}
          startIcon={<Clear />}
        >
          Clear All
        </Button>
        {diffResult && (
          <Button
            variant="outlined"
            onClick={copyDiffAsJson}
            startIcon={<ContentCopy />}
          >
            Copy Diff as JSON
          </Button>
        )}
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics */}
      {stats && (
        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Diff Statistics</Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Chip 
              label={`Added: ${stats.added}`} 
              color="success" 
              variant="outlined" 
            />
            <Chip 
              label={`Modified: ${stats.modified}`} 
              color="warning" 
              variant="outlined" 
            />
            <Chip 
              label={`Deleted: ${stats.deleted}`} 
              color="error" 
              variant="outlined" 
            />
            <Chip 
              label={`Unchanged: ${stats.unchanged}`} 
              color="default" 
              variant="outlined" 
            />
          </Stack>
        </Paper>
      )}

      {/* Diff Result */}
      {diffHtml && (
        <Paper elevation={1} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Differences</Typography>
          <Divider sx={{ mb: 2 }} />
          <Box
            sx={{
              '& .jsondiffpatch-delta': {
                fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                fontSize: '13px',
                lineHeight: 1.6,
                border: '1px solid #ddd',
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '600px',
              },
              '& .jsondiffpatch-node': {
                position: 'relative',
              },
              '& .jsondiffpatch-property-name': {
                fontWeight: 'bold',
                color: '#0066cc',
              },
              '& .jsondiffpatch-added': {
                backgroundColor: '#d4edda !important',
                '& .jsondiffpatch-value': {
                  color: '#155724',
                  backgroundColor: '#c3e6cb',
                  padding: '2px 4px',
                  borderRadius: '3px',
                },
                '& .jsondiffpatch-property-name': {
                  color: '#155724',
                },
              },
              '& .jsondiffpatch-modified': {
                backgroundColor: '#fff3cd !important',
                '& .jsondiffpatch-left-value': {
                  backgroundColor: '#f8d7da',
                  color: '#721c24',
                  textDecoration: 'line-through',
                  padding: '2px 4px',
                  borderRadius: '3px',
                  marginRight: '8px',
                },
                '& .jsondiffpatch-right-value': {
                  backgroundColor: '#c3e6cb',
                  color: '#155724',
                  padding: '2px 4px',
                  borderRadius: '3px',
                },
                '& .jsondiffpatch-property-name': {
                  color: '#856404',
                },
              },
              '& .jsondiffpatch-deleted': {
                backgroundColor: '#f8d7da !important',
                '& .jsondiffpatch-value': {
                  color: '#721c24',
                  backgroundColor: '#f5c6cb',
                  textDecoration: 'line-through',
                  padding: '2px 4px',
                  borderRadius: '3px',
                },
                '& .jsondiffpatch-property-name': {
                  color: '#721c24',
                },
              },
              '& .jsondiffpatch-unchanged': {
                color: '#6c757d',
                fontStyle: 'italic',
                textAlign: 'center',
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
              },
              '& .jsondiffpatch-textdiff-location': {
                color: '#6c757d',
                fontSize: '11px',
              },
              '& .jsondiffpatch-textdiff-line': {
                display: 'block',
                marginBottom: '2px',
              },
              '& .jsondiffpatch-textdiff-line-number': {
                display: 'inline-block',
                width: '40px',
                textAlign: 'right',
                color: '#999',
                marginRight: '10px',
                fontSize: '11px',
              },
              '& ul': {
                listStyle: 'none',
                padding: '0',
                margin: '8px 0',
              },
              '& li': {
                padding: '4px 8px',
                margin: '2px 0',
                borderRadius: '3px',
              },
            }}
            dangerouslySetInnerHTML={{ __html: diffHtml }}
          />
        </Paper>
      )}
    </Box>
  );
};

export default JsonDiff;
