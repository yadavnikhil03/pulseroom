import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Radio, 
  ListMusic, 
  Activity, 
  Users, 
  BarChart3, 
  TerminalSquare, 
  Settings,
  Search,
  GitBranch,
  Bell,
  PlayCircle,
  Database,
  Cpu,
  Globe,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import './dev-style.css';

const DevDashboard = ({ user, slides, onJoinRoom, onCreateRoom }) => {
  const [roomInput, setRoomInput] = useState('');
  const safeName = user?.name ? user.name.toString() : 'Admin User';

  const handleJoin = (e) => {
    e.preventDefault();
    if (roomInput.trim()) {
      onJoinRoom(roomInput.trim());
    }
  };

  return (
    <div className="dev-layout">
      <aside className="dev-sidebar">
        <div className="dev-sidebar-brand">
          <Globe className="dev-brand-icon" />
          <span className="dev-brand-text">Pulseroom Admin</span>
        </div>

        <nav className="dev-nav">
          <div className="dev-nav-section">Workspace</div>
          <a href="#" onClick={e => e.preventDefault()} className="dev-nav-item active"><LayoutDashboard size={16} /> Overview</a>
          <a href="#" onClick={e => e.preventDefault()} className="dev-nav-item"><Radio size={16} /> Rooms</a>
          <a href="#" onClick={e => e.preventDefault()} className="dev-nav-item"><ListMusic size={16} /> Queue</a>
          <a href="#" onClick={e => e.preventDefault()} className="dev-nav-item"><Activity size={16} /> Live Sessions</a>

          <div className="dev-nav-section">System</div>
          <a href="#" onClick={e => e.preventDefault()} className="dev-nav-item"><Users size={16} /> Users</a>
          <a href="#" onClick={e => e.preventDefault()} className="dev-nav-item"><BarChart3 size={16} /> Analytics</a>
          <a href="#" onClick={e => e.preventDefault()} className="dev-nav-item"><TerminalSquare size={16} /> Logs</a>
          
          <div className="dev-nav-section">Configuration</div>
          <a href="#" onClick={e => e.preventDefault()} className="dev-nav-item"><Settings size={16} /> Settings</a>
        </nav>

        <div className="dev-sidebar-footer">
          <div className="dev-nav-item" style={{ cursor: 'default' }}>
            <Database size={16} color="#1DB954" />
            <span style={{ fontSize: '0.75rem' }}>Cluster: Online</span>
          </div>
        </div>
      </aside>

      <main className="dev-main">
        {}
        <header className="dev-topbar">
          <div className="topbar-left">
            <span className="workspace-title">Production</span>
            <span className="env-badge">DEV</span>
          </div>
          <div className="topbar-right">
            <div className="search-box">
              <Search size={14} />
              <span>Search resources... (⌘K)</span>
            </div>
            <div className="git-branch">
              <GitBranch size={14} /> main
            </div>
            <Bell size={18} color="rgba(255,255,255,0.4)" style={{ cursor: 'pointer' }} />
            <div className="profile-avatar" title={safeName}></div>
          </div>
        </header>

        <div className="dev-content">
          
          <div className="dev-header">
            <h1 className="dev-title">Platform Overview</h1>
            <p className="dev-subtitle">Real-time metrics and active environment sessions.</p>
          </div>

          <div className="dev-grid">
            
            <div className="dev-card card-col-4">
              <div className="stat-value">24.8k</div>
              <div className="stat-label">
                <Users size={14} /> Connected Users <span className="stat-trend">↑ 12%</span>
              </div>
            </div>

            <div className="dev-card card-col-4">
              <div className="stat-value">1,402</div>
              <div className="stat-label">
                <Radio size={14} /> Active Rooms <span className="stat-trend">↑ 5%</span>
              </div>
            </div>

            <div className="dev-card card-col-4">
              <div className="stat-value">99.9%</div>
              <div className="stat-label">
                <Cpu size={14} /> API Uptime <span className="stat-trend">Stable</span>
              </div>
            </div>

            <div className="dev-card card-col-6">
              <div className="card-header">
                <div className="card-title-group">
                  <Radio size={18} className="card-icon" />
                  <h2 className="card-title">Join Listening Room</h2>
                </div>
                <div className="status-dot status-green status-active"></div>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginBottom: '24px' }}>
                Connect to an existing synchronized session by entering the Room ID.
              </p>
              
              <form onSubmit={handleJoin} className="room-input-group">
                <input 
                  type="text" 
                  className="dev-input" 
                  placeholder="Enter Room ID (e.g. 8f72a)" 
                  value={roomInput}
                  onChange={(e) => setRoomInput(e.target.value)}
                />
                <button type="submit" className="dev-btn-primary">
                  Connect
                </button>
              </form>
            </div>

            <div className="dev-card card-col-6">
              <div className="card-header">
                <div className="card-title-group">
                  <PlayCircle size={18} className="card-icon" />
                  <h2 className="card-title">Host New Session</h2>
                </div>
                <span className="card-action">Select Source</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '180px', paddingRight: '8px' }}>
                {slides && slides.length > 0 ? slides[0].map(playlist => (
                  <div key={playlist.id} className="host-row" onClick={() => onCreateRoom(playlist.id)}>
                    <img src={playlist.images[0]?.url || '/images/icons/pulseroom-logo.svg'} className="host-art" alt="cover" />
                    <div className="host-info">
                      <p className="host-name">{playlist.name}</p>
                      <p className="host-meta">ID: {playlist.id.substring(0,8)}...</p>
                    </div>
                    <CheckCircle2 size={16} color="rgba(255,255,255,0.2)" />
                  </div>
                )) : (
                  <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>No playlists available to host.</p>
                )}
              </div>
            </div>

            <div className="dev-card card-col-8">
              <div className="card-header">
                <div className="card-title-group">
                  <Activity size={18} className="card-icon" />
                  <h2 className="card-title">Recent Realtime Events</h2>
                </div>
                <span className="card-action">View All</span>
              </div>
              
              <table className="dev-table">
                <thead>
                  <tr>
                    <th>Event ID</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Latency</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>ev_982x1a</td>
                    <td>TRACK_CHANGE</td>
                    <td><span className="status-dot status-green"></span> Success</td>
                    <td>12ms</td>
                  </tr>
                  <tr>
                    <td>ev_452b9c</td>
                    <td>USER_JOIN</td>
                    <td><span className="status-dot status-green"></span> Success</td>
                    <td>8ms</td>
                  </tr>
                  <tr>
                    <td>ev_112z8q</td>
                    <td>QUEUE_UPDATE</td>
                    <td><span className="status-dot status-yellow"></span> Pending</td>
                    <td>--</td>
                  </tr>
                  <tr>
                    <td>ev_789f2d</td>
                    <td>SYNC_OFFSET</td>
                    <td><span className="status-dot status-red"></span> Failed</td>
                    <td>145ms</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="dev-card card-col-4">
              <div className="card-header">
                <div className="card-title-group">
                  <Database size={18} className="card-icon" />
                  <h2 className="card-title">System Health</h2>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                    <div className="status-dot status-green"></div> Database Cluster
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>9ms</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                    <div className="status-dot status-green"></div> Redis Cache
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>2ms</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                    <div className="status-dot status-green"></div> Socket Server
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>14ms</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                    <div className="status-dot status-yellow"></div> Auth Provider
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>184ms</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default DevDashboard;
