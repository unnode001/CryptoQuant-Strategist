import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from '../hooks/useTranslations';
import type { DataConfig } from '../types';

interface ImportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: DataConfig, source: 'import', fileName?: string) => Promise<void>;
}

export const ImportDataModal: React.FC<ImportDataModalProps> = ({ isOpen, onClose, onSave }) => {
  const { t } = useTranslations();
  const [file, setFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);
  
  const handleFileChange = (files: FileList | null) => {
      if (files && files.length > 0) {
          setFile(files[0]);
      }
  }

  const handleDragEvents = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
        setIsDragging(true);
    } else if (e.type === 'dragleave') {
        setIsDragging(false);
    }
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFileChange(e.dataTransfer.files);
    }
  }, []);


  const handleSave = async () => {
    if (!file) return;

    // In a real app, you might parse the CSV here to get the real data
    const mockConfig: DataConfig = {
      exchange: 'Imported',
      symbol: file.name.split('.')[0].toUpperCase(),
      startDate: 'N/A',
      endDate: 'N/A',
    };

    setIsSaving(true);
    await onSave(mockConfig, 'import', file.name);
    setIsSaving(false);
    setFile(null);
    onClose();
  };
  
  useEffect(() => {
    // Reset state when modal is closed
    if (!isOpen) {
        setFile(null);
        setIsSaving(false);
        setIsDragging(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-data-title"
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
            <h2 id="import-data-title" className="text-xl font-bold text-gray-800 font-source-serif">{t('importData')}</h2>
            <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
        </div>

        <div className="p-6">
            <div 
                className={`flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${isDragging ? 'border-orange-400 bg-orange-50' : 'border-gray-300'}`}
                onDragEnter={handleDragEvents}
                onDragOver={handleDragEvents}
                onDragLeave={handleDragEvents}
                onDrop={handleDrop}
            >
                <div className="space-y-1 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-gray-500 justify-center">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-orange-600 hover:text-orange-500 focus-within:outline-none">
                            <span>{t('uploadAFile')}</span>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={(e) => handleFileChange(e.target.files)} accept=".csv" />
                        </label>
                        <p className="pl-1">{t('orDragAndDrop')}</p>
                    </div>
                    <p className="text-xs text-gray-500">{t('csvUpTo10MB')}</p>
                    {file && <p className="text-sm text-green-600 pt-2 font-medium">{file.name}</p>}
                </div>
            </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end items-center gap-3 rounded-b-xl">
            <button onClick={onClose} disabled={isSaving} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                {t('cancel')}
            </button>
            <button onClick={handleSave} disabled={!file || isSaving} className="px-4 py-2 text-sm font-semibold text-white bg-[#D97757] rounded-lg hover:bg-[#C96747] disabled:bg-gray-300 disabled:cursor-not-allowed">
                {isSaving ? t('generating') : t('saveAndImport')}
            </button>
        </div>
      </div>
    </div>
  );
};
