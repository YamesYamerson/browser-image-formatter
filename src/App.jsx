import { useState, useRef, useCallback } from 'react'
import { 
  FaUpload, 
  FaDownload, 
  FaCog, 
  FaImage, 
  FaTrash, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaExpand,
  FaCompress,
  FaCrop,
  FaFileImage,
  FaTimes,
  FaPlay,
  FaPause,
  FaSpinner
} from 'react-icons/fa'

function App() {
  const [files, setFiles] = useState([])
  const [outputFormat, setOutputFormat] = useState('webp')
  const [resizeMode, setResizeMode] = useState('none')
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [quality, setQuality] = useState(80)
  const [processedImages, setProcessedImages] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const [cropMode, setCropMode] = useState(false)
  const fileInputRef = useRef(null)

  const supportedFormats = ['jpg', 'jpeg', 'png', 'svg', 'webp', 'avif']
  const aspectRatios = ['16:9', '4:3', '3:2', '1:1', '3:4', '9:16']

  const handleFileSelect = useCallback((event) => {
    const selectedFiles = Array.from(event.target.files)
    const imageFiles = selectedFiles.filter(file => 
      file.type.startsWith('image/') && 
      supportedFormats.some(format => file.name.toLowerCase().endsWith(format))
    )
    
    setFiles(prev => [...prev, ...imageFiles])
  }, [supportedFormats])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    const imageFiles = droppedFiles.filter(file => 
      file.type.startsWith('image/') && 
      supportedFormats.some(format => file.name.toLowerCase().endsWith(format))
    )
    
    setFiles(prev => [...prev, ...imageFiles])
  }, [supportedFormats])

  const removeFile = useCallback((index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  const clearAllFiles = useCallback(() => {
    setFiles([])
    setProcessedImages([])
    setProcessingProgress(0)
  }, [])

  const processImages = async () => {
    if (files.length === 0) return

    setIsProcessing(true)
    setProcessingProgress(0)
    const processed = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        const processedImage = await processImage(file)
        processed.push({
          original: file,
          processed: processedImage,
          status: 'success'
        })
        setProcessingProgress(((i + 1) / files.length) * 100)
      } catch (error) {
        processed.push({
          original: file,
          error: error.message,
          status: 'error'
        })
        setProcessingProgress(((i + 1) / files.length) * 100)
      }
    }

    setProcessedImages(processed)
    setIsProcessing(false)
  }

  const processImage = (file) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        let newWidth = img.width
        let newHeight = img.height
        let sourceX = 0
        let sourceY = 0
        let sourceWidth = img.width
        let sourceHeight = img.height

        // Calculate new dimensions based on resize mode
        if (resizeMode === 'specific') {
          newWidth = parseInt(width) || img.width
          newHeight = parseInt(height) || img.height
        } else if (resizeMode === 'width') {
          newWidth = parseInt(width) || img.width
          newHeight = (img.height * newWidth) / img.width
        } else if (resizeMode === 'height') {
          newHeight = parseInt(height) || img.height
          newWidth = (img.width * newHeight) / img.height
        } else if (resizeMode === 'aspect') {
          const [ratioW, ratioH] = aspectRatio.split(':').map(Number)
          const targetRatio = ratioW / ratioH
          
          if (cropMode) {
            // Crop to fit aspect ratio
            const imgRatio = img.width / img.height
            if (imgRatio > targetRatio) {
              // Image is wider than target ratio, crop width
              sourceWidth = img.height * targetRatio
              sourceX = (img.width - sourceWidth) / 2
            } else {
              // Image is taller than target ratio, crop height
              sourceHeight = img.width / targetRatio
              sourceY = (img.height - sourceHeight) / 2
            }
            newWidth = parseInt(width) || sourceWidth
            newHeight = parseInt(height) || sourceHeight
          } else {
            // Fit within aspect ratio (letterbox/pillarbox)
            const imgRatio = img.width / img.height
            if (imgRatio > targetRatio) {
              newWidth = img.height * targetRatio
              newHeight = img.height
            } else {
              newWidth = img.width
              newHeight = img.width / targetRatio
            }
          }
        }

        canvas.width = newWidth
        canvas.height = newHeight

        // Fill with white background for transparent images
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, newWidth, newHeight)

        // Draw the image with new dimensions
        ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, newWidth, newHeight)

        // Convert to desired format
        let mimeType
        switch (outputFormat) {
          case 'jpg':
          case 'jpeg':
            mimeType = 'image/jpeg'
            break
          case 'png':
            mimeType = 'image/png'
            break
          case 'webp':
            mimeType = 'image/webp'
            break
          case 'avif':
            mimeType = 'image/avif'
            break
          default:
            mimeType = 'image/png'
        }

        canvas.toBlob((blob) => {
          if (blob) {
            const processedFile = new File([blob], 
              `${file.name.split('.')[0]}.${outputFormat}`, 
              { type: mimeType }
            )
            resolve(processedFile)
          } else {
            reject(new Error('Failed to process image'))
          }
        }, mimeType, quality / 100)
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }

  const downloadAll = () => {
    processedImages.forEach((item, index) => {
      if (item.status === 'success') {
        const url = URL.createObjectURL(item.processed)
        const a = document.createElement('a')
        a.href = url
        a.download = item.processed.name
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    })
  }

  const downloadSingle = (processedFile) => {
    const url = URL.createObjectURL(processedFile)
    const a = document.createElement('a')
    a.href = url
    a.download = processedFile.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen h-screen flex flex-col">
      {/* Header */}
      <header className="glass-effect border-b border-white/20">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                <FaImage className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Batch Image Processor
                </h1>
                <p className="text-sm text-gray-600">Convert and resize multiple images with ease</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <FaCog className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-600">v1.0</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-row items-stretch justify-center min-h-0 p-2 lg:p-6 gap-4">
        {/* Settings Panel */}
        <aside className="w-full max-w-xs flex-shrink-0 flex flex-col">
          <div className="card h-full flex flex-col border border-gray-200 shadow-sm p-4 lg:p-6">
            <div className="flex items-center mb-6">
              <FaCog className="w-5 h-5 mr-3 text-blue-600" />
              <h2 className="text-xl font-semibold">Settings</h2>
            </div>

            {/* Output Format */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Output Format
              </label>
              <select 
                value={outputFormat} 
                onChange={(e) => setOutputFormat(e.target.value)}
                className="select-field"
              >
                {supportedFormats.map(format => (
                  <option key={format} value={format}>
                    {format.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Resize Mode */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resize Mode
              </label>
              <select 
                value={resizeMode} 
                onChange={(e) => setResizeMode(e.target.value)}
                className="select-field"
              >
                <option value="none">No Resize</option>
                <option value="specific">Specific Size</option>
                <option value="width">Width Only</option>
                <option value="height">Height Only</option>
                <option value="aspect">Aspect Ratio</option>
              </select>
            </div>

            {/* Width and Height */}
            {resizeMode === 'specific' && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Width
                  </label>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    placeholder="Width"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Height
                  </label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="Height"
                    className="input-field"
                  />
                </div>
              </div>
            )}

            {/* Width Only */}
            {resizeMode === 'width' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Width
                </label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder="Width"
                  className="input-field"
                />
              </div>
            )}

            {/* Height Only */}
            {resizeMode === 'height' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="Height"
                  className="input-field"
                />
              </div>
            )}

            {/* Aspect Ratio */}
            {resizeMode === 'aspect' && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aspect Ratio
                  </label>
                  <select 
                    value={aspectRatio} 
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="select-field"
                  >
                    {aspectRatios.map(ratio => (
                      <option key={ratio} value={ratio}>
                        {ratio}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setCropMode(false)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      !cropMode 
                        ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                        : 'bg-gray-100 text-gray-600 border border-gray-300'
                    }`}
                  >
                    <FaExpand className="w-4 h-4 mr-1 inline" />
                    Fit
                  </button>
                  <button
                    onClick={() => setCropMode(true)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      cropMode 
                        ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                        : 'bg-gray-100 text-gray-600 border border-gray-300'
                    }`}
                  >
                    <FaCrop className="w-4 h-4 mr-1 inline" />
                    Crop
                  </button>
                </div>
                
                <div className="text-xs text-gray-500">
                  {cropMode 
                    ? "Crop images to fit the exact aspect ratio" 
                    : "Fit images within the aspect ratio (may add letterboxing)"
                  }
                </div>
              </div>
            )}

            {/* Quality */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quality: {quality}%
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* Process Button */}
            <button
              onClick={processImages}
              disabled={files.length === 0 || isProcessing}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isProcessing ? (
                <>
                  <FaSpinner className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FaPlay className="w-4 h-4 mr-2" />
                  Process Images
                </>
              )}
            </button>

            {/* Progress Bar */}
            {isProcessing && (
              <div className="mt-4">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${processingProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-2 text-center">
                  {Math.round(processingProgress)}% Complete
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="flex-1 flex flex-col">
          <div className="card h-full flex flex-col border border-gray-200 shadow-sm p-4 lg:p-8">
            {/* File Upload */}
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <FaUpload className="w-5 h-5 mr-3 text-blue-600" />
                  <h2 className="text-xl font-semibold">Upload Images</h2>
                </div>
                {files.length > 0 && (
                  <button
                    onClick={clearAllFiles}
                    className="btn-danger text-sm flex items-center"
                  >
                    <FaTrash className="w-4 h-4 mr-1" />
                    Clear All
                  </button>
                )}
              </div>

              <div 
                className={`file-drop-zone ${isDragOver ? 'dragover' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <FaFileImage className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Drop images here or click to browse</h3>
                <p className="text-gray-600 mb-4">
                  Supported formats: {supportedFormats.join(', ').toUpperCase()}
                </p>
                <button className="btn-primary">
                  <FaUpload className="w-4 h-4 mr-2" />
                  Select Images
                </button>
              </div>

              {files.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-4 flex items-center">
                    <FaImage className="w-4 h-4 mr-2 text-blue-600" />
                    Selected Files ({files.length})
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center flex-1 min-w-0">
                          <FaFileImage className="w-4 h-4 mr-3 text-gray-500 flex-shrink-0" />
                          <span className="text-sm truncate">{file.name}</span>
                          <span className="text-xs text-gray-500 ml-2">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <FaTimes className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Results */}
            {processedImages.length > 0 && (
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <FaDownload className="w-5 h-5 mr-3 text-green-600" />
                    <h2 className="text-xl font-semibold">Processed Images</h2>
                  </div>
                  <button
                    onClick={downloadAll}
                    className="btn-primary flex items-center"
                  >
                    <FaDownload className="w-4 h-4 mr-2" />
                    Download All
                  </button>
                </div>

                <div className="space-y-3">
                  {processedImages.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center flex-1 min-w-0">
                        {item.status === 'success' ? (
                          <FaCheckCircle className="w-5 h-5 mr-3 text-green-500 flex-shrink-0" />
                        ) : (
                          <FaExclamationTriangle className="w-5 h-5 mr-3 text-red-500 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.original.name}</p>
                          {item.status === 'success' && (
                            <p className="text-sm text-gray-600 truncate">
                              → {item.processed.name}
                            </p>
                          )}
                          {item.status === 'error' && (
                            <p className="text-sm text-red-600">
                              {item.error}
                            </p>
                          )}
                        </div>
                      </div>
                      {item.status === 'success' && (
                        <button
                          onClick={() => downloadSingle(item.processed)}
                          className="btn-secondary text-sm flex items-center ml-4"
                        >
                          <FaDownload className="w-4 h-4 mr-1" />
                          Download
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
