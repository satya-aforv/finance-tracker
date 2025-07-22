// src/pages/payments/PaymentForm.tsx - Fixed with better error handling
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Upload, X, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { investmentsService } from '../../services/investments';
import { Investment } from '../../types';
import toast from 'react-hot-toast';

interface PaymentFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

interface FormData {
  investment: string;
  scheduleMonth: number;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'cheque' | 'bank_transfer' | 'upi' | 'card' | 'other';
  referenceNumber: string;
  interestAmount: number;
  principalAmount: number;
  penaltyAmount: number;
  bonusAmount: number;
  notes: string;
  documentCategory: 'receipt' | 'bank_statement' | 'cheque_copy' | 'upi_screenshot' | 'other';
  documentDescription: string;
}

interface UploadedFile {
  file: File;
  preview: string;
  category: string;
  description: string;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ onSubmit, onCancel }) => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [availableMonths, setAvailableMonths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    defaultValues: {
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'bank_transfer',
      penaltyAmount: 0,
      bonusAmount: 0,
      documentCategory: 'receipt'
    }
  });

  const watchInvestment = watch('investment');
  const watchScheduleMonth = watch('scheduleMonth');
  const watchAmount = watch('amount');
  const watchPaymentMethod = watch('paymentMethod');

  useEffect(() => {
    const fetchInvestments = async () => {
      try {
        const response = await investmentsService.getInvestments({ 
          status: 'active',
          limit: 100 
        });
        setInvestments(response.data || []);
      } catch (error: any) {
        toast.error('Failed to load investments');
      } finally {
        setLoading(false);
      }
    };

    fetchInvestments();
  }, []);

  useEffect(() => {
    if (watchInvestment) {
      const investment = investments.find(inv => inv._id === watchInvestment);
      setSelectedInvestment(investment || null);
      
      if (investment && investment.schedule) {
        // Get months that can accept payments (be more flexible)
        const availableScheduleMonths = investment.schedule
          .filter(s => ['pending', 'overdue', 'partial'].includes(s.status) || s.paidAmount < s.totalAmount)
          .map(s => ({
            month: s.month,
            status: s.status,
            totalAmount: s.totalAmount,
            paidAmount: s.paidAmount || 0,
            remainingAmount: s.totalAmount - (s.paidAmount || 0),
            dueDate: s.dueDate,
            interestAmount: s.interestAmount
          }))
          .sort((a, b) => a.month - b.month);
        
        setAvailableMonths(availableScheduleMonths);
        
        if (availableScheduleMonths.length > 0) {
          setValue('scheduleMonth', availableScheduleMonths[0].month);
        }
      } else {
        setAvailableMonths([]);
      }
    } else {
      setSelectedInvestment(null);
      setAvailableMonths([]);
    }
  }, [watchInvestment, investments, setValue]);

  useEffect(() => {
    if (selectedInvestment && watchScheduleMonth) {
      const scheduleItem = availableMonths.find(s => s.month === watchScheduleMonth);
      if (scheduleItem) {
        const remainingAmount = scheduleItem.remainingAmount;
        setValue('amount', remainingAmount);
        
        // Calculate suggested breakdown
        const remainingInterest = Math.max(0, scheduleItem.interestAmount - Math.min(scheduleItem.paidAmount, scheduleItem.interestAmount));
        setValue('interestAmount', Math.min(remainingAmount, remainingInterest));
        setValue('principalAmount', Math.max(0, remainingAmount - remainingInterest));
      }
    }
  }, [selectedInvestment, watchScheduleMonth, setValue, availableMonths]);

  // Auto-suggest document category based on payment method
  useEffect(() => {
    const suggestedCategories = {
      'cheque': 'cheque_copy',
      'bank_transfer': 'bank_statement',
      'upi': 'upi_screenshot',
      'cash': 'receipt',
      'card': 'receipt',
      'other': 'receipt'
    };
    
    if (watchPaymentMethod) {
      setValue('documentCategory', suggestedCategories[watchPaymentMethod] as any);
    }
  }, [watchPaymentMethod, setValue]);

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach(file => {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error(`Invalid file type: ${file.name}. Only images and PDFs are allowed.`);
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File too large: ${file.name}. Maximum size is 5MB.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const newFile: UploadedFile = {
          file,
          preview: e.target?.result as string,
          category: watch('documentCategory'),
          description: watch('documentDescription') || ''
        };
        setUploadedFiles(prev => [...prev, newFile]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateFileDetails = (index: number, category: string, description: string) => {
    setUploadedFiles(prev => prev.map((file, i) => 
      i === index ? { ...file, category, description } : file
    ));
  };

  const handleFormSubmit = (data: FormData) => {
    // Validate that breakdown matches total
    const total = (data.interestAmount || 0) + (data.principalAmount || 0) + (data.penaltyAmount || 0) + (data.bonusAmount || 0);
    if (Math.abs(data.amount - total) > 0.01) {
      toast.error('Amount breakdown does not match total payment amount');
      return;
    }

    // Prepare form data with files
    const formData = new FormData();
    
    // Add basic payment data - ensure numbers are properly formatted
    formData.append('investment', data.investment);
    formData.append('scheduleMonth', data.scheduleMonth.toString());
    formData.append('amount', data.amount.toString());
    formData.append('paymentDate', data.paymentDate);
    formData.append('paymentMethod', data.paymentMethod);
    formData.append('referenceNumber', data.referenceNumber || '');
    formData.append('type', 'mixed');
    formData.append('interestAmount', (data.interestAmount || 0).toString());
    formData.append('principalAmount', (data.principalAmount || 0).toString());
    formData.append('penaltyAmount', (data.penaltyAmount || 0).toString());
    formData.append('bonusAmount', (data.bonusAmount || 0).toString());
    formData.append('notes', data.notes || '');

    // Add files
    uploadedFiles.forEach(uploadedFile => {
      formData.append('documents', uploadedFile.file);
    });

    // Add document metadata
    if (uploadedFiles.length > 0) {
      formData.append('documentCategory', uploadedFiles[0].category);
      formData.append('documentDescription', uploadedFiles[0].description);
    }

    onSubmit(formData);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getScheduleDetails = () => {
    if (!watchScheduleMonth) return null;
    return availableMonths.find(s => s.month === watchScheduleMonth);
  };

  const getRequiredDocuments = () => {
    const method = watchPaymentMethod;
    const required = ['receipt'];
    const optional = [];

    switch (method) {
      case 'cheque':
        required.push('cheque_copy');
        optional.push('bank_statement');
        break;
      case 'bank_transfer':
        required.push('bank_statement');
        break;
      case 'upi':
        required.push('upi_screenshot');
        break;
    }

    return { required, optional };
  };

  const scheduleDetails = getScheduleDetails();
  const { required: requiredDocs, optional: optionalDocs } = getRequiredDocuments();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Payment Details */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Investment</label>
            <select
              {...register('investment', { required: 'Please select an investment' })}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Investment</option>
              {investments.map((investment) => (
                <option key={investment._id} value={investment._id}>
                  {investment.investmentId} - {investment.investor.name}
                </option>
              ))}
            </select>
            {errors.investment && <p className="mt-1 text-sm text-red-600">{errors.investment.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Schedule Month</label>
            <select
              {...register('scheduleMonth', { 
                required: 'Please select a schedule month',
                valueAsNumber: true 
              })}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={!selectedInvestment || availableMonths.length === 0}
            >
              <option value="">Select Month</option>
              {availableMonths.map((scheduleItem) => (
                <option key={scheduleItem.month} value={scheduleItem.month}>
                  Month {scheduleItem.month} - {formatCurrency(scheduleItem.remainingAmount)} remaining
                </option>
              ))}
            </select>
            {errors.scheduleMonth && <p className="mt-1 text-sm text-red-600">{errors.scheduleMonth.message}</p>}
            {selectedInvestment && availableMonths.length === 0 && (
              <p className="mt-1 text-sm text-yellow-600">No pending payments found for this investment</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Date</label>
            <input
              {...register('paymentDate', { required: 'Payment date is required' })}
              type="date"
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.paymentDate && <p className="mt-1 text-sm text-red-600">{errors.paymentDate.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Method</label>
            <select
              {...register('paymentMethod', { required: 'Payment method is required' })}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="bank_transfer">Bank Transfer</option>
              <option value="upi">UPI</option>
              <option value="cheque">Cheque</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </select>
            {errors.paymentMethod && <p className="mt-1 text-sm text-red-600">{errors.paymentMethod.message}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Reference Number</label>
            <input
              {...register('referenceNumber')}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Transaction reference number"
            />
          </div>
        </div>
      </div>

      {/* Schedule Information */}
      {scheduleDetails && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-md font-medium text-blue-900 mb-3">Schedule Details - Month {scheduleDetails.month}</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Due Date:</span>
              <div className="font-medium">{new Date(scheduleDetails.dueDate).toLocaleDateString()}</div>
            </div>
            <div>
              <span className="text-blue-700">Total Due:</span>
              <div className="font-medium">{formatCurrency(scheduleDetails.totalAmount)}</div>
            </div>
            <div>
              <span className="text-blue-700">Already Paid:</span>
              <div className="font-medium">{formatCurrency(scheduleDetails.paidAmount)}</div>
            </div>
            <div>
              <span className="text-blue-700">Remaining:</span>
              <div className="font-medium">{formatCurrency(scheduleDetails.remainingAmount)}</div>
            </div>
          </div>
          <div className="mt-2 text-xs text-blue-600">
            Status: <span className="font-medium capitalize">{scheduleDetails.status}</span>
          </div>
        </div>
      )}

      {/* Amount Breakdown */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Amount Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Total Payment Amount (₹)</label>
            <input
              {...register('amount', {
                required: 'Payment amount is required',
                min: { value: 0.01, message: 'Amount must be greater than 0' },
                valueAsNumber: true
              })}
              type="number"
              step="0.01"
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter payment amount"
            />
            {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Interest Amount (₹)</label>
            <input
              {...register('interestAmount', {
                min: { value: 0, message: 'Interest amount cannot be negative' },
                valueAsNumber: true
              })}
              type="number"
              step="0.01"
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Interest portion"
            />
            {errors.interestAmount && <p className="mt-1 text-sm text-red-600">{errors.interestAmount.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Principal Amount (₹)</label>
            <input
              {...register('principalAmount', {
                min: { value: 0, message: 'Principal amount cannot be negative' },
                valueAsNumber: true
              })}
              type="number"
              step="0.01"
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Principal portion"
            />
            {errors.principalAmount && <p className="mt-1 text-sm text-red-600">{errors.principalAmount.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Penalty Amount (₹)</label>
            <input
              {...register('penaltyAmount', {
                min: { value: 0, message: 'Penalty amount cannot be negative' },
                valueAsNumber: true
              })}
              type="number"
              step="0.01"
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Penalty (if any)"
            />
            {errors.penaltyAmount && <p className="mt-1 text-sm text-red-600">{errors.penaltyAmount.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Bonus Amount (₹)</label>
            <input
              {...register('bonusAmount', {
                min: { value: 0, message: 'Bonus amount cannot be negative' },
                valueAsNumber: true
              })}
              type="number"
              step="0.01"
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Bonus (if any)"
            />
            {errors.bonusAmount && <p className="mt-1 text-sm text-red-600">{errors.bonusAmount.message}</p>}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes about this payment"
            />
          </div>
        </div>
      </div>

      {/* Document Upload Section */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Documents</h3>
        
        {/* Required Documents Info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Document Requirements</h4>
              <div className="mt-2 text-sm text-yellow-700">
                <div><strong>Required:</strong> {requiredDocs.join(', ')}</div>
                {optionalDocs.length > 0 && (
                  <div><strong>Optional:</strong> {optionalDocs.join(', ')}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* File Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
            id="file-upload"
            accept=".pdf,.jpg,.jpeg,.png,.gif"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PDF, JPG, PNG, GIF (Max 5MB per file)
            </p>
          </label>
        </div>

        {/* Default Document Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Default Document Category</label>
            <select
              {...register('documentCategory')}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="receipt">Payment Receipt</option>
              <option value="bank_statement">Bank Statement</option>
              <option value="cheque_copy">Cheque Copy</option>
              <option value="upi_screenshot">UPI Screenshot</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Document Description</label>
            <input
              {...register('documentDescription')}
              className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Brief description of the documents"
            />
          </div>
        </div>

        {/* Uploaded Files */}
        {uploadedFiles.length > 0 && (
          <div className="mt-4 space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Uploaded Files ({uploadedFiles.length})</h4>
            {uploadedFiles.map((uploadedFile, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{uploadedFile.file.name}</div>
                    <div className="text-xs text-gray-500">
                      {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB • {uploadedFile.category}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={uploadedFile.category}
                    onChange={(e) => updateFileDetails(index, e.target.value, uploadedFile.description)}
                    className="text-xs border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="receipt">Receipt</option>
                    <option value="bank_statement">Bank Statement</option>
                    <option value="cheque_copy">Cheque Copy</option>
                    <option value="upi_screenshot">UPI Screenshot</option>
                    <option value="other">Other</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Document Status Check */}
        {uploadedFiles.length > 0 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-sm text-green-800">
                {uploadedFiles.length} document(s) ready for upload
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          loading={isSubmitting}
          disabled={!selectedInvestment || availableMonths.length === 0}
        >
          Record Payment
          {uploadedFiles.length > 0 && ` & Upload ${uploadedFiles.length} Document(s)`}
        </Button>
      </div>
    </form>
  );
};

export default PaymentForm;