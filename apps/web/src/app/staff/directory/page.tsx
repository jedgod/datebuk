'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/stores/auth';
import { apiEndpoint } from '@/lib/config';

interface StaffMember {
  id: string;
  email: string;
  staffProfile?: {
    displayName: string;
    jobTitle?: string;
    department?: string;
  };
  accountStatus: string;
  role: string;
  lastLoginAt?: string;
  photoUrl?: string;
  photoData?: string;
  staffCode?: string;      // NEW: Structured staff code
  issuedDate?: string;     // NEW: ISO date of creation
  validUntil?: string;     // NEW: Expiry date (null for indefinite)
}

export default function StaffDirectory() {
  const { accessToken } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);

  useEffect(() => {
    fetchStaff();
  }, [accessToken]);

  const fetchStaff = async () => {
    try {
      if (!accessToken) throw new Error('Staff authentication is required');
      const res = await fetch(apiEndpoint('/admin/staff'), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.message || 'Failed to fetch staff');
      }
      const data = await res.json();
      setStaff(Array.isArray(data) ? data : data.staff || data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading staff');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading staff directory...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/admin/dashboard"
              className="text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2 transition"
            >
              ← Return to Dashboard
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-4xl font-bold text-gray-900">Staff Directory</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transition"
          >
            ➕ Create Staff
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-sm text-gray-600">Total Staff</div>
            <div className="text-3xl font-bold text-gray-900">{staff.length}</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-sm text-gray-600">Active</div>
            <div className="text-3xl font-bold text-green-600">
              {staff.filter(s => s.accountStatus === 'ACTIVE').length}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-sm text-gray-600">Pending</div>
            <div className="text-3xl font-bold text-yellow-600">
              {staff.filter(s => s.accountStatus === 'PENDING').length}
            </div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <div className="text-sm text-gray-600">Suspended</div>
            <div className="text-3xl font-bold text-red-600">
              {staff.filter(s => s.accountStatus === 'SUSPENDED').length}
            </div>
          </div>
        </div>

        {/* Staff Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Last Login</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map(member => (
                <tr key={member.id} className="border-b hover:bg-gray-50 transition">
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {member.photoUrl ? (
                          <img
                            src={member.photoUrl}
                            alt={member.staffProfile?.displayName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {member.staffProfile?.displayName?.[0] || 'S'}
                          </div>
                        )}
                      </div>
                      {/* Name and Title */}
                      <div>
                        <div className="font-medium text-gray-900">
                          {member.staffProfile?.displayName || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {member.staffProfile?.jobTitle || 'No title'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{member.email}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        member.accountStatus === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : member.accountStatus === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {member.accountStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {member.lastLoginAt ? new Date(member.lastLoginAt).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/staff/${member.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View →
                      </Link>
                      <button
                        onClick={() => {
                          setEditingStaff(member);
                          setShowEditModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        ✏️ Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Staff Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-8 max-w-5xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="mb-4">
              <Link 
                href="/admin/dashboard"
                className="text-gray-600 hover:text-gray-900 text-sm font-medium flex items-center gap-2 transition w-fit"
              >
                ← Return to Dashboard
              </Link>
            </div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900">👤 Add New Staff Member</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            <CreateStaffForm onSuccess={(newStaff) => { 
              setStaff([...staff, newStaff]); 
              setShowCreateModal(false); 
            }} />
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditModal && editingStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-8 max-w-5xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="mb-4">
              <Link 
                href="/admin/dashboard"
                className="text-gray-600 hover:text-gray-900 text-sm font-medium flex items-center gap-2 transition w-fit"
              >
                ← Return to Dashboard
              </Link>
            </div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900">✏️ Edit Staff Member</h2>
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  setEditingStaff(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            <EditStaffForm 
              staffMember={editingStaff}
              onSuccess={(updatedStaff) => { 
                setStaff(staff.map(s => s.id === updatedStaff.id ? updatedStaff : s));
                setShowEditModal(false); 
                setEditingStaff(null);
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
}

function CreateStaffForm({ onSuccess }: { onSuccess: (newStaff: StaffMember) => void }) {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'identity' | 'roles' | 'security' | 'access' | 'tasks' | 'compliance' | 'notifications' | 'metadata'>('identity');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  const [formData, setFormData] = useState({
    // 1. Identity & Account Details
    fullName: '',
    workEmail: '',
    staffId: '',
    username: '',
    department: '',
    jobTitle: '',
    passportPhoto: null as File | null,
    photoPreview: null as string | null,
    
    // 2. Role & Permissions
    role: 'VIEWER',
    permissions: [] as string[],
    
    // 3. Authentication & Security
    forcePasswordChange: true,
    require2FA: false,
    allowedLoginIPs: '',
    maxSessionDuration: '8',
    loginTimeWindow: '',
    
    // 4. Access Scope & Limits
    allowedModules: [] as string[],
    userVisibilityScope: 'ASSIGNED',
    actionApprovalRequired: false,
    escalationLevel: 'TIER_1',
    
    // 5. Task & Work Assignment
    defaultTaskType: 'FRAUD_REVIEW',
    dailyTaskLimit: '50',
    slaTier: '1HR',
    autoAssignment: false,
    
    // 6. Compliance & Monitoring
    activityLogging: true,
    sessionRecording: false,
    dataExportPermission: false,
    riskScoringEnabled: true,
    
    // 7. Notification & Alert Preferences
    emailAlerts: true,
    inAppAlerts: true,
    criticalIncidentAlerts: false,
    
    // 8. Onboarding Metadata
    creationReason: '',
    startDate: '',
    contractType: 'FULL_TIME',
    expiryDate: '',
  });

  const tabs = [
    { id: 'identity', label: '1️⃣ Identity', icon: '👤' },
    { id: 'roles', label: '2️⃣ Roles', icon: '🔐' },
    { id: 'security', label: '3️⃣ Security', icon: '🔒' },
    { id: 'access', label: '4️⃣ Access', icon: '🚪' },
    { id: 'tasks', label: '5️⃣ Tasks', icon: '📋' },
    { id: 'compliance', label: '6️⃣ Compliance', icon: '✅' },
    { id: 'notifications', label: '7️⃣ Alerts', icon: '🔔' },
    { id: 'metadata', label: '8️⃣ Metadata', icon: '📝' },
  ];

  // Validation function
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.workEmail.trim()) {
      newErrors.workEmail = 'Work email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.workEmail)) {
      newErrors.workEmail = 'Please enter a valid email address';
    }

    if (!formData.department) {
      newErrors.department = 'Department is required';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all required fields as touched
    setTouched({
      fullName: true,
      workEmail: true,
      department: true,
      role: true,
    });

    // Validate form
    if (!validateForm()) {
      // Switch to the identity tab where required fields are
      setActiveTab('identity');
      alert('⚠️ Please fill in all required fields:\n• Full Name\n• Work Email (valid format)\n• Department');
      return;
    }

    setLoading(true);

    try {
      if (!accessToken) throw new Error('Staff authentication is required');
      const rolesResponse = await fetch(apiEndpoint('/admin/roles'), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const rolesPayload = await rolesResponse.json().catch(() => null);
      if (!rolesResponse.ok) throw new Error(rolesPayload?.message || 'Unable to load staff roles');
      const roles = Array.isArray(rolesPayload) ? rolesPayload : rolesPayload?.roles || [];
      const selectedRole = roles.find((role: { id: string; name?: string }) =>
        role.id === formData.role || role.name?.toLowerCase() === formData.role.toLowerCase()
      );
      if (!selectedRole) throw new Error(`Role "${formData.role}" is not configured`);

      const createResponse = await fetch(apiEndpoint('/admin/staff'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          email: formData.workEmail,
          displayName: formData.fullName,
          jobTitle: formData.jobTitle || 'Staff Member',
          department: formData.department,
          requireTwoFactor: formData.require2FA,
          roleIds: [selectedRole.id],
        }),
      });
      const created = await createResponse.json().catch(() => null);
      if (!createResponse.ok) throw new Error(created?.message || 'Failed to create staff');
      alert(`Staff created. Temporary password: ${created.tempPassword}`);
      onSuccess({
        id: created.userId,
        email: created.email,
        staffProfile: { displayName: formData.fullName, jobTitle: formData.jobTitle, department: formData.department },
        accountStatus: 'PENDING',
        role: formData.role,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error creating staff');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    validateForm();
  };

  const togglePermission = (permission: string) => {
    setFormData({
      ...formData,
      permissions: formData.permissions.includes(permission)
        ? formData.permissions.filter(p => p !== permission)
        : [...formData.permissions, permission]
    });
  };

  const toggleModule = (module: string) => {
    setFormData({
      ...formData,
      allowedModules: formData.allowedModules.includes(module)
        ? formData.allowedModules.filter(m => m !== module)
        : [...formData.allowedModules, module]
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Validate file
      const validation = {
        isValid: ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) && file.size <= 2 * 1024 * 1024,
        error: file.size > 2 * 1024 * 1024 ? 'Image too large (max 2MB)' : 
               !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ? 'Invalid image type' : ''
      };

      if (!validation.isValid) {
        alert(`❌ ${validation.error}`);
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData({
          ...formData,
          passportPhoto: file,
          photoPreview: event.target?.result as string
        });
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert(`Failed to process photo: ${err}`);
    }
  };

  // Check if identity tab has errors
  const hasIdentityErrors = () => {
    return (touched.fullName && errors.fullName) || 
           (touched.workEmail && errors.workEmail) || 
           (touched.department && errors.department);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <div className="flex space-x-1 min-w-max">
          {tabs.map(tab => {
            const hasError = tab.id === 'identity' && hasIdentityErrors();
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-3 font-medium text-sm whitespace-nowrap transition relative ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.icon} {tab.label}
                {hasError && <span className="ml-1 text-red-500">⚠️</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* 1. Identity & Account Details */}
        {activeTab === 'identity' && (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-bold text-gray-900">Identity & Account Details</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs">
                <span className="text-red-500 font-bold">*</span> = Required field
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={e => updateField('fullName', e.target.value)}
                  onBlur={() => handleBlur('fullName')}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    touched.fullName && errors.fullName 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'focus:ring-blue-500'
                  }`}
                  placeholder="John Smith"
                  required
                />
                {touched.fullName && errors.fullName && (
                  <p className="text-red-500 text-xs mt-1">⚠️ {errors.fullName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.workEmail}
                  onChange={e => updateField('workEmail', e.target.value)}
                  onBlur={() => handleBlur('workEmail')}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    touched.workEmail && errors.workEmail 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'focus:ring-blue-500'
                  }`}
                  placeholder="john.smith@company.com"
                  required
                />
                {touched.workEmail && errors.workEmail && (
                  <p className="text-red-500 text-xs mt-1">⚠️ {errors.workEmail}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Staff ID / Employee ID
                </label>
                <input
                  type="text"
                  value={formData.staffId}
                  onChange={e => updateField('staffId', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Auto-generated if empty"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={e => updateField('username', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Email is default"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department / Team <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.department}
                  onChange={e => updateField('department', e.target.value)}
                  onBlur={() => handleBlur('department')}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    touched.department && errors.department 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'focus:ring-blue-500'
                  }`}
                  required
                >
                  <option value="">Select Department</option>
                  <option value="FRAUD">Fraud Detection</option>
                  <option value="SUPPORT">Customer Support</option>
                  <option value="RISK">Risk Management</option>
                  <option value="ENGINEERING">Engineering</option>
                  <option value="MODERATION">Content Moderation</option>
                  <option value="OPERATIONS">Operations</option>
                </select>
                {touched.department && errors.department && (
                  <p className="text-red-500 text-xs mt-1">⚠️ {errors.department}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title
                </label>
                <input
                  type="text"
                  value={formData.jobTitle}
                  onChange={e => updateField('jobTitle', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Fraud Analyst, Support Manager, etc."
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  📸 Passport Photo
                </label>
                <div className="flex gap-4 items-start">
                  {/* Photo Preview */}
                  <div className="flex-shrink-0">
                    {formData.photoPreview ? (
                      <div className="relative">
                        <img 
                          src={formData.photoPreview}
                          alt="Photo preview"
                          className="w-24 h-24 rounded-lg object-cover border-2 border-blue-300"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, photoPreview: null, passportPhoto: null })}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <span className="text-3xl">📷</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Input */}
                  <div className="flex-1">
                    <input
                      type="file"
                      id="photo-input"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="photo-input"
                      className="block px-4 py-2 bg-blue-50 border-2 border-blue-300 rounded-lg text-blue-700 text-sm font-medium cursor-pointer hover:bg-blue-100 text-center transition"
                    >
                      Choose Photo
                    </label>
                    <p className="text-xs text-gray-600 mt-2">
                      JPG, PNG, or WebP • Max 2MB • Min 300x300px
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Role & Permissions */}
        {activeTab === 'roles' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Role & Permissions</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Primary Role <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.role}
                onChange={e => updateField('role', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="SUPERADMIN">Super Admin (Full Access)</option>
                <option value="ADMIN">Admin (Management Access)</option>
                <option value="MANAGER">Manager (Team Lead)</option>
                <option value="STAFF">Staff (Standard Access)</option>
                <option value="SUPPORT">Support (Customer Service)</option>
                <option value="VIEWER">Viewer (Read-only)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Granular Permissions (Override role defaults)
              </label>
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg">
                {[
                  { id: 'staff.assign', label: 'Assign Staff' },
                  { id: 'tasks.view', label: 'View Tasks' },
                  { id: 'tasks.assign', label: 'Assign Tasks' },
                  { id: 'fraud.view', label: 'View Fraud Events' },
                  { id: 'fraud.edit', label: 'Edit Fraud Cases' },
                  { id: 'users.moderate', label: 'Moderate Users' },
                  { id: 'users.ban', label: 'Ban Users' },
                  { id: 'data.export', label: 'Export Data' },
                  { id: 'ip.monitor', label: 'Access IP Monitoring' },
                  { id: 'experiments.access', label: 'Access Experiments' },
                  { id: 'risk.edit', label: 'Edit Risk Scores' },
                  { id: 'reports.view', label: 'View Reports' },
                ].map(perm => (
                  <label key={perm.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(perm.id)}
                      onChange={() => togglePermission(perm.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{perm.label}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                🔐 Best practice: Apply least-privilege by default
              </p>
            </div>
          </div>
        )}

        {/* 3. Authentication & Security Controls */}
        {activeTab === 'security' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Authentication & Security Controls</h3>
            
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.forcePasswordChange}
                  onChange={e => updateField('forcePasswordChange', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Force Password Change on First Login</span>
                  <p className="text-xs text-gray-600">User must create new password after first login</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.require2FA}
                  onChange={e => updateField('require2FA', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Require 2FA (Two-Factor Authentication)</span>
                  <p className="text-xs text-gray-600">Mandatory for privileged roles</p>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Allowed Login IPs (Optional)
                </label>
                <textarea
                  value={formData.allowedLoginIPs}
                  onChange={e => updateField('allowedLoginIPs', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="192.168.1.1, 10.0.0.0/24"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">Comma-separated IPs or CIDR ranges</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Session Duration (hours)
                </label>
                <input
                  type="number"
                  value={formData.maxSessionDuration}
                  onChange={e => updateField('maxSessionDuration', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="8"
                  min="1"
                  max="24"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Login Time Window (Optional)
                </label>
                <input
                  type="text"
                  value={formData.loginTimeWindow}
                  onChange={e => updateField('loginTimeWindow', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 08:00-18:00 (24-hour format)"
                />
                <p className="text-xs text-gray-500 mt-1">Restrict login times for enhanced security</p>
              </div>
            </div>
          </div>
        )}

        {/* 4. Access Scope & Limits */}
        {activeTab === 'access' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Access Scope & Limits</h3>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Allowed Products / Modules
              </label>
              <div className="grid grid-cols-3 gap-3 bg-gray-50 p-4 rounded-lg">
                {[
                  'Fraud Detection',
                  'Support Platform',
                  'Admin Panel',
                  'IP Monitoring',
                  'Risk Scoring',
                  'User Management',
                  'Content Moderation',
                  'Analytics',
                  'Experiments',
                ].map(module => (
                  <label key={module} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allowedModules.includes(module)}
                      onChange={() => toggleModule(module)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{module}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User Visibility Scope
                </label>
                <select
                  value={formData.userVisibilityScope}
                  onChange={e => updateField('userVisibilityScope', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="GLOBAL">Global (All Users)</option>
                  <option value="REGION">Region Specific</option>
                  <option value="ASSIGNED">Assigned Only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Escalation Level
                </label>
                <select
                  value={formData.escalationLevel}
                  onChange={e => updateField('escalationLevel', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="TIER_1">Tier 1 (Entry Level)</option>
                  <option value="TIER_2">Tier 2 (Intermediate)</option>
                  <option value="TIER_3">Tier 3 (Senior/Expert)</option>
                </select>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.actionApprovalRequired}
                  onChange={e => updateField('actionApprovalRequired', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Action Approval Required</span>
                  <p className="text-xs text-gray-600">Manager approval needed for critical actions</p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* 5. Task & Work Assignment Defaults */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Task & Work Assignment Defaults</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Task Type
                </label>
                <select
                  value={formData.defaultTaskType}
                  onChange={e => updateField('defaultTaskType', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="FRAUD_REVIEW">Fraud Review</option>
                  <option value="TICKET_HANDLING">Ticket Handling</option>
                  <option value="USER_MODERATION">User Moderation</option>
                  <option value="CONTENT_REVIEW">Content Review</option>
                  <option value="RISK_ASSESSMENT">Risk Assessment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Daily Task Limit
                </label>
                <input
                  type="number"
                  value={formData.dailyTaskLimit}
                  onChange={e => updateField('dailyTaskLimit', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="50"
                  min="1"
                />
                <p className="text-xs text-gray-500 mt-1">Prevent workload overload</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SLA Tier
                </label>
                <select
                  value={formData.slaTier}
                  onChange={e => updateField('slaTier', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="15MIN">15 Minutes (Critical)</option>
                  <option value="1HR">1 Hour (High Priority)</option>
                  <option value="4HR">4 Hours (Standard)</option>
                  <option value="24HR">24 Hours (Low Priority)</option>
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center space-x-3 cursor-pointer bg-gray-50 p-3 rounded-lg w-full">
                  <input
                    type="checkbox"
                    checked={formData.autoAssignment}
                    onChange={e => updateField('autoAssignment', e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-900">Enable Auto-assignment</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* 6. Compliance & Monitoring */}
        {activeTab === 'compliance' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Compliance & Monitoring</h3>
            <p className="text-sm text-gray-600 mb-4">SOC2 / ISO 27001 Ready</p>
            
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.activityLogging}
                  onChange={e => updateField('activityLogging', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  disabled
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Activity Logging ✅</span>
                  <p className="text-xs text-gray-600">Always enabled for compliance (cannot be disabled)</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.sessionRecording}
                  onChange={e => updateField('sessionRecording', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Session Recording</span>
                  <p className="text-xs text-gray-600">Record sessions for sensitive roles (SOC2 requirement)</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.dataExportPermission}
                  onChange={e => updateField('dataExportPermission', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Data Export Permission</span>
                  <p className="text-xs text-gray-600">Allow exporting data (explicit opt-in required)</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.riskScoringEnabled}
                  onChange={e => updateField('riskScoringEnabled', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Risk Scoring Enabled</span>
                  <p className="text-xs text-gray-600">Track staff member's own risk score</p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* 7. Notification & Alert Preferences */}
        {activeTab === 'notifications' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Notification & Alert Preferences</h3>
            
            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.emailAlerts}
                  onChange={e => updateField('emailAlerts', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">📧 Email Alerts</span>
                  <p className="text-xs text-gray-600">Task assignments, escalations, important updates</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.inAppAlerts}
                  onChange={e => updateField('inAppAlerts', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">🔔 In-App Alerts</span>
                  <p className="text-xs text-gray-600">Real-time notifications for live events</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.criticalIncidentAlerts}
                  onChange={e => updateField('criticalIncidentAlerts', e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">🚨 Critical Incident Alerts</span>
                  <p className="text-xs text-gray-600">Fraud spikes, system outages, security incidents</p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* 8. Onboarding Metadata */}
        {activeTab === 'metadata' && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Onboarding Metadata</h3>
            <p className="text-sm text-gray-600 mb-4">Internal admin information (not visible to staff)</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Creation Reason / Notes
                </label>
                <textarea
                  value={formData.creationReason}
                  onChange={e => updateField('creationReason', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Backfill for departed employee, seasonal hiring, team expansion"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={e => updateField('startDate', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Account auto-disabled before this date</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contract Type
                </label>
                <select
                  value={formData.contractType}
                  onChange={e => updateField('contractType', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="FULL_TIME">Full-Time</option>
                  <option value="PART_TIME">Part-Time</option>
                  <option value="CONTRACT">Contract / Temporary</option>
                  <option value="INTERN">Intern</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={e => updateField('expiryDate', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Account auto-revoked after this date (for contracts/interns)</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <button
          type="button"
          onClick={() => {
            const tabOrder: any[] = ['identity', 'roles', 'security', 'access', 'tasks', 'compliance', 'notifications', 'metadata'];
            const currentIndex = tabOrder.indexOf(activeTab);
            if (currentIndex > 0) setActiveTab(tabOrder[currentIndex - 1]);
          }}
          className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium"
          disabled={activeTab === 'identity'}
        >
          ← Previous
        </button>

        <div className="text-sm text-gray-500">
          Step {['identity', 'roles', 'security', 'access', 'tasks', 'compliance', 'notifications', 'metadata'].indexOf(activeTab) + 1} of 8
        </div>

        {activeTab === 'metadata' ? (
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:shadow-lg transition disabled:opacity-50"
          >
            {loading ? 'Creating Staff...' : '✅ Create Staff Member'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              const tabOrder: any[] = ['identity', 'roles', 'security', 'access', 'tasks', 'compliance', 'notifications', 'metadata'];
              const currentIndex = tabOrder.indexOf(activeTab);
              if (currentIndex < tabOrder.length - 1) setActiveTab(tabOrder[currentIndex + 1]);
            }}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
          >
            Next →
          </button>
        )}
      </div>
    </form>
  );
}

function EditStaffForm({ staffMember, onSuccess }: { staffMember: StaffMember; onSuccess: (updatedStaff: StaffMember) => void }) {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: staffMember.staffProfile?.displayName || '',
    workEmail: staffMember.email,
    jobTitle: staffMember.staffProfile?.jobTitle || '',
    department: staffMember.staffProfile?.department || '',
    role: staffMember.role,
    accountStatus: staffMember.accountStatus,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!accessToken) throw new Error('Staff authentication is required');
      const authHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` };

      const profileRes = await fetch(apiEndpoint(`/admin/staff/${staffMember.id}`), {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          displayName: formData.fullName,
          jobTitle: formData.jobTitle,
          department: formData.department,
        }),
      });
      const profilePayload = await profileRes.json().catch(() => null);
      if (!profileRes.ok) throw new Error(profilePayload?.message || 'Failed to update staff profile');

      if (formData.role !== staffMember.role) {
        const rolesResponse = await fetch(apiEndpoint('/admin/roles'), { headers: authHeaders });
        const rolesPayload = await rolesResponse.json().catch(() => null);
        if (!rolesResponse.ok) throw new Error(rolesPayload?.message || 'Unable to load staff roles');
        const roles = Array.isArray(rolesPayload) ? rolesPayload : rolesPayload?.roles || [];
        const selectedRole = roles.find((role: { id: string; name?: string }) =>
          role.id === formData.role || role.name?.toLowerCase() === formData.role.toLowerCase()
        );
        if (!selectedRole) throw new Error(`Role "${formData.role}" is not configured`);

        const roleRes = await fetch(apiEndpoint(`/admin/staff/${staffMember.id}/roles`), {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({ roleIds: [selectedRole.id] }),
        });
        const rolePayload = await roleRes.json().catch(() => null);
        if (!roleRes.ok) throw new Error(rolePayload?.message || 'Failed to update staff role');
      }

      if (formData.accountStatus !== staffMember.accountStatus) {
        if (formData.accountStatus === 'SUSPENDED' || formData.accountStatus === 'REVOKED') {
          const reason = window.prompt(`Reason for setting status to ${formData.accountStatus}:`) || '';
          if (!reason.trim()) throw new Error('A reason is required to suspend or revoke a staff account');
          const action = formData.accountStatus === 'SUSPENDED' ? 'suspend' : 'revoke';
          const statusRes = await fetch(apiEndpoint(`/admin/staff/${staffMember.id}/${action}`), {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ reason }),
          });
          const statusPayload = await statusRes.json().catch(() => null);
          if (!statusRes.ok) throw new Error(statusPayload?.message || `Failed to ${action} staff account`);
        } else {
          throw new Error(
            `Reactivating a staff account from ${staffMember.accountStatus} to ${formData.accountStatus} isn't supported yet — this transition has no backend endpoint.`
          );
        }
      }

      onSuccess({
        ...staffMember,
        email: formData.workEmail,
        staffProfile: {
          displayName: formData.fullName,
          jobTitle: formData.jobTitle,
          department: formData.department,
        },
        accountStatus: formData.accountStatus,
        role: formData.role,
      });
      alert(`✅ Staff member updated.`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error updating staff');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <p className="text-sm text-blue-700">
          <strong>Editing:</strong> {staffMember.staffProfile?.displayName || staffMember.email}
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Staff ID: {staffMember.id}
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Staff Information</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={e => updateField('fullName', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Work Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.workEmail}
              onChange={e => updateField('workEmail', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Title
            </label>
            <input
              type="text"
              value={formData.jobTitle}
              onChange={e => updateField('jobTitle', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.department}
              onChange={e => updateField('department', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select Department</option>
              <option value="FRAUD">Fraud Detection</option>
              <option value="SUPPORT">Customer Support</option>
              <option value="RISK">Risk Management</option>
              <option value="ENGINEERING">Engineering</option>
              <option value="MODERATION">Content Moderation</option>
              <option value="OPERATIONS">Operations</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.role}
              onChange={e => updateField('role', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="SUPERADMIN">Super Admin</option>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="STAFF">Staff</option>
              <option value="SUPPORT">Support</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Status <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.accountStatus}
              onChange={e => updateField('accountStatus', e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-6 border-t">
        <div className="text-sm text-gray-500">
          Last login: {staffMember.lastLoginAt ? new Date(staffMember.lastLoginAt).toLocaleDateString() : 'Never'}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onSuccess(staffMember)}
            className="px-6 py-2 text-gray-600 hover:text-gray-900 font-medium border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition disabled:opacity-50"
          >
            {loading ? 'Updating...' : '💾 Save Changes'}
          </button>
        </div>
      </div>
    </form>
  );
}
