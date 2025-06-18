# ConfigLink

A professional web-based INI file editor with advanced features including change tracking, validation, sharing capabilities, and real-time editing.

![ConfigLink](https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=1200&h=400&fit=crop)

## ✨ Features

### 📝 Core Editing
- **Visual Tree Structure**: Navigate INI files with an intuitive tree view
- **Real-time Validation**: Instant feedback on syntax errors and data type issues
- **Smart Type Detection**: Automatic detection of strings, numbers, and booleans
- **Inline Editing**: Edit values directly with type-specific input controls

### 🔍 Advanced Search & Filtering
- **Global Search**: Search across all sections and keys
- **Section Filtering**: Filter sections by name in the tree view
- **Modified Items Filter**: View only changed items with a single click
- **Search Highlighting**: Visual highlighting of search matches

### 📊 Change Management
- **Change Tracking**: Complete history of all modifications
- **Undo/Redo**: Full undo/redo support with history navigation
- **Change Comments**: Add comments to document your changes
- **Export Change Log**: Generate detailed change reports

### 🔗 Sharing & Collaboration
- **URL Sharing**: Share configurations via compressed URLs
- **No Server Required**: All data embedded in the URL for privacy
- **Cross-platform**: Works on any device with a web browser
- **Import/Export**: Standard INI file format support

### ✅ Validation & Quality
- **Syntax Validation**: Real-time INI syntax checking
- **Duplicate Detection**: Identify duplicate keys and sections
- **Type Validation**: Ensure values match their expected types
- **Error Reporting**: Detailed error messages with line numbers

### 📱 Mobile Responsive
- **Touch-Friendly UI**: Optimized for mobile devices with proper touch targets
- **Collapsible Sidebar**: Mobile-friendly navigation with hamburger menu
- **Smooth Scrolling**: Auto-scroll to inputs on mobile for better UX
- **Responsive Design**: Adapts to all screen sizes from mobile to desktop

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

### Loading INI Files
1. **Drag & Drop**: Simply drag an INI file onto the upload area
2. **File Browser**: Click "Choose File" to browse and select an INI file
3. **Shared URLs**: Open shared configuration URLs directly

### Editing Configuration
1. **Navigate**: Use the tree view to browse sections and keys
2. **Select**: Click on any key to open the editor panel
3. **Edit**: Modify values using type-appropriate controls
4. **Save**: Click "Save Changes" to apply modifications

### Managing Changes
- **View Changes**: Switch to the "Changes" tab to see all modifications
- **Add Comments**: Document your changes with descriptive comments
- **Undo/Redo**: Use toolbar buttons or keyboard shortcuts
- **Export Log**: Generate a detailed change report

### Sharing Configurations
1. **Click Share**: Use the "Share" button in the toolbar
2. **Copy URL**: Copy the generated URL to share with others
3. **Test**: Use "Test URL" to verify the link works correctly

### Search & Filter
- **Global Search**: Use the toolbar search to find keys across all sections
- **Section Filter**: Use the tree view filter to find specific sections
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
- **lz-string**: URL-safe compression for sharing
- **React Hooks**: State management and side effects

### Architecture
```
src/
├── components/          # React components
│   ├── TreeView.tsx    # File structure navigation
│   ├── EditorForm.tsx  # Key-value editing interface
│   ├── ChangeLog.tsx   # Change history display
│   ├── ShareModal.tsx  # URL sharing functionality
│   ├── Toolbar.tsx     # Main toolbar with actions
│   └── FileUpload.tsx  # File upload interface
├── hooks/              # Custom React hooks
│   └── useIniEditor.ts # Main editor state management
├── utils/              # Utility functions
│   ├── iniParser.ts    # INI parsing and validation
│   └── shareUtils.ts   # URL sharing utilities
├── types/              # TypeScript type definitions
│   └── ini.ts          # INI data structures
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

### Supported INI Features
- **Sections**: `[section_name]`
- **Key-Value Pairs**: `key=value`
- **Comments**: `;` and `#` style comments
- **Data Types**: Automatic detection of strings, numbers, booleans
- **Boolean Values**: `true/false`, `1/0`, `yes/no`, `on/off`

### Validation Rules
- Section names cannot be empty or contain `[]` characters
- Key names cannot be empty or contain `=[]` characters
- Boolean values must use recognized formats
- Numbers must be finite and valid
- No duplicate keys within sections

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm run lint`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style
- Use TypeScript for all new code
- Follow existing component patterns
- Add proper type definitions
- Include error handling
- Write descriptive commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Pexels](https://pexels.com) for stock photography
- [Lucide](https://lucide.dev) for beautiful icons
- [Tailwind CSS](https://tailwindcss.com) for styling utilities
- [Vite](https://vitejs.dev) for build tooling

## 📞 Support

If you encounter any issues or have questions:

1. **Check the Issues**: Look for existing solutions in the GitHub issues
2. **Create an Issue**: Report bugs or request features
3. **Documentation**: Review this README and inline code comments

## 🗺️ Roadmap

### Upcoming Features
- [ ] Multiple file support
- [ ] Advanced validation rules
- [ ] Export to different formats (JSON, YAML)
- [ ] Syntax highlighting
- [ ] Keyboard shortcuts
- [ ] Dark mode theme
- [ ] Collaborative editing
- [ ] Plugin system

### Version History
- **v1.0.0**: Initial release with core editing features
- **v1.1.0**: Added sharing functionality and validation
- **v1.2.0**: Enhanced search and filtering capabilities
- **v1.3.0**: Mobile responsive design and touch optimization

---

**Made with ❤️ for the developer community**