// src/pages/settings/SettingsPage.tsx - Fixed to Match Types and Services
import React, { useState, useEffect } from 'react';
import { Save, Upload, Building, Shield, Bell, Database, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { settingsService } from '../../services/settings';
import { Settings } from '../../types';
import toast from 'react-hot-toast';

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'company' | 'financial' | 'notifications' | 'security' | 'backup'>('company');
  const [logoUploading, setLogoUploading] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty }
  } = useForm<Settings>();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await settingsService.getSettings();
        setSettings(response.data);
        reset(response.data);
      } catch (error: any) {
        console.error('Failed to load settings:', error);
        toast.error('Failed to load settings. Using defaults.');
        
        // Set default settings for fresh installation
        const defaultSettings: Settings = {
          _id: '',
          company: {
            name: 'Your Company Name',
            email: 'admin@yourcompany.com',
            phone: '+1234567890',
            address: {
              street: '',
              city: '',
              state: '',
              pincode: '',
              country: 'India'
            },
            website: '',
            taxId: '',
            registrationNumber: ''
          },
          financial: {
            defaultCurrency: 'INR',
            currencySymbol: '₹',
            financialYearStart: 'April',
            interestCalculationMethod: 'monthly',
            defaultLateFee: 2.0,
            gracePeriodDays: 7
          },
          notifications: {
            emailEnabled: true,
            smsEnabled: false,
            paymentReminders: {
              enabled: true,
              daysBefore: 3
            },
            overdueAlerts: {
              enabled: true,
              frequency: 'weekly'
            },
            investmentMaturity: {
              enabled: true,
              daysBefore: 30
            }
          },
          security: {
            passwordPolicy: {
              minLength: 8,
              requireUppercase: true,
              requireLowercase: true,
              requireNumbers: true,
              requireSpecialChars: false
            },
            sessionTimeout: 480,
            maxLoginAttempts: 5,
            twoFactorAuth: false
          },
          backup: {
            enabled: false,
            frequency: 'daily',
            retentionDays: 30
          },
          updatedBy: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        setSettings(defaultSettings);
        reset(defaultSettings);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [reset]);

  const handleSaveSettings = async (data: Settings) => {
    try {
      setSaving(true);
      
      // Only send the data that has actually changed
      const changedData: Partial<Settings> = {};
      
      if (activeTab === 'company') {
        changedData.company = data.company;
      } else if (activeTab === 'financial') {
        changedData.financial = data.financial;
      } else if (activeTab === 'notifications') {
        changedData.notifications = data.notifications;
      } else if (activeTab === 'security') {
        changedData.security = data.security;
      } else if (activeTab === 'backup') {
        changedData.backup = data.backup;
      }

      await settingsService.updateSettings(changedData);
      toast.success('Settings updated successfully');
      setSettings({ ...settings!, ...changedData });
    } catch (error: any) {
      console.error('Failed to update settings:', error);
      toast.error(error.response?.data?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLogoUploading(true);
      const response = await settingsService.uploadLogo(file);
      
      toast.success('Logo uploaded successfully');
      
      // Update the current settings
      if (settings) {
        const updatedSettings = {
          ...settings,
          company: {
            ...settings.company,
            logo: response.data.logo
          }
        };
        setSettings(updatedSettings);
        reset(updatedSettings);
      }
    } catch (error: any) {
      console.error('Failed to upload logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      setTestingEmail(true);
      const testEmail = settings?.company?.email || 'test@example.com';
      const response = await settingsService.testEmail(testEmail);
      
      if (response.data.success) {
        toast.success(`Test email sent successfully to ${testEmail}`);
      } else {
        toast.error(response.data.message || 'Test email failed');
      }
    } catch (error: any) {
      console.error('Email test failed:', error);
      toast.error('Email test failed. Please check your configuration.');
    } finally {
      setTestingEmail(false);
    }
  };

  const tabs = [
    { id: 'company', label: 'Company', icon: Building },
    { id: 'financial', label: 'Financial', icon: Database },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'backup', label: 'Backup', icon: Database }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Failed to load settings</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-blue-600 hover:text-blue-800"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Configure system settings and preferences</p>
        </div>
        {isDirty && (
          <div className="flex items-center space-x-2">
            <span className="text-amber-600 text-sm">You have unsaved changes</span>
            <Button
              onClick={handleSubmit(handleSaveSettings)}
              loading={saving}
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        )}
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:w-64"
        >
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <tab.icon className="mr-3 h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-1"
        >
          <form onSubmit={handleSubmit(handleSaveSettings)} className="space-y-6">
            {/* Company Settings */}
            {activeTab === 'company' && (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Company Information</h3>
                
                {/* Logo Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
                  <div className="flex items-center space-x-4">
                    {settings?.company.logo && (
                      <img
                        src={settings.company.logo}
                        alt="Company Logo"
                        className="h-16 w-16 object-contain border border-gray-300 rounded"
                      />
                    )}
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload"
                        disabled={logoUploading}
                      />
                      <label htmlFor="logo-upload">
                        <Button type="button" variant="outline" size="sm" loading={logoUploading}>
                          <Upload className="h-4 w-4 mr-2" />
                          {logoUploading ? 'Uploading...' : 'Upload Logo'}
                        </Button>
                      </label>
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 2MB</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Company Name *</label>
                    <input
                      {...register('company.name', { required: 'Company name is required' })}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter company name"
                    />
                    {errors.company?.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.company.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email *</label>
                    <input
                      {...register('company.email', { 
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      })}
                      type="email"
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="admin@company.com"
                    />
                    {errors.company?.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.company.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone *</label>
                    <input
                      {...register('company.phone', { required: 'Phone is required' })}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+91 98765 43210"
                    />
                    {errors.company?.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.company.phone.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Website</label>
                    <input
                      {...register('company.website')}
                      type="url"
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://www.company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tax ID / GST Number</label>
                    <input
                      {...register('company.taxId')}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="22AAAAA0000A1Z5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Registration Number</label>
                    <input
                      {...register('company.registrationNumber')}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="CIN: U12345AB1234PLC567890"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Company Address</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Street Address</label>
                      <input
                        {...register('company.address.street')}
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="123 Business Street"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">City</label>
                      <input
                        {...register('company.address.city')}
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Mumbai"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">State</label>
                      <input
                        {...register('company.address.state')}
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Maharashtra"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Pincode</label>
                      <input
                        {...register('company.address.pincode')}
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="400001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Country</label>
                      <input
                        {...register('company.address.country')}
                        className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="India"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Financial Settings */}
            {activeTab === 'financial' && (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Financial Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Default Currency</label>
                    <select
                      {...register('financial.defaultCurrency')}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="INR">INR - Indian Rupee</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Currency Symbol</label>
                    <input
                      {...register('financial.currencySymbol')}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="₹"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Financial Year Start</label>
                    <select
                      {...register('financial.financialYearStart')}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="January">January</option>
                      <option value="April">April</option>
                      <option value="July">July</option>
                      <option value="October">October</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Interest Calculation Method</label>
                    <select
                      {...register('financial.interestCalculationMethod')}
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="daily">Daily</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Default Late Fee (%)</label>
                    <input
                      {...register('financial.defaultLateFee', { 
                        min: { value: 0, message: 'Late fee cannot be negative' },
                        max: { value: 10, message: 'Late fee cannot exceed 10%' },
                        valueAsNumber: true 
                      })}
                      type="number"
                      step="0.1"
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="2.0"
                    />
                    {errors.financial?.defaultLateFee && (
                      <p className="mt-1 text-sm text-red-600">{errors.financial.defaultLateFee.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Grace Period (Days)</label>
                    <input
                      {...register('financial.gracePeriodDays', { 
                        min: { value: 0, message: 'Grace period cannot be negative' },
                        max: { value: 30, message: 'Grace period cannot exceed 30 days' },
                        valueAsNumber: true 
                      })}
                      type="number"
                      className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="7"
                    />
                    {errors.financial?.gracePeriodDays && (
                      <p className="mt-1 text-sm text-red-600">{errors.financial.gracePeriodDays.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Notification Preferences</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleTestEmail}
                    loading={testingEmail}
                  >
                    Test Email
                  </Button>
                </div>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <input
                      {...register('notifications.emailEnabled')}
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">SMS Notifications</h4>
                      <p className="text-sm text-gray-500">Receive notifications via SMS</p>
                    </div>
                    <input
                      {...register('notifications.smsEnabled')}
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Payment Reminders</h4>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <input
                          {...register('notifications.paymentReminders.enabled')}
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 mr-2"
                        />
                        <label className="text-sm text-gray-700">Enable payment reminders</label>
                      </div>
                      {watch('notifications.paymentReminders.enabled') && (
                        <div className="ml-6">
                          <label className="block text-sm font-medium text-gray-700">Days before due date</label>
                          <input
                            {...register('notifications.paymentReminders.daysBefore', { 
                              min: { value: 1, message: 'Must be at least 1 day' },
                              max: { value: 30, message: 'Cannot exceed 30 days' },
                              valueAsNumber: true 
                            })}
                            type="number"
                            className="mt-1 block w-32 border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="3"
                          />
                          {errors.notifications?.paymentReminders?.daysBefore && (
                            <p className="mt-1 text-sm text-red-600">{errors.notifications.paymentReminders.daysBefore.message}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Overdue Alerts</h4>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <input
                          {...register('notifications.overdueAlerts.enabled')}
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 mr-2"
                        />
                        <label className="text-sm text-gray-700">Enable overdue alerts</label>
                      </div>
                      {watch('notifications.overdueAlerts.enabled') && (
                        <div className="ml-6">
                          <label className="block text-sm font-medium text-gray-700">Alert frequency</label>
                          <select
                            {...register('notifications.overdueAlerts.frequency')}
                            className="mt-1 block w-40 border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Investment Maturity Alerts</h4>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <input
                          {...register('notifications.investmentMaturity.enabled')}
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 mr-2"
                        />
                        <label className="text-sm text-gray-700">Enable maturity alerts</label>
                      </div>
                      {watch('notifications.investmentMaturity.enabled') && (
                        <div className="ml-6">
                          <label className="block text-sm font-medium text-gray-700">Days before maturity</label>
                          <input
                            {...register('notifications.investmentMaturity.daysBefore', { 
                              min: { value: 1, message: 'Must be at least 1 day' },
                              max: { value: 90, message: 'Cannot exceed 90 days' },
                              valueAsNumber: true 
                            })}
                            type="number"
                            className="mt-1 block w-32 border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="30"
                          />
                          {errors.notifications?.investmentMaturity?.daysBefore && (
                            <p className="mt-1 text-sm text-red-600">{errors.notifications.investmentMaturity.daysBefore.message}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Security Configuration</h3>
                <div className="space-y-6">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Password Policy</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Minimum Length</label>
                        <input
                          {...register('security.passwordPolicy.minLength', { 
                            min: { value: 6, message: 'Minimum length must be at least 6' },
                            max: { value: 20, message: 'Maximum length cannot exceed 20' },
                            valueAsNumber: true 
                          })}
                          type="number"
                          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="8"
                        />
                        {errors.security?.passwordPolicy?.minLength && (
                          <p className="mt-1 text-sm text-red-600">{errors.security.passwordPolicy.minLength.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Session Timeout (minutes)</label>
                        <input
                          {...register('security.sessionTimeout', { 
                            min: { value: 15, message: 'Session timeout must be at least 15 minutes' },
                            max: { value: 480, message: 'Session timeout cannot exceed 8 hours' },
                            valueAsNumber: true 
                          })}
                          type="number"
                          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="480"
                        />
                        {errors.security?.sessionTimeout && (
                          <p className="mt-1 text-sm text-red-600">{errors.security.sessionTimeout.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          {...register('security.passwordPolicy.requireUppercase')}
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 mr-2"
                        />
                        <label className="text-sm text-gray-700">Require uppercase letters</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          {...register('security.passwordPolicy.requireLowercase')}
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 mr-2"
                        />
                        <label className="text-sm text-gray-700">Require lowercase letters</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          {...register('security.passwordPolicy.requireNumbers')}
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 mr-2"
                        />
                        <label className="text-sm text-gray-700">Require numbers</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          {...register('security.passwordPolicy.requireSpecialChars')}
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 mr-2"
                        />
                        <label className="text-sm text-gray-700">Require special characters</label>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Login Security</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Max Login Attempts</label>
                        <input
                          {...register('security.maxLoginAttempts', { 
                            min: { value: 3, message: 'Must allow at least 3 attempts' },
                            max: { value: 10, message: 'Cannot exceed 10 attempts' },
                            valueAsNumber: true 
                          })}
                          type="number"
                          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="5"
                        />
                        {errors.security?.maxLoginAttempts && (
                          <p className="mt-1 text-sm text-red-600">{errors.security.maxLoginAttempts.message}</p>
                        )}
                      </div>
                      <div className="flex items-center">
                        <input
                          {...register('security.twoFactorAuth')}
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 mr-2"
                        />
                        <label className="text-sm text-gray-700">Enable Two-Factor Authentication</label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Backup Settings */}
            {activeTab === 'backup' && (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Backup Configuration</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Enable Automatic Backups</h4>
                      <p className="text-sm text-gray-500">Automatically backup data at regular intervals</p>
                    </div>
                    <input
                      {...register('backup.enabled')}
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                  </div>

                  {watch('backup.enabled') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Backup Frequency</label>
                        <select
                          {...register('backup.frequency')}
                          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Retention Period (Days)</label>
                        <input
                          {...register('backup.retentionDays', { 
                            min: { value: 7, message: 'Retention must be at least 7 days' },
                            max: { value: 365, message: 'Retention cannot exceed 365 days' },
                            valueAsNumber: true 
                          })}
                          type="number"
                          className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="30"
                        />
                        {errors.backup?.retentionDays && (
                          <p className="mt-1 text-sm text-red-600">{errors.backup.retentionDays.message}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                      <div>
                        <h4 className="text-sm font-medium text-blue-800">Backup Information</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Backups include all your investment data, user accounts, and system settings. 
                          Regular backups ensure you can recover your data in case of any issues.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end space-x-3">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  reset(settings);
                  toast.info('Changes discarded');
                }}
                disabled={!isDirty}
              >
                Discard Changes
              </Button>
              <Button 
                type="submit" 
                loading={saving}
                disabled={!isDirty}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;