# Batch Image Processor

A modern, browser-based batch image processor built with React and Vite. Process multiple images simultaneously with format conversion and flexible resizing options.

## Features

### 🖼️ Image Format Support
- **Input formats**: JPG, JPEG, PNG, SVG, WebP, AVIF
- **Output formats**: JPG, JPEG, PNG, WebP, AVIF
- **Note**: SVG files can be converted to raster formats but not vice versa

### 📏 Resizing Options
- **No Resize**: Keep original dimensions
- **Specific Size**: Set exact width and height
- **Width Only**: Resize to specific width, maintain aspect ratio
- **Height Only**: Resize to specific height, maintain aspect ratio
- **Aspect Ratio**: Resize to common aspect ratios (16:9, 4:3, 3:2, 1:1, 3:4, 9:16)

### ⚙️ Quality Control
- Adjustable quality slider (1-100%)
- Optimized for file size vs quality balance

### 🚀 Batch Processing
- Upload multiple images at once
- Process all images with the same settings
- Individual or bulk download options
- Real-time progress feedback

## Getting Started

### Prerequisites
- Node.js (version 18 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd browser-image-formatter
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

1. **Upload Images**: Click "Select Images" to choose one or more image files
2. **Configure Settings**:
   - Select output format (JPG, PNG, WebP, AVIF)
   - Choose resize mode and parameters
   - Adjust quality settings
3. **Process**: Click "Process Images" to convert and resize your images
4. **Download**: Download individual files or all processed images at once

## Technical Details

### Browser Compatibility
- Modern browsers with Canvas API support
- WebP and AVIF support varies by browser
- SVG processing requires modern browser support

### Performance
- Client-side processing (no server required)
- Images are processed in the browser using Canvas API
- Large batches may take time depending on image sizes and quantity

### File Handling
- All processing happens locally in the browser
- No files are uploaded to external servers
- Original files remain unchanged

## Development

### Project Structure
```
src/
├── App.jsx          # Main application component
├── index.css        # Tailwind CSS styles
└── main.jsx         # Application entry point
```

### Technologies Used
- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Styling
- **Lucide React**: Icons
- **Canvas API**: Image processing

### Customization

The application is built with modularity in mind. You can easily:

- Add new output formats by extending the `processImage` function
- Modify resize algorithms in the dimension calculation logic
- Add new aspect ratios to the `aspectRatios` array
- Customize the UI using Tailwind CSS classes

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
