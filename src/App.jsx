import { useState, useRef } from 'react'
import { Upload, Download, Settings, Image, Trash2, CheckCircle, AlertCircle } from 'lucide-react'

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
  const fileInputRef = useRef(null)

  const supportedFormats = ['jpg', 'jpeg', 'png', 'svg', 'webp', 'avif']
  const aspectRatios = ['16:9', '4:3', '3:2', '1:1', '3:4', '9:16']

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files)
    const imageFiles = selectedFiles.filter(file => 
      file.type.startsWith('image/') && 
      supportedFormats.some(format => file.name.toLowerCase().endsWith(format))
    )
    
    setFiles(prev => [...prev, ...imageFiles])
  }

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const clearAllFiles = () => {
    setFiles([])
    setProcessedImages([])
  }

  const processImages = async () => {
    if (files.length === 0) return

    setIsProcessing(true)
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
      } catch (error) {
        processed.push({
          original: file,
          error: error.message,
          status: 'error'
        })
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
          const imgRatio = img.width / img.height
          const targetRatio = ratioW / ratioH

          if (imgRatio > targetRatio) {
            newWidth = img.height * targetRatio
            newHeight = img.height
          } else {
            newWidth = img.width
            newHeight = img.width / targetRatio
          }
        }

        canvas.width = newWidth
        canvas.height = newHeight

        // Draw the image with new dimensions
        ctx.drawImage(img, 0, 0, newWidth, newHeight)

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Batch Image Processor
          </h1>
          <p className="text-gray-600">
            Convert and resize multiple images with ease
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings Panel */}
          <div className="lg:col-span-1">
            <div className="card">
              <div className="flex items-center mb-4">
                <Settings className="w-5 h-5 mr-2 text-blue-600" />
                <h2 className="text-xl font-semibold">Settings</h2>
              </div>

              {/* Output Format */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Output Format
                </label>
                <select 
                  value={outputFormat} 
                  onChange={(e) => setOutputFormat(e.target.value)}
                  className="input-field"
                >
                  {supportedFormats.map(format => (
                    <option key={format} value={format}>
                      {format.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Resize Mode */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resize Mode
                </label>
                <select 
                  value={resizeMode} 
                  onChange={(e) => setResizeMode(e.target.value)}
                  className="input-field"
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
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                <div className="mb-4">
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
                <div className="mb-4">
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
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aspect Ratio
                  </label>
                  <select 
                    value={aspectRatio} 
                    onChange={(e) => setAspectRatio(e.target.value)}
                    className="input-field"
                  >
                    {aspectRatios.map(ratio => (
                      <option key={ratio} value={ratio}>
                        {ratio}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quality */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quality: {quality}%
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Process Button */}
              <button
                onClick={processImages}
                disabled={files.length === 0 || isProcessing}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Process Images'}
              </button>
            </div>
          </div>

          {/* File Upload and Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* File Upload */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Upload className="w-5 h-5 mr-2 text-blue-600" />
                  <h2 className="text-xl font-semibold">Upload Images</h2>
                </div>
                {files.length > 0 && (
                  <button
                    onClick={clearAllFiles}
                    className="btn-secondary text-sm"
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-primary mb-4"
                >
                  Select Images
                </button>
                <p className="text-gray-600">
                  Supported formats: {supportedFormats.join(', ').toUpperCase()}
                </p>
              </div>

              {files.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Selected Files ({files.length})</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center">
                          <Image className="w-4 h-4 mr-2 text-gray-500" />
                          <span className="text-sm">{file.name}</span>
                        </div>
                        <button
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
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
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Download className="w-5 h-5 mr-2 text-green-600" />
                    <h2 className="text-xl font-semibold">Processed Images</h2>
                  </div>
                  <button
                    onClick={downloadAll}
                    className="btn-primary"
                  >
                    Download All
                  </button>
                </div>

                <div className="space-y-3">
                  {processedImages.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center">
                        {item.status === 'success' ? (
                          <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                        ) : (
                          <AlertCircle className="w-5 h-5 mr-2 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium">{item.original.name}</p>
                          {item.status === 'success' && (
                            <p className="text-sm text-gray-600">
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
                          className="btn-secondary text-sm"
                        >
                          Download
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
