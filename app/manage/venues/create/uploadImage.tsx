import React, { useRef, useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';

interface MediaUploadProps {
  multiple?: boolean;
  accept?: string;
  onChange: (files: FileList | null) => void;
  value?: File[];
}

const MediaUpload: React.FC<MediaUploadProps> = ({ multiple = false, accept = 'image/*', onChange, value }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>(value || []);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      // If multiple is true, append new files to existing ones
      const newFiles = multiple ? [...selectedFiles, ...fileArray] : fileArray;
      setSelectedFiles(newFiles);
      
      // Convert FileList to new FileList for onChange
      const dataTransfer = new DataTransfer();
      newFiles.forEach(file => dataTransfer.items.add(file));
      onChange(dataTransfer.files);
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    const newFiles = selectedFiles.filter((_, index) => index !== indexToRemove);
    setSelectedFiles(newFiles);

    // Convert remaining files to new FileList
    const dataTransfer = new DataTransfer();
    newFiles.forEach(file => dataTransfer.items.add(file));
    onChange(dataTransfer.files);
  };

  useEffect(() => {
    if (!selectedFiles.length) {
      setPreviewUrls([]);
      return;
    }
    const urls = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => {
      urls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

  return (
    <div className="w-full">
      <div className={`bg-gray-50 rounded-lg p-4 w-full ${!previewUrls.length ? 'border-2 border-dashed border-gray-300' : ''}`}>
        {previewUrls.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {previewUrls.map((url, idx) => (
              <div key={idx} className="relative group aspect-square">
                {accept.startsWith('video') ? (
                  <video 
                    src={url} 
                    controls 
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <img 
                      src={url} 
                      alt={`Selected ${idx + 1}`} 
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg" />
                  </div>
                )}
              </div>
            ))}
            {multiple && (
              <button
                type="button"
                onClick={handleButtonClick}
                className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
              >
                <Upload className="w-6 h-6 text-gray-400" />
                <span className="text-sm text-gray-500 mt-2">Add More</span>
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={handleButtonClick}
            className="w-full py-12 flex flex-col items-center justify-center hover:bg-gray-100 transition-colors rounded-lg"
          >
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-gray-500 text-sm font-medium">
              Click to upload {multiple ? 'images' : 'an image'}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              {accept === 'image/*' ? 'PNG, JPG, GIF up to 10MB' : 'MP4, WebM up to 50MB'}
            </p>
          </button>
        )}
      </div>
      <input
        type="file"
        accept={accept}
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple={multiple}
      />
    </div>
  );
};

export default MediaUpload;
