import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotifications, getUnreadCount, markAllAsRead } from '../api/notificationApi';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await getUnreadCount();
      setUnreadCount(res.data.count);
    } catch {}
  };

  const handleOpen = async () => {
    setOpen(!open);
    if (!open) {
      try {
        const res = await getNotifications();
        setNotifications(res.data);
        await markAllAsRead();
        setUnreadCount(0);
      } catch {}
    }
  };

  const getIcon = (type) => {
    if (type === 'BOOKING_REQUEST') return '📋';
    if (type === 'BOOKING_APPROVED') return '✅';
    if (type === 'BOOKING_REJECTED') return '❌';
    if (type === 'TICKET_CREATED') return '🎫';
    if (type === 'TICKET_COMMENT') return '💬';
    if (type === 'TICKET_ATTACHMENT') return '📎';
    if (type === 'TICKET_STATUS_CHANGED') return '🔄';
    return '🔔';
  };

  const getColor = (type) => {
    if (type === 'BOOKING_REQUEST') return '#BA7517';
    if (type === 'BOOKING_APPROVED') return '#1D9E75';
    if (type === 'BOOKING_REJECTED') return '#E24B4A';
    if (type === 'TICKET_CREATED') return '#003366';
    if (type === 'TICKET_COMMENT') return '#5C6BC0';
    if (type === 'TICKET_ATTACHMENT') return '#7B1FA2';
    if (type === 'TICKET_STATUS_CHANGED') return '#E87722';
    return '#003366';
  };

  // Navigate to relevant page based on notification type
  const handleNotificationClick = (notification) => {
    setOpen(false);
    const type = notification.type;

    if (type === 'BOOKING_REQUEST') {
      navigate('/admin/bookings');
    } else if (type === 'BOOKING_APPROVED' || type === 'BOOKING_REJECTED') {
      navigate('/bookings');
    } else if (type === 'TICKET_CREATED' || type === 'TICKET_COMMENT' || type === 'TICKET_ATTACHMENT') {
      // Extract ticket ID from message if available
      const match = notification.message.match(/Ticket #(\d+)/);
      if (match) {
        navigate(`/tickets/${match[1]}`);
      } else {
        navigate('/tickets');
      }
    } else if (type === 'TICKET_STATUS_CHANGED') {
      navigate('/tickets');
    } else {
      navigate('/');
    }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return 'Just now';
  };

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        style={{
          position: 'relative', background: 'transparent',
          border: '1px solid #ddd', borderRadius: '50%',
          width: '38px', height: '38px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', transition: 'all 0.2s',
          backgroundColor: open ? '#f0f4ff' : '#fff',
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '-4px', right: '-4px',
            background: '#E24B4A', color: '#fff',
            borderRadius: '50%', width: '18px', height: '18px',
            fontSize: '10px', fontWeight: '700',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #fff',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {open && (
        <div style={{
          position: 'absolute', top: '48px', right: 0,
          width: '360px', maxHeight: '480px',
          background: '#fff', borderRadius: '14px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
          border: '1px solid #eee', zIndex: 1000,
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid #f0f0f0',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: '#003366', color: '#fff',
          }}>
            <span style={{ fontWeight: '700', fontSize: '15px' }}>🔔 Notifications</span>
            <span style={{ fontSize: '12px', opacity: 0.8 }}>
              {notifications.length} total
            </span>
          </div>

          {/* Notifications List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '40px 20px', textAlign: 'center', color: '#aaa'
              }}>
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>🔕</div>
                <div style={{ fontSize: '14px' }}>No notifications yet</div>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid #f5f5f5',
                    background: n.read ? '#fff' : '#f8faff',
                    transition: 'background 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
                  onMouseLeave={e => e.currentTarget.style.background = n.read ? '#fff' : '#f8faff'}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '22px' }}>{getIcon(n.type)}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '13px', fontWeight: '700',
                        color: getColor(n.type), marginBottom: '3px'
                      }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#555', lineHeight: '1.4' }}>
                        {n.message}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                        <span style={{ fontSize: '11px', color: '#aaa' }}>
                          {timeAgo(n.createdAt)}
                        </span>
                        <span style={{ fontSize: '11px', color: getColor(n.type), fontWeight: '600' }}>
                          View →
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}