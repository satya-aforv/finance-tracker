// src/components/investments/InvestmentTimeline.tsx
import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  DollarSign, 
  FileText, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle, 
  Upload,
  User,
  Clock,
  Plus,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../common/Button';
import Modal from '../common/Modal';
import { investmentsService } from '../../services/investments';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface TimelineEntry {
  _id: string;
  date: string;
  type: 'investment_created' | 'payment_received' | 'payment_overdue' | 'document_uploaded' | 'status_changed' | 'note_added' | 'communication';
  description: string;
  amount?: number;
  performedBy: {
    _id: string;
    name: string;
    email: string;
  };
  metadata?: any;
}

interface InvestmentTimelineProps {
  investmentId: string;
  isEditable?: boolean;
}

const InvestmentTimeline: React.FC<InvestmentTimelineProps> = ({ 
  investmentId, 
  isEditable = false 
}) => {
  const { user } = useAuth();
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingEntry, setAddingEntry] = useState(false);

  const [entryForm, setEntryForm] = useState({
    type: 'note_added' as TimelineEntry['type'],
    description: '',
    amount: 0
  });

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const response = await investmentsService.getTimeline(investmentId);
      setTimeline(response.data.timeline || []);
    } catch (error: any) {
      toast.error('Failed to fetch timeline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [investmentId]);

  const handleAddEntry = async () => {
    if (!entryForm.description.trim()) {
      toast.error('Please enter a description');
      return;
    }

    try {
      setAddingEntry(true);
      await investmentsService.addTimelineEntry(investmentId, {
        type: entryForm.type,
        description: entryForm.description,
        amount: entryForm.amount
      });
      
      toast.success('Timeline entry added successfully');
      setShowAddModal(false);
      setEntryForm({ type: 'note_added', description: '', amount: 0 });
      fetchTimeline();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add timeline entry');
    } finally {
      setAddingEntry(false);
    }
  };

  const getTimelineIcon = (type: string) => {
    const icons = {
      investment_created: <DollarSign className="h-4 w-4" />,
      payment_received: <CheckCircle className="h-4 w-4" />,
      payment_overdue: <AlertTriangle className="h-4 w-4" />,
      document_uploaded: <Upload className="h-4 w-4" />,
      status_changed: <FileText className="h-4 w-4" />,
      note_added: <MessageSquare className="h-4 w-4" />,
      communication: <MessageSquare className="h-4 w-4" />
    };
    return icons[type as keyof typeof icons] || <FileText className="h-4 w-4" />;
  };

  const getTimelineColor = (type: string) => {
    const colors = {
      investment_created: 'bg-blue-500 text-white',
      payment_received: 'bg-green-500 text-white',
      payment_overdue: 'bg-red-500 text-white',
      document_uploaded: 'bg-purple-500 text-white',
      status_changed: 'bg-yellow-500 text-white',
      note_added: 'bg-gray-500 text-white',
      communication: 'bg-indigo-500 text-white'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500 text-white';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
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

  const getRelativeTime = (date: string) => {
    const now = new Date();
    const entryDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
    
    return formatDate(date);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Investment Timeline</h3>
          <p className="text-sm text-gray-500">
            Track all activities and changes related to this investment
          </p>
        </div>
        {isEditable && (
          <Button onClick={() => setShowAddModal(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        {timeline.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No timeline entries yet</p>
            {isEditable && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowAddModal(true)}
              >
                Add your first entry
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            <AnimatePresence>
              {timeline.map((entry, index) => (
                <motion.div
                  key={entry._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative flex items-start space-x-4"
                >
                  {/* Timeline dot */}
                  <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full ${getTimelineColor(entry.type)}`}>
                    {getTimelineIcon(entry.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {entry.type.replace('_', ' ')}
                        </span>
                        {entry.amount > 0 && (
                          <span className="text-sm font-semibold text-green-600">
                            {formatCurrency(entry.amount)}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500" title={formatDate(entry.date)}>
                        {getRelativeTime(entry.date)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-700 mb-3">
                      {entry.description}
                    </p>

                    {/* Metadata display */}
                    {entry.metadata && Object.keys(entry.metadata).length > 0 && (
                      <div className="bg-gray-50 rounded p-2 mb-3">
                        <div className="text-xs text-gray-600">
                          {entry.metadata.oldStatus && entry.metadata.newStatus && (
                            <span>
                              Status changed from <strong>{entry.metadata.oldStatus}</strong> to <strong>{entry.metadata.newStatus}</strong>
                            </span>
                          )}
                          {entry.metadata.fileName && (
                            <span>File: <strong>{entry.metadata.fileName}</strong></span>
                          )}
                          {entry.metadata.category && (
                            <span>Category: <strong>{entry.metadata.category}</strong></span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <User className="h-3 w-3" />
                      <span>{entry.performedBy.name}</span>
                      <span>•</span>
                      <span>{entry.performedBy.email}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Add Entry Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEntryForm({ type: 'note_added', description: '', amount: 0 });
        }}
        title="Add Timeline Entry"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Entry Type
            </label>
            <select
              value={entryForm.type}
              onChange={(e) => setEntryForm(prev => ({ 
                ...prev, 
                type: e.target.value as TimelineEntry['type']
              }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="note_added">Note</option>
              <option value="communication">Communication</option>
              <option value="status_changed">Status Change</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={entryForm.description}
              onChange={(e) => setEntryForm(prev => ({ 
                ...prev, 
                description: e.target.value 
              }))}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter detailed description of this entry..."
            />
          </div>

          {entryForm.type === 'payment_received' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (₹)
              </label>
              <input
                type="number"
                value={entryForm.amount}
                onChange={(e) => setEntryForm(prev => ({ 
                  ...prev, 
                  amount: Number(e.target.value) 
                }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>
          )}

          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                This entry will be recorded as performed by <strong>{user?.name}</strong>
              </span>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                setEntryForm({ type: 'note_added', description: '', amount: 0 });
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddEntry}
              loading={addingEntry}
              disabled={!entryForm.description.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              Add Entry
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default InvestmentTimeline;