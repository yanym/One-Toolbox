import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  ToggleButton,
  ToggleButtonGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import GridWrapper from './GridWrapper';
import {
  SwapVert,
  ContentCopy,
  Clear,
  Info,
  ExpandMore,
  Upload,
  Download,
  Code,
  DataObject
} from '@mui/icons-material';
import Editor from '@monaco-editor/react';
import * as protobuf from 'protobufjs';

interface ProtoField {
  name: string;
  type: string;
  id: number;
  rule?: string;
  options?: any;
}

interface ProtoMessage {
  name: string;
  fields: ProtoField[];
}

const ProtobufConverter: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [protoSchema, setProtoSchema] = useState(`syntax = "proto3";

message Person {
  string name = 1;
  int32 id = 2;
  string email = 3;
  repeated string phone_numbers = 4;
}

message AddressBook {
  repeated Person people = 1;
}`);
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [encoding, setEncoding] = useState<'binary' | 'base64' | 'hex'>('base64');
  const [selectedMessage, setSelectedMessage] = useState('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [parsedMessages, setParsedMessages] = useState<ProtoMessage[]>([]);
  const [root, setRoot] = useState<protobuf.Root | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample data for demonstration
  const sampleData = {
    Person: {
      name: "John Doe",
      id: 123,
      email: "john.doe@example.com",
      phone_numbers: ["+1-555-0123", "+1-555-0456"]
    },
    AddressBook: {
      people: [
        {
          name: "John Doe",
          id: 123,
          email: "john.doe@example.com",
          phone_numbers: ["+1-555-0123"]
        },
        {
          name: "Jane Smith",
          id: 456,
          email: "jane.smith@example.com",
          phone_numbers: ["+1-555-0789"]
        }
      ]
    }
  };

  const parseProtoSchema = useCallback(async (schema: string) => {
    try {
      const newRoot = protobuf.parse(schema).root;
      
      const messages: ProtoMessage[] = [];
      
      // Extract message definitions
      const extractMessages = (namespace: protobuf.Namespace) => {
        for (const [name, nested] of Object.entries(namespace.nested || {})) {
          if (nested instanceof protobuf.Type) {
            const fields: ProtoField[] = [];
            for (const [fieldName, field] of Object.entries(nested.fields)) {
              fields.push({
                name: fieldName,
                type: field.type,
                id: field.id,
                rule: (field as any).rule,
                options: field.options
              });
            }
            messages.push({ name, fields });
          } else if (nested instanceof protobuf.Namespace) {
            extractMessages(nested);
          }
        }
      };
      
      extractMessages(newRoot);
      
      setParsedMessages(messages);
      setRoot(newRoot);
      setError('');
      setSuccess('Proto schema parsed successfully!');
      
      // Set default message if available
      if (messages.length > 0 && !messages.find(m => m.name === selectedMessage)) {
        setSelectedMessage(messages[0].name);
      }
      
      return newRoot;
    } catch (err: any) {
      setError(`Failed to parse proto schema: ${err.message}`);
      setParsedMessages([]);
      setRoot(null);
      return null;
    }
  }, [selectedMessage]);

  // Helper functions for browser-compatible encoding/decoding
  const base64ToUint8Array = (base64: string): Uint8Array => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const uint8ArrayToBase64 = (bytes: Uint8Array): string => {
    let binaryString = '';
    for (let i = 0; i < bytes.length; i++) {
      binaryString += String.fromCharCode(bytes[i]);
    }
    return btoa(binaryString);
  };

  const hexToUint8Array = (hex: string): Uint8Array => {
    const cleanHex = hex.replace(/\s/g, '');
    if (cleanHex.length % 2 !== 0) {
      throw new Error('Invalid hex format');
    }
    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
      bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
    }
    return bytes;
  };

  const uint8ArrayToHex = (bytes: Uint8Array): string => {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const convertData = useCallback(async (data: string, currentMode: 'encode' | 'decode') => {
    if (!root || !selectedMessage) {
      setError('Please parse a valid proto schema first');
      return;
    }

    if (!data.trim()) {
      setOutputText('');
      setError('');
      return;
    }

    try {
      const MessageType = root.lookupType(selectedMessage);
      
      if (currentMode === 'encode') {
        // Parse JSON input and encode to protobuf
        const jsonData = JSON.parse(data);
        const message = MessageType.create(jsonData);
        const buffer = MessageType.encode(message).finish();
        
        let encoded: string;
        switch (encoding) {
          case 'base64':
            encoded = uint8ArrayToBase64(buffer);
            break;
          case 'hex':
            encoded = uint8ArrayToHex(buffer);
            break;
          case 'binary':
            encoded = Array.from(buffer).map(b => b.toString(2).padStart(8, '0')).join(' ');
            break;
          default:
            encoded = uint8ArrayToBase64(buffer);
        }
        
        setOutputText(encoded);
        setError('');
        setSuccess('Data encoded successfully!');
      } else {
        // Decode protobuf data to JSON
        let buffer: Uint8Array;
        
        switch (encoding) {
          case 'base64':
            buffer = base64ToUint8Array(data);
            break;
          case 'hex':
            buffer = hexToUint8Array(data);
            break;
          case 'binary':
            const binaryStr = data.replace(/\s/g, '');
            if (binaryStr.length % 8 !== 0) {
              throw new Error('Invalid binary format');
            }
            const bytes = [];
            for (let i = 0; i < binaryStr.length; i += 8) {
              bytes.push(parseInt(binaryStr.substr(i, 8), 2));
            }
            buffer = new Uint8Array(bytes);
            break;
          default:
            buffer = base64ToUint8Array(data);
        }
        
        const message = MessageType.decode(buffer);
        const jsonData = MessageType.toObject(message, {
          longs: String,
          enums: String,
          bytes: String,
          defaults: true,
          arrays: true,
          objects: true
        });
        
        setOutputText(JSON.stringify(jsonData, null, 2));
        setError('');
        setSuccess('Data decoded successfully!');
      }
    } catch (err: any) {
      setError(`Conversion failed: ${err.message}`);
      setOutputText('');
      setSuccess('');
    }
  }, [root, selectedMessage, encoding]);

  const handleInputChange = (value: string | undefined) => {
    const newValue = value || '';
    setInputText(newValue);
    convertData(newValue, mode);
  };

  const handleSchemaChange = (value: string | undefined) => {
    const newValue = value || '';
    setProtoSchema(newValue);
  };

  const handleModeChange = (event: React.MouseEvent<HTMLElement>, newMode: 'encode' | 'decode' | null) => {
    if (newMode !== null) {
      setMode(newMode);
      convertData(inputText, newMode);
    }
  };

  const handleEncodingChange = (event: SelectChangeEvent) => {
    const newEncoding = event.target.value as 'binary' | 'base64' | 'hex';
    setEncoding(newEncoding);
    convertData(inputText, mode);
  };

  const handleMessageChange = (event: SelectChangeEvent) => {
    const newMessage = event.target.value;
    setSelectedMessage(newMessage);
    convertData(inputText, mode);
  };

  const swapInputOutput = () => {
    const temp = inputText;
    setInputText(outputText);
    setOutputText(temp);
    setMode(mode === 'encode' ? 'decode' : 'encode');
    convertData(outputText, mode === 'encode' ? 'decode' : 'encode');
  };

  const clearInput = () => {
    setInputText('');
    setOutputText('');
    setError('');
    setSuccess('');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const loadSampleData = () => {
    const sample = sampleData[selectedMessage as keyof typeof sampleData];
    if (sample) {
      const jsonString = JSON.stringify(sample, null, 2);
      setInputText(jsonString);
      convertData(jsonString, mode);
    }
  };

  const parseSchema = () => {
    parseProtoSchema(protoSchema);
  };

  const downloadProtoFile = () => {
    const blob = new Blob([protoSchema], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schema.proto';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const uploadProtoFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setProtoSchema(content);
        parseProtoSchema(content);
      };
      reader.readAsText(file);
    }
  };

  const getTextStats = (text: string) => {
    if (!text) return null;
    
    return {
      size: new TextEncoder().encode(text).length,
      lines: text.split('\n').length,
      characters: text.length
    };
  };

  const inputStats = getTextStats(inputText);
  const outputStats = getTextStats(outputText);

  // Parse schema on component mount
  useEffect(() => {
    parseProtoSchema(protoSchema);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Protocol Buffers Encoder & Decoder
      </Typography>

      {/* Proto Schema Section */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">Protocol Buffer Schema (.proto)</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  onClick={parseSchema}
                  startIcon={<Code />}
                >
                  Parse Schema
                </Button>
                <Button
                  variant="outlined"
                  onClick={downloadProtoFile}
                  startIcon={<Download />}
                >
                  Download .proto
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => fileInputRef.current?.click()}
                  startIcon={<Upload />}
                >
                  Upload .proto
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".proto"
                  style={{ display: 'none' }}
                  onChange={uploadProtoFile}
                />
              </Box>
              
              <Box sx={{ height: '200px', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Editor
                  height="100%"
                  defaultLanguage="protobuf"
                  value={protoSchema}
                  onChange={handleSchemaChange}
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

              {parsedMessages.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>Parsed Messages:</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {parsedMessages.map((msg) => (
                      <Chip
                        key={msg.name}
                        label={`${msg.name} (${msg.fields.length} fields)`}
                        variant={msg.name === selectedMessage ? "filled" : "outlined"}
                        color={msg.name === selectedMessage ? "primary" : "default"}
                      />
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Paper>

      <GridWrapper container spacing={3}>
        <GridWrapper item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 2, height: '600px', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                {mode === 'encode' ? 'JSON Input' : `${encoding.toUpperCase()} Input`}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Tooltip title="Load Sample Data">
                  <IconButton onClick={loadSampleData} color="primary">
                    <DataObject />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Swap Input/Output">
                  <IconButton onClick={swapInputOutput} color="primary">
                    <SwapVert />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Copy to Clipboard">
                  <IconButton onClick={() => copyToClipboard(inputText)} color="primary">
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
                defaultLanguage={mode === 'encode' ? 'json' : 'text'}
                value={inputText}
                onChange={handleInputChange}
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
              <Typography variant="h6">
                {mode === 'encode' ? `${encoding.toUpperCase()} Output` : 'JSON Output'}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Tooltip title="Copy to Clipboard">
                  <IconButton 
                    onClick={() => copyToClipboard(outputText)} 
                    color="primary"
                    disabled={!outputText}
                  >
                    <ContentCopy />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>
            
            <Box sx={{ flexGrow: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Editor
                height="100%"
                defaultLanguage={mode === 'encode' ? 'text' : 'json'}
                value={outputText}
                theme="vs-dark"
                options={{
                  readOnly: true,
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

        <GridWrapper item xs={12}>
          <Stack spacing={2}>
            {/* Controls */}
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>Configuration</Typography>
              <GridWrapper container spacing={2}>
                <GridWrapper item xs={12} md={4}>
                  <ToggleButtonGroup
                    value={mode}
                    exclusive
                    onChange={handleModeChange}
                    aria-label="conversion mode"
                    fullWidth
                  >
                    <ToggleButton value="encode" aria-label="encode">
                      Encode
                    </ToggleButton>
                    <ToggleButton value="decode" aria-label="decode">
                      Decode
                    </ToggleButton>
                  </ToggleButtonGroup>
                </GridWrapper>
                
                <GridWrapper item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Message Type</InputLabel>
                    <Select
                      value={selectedMessage}
                      label="Message Type"
                      onChange={handleMessageChange}
                      disabled={parsedMessages.length === 0}
                    >
                      {parsedMessages.map((msg) => (
                        <MenuItem key={msg.name} value={msg.name}>
                          {msg.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </GridWrapper>
                
                <GridWrapper item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Encoding Format</InputLabel>
                    <Select
                      value={encoding}
                      label="Encoding Format"
                      onChange={handleEncodingChange}
                    >
                      <MenuItem value="base64">Base64</MenuItem>
                      <MenuItem value="hex">Hexadecimal</MenuItem>
                      <MenuItem value="binary">Binary</MenuItem>
                    </Select>
                  </FormControl>
                </GridWrapper>
              </GridWrapper>
            </Paper>

            {/* Status Messages */}
            {error && (
              <Paper elevation={1} sx={{ p: 2 }}>
                <Alert severity="error">{error}</Alert>
              </Paper>
            )}
            
            {success && !error && (
              <Paper elevation={1} sx={{ p: 2 }}>
                <Alert severity="success">{success}</Alert>
              </Paper>
            )}

            {/* Statistics */}
            <GridWrapper container spacing={2}>
              {inputStats && (
                <GridWrapper item xs={12} md={6}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>Input Statistics</Typography>
                    <Stack spacing={1}>
                      <Chip label={`Size: ${inputStats.size} bytes`} variant="outlined" />
                      <Chip label={`Lines: ${inputStats.lines}`} variant="outlined" />
                      <Chip label={`Characters: ${inputStats.characters}`} variant="outlined" />
                    </Stack>
                  </Paper>
                </GridWrapper>
              )}

              {outputStats && (
                <GridWrapper item xs={12} md={6}>
                  <Paper elevation={1} sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>Output Statistics</Typography>
                    <Stack spacing={1}>
                      <Chip label={`Size: ${outputStats.size} bytes`} variant="outlined" />
                      <Chip label={`Lines: ${outputStats.lines}`} variant="outlined" />
                      <Chip label={`Characters: ${outputStats.characters}`} variant="outlined" />
                    </Stack>
                  </Paper>
                </GridWrapper>
              )}
            </GridWrapper>

            {/* Message Schema Display */}
            {parsedMessages.find(m => m.name === selectedMessage) && (
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedMessage} Schema
                </Typography>
                <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
                  {parsedMessages.find(m => m.name === selectedMessage)?.fields.map((field, index) => (
                    <Box key={index} sx={{ mb: 1 }}>
                      <Typography variant="body2" component="code">
                        {field.rule && `${field.rule} `}
                        <strong>{field.type}</strong> {field.name} = {field.id};
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            )}

            {/* Info */}
            <Paper elevation={1} sx={{ p: 2 }}>
              <Alert severity="info" icon={<Info />}>
                Protocol Buffers (protobuf) is a language-neutral, platform-neutral extensible mechanism 
                for serializing structured data. It's smaller, faster, and simpler than XML or JSON. 
                This tool supports proto2 and proto3 syntax and can encode/decode data in multiple formats.
              </Alert>
            </Paper>
          </Stack>
        </GridWrapper>
      </GridWrapper>
    </Box>
  );
};

export default ProtobufConverter;
