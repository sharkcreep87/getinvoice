'use client'

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, Scan, X, Loader2, Image as ImageIcon } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

type ReceiptScannerProps = {
  onScanComplete: (data: {
    vendor: string
    amount: number
    date: string
    description: string
    suggested_category: string
  }, receiptUrl: string) => void
  disabled?: boolean
}

export function ReceiptScanner({ onScanComplete, disabled }: ReceiptScannerProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileSelect = (selectedFile: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic']
    if (!allowedTypes.includes(selectedFile.type.toLowerCase())) {
      toast({
        title: "Invalid file type",
        description: "Please upload JPG, PNG, or HEIC images only",
        variant: "destructive",
      })
      return
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024
    if (selectedFile.size > maxSize) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      })
      return
    }

    setFile(selectedFile)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(selectedFile)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (disabled) return

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleScanReceipt = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please upload a receipt image first",
        variant: "destructive",
      })
      return
    }

    setScanning(true)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/scan-receipt', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to scan receipt')
      }

      if (data.success && data.data) {
        toast({
          title: "Success",
          description: "Receipt scanned successfully! Form auto-filled with extracted data.",
        })

        onScanComplete(data.data, data.receipt_url)
      } else {
        throw new Error('No data extracted from receipt')
      }
    } catch (error: any) {
      console.error('Scan error:', error)
      toast({
        title: "Scan failed",
        description: error.message || "Failed to scan receipt. You can still enter details manually.",
        variant: "destructive",
      })
    } finally {
      setScanning(false)
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {!file ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center cursor-pointer transition-colors ${
            disabled
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
              : 'border-primary/30 hover:border-primary/50 hover:bg-primary/5'
          }`}
        >
          <Upload className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-primary/60" />
          <p className="text-sm sm:text-base font-medium text-gray-700 mb-1">
            Upload Receipt (Optional)
          </p>
          <p className="text-xs sm:text-sm text-gray-500">
            Drag and drop or click to browse
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Supports JPG, PNG, HEIC (max 10MB)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/heic"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Preview */}
          <div className="relative border-2 border-primary/20 rounded-lg overflow-hidden">
            {preview && (
              <img
                src={preview}
                alt="Receipt preview"
                className="w-full h-48 sm:h-64 object-contain bg-gray-50"
              />
            )}
            <button
              onClick={handleRemoveFile}
              disabled={disabled || scanning}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* File info */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ImageIcon className="h-4 w-4" />
            <span className="truncate">{file.name}</span>
            <span className="text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
          </div>

          {/* Scan button */}
          <Button
            onClick={handleScanReceipt}
            disabled={disabled || scanning || uploading}
            className="w-full bg-gradient-to-r from-primary to-secondary text-white hover:from-primary/90 hover:to-secondary/90 hover:shadow-lg hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {scanning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Scanning Receipt...
              </>
            ) : uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Scan className="h-4 w-4 mr-2" />
                Scan Receipt with AI
              </>
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            AI will extract vendor, amount, date, and category from the receipt
          </p>
        </div>
      )}
    </div>
  )
}
