import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  Tooltip,
  Stack,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab
} from '@mui/material';
import GridWrapper from './GridWrapper';
import {
  ContentCopy,
  Clear,
  SwapHoriz,
  Code,
  DataObject
} from '@mui/icons-material';
import Editor from '@monaco-editor/react';

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
      id={`serializer-tabpanel-${index}`}
      aria-labelledby={`serializer-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const JsonSerializer: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [jsonInput, setJsonInput] = useState('{\n  "name": "John Doe",\n  "age": 30,\n  "active": true,\n  "hobbies": ["reading", "coding"]\n}');
  const [output, setOutput] = useState('');
  const [outputFormat, setOutputFormat] = useState('javascript');
  const [error, setError] = useState('');

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const serializeJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      let serialized = '';

      switch (outputFormat) {
        case 'javascript':
          serialized = generateJavaScript(parsed);
          break;
        case 'typescript':
          serialized = generateTypeScript(parsed);
          break;
        case 'python':
          serialized = generatePython(parsed);
          break;
        case 'java':
          serialized = generateJava(parsed);
          break;
        case 'csharp':
          serialized = generateCSharp(parsed);
          break;
        case 'go':
          serialized = generateGo(parsed);
          break;
        default:
          serialized = JSON.stringify(parsed, null, 2);
      }

      setOutput(serialized);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Invalid JSON');
      setOutput('');
    }
  };

  const deserializeToJson = () => {
    try {
      // Simple deserialization - in a real app, you'd need proper parsers for each language
      let result = '';
      
      if (outputFormat === 'javascript' || outputFormat === 'typescript') {
        // Extract object from JavaScript/TypeScript code
        const match = jsonInput.match(/=\s*({[\s\S]*});?\s*$/);
        if (match) {
          result = match[1];
        } else {
          throw new Error('Could not parse JavaScript/TypeScript object');
        }
      } else {
        // For other languages, this would need specific parsers
        throw new Error(`Deserialization from ${outputFormat} not implemented`);
      }

      const parsed = JSON.parse(result);
      setOutput(JSON.stringify(parsed, null, 2));
      setError('');
    } catch (err: any) {
      setError(err.message || 'Could not deserialize');
      setOutput('');
    }
  };

  const generateJavaScript = (obj: any): string => {
    return `const data = ${JSON.stringify(obj, null, 2)};`;
  };

  const generateTypeScript = (obj: any): string => {
    const interfaceDef = generateTypeScriptInterface(obj, 'DataType');
    return `${interfaceDef}\n\nconst data: DataType = ${JSON.stringify(obj, null, 2)};`;
  };

  const generateTypeScriptInterface = (obj: any, name: string): string => {
    if (typeof obj !== 'object' || obj === null) return '';
    
    const properties = Object.entries(obj).map(([key, value]) => {
      const type = getTypeScriptType(value);
      return `  ${key}: ${type};`;
    }).join('\n');

    return `interface ${name} {\n${properties}\n}`;
  };

  const getTypeScriptType = (value: any): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) {
      if (value.length === 0) return 'any[]';
      const firstType = getTypeScriptType(value[0]);
      return `${firstType}[]`;
    }
    if (typeof value === 'object') return 'object';
    return typeof value;
  };

  const generatePython = (obj: any): string => {
    const pythonObj = JSON.stringify(obj, null, 2)
      .replace(/true/g, 'True')
      .replace(/false/g, 'False')
      .replace(/null/g, 'None');
    return `data = ${pythonObj}`;
  };

  const generateJava = (obj: any): string => {
    return `// Java representation (using Jackson or similar library)
import com.fasterxml.jackson.databind.ObjectMapper;

String jsonString = ${JSON.stringify(JSON.stringify(obj))};
ObjectMapper mapper = new ObjectMapper();
// Define your POJO class and deserialize:
// YourClass data = mapper.readValue(jsonString, YourClass.class);`;
  };

  const generateCSharp = (obj: any): string => {
    return `// C# representation (using Newtonsoft.Json)
using Newtonsoft.Json;

string jsonString = ${JSON.stringify(JSON.stringify(obj))};
// Define your class and deserialize:
// var data = JsonConvert.DeserializeObject<YourClass>(jsonString);`;
  };

  const generateGo = (obj: any): string => {
    return `// Go representation
package main

import (
    "encoding/json"
    "fmt"
)

func main() {
    jsonString := ${JSON.stringify(JSON.stringify(obj))}
    
    // Define your struct and unmarshal:
    // var data YourStruct
    // json.Unmarshal([]byte(jsonString), &data)
}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const clearInput = () => {
    setJsonInput('');
    setOutput('');
    setError('');
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        JSON Serializer & Deserializer
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab icon={<Code />} label="Serialize" iconPosition="start" />
          <Tab icon={<DataObject />} label="Deserialize" iconPosition="start" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <GridWrapper container spacing={3}>
          <GridWrapper item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 2, height: '600px', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">JSON Input</Typography>
                <Stack direction="row" spacing={1}>
                  <Tooltip title="Copy to Clipboard">
                    <IconButton onClick={() => copyToClipboard(jsonInput)} color="primary">
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
                  defaultLanguage="json"
                  value={jsonInput}
                  onChange={(value) => setJsonInput(value || '')}
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
          </GridWrapper>

          <GridWrapper item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 2, height: '600px', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Generated Code</Typography>
                <Stack direction="row" spacing={1}>
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Language</InputLabel>
                    <Select
                      value={outputFormat}
                      label="Language"
                      onChange={(e) => setOutputFormat(e.target.value)}
                    >
                      <MenuItem value="javascript">JavaScript</MenuItem>
                      <MenuItem value="typescript">TypeScript</MenuItem>
                      <MenuItem value="python">Python</MenuItem>
                      <MenuItem value="java">Java</MenuItem>
                      <MenuItem value="csharp">C#</MenuItem>
                      <MenuItem value="go">Go</MenuItem>
                    </Select>
                  </FormControl>
                  <Button
                    variant="contained"
                    onClick={serializeJson}
                    startIcon={<SwapHoriz />}
                  >
                    Serialize
                  </Button>
                  <Tooltip title="Copy to Clipboard">
                    <IconButton onClick={() => copyToClipboard(output)} color="primary">
                      <ContentCopy />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              
              <Box sx={{ flexGrow: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Editor
                  height="100%"
                  defaultLanguage={outputFormat === 'csharp' ? 'csharp' : outputFormat}
                  value={output}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    readOnly: true
                  }}
                />
              </Box>
            </Paper>
          </GridWrapper>
        </GridWrapper>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <GridWrapper container spacing={3}>
          <GridWrapper item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 2, height: '600px', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Code Input</Typography>
                <Stack direction="row" spacing={1}>
                  <FormControl size="small" sx={{ minWidth: 140 }}>
                    <InputLabel>Language</InputLabel>
                    <Select
                      value={outputFormat}
                      label="Language"
                      onChange={(e) => setOutputFormat(e.target.value)}
                    >
                      <MenuItem value="javascript">JavaScript</MenuItem>
                      <MenuItem value="typescript">TypeScript</MenuItem>
                    </Select>
                  </FormControl>
                  <Tooltip title="Copy to Clipboard">
                    <IconButton onClick={() => copyToClipboard(jsonInput)} color="primary">
                      <ContentCopy />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>
              
              <Box sx={{ flexGrow: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Editor
                  height="100%"
                  defaultLanguage={outputFormat}
                  value={jsonInput}
                  onChange={(value) => setJsonInput(value || '')}
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
          </GridWrapper>

          <GridWrapper item xs={12} md={6}>
            <Paper elevation={1} sx={{ p: 2, height: '600px', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">JSON Output</Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    onClick={deserializeToJson}
                    startIcon={<SwapHoriz />}
                  >
                    Deserialize
                  </Button>
                  <Tooltip title="Copy to Clipboard">
                    <IconButton onClick={() => copyToClipboard(output)} color="primary">
                      <ContentCopy />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              
              <Box sx={{ flexGrow: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Editor
                  height="100%"
                  defaultLanguage="json"
                  value={output}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    readOnly: true
                  }}
                />
              </Box>
            </Paper>
          </GridWrapper>
        </GridWrapper>
      </TabPanel>
    </Box>
  );
};

export default JsonSerializer;
