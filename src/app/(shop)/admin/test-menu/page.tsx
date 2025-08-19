'use client';

import { useState, useEffect } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/constants/permissions';

export default function TestMenuPage() {
  const { hasPermission, isAdmin, loading: permissionsLoading } = usePermissions();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [instructions, setInstructions] = useState<string>('');

  useEffect(() => {
    // ทดสอบการทำงานของ permissions
    const testPermissions = async () => {
      try {
        // ทดสอบ API /api/auth/me
        const meResponse = await fetch('/api/auth/me');
        const meData = await meResponse.json();
        
        // ทดสอบ API permissions
        let permissionsData = null;
        if (meData.user?.phoneNumber) {
          const permResponse = await fetch(`/api/admin/permissions/${encodeURIComponent(meData.user.phoneNumber)}`);
          if (permResponse.ok) {
            permissionsData = await permResponse.json();
          }
        }

        setDebugInfo({
          timestamp: new Date().toISOString(),
          me: meData,
          permissions: permissionsData,
          hasPermission: typeof hasPermission,
          isAdmin,
          permissionsLoading,
          testPermissions: {
            ORDERS_VIEW: hasPermission(PERMISSIONS.ORDERS_VIEW),
            PRODUCTS_VIEW: hasPermission(PERMISSIONS.PRODUCTS_VIEW),
            CUSTOMERS_VIEW: hasPermission(PERMISSIONS.CUSTOMERS_VIEW),
            DASHBOARD_VIEW: hasPermission(PERMISSIONS.DASHBOARD_VIEW),
          }
        });
      } catch (error) {
        console.error('Error testing permissions:', error);
        setDebugInfo({
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        });
      }
    };

    if (!permissionsLoading) {
      testPermissions();
    }
  }, [hasPermission, isAdmin, permissionsLoading]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Admin Menu Permissions</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Current Status</h2>
          <div className="space-y-2">
            <p><strong>Loading:</strong> {permissionsLoading ? 'Yes' : 'No'}</p>
            <p><strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}</p>
            <p><strong>Has Permission Function:</strong> {typeof hasPermission}</p>
          </div>
        </div>

        {/* Test Results */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Test Results</h2>
          <div className="space-y-2">
            <p><strong>Orders View:</strong> {hasPermission(PERMISSIONS.ORDERS_VIEW) ? 'Yes' : 'No'}</p>
            <p><strong>Products View:</strong> {hasPermission(PERMISSIONS.PRODUCTS_VIEW) ? 'Yes' : 'No'}</p>
            <p><strong>Customers View:</strong> {hasPermission(PERMISSIONS.CUSTOMERS_VIEW) ? 'Yes' : 'No'}</p>
            <p><strong>Dashboard View:</strong> {hasPermission(PERMISSIONS.DASHBOARD_VIEW) ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>

      {/* Debug Information */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Debug Information</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      {/* Test Actions */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Test Actions</h2>
        <div className="space-y-2">
          <button
            onClick={() => {
              console.log('=== MANUAL PERMISSION TEST ===');
              console.log('isAdmin:', isAdmin);
              console.log('hasPermission function:', typeof hasPermission);
              console.log('ORDERS_VIEW:', hasPermission(PERMISSIONS.ORDERS_VIEW));
              console.log('PRODUCTS_VIEW:', hasPermission(PERMISSIONS.PRODUCTS_VIEW));
              console.log('=============================');
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test Permissions in Console
          </button>
          <button
            onClick={async () => {
              try {
                const res = await fetch('/api/test-build-instructions?refresh=true');
                const data = await res.json();
                setInstructions(data.instructions || '');
              } catch (err) {
                console.error('Error building instructions:', err);
              }
            }}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Build Instructions from Google
          </button>
        </div>
        {instructions && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Generated Instructions</h3>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto whitespace-pre-wrap">
              {instructions}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
