'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/stores/auth';
import { apiEndpoint } from '@/lib/config';
import { 
  printIDCard, 
  downloadIDCard,
  printDoubleSidedIDCard,
  downloadDoubleSidedIDCard,
  generateStaffCode 
} from '@/lib/id-card.service';

interface StaffMember {
  id: string;
  email: string;
  staffProfile?: {
    displayName: string;
    jobTitle?: string;
    department?: string;
    phoneNumber?: string;
  };
  accountStatus: string;
  role: string;
  lastLoginAt?: string;
  createdAt: string;
  staffRoles: any[];
  twoFactorAuth?: {
    enabled: boolean;
  };
}

const normalizeCardStatus = (status: string | undefined): 'ACTIVE' | 'SUSPENDED' | 'REVOKED' => {
  if (status === 'SUSPENDED' || status === 'REVOKED') return status;
  return 'ACTIVE';
};

export default function StaffProfile() {
  const params = useParams();
  const staffId = (params?.staffId as string) || '';
  const { accessToken } = useAuth();
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'roles' | 'tasks' | 'activity'>('overview');

  useEffect(() => {
    fetchStaff();
  }, [staffId, accessToken]);

  const fetchStaff = async () => {
    if (!staffId) return;
    
    try {
      if (!accessToken) throw new Error('Staff authentication is required');
      const res = await fetch(apiEndpoint(`/admin/staff/${staffId}`), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error('Failed to fetch staff');
      const data = await res.json();
      setStaff(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading staff');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;
  if (!staff) return <div className="p-8">Staff not found</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Link href="/staff/directory" className="text-blue-600 hover:text-blue-800 mb-6 block">
          ← Back to Directory
        </Link>

        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Staff Info */}
          <div className="col-span-3 lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center mb-6">
                {(staff as any).photoUrl ? (
                  <img
                    src={(staff as any).photoUrl}
                    alt={staff.staffProfile?.displayName}
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-4 border-blue-100"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <span className="text-4xl text-white">
                      {staff.staffProfile?.displayName?.[0] || 'S'}
                    </span>
                  </div>
                )}
                <h2 className="text-2xl font-bold text-gray-900">
                  {staff.staffProfile?.displayName || 'Staff Member'}
                </h2>
                <p className="text-gray-600">{staff.email}</p>
              </div>

              <div className="space-y-4 border-t pt-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Job Title</p>
                  <p className="text-lg font-medium text-gray-900">
                    {staff.staffProfile?.jobTitle || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Department</p>
                  <p className="text-lg font-medium text-gray-900">
                    {staff.staffProfile?.department || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Role</p>
                  <p className="text-lg font-medium text-indigo-700">
                    {staff.role || 'N/A'}
                  </p>
                </div>
                
                {/* Status Badge */}
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Account Status</p>
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                    staff.accountStatus === 'ACTIVE' 
                      ? 'bg-green-100 text-green-800' 
                      : staff.accountStatus === 'PENDING'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {staff.accountStatus === 'ACTIVE' ? '🟢' : staff.accountStatus === 'PENDING' ? '🟠' : '🔴'} {staff.accountStatus}
                  </div>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">2FA Status</p>
                  <p className={staff.twoFactorAuth?.enabled ? 'text-green-600' : 'text-red-600'}>
                    {staff.twoFactorAuth?.enabled ? '✅ Enabled' : '❌ Disabled'}
                  </p>
                </div>
                
                {/* Staff Code */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Staff ID Code</p>
                  <p className="font-mono font-bold text-gray-900 text-sm">
                    {staff.id?.startsWith('STF-') ? staff.id : 'STF-' + staff.id?.substring(0, 8).toUpperCase()}
                  </p>
                </div>
                
                {/* Dates */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Issued</p>
                    <p className="text-sm font-medium text-gray-900">
                      {staff.createdAt ? new Date(staff.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Valid Until</p>
                    <p className="text-sm font-medium text-gray-900">No Expiry</p>
                  </div>
                </div>
              </div>

              {/* Actions - ID Card Options */}
              <div className="mt-6 space-y-2">
                <div className="text-xs font-semibold text-gray-700 uppercase mb-3">ID Card Options (v4.1)</div>
                
                {/* Single-Sided Card */}
                <button 
                  onClick={() => {
                    const enrichedStaff = {
                      ...staff,
                      staffCode: staff.id?.startsWith('STF-') 
                        ? staff.id 
                        : generateStaffCode(
                            staff.staffProfile?.department || 'GEN',
                            staff.role || 'STAFF',
                            Math.floor(Math.random() * 9000) + 1000
                          ),
                      status: normalizeCardStatus(staff.accountStatus),
                      issuedDate: staff.createdAt,
                      validUntil: undefined,
                    };
                    
                    printIDCard(enrichedStaff);
                  }}
                  className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 text-sm font-medium transition flex items-center justify-center gap-2"
                >
                  🖨️ Print ID Card (Front Only)
                </button>
                
                <button 
                  onClick={() => {
                    const enrichedStaff = {
                      ...staff,
                      staffCode: staff.id?.startsWith('STF-') 
                        ? staff.id 
                        : generateStaffCode(
                            staff.staffProfile?.department || 'GEN',
                            staff.role || 'STAFF',
                            Math.floor(Math.random() * 9000) + 1000
                          ),
                      status: normalizeCardStatus(staff.accountStatus),
                      issuedDate: staff.createdAt,
                      validUntil: undefined,
                    };
                    
                    downloadIDCard(enrichedStaff);
                  }}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm font-medium transition flex items-center justify-center gap-2"
                >
                  ⬇️ Download Card (Front Only)
                </button>

                <div className="border-t border-gray-200 my-2"></div>

                {/* Double-Sided Card (NEW v4.1) */}
                <button 
                  onClick={() => {
                    const enrichedStaff = {
                      ...staff,
                      staffCode: staff.id?.startsWith('STF-') 
                        ? staff.id 
                        : generateStaffCode(
                            staff.staffProfile?.department || 'GEN',
                            staff.role || 'STAFF',
                            Math.floor(Math.random() * 9000) + 1000
                          ),
                      status: normalizeCardStatus(staff.accountStatus),
                      issuedDate: staff.createdAt,
                      validUntil: undefined,
                    };
                    
                    printDoubleSidedIDCard(enrichedStaff);
                  }}
                  className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 text-sm font-medium transition flex items-center justify-center gap-2"
                >
                  🖨️ Print Card (Double-Sided)
                </button>
                
                <button 
                  onClick={() => {
                    const enrichedStaff = {
                      ...staff,
                      staffCode: staff.id?.startsWith('STF-') 
                        ? staff.id 
                        : generateStaffCode(
                            staff.staffProfile?.department || 'GEN',
                            staff.role || 'STAFF',
                            Math.floor(Math.random() * 9000) + 1000
                          ),
                      status: normalizeCardStatus(staff.accountStatus),
                      issuedDate: staff.createdAt,
                      validUntil: undefined,
                    };
                    
                    downloadDoubleSidedIDCard(enrichedStaff);
                  }}
                  className="w-full bg-violet-600 text-white py-2 rounded-lg hover:bg-violet-700 text-sm font-medium transition flex items-center justify-center gap-2"
                >
                  ⬇️ Download Card (Double-Sided + Emergency)
                </button>

                <div className="border-t border-gray-200 my-2"></div>
                
                <button className="w-full bg-amber-600 text-white py-2 rounded-lg hover:bg-amber-700 text-sm font-medium transition flex items-center justify-center gap-2">
                  🔑 Reset Password
                </button>
                
                <button className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 text-sm font-medium transition flex items-center justify-center gap-2">
                  ⏸️ Suspend Account
                </button>
                
                <button className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 text-sm font-medium transition flex items-center justify-center gap-2">
                  ✂️ Revoke Access
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Tabs */}
          <div className="col-span-3 lg:col-span-2">
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow">
              <div className="border-b flex">
                {['overview', 'roles', 'tasks', 'activity'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`flex-1 py-4 px-4 font-medium text-sm transition ${
                      activeTab === tab
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs text-gray-600 uppercase">Joined</p>
                        <p className="text-lg font-medium text-gray-900">
                          {new Date(staff.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs text-gray-600 uppercase">Last Login</p>
                        <p className="text-lg font-medium text-gray-900">
                          {staff.lastLoginAt ? new Date(staff.lastLoginAt).toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'roles' && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Current Roles</h3>
                    
                    {/* Display simple role string (for mock staff) */}
                    {staff.role && (
                      <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg mb-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-indigo-600 uppercase tracking-wide mb-1">Primary Role</p>
                            <span className="font-semibold text-lg text-indigo-900">{staff.role}</span>
                          </div>
                          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full">Active</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Display staffRoles array (for real staff from API) */}
                    {staff.staffRoles && staff.staffRoles.length > 0 ? (
                      <div className="space-y-2">
                        {staff.staffRoles.map(sr => (
                          <div key={sr.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                            <span className="font-medium text-gray-900">{sr.role.name}</span>
                            <button className="text-red-600 hover:text-red-800 text-sm">Remove</button>
                          </div>
                        ))}
                      </div>
                    ) : !staff.role ? (
                      <p className="text-gray-600">No roles assigned</p>
                    ) : null}
                  </div>
                )}

                {activeTab === 'tasks' && (
                  <div className="space-y-4">
                    <p className="text-gray-600">Tasks will be displayed here</p>
                  </div>
                )}

                {activeTab === 'activity' && (
                  <div className="space-y-4">
                    <p className="text-gray-600">Activity log will be displayed here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
