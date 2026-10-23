import React, { useState, useMemo } from 'react';
import telemetryData from '../services_telemetry.json';

interface ServiceItem {
  name: string;
  displayName: string;
  category: string;
  status: string;
  startType: string;
  path: string;
  timestamp: string;
  riskScore: string;
  mitreMapping: string;
}

export default function App() {
  const [services] = useState<ServiceItem[]>(telemetryData as ServiceItem[]);
  const [filterRisk, setFilterRisk] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<string>('newest');
  
  // NEW FEATURE STATE: Selected Service for SOC Action Playbook
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  const processedServices = useMemo(() => {
    let result = [...services];
    
    if (filterRisk !== 'All') {
      result = result.filter(s => s.riskScore === filterRisk);
    }
    
    result.sort((a, b) => {
      if (sortOrder === 'alphabetical') {
        return a.name.localeCompare(b.name);
      }
      
      const timeA = a.timestamp === "System Baseline" ? 0 : new Date(a.timestamp).getTime();
      const timeB = b.timestamp === "System Baseline" ? 0 : new Date(b.timestamp).getTime();
      
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });
    
    return result;
  }, [services, filterRisk, sortOrder]);

  const stats = useMemo(() => ({
    total: services.length,
    highRisk: services.filter(s => s.riskScore === 'High').length,
    thirdParty: services.filter(s => s.category === 'Third-Party / Apps').length
  }), [services]);

  const formatDisplayTime = (isoString: string) => {
    if (isoString === "System Baseline") return "System Baseline / Pre-installed";
    try {
      const d = new Date(isoString);
      return d.toLocaleString();
    } catch {
      return isoString;
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Segoe UI, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh', fontSize: '13px', position: 'relative' }}>
      
      <header style={{ marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
        <h1 style={{ color: '#0f172a', margin: 0, fontSize: '28px', fontWeight: 600 }}>Service Sentinel & Response Console</h1>
      </header>

      {/* Metrics Grid */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
        <div style={{ background: '#475569', color: '#fff', padding: '12px 20px', borderRadius: '6px', flex: 1 }}>
          <span style={{ fontSize: '11px', fontWeight: '600' }}>TOTAL ACTIVE SERVICES</span>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px' }}>{stats.total}</div>
        </div>
        <div style={{ background: '#dc2626', color: '#fff', padding: '12px 20px', borderRadius: '6px', flex: 1 }}>
          <span style={{ fontSize: '11px', fontWeight: '600' }}>HIGH SEVERITY ALERTS</span>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px' }}>{stats.highRisk}</div>
        </div>
        <div style={{ background: '#7c3aed', color: '#fff', padding: '12px 20px', borderRadius: '6px', flex: 1 }}>
          <span style={{ fontSize: '11px', fontWeight: '600' }}>THIRD-PARTY INTRODUCTIONS</span>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '4px' }}>{stats.thirdParty}</div>
        </div>
      </div>

      {/* Forensic Filters Panel */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', background: '#fff', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
        <div>
          <label style={{ fontWeight: '600', marginRight: '8px' }}>Timeline Sort:</label>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer' }}>
            <option value="newest">Newest Installed First</option>
            <option value="oldest">Oldest / Baseline First</option>
            <option value="alphabetical">Alphabetical (A-Z)</option>
          </select>
        </div>

        <div>
          <label style={{ fontWeight: '600', marginRight: '8px' }}>Risk Assessment:</label>
          <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', cursor: 'pointer' }}>
            <option value="All">All Tiers</option>
            <option value="High">🔴 High Priority Only</option>
            <option value="Medium">🟡 Medium Warnings</option>
            <option value="Low">🟢 Low Risk Core</option>
          </select>
        </div>
        <div style={{ marginLeft: 'auto', alignSelf: 'center', color: '#64748b', fontSize: '12px', italic: 'true' }}>
          💡 Click any row to open the SOC Incident Remediation Playbook
        </div>
      </div>

      {/* Streamlined Forensic Table */}
      <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#0f172a', color: '#fff' }}>
              <th style={{ padding: '10px 14px' }}>Service Target ID</th>
              <th style={{ padding: '10px 14px' }}>Segregation Category</th>
              <th style={{ padding: '10px 14px' }}>Installation Timeline Timestamp</th>
              <th style={{ padding: '10px 14px' }}>Risk Priority</th>
              <th style={{ padding: '10px 14px' }}>MITRE Flag</th>
              <th style={{ padding: '10px 14px' }}>Binary Execution Path</th>
            </tr>
          </thead>
          <tbody>
            {processedServices.map((service, index) => (
              <tr 
                key={index} 
                onClick={() => setSelectedService(service)}
                style={{ 
                  borderBottom: '1px solid #e2e8f0', 
                  background: selectedService?.name === service.name ? '#e0f2fe' : service.riskScore === 'High' ? '#fef2f2' : 'inherit',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                <td style={{ padding: '10px 14px', fontWeight: '600', color: '#1e293b' }}>{service.name}</td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ 
                    padding: '3px 8px', 
                    borderRadius: '4px', 
                    fontSize: '11px', 
                    fontWeight: 500,
                    background: service.category === 'Third-Party / Apps' ? '#f3e8ff' : service.category === 'OEM / Hardware Service' ? '#ffedd5' : '#e2e8f0',
                    color: service.category === 'Third-Party / Apps' ? '#6b21a8' : service.category === 'OEM / Hardware Service' ? '#9a3412' : '#334155'
                  }}>
                    {service.category}
                  </span>
                </td>
                <td style={{ padding: '10px 14px', color: '#334155' }}>{formatDisplayTime(service.timestamp)}</td>
                <td style={{ padding: '10px 14px', fontWeight: 'bold', color: service.riskScore === 'High' ? '#dc2626' : service.riskScore === 'Medium' ? '#d97706' : '#16a34a' }}>
                  {service.riskScore}
                </td>
                <td style={{ padding: '10px 14px', color: '#64748b', fontFamily: 'monospace' }}>{service.mitreMapping}</td>
                <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: '11px', color: '#64748b', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={service.path}>
                  {service.path}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 🚀 EXCLUSIVE FEATURE: SOC INCIDENT REMEDIATION PLAYBOOK DRAWER */}
      {selectedService && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '420px',
          height: '100vh',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          boxShadow: '-4px 0 15px rgba(0,0,0,0.3)',
          padding: '24px',
          boxSizing: 'border-box',
          overflowY: 'auto',
          zIndex: 1000
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
            <h3 style={{ margin: 0, color: '#38bdf8', fontSize: '16px' }}>⚡ SOC Incident Response Playbook</h3>
            <button onClick={() => setSelectedService(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}>✖</button>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.5px' }}>TARGET SERVICE</span>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f1f5f9' }}>{selectedService.name}</div>
            <div style={{ fontSize: '12px', color: '#cbd5e1' }}>{selectedService.displayName}</div>
          </div>

          <div style={{ background: '#1e293b', padding: '12px', borderRadius: '6px', marginBottom: '16px', borderLeft: selectedService.riskScore === 'High' ? '4px solid #ef4444' : '4px solid #22c55e' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>RISK EVALUATION</div>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: selectedService.riskScore === 'High' ? '#fca5a5' : '#86efac' }}>
              {selectedService.riskScore} Risk Tier
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>MITRE ATT&CK FRAMEWORK</div>
            <div style={{ fontSize: '12px', fontFamily: 'monospace', color: '#e2e8f0' }}>{selectedService.mitreMapping}</div>
          </div>

          <h4 style={{ color: '#38bdf8', fontSize: '13px', marginBottom: '8px' }}>1. Containment & Remediation Scripts</h4>
          <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: 0 }}>Copy and execute these administrator commands in PowerShell to neutralize this service if malicious:</p>

          <div style={{ marginBottom: '12px' }}>
            <span style={{ fontSize: '10px', color: '#cbd5e1' }}>Stop Service:</span>
            <pre style={{ background: '#020617', padding: '8px', borderRadius: '4px', fontSize: '11px', color: '#4ade80', overflowX: 'auto', border: '1px solid #1e293b' }}>
              Stop-Service -Name "{selectedService.name}" -Force
            </pre>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <span style={{ fontSize: '10px', color: '#cbd5e1' }}>Disable Startup:</span>
            <pre style={{ background: '#020617', padding: '8px', borderRadius: '4px', fontSize: '11px', color: '#4ade80', overflowX: 'auto', border: '1px solid #1e293b' }}>
              Set-Service -Name "{selectedService.name}" -StartupType Disabled
            </pre>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '10px', color: '#cbd5e1' }}>Eradicate Service Entry:</span>
            <pre style={{ background: '#020617', padding: '8px', borderRadius: '4px', fontSize: '11px', color: '#f87171', overflowX: 'auto', border: '1px solid #1e293b' }}>
              sc.exe delete "{selectedService.name}"
            </pre>
          </div>

          <h4 style={{ color: '#38bdf8', fontSize: '13px', marginBottom: '8px' }}>2. Forensic Path Verification</h4>
          <pre style={{ background: '#020617', padding: '8px', borderRadius: '4px', fontSize: '10px', color: '#94a3b8', whiteSpace: 'pre-wrap', wordBreak: 'break-all', border: '1px solid #1e293b' }}>
            {selectedService.path}
          </pre>

          <button 
            onClick={() => setSelectedService(null)} 
            style={{ width: '100%', padding: '10px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', marginTop: '12px' }}
          >
            Close Playbook
          </button>
        </div>
      )}

    </div>
  );
}