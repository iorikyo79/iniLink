# ConfigLink

A professional web-based configuration file editor supporting **INI**, **JSON**, and **XML** formats with advanced features including change tracking, validation, sharing capabilities, and real-time editing.

![ConfigLink](https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=1200&h=400&fit=crop)

## ✨ Features

### 📝 Multi-Format Support
- **INI Files**: Traditional configuration files with sections and key-value pairs
- **JSON Files**: JavaScript Object Notation with full object/array support
- **XML Files**: Extensible Markup Language with hierarchical structure
- **Universal Parser**: Automatic file type detection and format-specific validation

### 🔍 Advanced Editing
- **Unified Tree Structure**: Navigate all file types with an intuitive tree view
- **Real-time Validation**: Instant feedback on syntax errors and data type issues
- **Smart Type Detection**: Automatic detection of strings, numbers, booleans, objects, and arrays
- **Inline Editing**: Edit values directly with type-specific input controls

### 🔍 Advanced Search & Filtering
- **Global Search**: Search across all nodes and values
- **Node Filtering**: Filter nodes by name in the tree view
- **Modified Items Filter**: View only changed items with a single click
- **Search Highlighting**: Visual highlighting of search matches

### 📊 Change Management
- **Change Tracking**: Complete history of all modifications
- **Undo/Redo**: Full undo/redo support with history navigation
- **Change Comments**: Add comments to document your changes
- **Export Change Log**: Generate detailed change reports

### 🔗 Sharing & Collaboration
- **URL Sharing**: Share configurations via compressed URLs
- **Multi-Format Support**: Share any supported file format
- **No Server Required**: All data embedded in the URL for privacy
- **Cross-platform**: Works on any device with a web browser
- **Import/Export**: Standard file format support

### ✅ Validation & Quality
- **Format-Specific Validation**: Real-time syntax checking for each file type
- **Type Validation**: Ensure values match their expected types
- **Error Reporting**: Detailed error messages with path information
- **Data Sanitization**: Input sanitization for security

### 📱 Mobile Responsive
- **Touch-Friendly UI**: Optimized for mobile devices with proper touch targets
- **Collapsible Sidebar**: Mobile-friendly navigation with hamburger menu
- **Smooth Scrolling**: Auto-scroll to inputs on mobile for better UX
- **Responsive Design**: Adapts to all screen sizes from mobile to desktop

### 🔒 Security Features
- **Input Sanitization**: All input data is sanitized to prevent XSS attacks
- **Client-Side Processing**: No data sent to external servers
- **File Size Limits**: 10MB maximum file size for performance
- **Content Validation**: Comprehensive validation before processing

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd configlink
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 📖 Usage Guide

### Loading Configuration Files
1. **Drag & Drop**: Simply drag a configuration file onto the upload area
2. **File Browser**: Click "Choose File" to browse and select a file
3. **Shared URLs**: Open shared configuration URLs directly
4. **Supported Formats**: INI, JSON, XML, CFG, CONF, CONFIG, TXT

### Editing Configuration
1. **Navigate**: Use the tree view to browse nodes and values
2. **Select**: Click on any node to open the editor panel
3. **Edit**: Modify values using type-appropriate controls
4. **Data Types**: Support for string, number, boolean, object, array, and null types

### Managing Changes
- **View Changes**: Switch to the "Changes" tab to see all modifications
- **Add Comments**: Document your changes with descriptive comments
- **Undo/Redo**: Use toolbar buttons or keyboard shortcuts
- **Export Log**: Generate a detailed change report

### Sharing Configurations
1. **Click Share**: Use the "Share" button in the toolbar
2. **Copy URL**: Copy the generated URL to share with others
3. **Test**: Use "Test URL" to verify the link works correctly
4. **Multi-Format**: Works with all supported file formats

### Search & Filter
- **Global Search**: Use the toolbar search to find nodes across the entire structure
- **Node Filter**: Use the tree view filter to find specific nodes
- **Modified Filter**: Toggle "Show Modified Only" to focus on changes

### Mobile Usage
- **Hamburger Menu**: Tap the menu button to access the tree view on mobile
- **Touch Navigation**: All buttons and inputs are optimized for touch
- **Auto-scroll**: Inputs automatically scroll into view when focused

## 🛠️ Technical Details

### Built With
- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Full type safety and enhanced developer experience
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Vite**: Fast build tool and development server
- **Lucide React**: Beautiful, customizable icons

### Key Libraries
- **ini**: INI file parsing and serialization
- **xml2js**: XML parsing and conversion
- **js-beautify**: Code formatting and beautification
- **lz-string**: URL-safe compression for sharing

### Architecture
```
src/
├── components/          # React components
│   ├── UnifiedTreeView.tsx      # Universal tree navigation
│   ├── UnifiedEditorForm.tsx    # Multi-type value editing
│   ├── UnifiedChangeLog.tsx     # Change history display
│   ├── UnifiedFileUpload.tsx    # Multi-format file upload
│   ├── ShareModal.tsx           # URL sharing functionality
│   └── Toolbar.tsx              # Main toolbar with actions
├── hooks/              # Custom React hooks
│   └── useUnifiedEditor.ts      # Main editor state management
├── utils/              # Utility functions
│   ├── fileProcessor.ts         # File processing pipeline
│   ├── validation.ts            # Validation engine
│   ├── parsers/                 # Format-specific parsers
│   │   ├── iniParser.ts
│   │   ├── jsonParser.ts
│   │   └── xmlParser.ts
│   ├── serializers/             # Format-specific serializers
│   │   ├── iniSerializer.ts
│   │   ├── jsonSerializer.ts
│   │   └── xmlSerializer.ts
│   └── shareUtils.ts            # URL sharing utilities
├── types/              # TypeScript type definitions
│   └── unified.ts               # Unified data structures
└── App.tsx             # Main application component
```

## 🔧 Configuration

### Environment Variables
No environment variables required - the application runs entirely client-side.

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📝 File Format Support

### INI Files
- **Sections**: `[section_name]`
- **Key-Value Pairs**: `key=value`
- **Comments**: `;` and `#` style comments
- **Data Types**: Automatic detection of strings, numbers, booleans

### JSON Files
- **Objects**: Nested object structures
- **Arrays**: Array data with indexed access
- **Primitives**: Strings, numbers, booleans, null
- **Validation**: Full JSON syntax validation

### XML Files
- **Elements**: Hierarchical element structure
- **Attributes**: Element attributes support
- **Text Content**: Element text content
- **Namespaces**: Basic namespace support

### Validation Rules
- Format-specific syntax validation
- Data type validation and conversion
- File size limits (10MB maximum)
- Input sanitization for security

## 🔒 Security Considerations

### Input Sanitization
- All file content is sanitized before processing
- XSS prevention through content filtering
- Script tag removal and dangerous content blocking

### Data Privacy
- No data sent to external servers
- All processing happens client-side
- Share URLs contain compressed data only

### File Validation
- File size limits enforced
- Content type validation
- Malicious content detection

## ⚡ Performance Optimization

### Lazy Loading
- Parser modules loaded on demand
- Large file handling with virtual scrolling
- Efficient memory management

### Caching
- Parsed results cached for performance
- Validation results memoized
- Search results optimized

### Compression
- Share URLs use LZ-String compression
- Efficient data serialization
- Minimal payload sizes

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm run test`
5. Run linting: `npm run lint`
6. Commit changes: `git commit -m 'Add amazing feature'`
7. Push to branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Code Style
- Use TypeScript for all new code
- Follow existing component patterns
- Add proper type definitions
- Include error handling
- Write descriptive commit messages

### Testing
- Unit tests for parsers and serializers
- Integration tests for file processing
- Validation tests for all supported formats
- Error boundary testing

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Pexels](https://pexels.com) for stock photography
- [Lucide](https://lucide.dev) for beautiful icons
- [Tailwind CSS](https://tailwindcss.com) for styling utilities
- [Vite](https://vitejs.dev) for build tooling
- [xml2js](https://github.com/Leonidas-from-XIV/node-xml2js) for XML parsing

## 📞 Support

If you encounter any issues or have questions:

1. **Check the Issues**: Look for existing solutions in the GitHub issues
2. **Create an Issue**: Report bugs or request features
3. **Documentation**: Review this README and inline code comments

## 🗺️ Roadmap

### Upcoming Features
- [ ] YAML format support
- [ ] TOML format support
- [ ] Advanced validation rules
- [ ] Export to different formats
- [ ] Syntax highlighting
- [ ] Keyboard shortcuts
- [ ] Dark mode theme
- [ ] Collaborative editing
- [ ] Plugin system
- [ ] API integration
- [ ] Batch file processing

### Version History
- **v2.0.0**: Multi-format support (INI, JSON, XML) with unified editor
- **v1.3.0**: Mobile responsive design and touch optimization
- **v1.2.0**: Enhanced search and filtering capabilities
- **v1.1.0**: Added sharing functionality and validation
- **v1.0.0**: Initial release with INI editing features

---

**Made with ❤️ for the developer community**

*ConfigLink - Your Universal Configuration Management Solution*