import React, { useRef, useState } from 'react';
import { Camera, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { Button } from './Button';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  initials?: string;
  onAvatarChange: (dataUrlOrUrl: string | null) => void;
  className?: string;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatarUrl,
  initials = 'EP',
  onAvatarChange,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (< 5MB) and type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size should be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      onAvatarChange(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (customUrlInput.trim()) {
      onAvatarChange(customUrlInput.trim());
      setShowUrlInput(false);
      setCustomUrlInput('');
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col sm:flex-row items-center gap-5">
        {/* Avatar Preview Box */}
        <div className="relative group shrink-0">
          <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-slate-200/80 bg-slate-100 shadow-xs flex items-center justify-center relative">
            {currentAvatarUrl ? (
              <img
                src={currentAvatarUrl}
                alt="Profile Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#714B67] to-slate-800 text-white font-black text-2xl flex items-center justify-center">
                {initials}
              </div>
            )}

            {/* Hover overlay */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 cursor-pointer"
              title="Click to upload photo"
            >
              <Camera className="w-5 h-5" />
              <span className="text-[10px] font-bold">Upload</span>
            </button>
          </div>

          {currentAvatarUrl && (
            <button
              type="button"
              onClick={() => onAvatarChange(null)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-110"
              title="Remove Profile Photo"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Action Buttons & Helpers */}
        <div className="flex-1 space-y-2 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden"
            />
            <Button
              type="button"
              variant="primary"
              size="sm"
              leftIcon={<Upload className="w-4 h-4" />}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload Photo
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<ImageIcon className="w-4 h-4 text-slate-400" />}
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="text-xs text-slate-600"
            >
              {showUrlInput ? 'Hide URL Input' : 'Enter Photo URL'}
            </Button>
          </div>

          <p className="text-[11px] text-slate-500 leading-tight">
            Upload custom employee photo (PNG, JPG, WebP up to 5MB) or specify an image URL.
          </p>
        </div>
      </div>

      {/* URL Input Drawer */}
      {showUrlInput && (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex gap-2 animate-fadeIn">
          <input
            type="url"
            placeholder="Paste image web link (https://...)"
            value={customUrlInput}
            onChange={(e) => setCustomUrlInput(e.target.value)}
            className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#714B67]"
          />
          <Button type="button" variant="primary" size="sm" onClick={handleApplyUrl}>
            Apply URL
          </Button>
        </div>
      )}
    </div>
  );
};
