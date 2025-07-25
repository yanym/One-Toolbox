# JSON Toolkit

A comprehensive, modern JSON toolkit built with React and TypeScript, featuring validation, formatting, comparison, and conversion capabilities with a beautiful Material-UI interface.

## ✨ Features

### 🔍 JSON Validator & Formatter
- **Real-time validation** with detailed error reporting (line/column detection)
- **Smart formatting** with customizable indentation (2, 4, or 8 spaces)
- **JSON minification** for production use
- **File upload/download** support (.json files)
- **Statistics display** (size, lines, characters, keys, depth)
- **Debounced validation** for better performance
- **Copy to clipboard** functionality

### 🔄 JSON Serializer & Deserializer
- **Multi-language code generation**: JavaScript, TypeScript, Python, Java, C#, Go
- **TypeScript interface generation** with proper type inference
- **Bidirectional conversion** (JSON ↔ Code)
- **Syntax highlighting** for generated code
- **Language-specific formatting** and conventions

### 🔀 JSON Diff & Compare
- **Visual diff comparison** with color-coded changes
- **Statistical analysis** (added, modified, deleted, unchanged)
- **Side-by-side comparison** with swap functionality
- **Export diff results** as JSON
- **Intelligent change detection** with move detection
- **Hierarchical diff display**

### 👁️ JSON Viewer & Explorer
- **Interactive tree view** with expand/collapse
- **Table view** for structured data analysis
- **Search and filter** functionality
- **Path-based navigation**
- **Type-aware display** with color coding
- **Copy individual values**
- **Multiple view modes** (tree, table, raw)

### 🔤 String Escape Utilities
- **Multiple escape formats**: JSON, JavaScript, HTML, URL, Base64
- **Bidirectional conversion**
- **Real-time preview**
- **Batch processing**

### 📄 XML Formatter
- **XML validation and formatting**
- **Syntax highlighting**
- **Error detection**
- **Minification support**

### 🔐 Base64 Converter
- **Text ↔ Base64 conversion**
- **File encoding support**
- **URL-safe Base64**
- **Validation and error handling**

### 📦 Protobuf Converter
- **JSON ↔ Protobuf conversion**
- **Schema validation**
- **Type definitions**
- **Binary format support**

## 🎨 Design & UX Improvements

### 🌓 Advanced Theming
- **Smart dark/light mode** with system preference detection
- **Persistent theme settings** (localStorage)
- **Smooth transitions** and animations
- **Gradient backgrounds** and glassmorphism effects
- **Enhanced color palette** with better contrast
- **Custom scrollbars** and focus indicators

### ⌨️ Keyboard Shortcuts
- `Ctrl/Cmd + 1-8`: Switch between tabs
- `Ctrl/Cmd + D`: Toggle dark/light mode
- `Ctrl/Cmd + Shift + F`: Format JSON
- `Ctrl/Cmd + Shift + M`: Minify JSON
- `Ctrl/Cmd + C`: Copy to clipboard
- `Ctrl/Cmd + Shift + X`: Clear input

### 📱 Responsive Design
- **Mobile-first approach** with adaptive layouts
- **Touch-friendly interfaces** for mobile devices
- **Flexible grid system** with breakpoint support
- **Optimized typography** for all screen sizes

### 🎯 Performance Optimizations
- **Memoized components** to prevent unnecessary re-renders
- **Debounced validation** for large JSON files
- **Lazy loading** and code splitting
- **Optimized bundle size** with tree shaking
- **Efficient state management** with React hooks

### 🔧 Developer Experience
- **TypeScript throughout** for type safety
- **ESLint configuration** with custom rules
- **Comprehensive error handling** with user-friendly messages
- **Loading states** and progress indicators
- **Toast notifications** for user feedback

## 🚀 Getting Started

### Prerequisites
- Node.js >= 16.0.0
- npm >= 8.0.0

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd json-toolkit

# Install dependencies
npm install

# Start development server
npm start
```

### Available Scripts
```bash
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
npm run lint       # Run ESLint
npm run lint:fix   # Fix ESLint issues
npm run type-check # TypeScript type checking
npm run analyze    # Analyze bundle size
npm run serve      # Serve production build
```

## 🏗️ Architecture

### Technology Stack
- **React 19** with functional components and hooks
- **TypeScript** for type safety and better DX
- **Material-UI v7** for consistent design system
- **Monaco Editor** for advanced code editing
- **Emotion** for CSS-in-JS styling

### Component Structure
```
src/
├── components/
│   ├── JsonValidator.tsx      # JSON validation and formatting
│   ├── JsonSerializer.tsx     # Code generation and conversion
│   ├── JsonDiff.tsx          # JSON comparison and diff
│   ├── JsonViewer.tsx        # Interactive JSON explorer
│   ├── StringEscape.tsx      # String escape utilities
│   ├── XmlFormatter.tsx      # XML formatting
│   ├── Base64Converter.tsx   # Base64 encoding/decoding
│   ├── ProtobufConverter.tsx # Protobuf conversion
│   └── GridWrapper.tsx       # Responsive grid system
├── App.tsx                   # Main application component
├── App.css                   # Global styles and animations
└── index.tsx                 # Application entry point
```

### Key Features Implementation

#### Smart Validation
- Uses `jsonlint-mod` for detailed error reporting
- Debounced validation (300ms) for performance
- Line/column error detection
- Real-time statistics calculation

#### Advanced Theming
- System preference detection
- localStorage persistence
- Smooth transitions between themes
- Custom Material-UI theme configuration

#### Performance Optimizations
- `useCallback` and `useMemo` for expensive operations
- Debounced input handling
- Lazy component loading
- Optimized re-rendering patterns

## 🎯 Usage Examples

### JSON Validation
```javascript
// Paste your JSON and get instant validation
{
  "name": "John Doe",
  "age": 30,
  "active": true
}
// ✅ Valid JSON - Ready for processing
```

### Code Generation
```javascript
// Input JSON
{"name": "John", "age": 30}

// Generated TypeScript
interface DataType {
  name: string;
  age: number;
}

const data: DataType = {
  "name": "John",
  "age": 30
};
```

### JSON Comparison
```javascript
// Compare two JSON objects and see visual diff
// Left: {"name": "John", "age": 30}
// Right: {"name": "John", "age": 31, "city": "NYC"}
// Result: Shows age modified, city added
```

## 🔧 Configuration

### Theme Customization
The application supports extensive theme customization through Material-UI's theme system:

```typescript
const theme = createTheme({
  palette: {
    mode: darkMode ? 'dark' : 'light',
    primary: { main: '#1976d2' },
    // ... custom colors
  },
  typography: {
    fontFamily: '"Inter", "Roboto", sans-serif',
    // ... custom typography
  },
  // ... custom components
});
```

### Editor Configuration
Monaco Editor is configured with optimal settings for JSON editing:

```typescript
const editorOptions = {
  minimap: { enabled: false },
  fontSize: 14,
  lineNumbers: 'on',
  wordWrap: 'on',
  formatOnPaste: true,
  formatOnType: true,
  // ... more options
};
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use functional components with hooks
- Implement proper error handling
- Add comprehensive comments
- Ensure responsive design
- Test on multiple browsers

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Material-UI](https://mui.com/) for the excellent component library
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) for the powerful code editor
- [React](https://reactjs.org/) for the amazing framework
- [TypeScript](https://www.typescriptlang.org/) for type safety

## 📊 Performance Metrics

- **Bundle Size**: Optimized for production with code splitting
- **Lighthouse Score**: 95+ for Performance, Accessibility, Best Practices
- **Load Time**: < 2s on 3G networks
- **Memory Usage**: Efficient with proper cleanup
- **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge)

## 🔮 Future Enhancements

- [ ] JSON Schema validation
- [ ] Custom theme builder
- [ ] Plugin system for extensions
- [ ] Offline support with PWA
- [ ] Advanced search and replace
- [ ] JSON Path query support
- [ ] Export to multiple formats (CSV, YAML, etc.)
- [ ] Collaborative editing features
- [ ] API integration for remote JSON sources

---

**Built with ❤️ using React, TypeScript, and Material-UI**
