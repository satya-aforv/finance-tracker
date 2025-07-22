// src/components/investments/DocumentManager.tsx
import React, { useState, useEffect } from 'react';
import { Upload, FileText, Download, Trash2, Eye, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../common/Button';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import { investmentsService } from '../../services/investments';
import toast from 'react-hot-toast';

interface Document {
  _id: string;
  category: 'agreement' | 'kyc' | 'payment_proof' | 'communication' | 'legal' | 'other';
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadDate: string;
  uploadedBy: {
    _id: string;
    name: string;
    email: string;
  };
  description?: string;
  isActive: boolean;
}

interface DocumentManagerProps {
  investmentId: string;
  isEditable?: boolean;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ 
  investmentId, 
  isEditable = false 
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [documentStats, setDocumentStats] = useState<any>({});

  const [uploadForm, setUploadForm] = useState({
    category: 'agreement' as Document['category'],
    description: '',
    files: [] as File[]
  });

  const categories = [
    { value: 'all', label: 'All Documents', color: 'gray' },
    { value: 'agreement', label: 'Agreements', color: 'blue' },
    { value: 'kyc', label: 'KYC Documents', color: 'green' },
    { value: 'payment_proof', label: 'Payment Proofs', color: 'purple' },
    { value: 'communication', label: 'Communications', color: 'yellow' },
    { value: 'legal', label: 'Legal Documents', color: 'red' },
    { value: 'other', label: 'Other', color: 'gray' }
  ];

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await investmentsService.getDocuments(investmentId, 
        selectedCategory !== 'all' ? { category: selectedCategory } : {}
      );
      setDocuments(response.data.documents || []);
      setDocumentStats(response.data.documentsByCategory || {});
    } catch (error: any) {
      toast.error('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [investmentId, selectedCategory]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadForm(prev => ({ ...prev, files }));
  };

  const handleUpload = async () => {
    if (uploadForm.files.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    if (!uploadForm.category) {
      toast.error('Please select a document category');
      return;
    }

    try {
      setUploading(true);
      await investmentsService.uploadDocuments(
        investmentId, 
        uploadForm.files,
        {
          category: uploadForm.category,
          description: uploadForm.description
        }
      );
      
      toast.success(`${uploadForm.files.length} document(s) uploaded successfully`);
      setShowUploadModal(false);
      setUploadForm({ category: 'agreement', description: '', files: [] });
      fetchDocuments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to upload documents');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) return;

    try {
      await investmentsService.deleteDocument(investmentId, documentId);
      toast.success('Document deleted successfully');
      fetchDocuments();
    } catch (error: any) {
      toast.error('Failed to delete document');
    }
  };

  const handleDownload = (document: Document) => {
    // In a real implementation, this would handle file download
    const link = document.createElement('a');
    link.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${document.filePath}`;
    link.download = document.originalName;
    link.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryColor = (category: string) => {
    const categoryData = categories.find(c => c.value === category);
    return categoryData?.color || 'gray';
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      agreement: 'bg-blue-100 text-blue-800',
      kyc: 'bg-green-100 text-green-800',
      payment_proof: 'bg-purple-100 text-purple-800',
      communication: 'bg-yellow-100 text-yellow-800',
      legal: 'bg-red-100 text-red-800',
      other: 'bg-gray-100 text-gray-800'
    };
    
    return colors[category as keyof typeof colors] || colors.other;
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    return '📎';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Document Management</h3>
          <p className="text-sm text-gray-500">
            Manage documents related to this investment
          </p>
        </div>
        {isEditable && (
          <Button onClick={() => setShowUploadModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Upload Documents
          </Button>
        )}
      </div>

      {/* Document Statistics */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Document Overview</h4>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          {categories.filter(c => c.value !== 'all').map((category) => (
            <div key={category.value} className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {documentStats[category.value] || 0}
              </div>
              <div className="text-xs text-gray-500">{category.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.value}
            onClick={() => setSelectedCategory(category.value)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category.value
                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {category.label}
            {category.value !== 'all' && documentStats[category.value] > 0 && (
              <span className="ml-1 bg-white px-1 rounded-full text-xs">
                {documentStats[category.value]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Documents List */}
      <div className="space-y-3">
        <AnimatePresence>
          {documents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8 text-gray-500"
            >
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No documents found</p>
              {isEditable && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setShowUploadModal(true)}
                >
                  Upload your first document
                </Button>
              )}
            </motion.div>
          ) : (
            documents.map((document, index) => (
              <motion.div
                key={document._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="text-2xl">
                      {getFileIcon(document.mimeType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {document.originalName}
                        </h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryBadge(document.category)}`}>
                          {categories.find(c => c.value === document.category)?.label}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                        <span>{formatFileSize(document.fileSize)}</span>
                        <span>•</span>
                        <span>Uploaded by {document.uploadedBy.name}</span>
                        <span>•</span>
                        <span>{formatDate(document.uploadDate)}</span>
                      </div>
                      {document.description && (
                        <p className="text-xs text-gray-600 mt-1 truncate">
                          {document.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleDownload(document)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                      title="Preview"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    {isEditable && (
                      <button
                        onClick={() => handleDeleteDocument(document._id, document.originalName)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setUploadForm({ category: 'agreement', description: '', files: [] });
        }}
        title="Upload Documents"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Category
            </label>
            <select
              value={uploadForm.category}
              onChange={(e) => setUploadForm(prev => ({ 
                ...prev, 
                category: e.target.value as Document['category'] 
              }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.filter(c => c.value !== 'all').map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={uploadForm.description}
              onChange={(e) => setUploadForm(prev => ({ 
                ...prev, 
                description: e.target.value 
              }))}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter document description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Files
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.xlsx,.xls"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  Click to select files or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, DOC, DOCX, JPG, PNG, XLS, XLSX (Max 5MB per file)
                </p>
              </label>
            </div>

            {uploadForm.files.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Selected Files ({uploadForm.files.length}):
                </p>
                {uploadForm.files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                    <span className="text-sm text-gray-700 truncate">{file.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                      <button
                        onClick={() => setUploadForm(prev => ({
                          ...prev,
                          files: prev.files.filter((_, i) => i !== index)
                        }))}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowUploadModal(false);
                setUploadForm({ category: 'agreement', description: '', files: [] });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              loading={uploading}
              disabled={uploadForm.files.length === 0}
            >
              Upload {uploadForm.files.length > 0 && `(${uploadForm.files.length})`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DocumentManager;