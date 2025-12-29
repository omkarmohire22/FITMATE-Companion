
import React, { useState, useEffect } from "react";
import axios from "../../utils/api";

const avatarColors = ["#f87171", "#60a5fa", "#34d399", "#fbbf24", "#a78bfa", "#f472b6", "#38bdf8", "#facc15"];
function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

const AdminMessageBox = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [userUnread, setUserUnread] = useState({}); // { userId: count }

  // Fetch all users (trainees, trainers, admins) and their unread message counts
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("/api/admin/users");
        setUsers(res.data.users || []);
        // Fetch unread counts for each user
        const unreadMap = {};
        for (const u of res.data.users || []) {
          try {
            const inboxRes = await axios.get(`/api/admin/messages/${u.id}`);
            if (Array.isArray(inboxRes.data)) {
              unreadMap[u.id] = (inboxRes.data.filter(m => !m.is_read).length);
            } else if (Array.isArray(inboxRes.data.messages)) {
              unreadMap[u.id] = (inboxRes.data.messages.filter(m => !m.is_read).length);
            } else {
              unreadMap[u.id] = 0;
            }
          } catch {
            unreadMap[u.id] = 0;
          }
        }
        setUserUnread(unreadMap);
      } catch (err) {
        setUsers([]);
        setError("Failed to load users");
      }
    };
    fetchUsers();
  }, []);

  // Fetch messages with selected user and mark unread as read
  useEffect(() => {
    if (!selectedUser) return;
    setLoading(true);
    setError("");
    axios
      .get(`/api/admin/messages/${selectedUser.id}`)
      .then(async (res) => {
        let msgs = res.data;
        if (msgs && msgs.messages) msgs = msgs.messages;
        setMessages(msgs);
        // Mark unread messages as read
        const unreadMsgs = (msgs || []).filter(m => !m.is_read);
        for (const m of unreadMsgs) {
          try {
            await axios.put(`/api/admin/messages/${m.id}/read`);
          } catch {}
        }
        // Update unread count for this user
        setUserUnread(prev => ({ ...prev, [selectedUser.id]: 0 }));
      })
      .catch(() => {
        setMessages([]);
        setError("Failed to load messages");
      })
      .finally(() => setLoading(false));
  }, [selectedUser]);

  // File/image attachment state
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setAttachment(file);
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setAttachmentPreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setAttachmentPreview(null);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setError("");
    if ((!newMessage.trim() && !attachment) || !selectedUser) return;
    setSending(true);
    try {
      // For now, only send text. File upload will be implemented later.
      await axios.post(
        "/api/admin/messages/send",
        { receiver_id: selectedUser.id, message: newMessage }
      );
      setNewMessage("");
      setAttachment(null);
      setAttachmentPreview(null);
      // Refresh messages
      const res = await axios.get(`/api/admin/messages/${selectedUser.id}`);
      setMessages(res.data);
    } catch (err) {
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="admin-message-box" style={{ display: "flex", height: 540, borderRadius: 12, boxShadow: '0 2px 16px #0001', background: '#fff', overflow: 'hidden' }}>
      {/* User List */}
      <div style={{ width: 260, borderRight: "1px solid #e5e7eb", background: '#f9fafb', overflowY: "auto" }}>
        <div style={{ padding: 18, fontWeight: 700, fontSize: 18, borderBottom: '1px solid #e5e7eb', background: '#fff' }}>Users</div>
        {users.length === 0 && <div style={{ padding: 18, color: '#f87171' }}>No users found</div>}
        {users.map((u) => (
          <div
            key={u.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: 14,
              background: selectedUser?.id === u.id ? "#e0e7ff" : "#f9fafb",
              cursor: "pointer",
              borderBottom: '1px solid #e5e7eb',
              transition: 'background 0.2s',
              position: 'relative',
            }}
            onClick={() => setSelectedUser(u)}
          >
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: getAvatarColor(u.name), color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 16
            }}>{u.name[0]}</div>
            <div>
              <div style={{ fontWeight: 600 }}>{u.name}</div>
              <div style={{ fontSize: 12, color: "#888" }}>{u.email}</div>
            </div>
            {userUnread[u.id] > 0 && (
              <span style={{
                position: 'absolute', right: 18, top: 18,
                background: '#f87171', color: '#fff', borderRadius: '50%',
                minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700
              }}>{userUnread[u.id]}</span>
            )}
          </div>
        ))}
      </div>
      {/* Chat Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: '#f3f4f6' }}>
        <div style={{ flex: 1, overflowY: "auto", padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {error && <div style={{ color: '#f87171', marginBottom: 8, fontWeight: 500 }}>{typeof error === 'string' ? error : error?.message || JSON.stringify(error)}</div>}
          {loading ? (
            <div style={{ color: '#888' }}>Loading...</div>
          ) : (
            messages.length === 0 ? (
              <div style={{ color: '#888', textAlign: 'center', marginTop: 40 }}>No messages yet</div>
            ) : (
              messages.map((m) => (
                <div key={m.id} style={{
                  alignSelf: m.sender_id === selectedUser.id ? 'flex-start' : 'flex-end',
                  background: m.sender_id === selectedUser.id ? '#fff' : '#6366f1',
                  color: m.sender_id === selectedUser.id ? '#222' : '#fff',
                  borderRadius: 16,
                  padding: '10px 16px',
                  maxWidth: 320,
                  boxShadow: '0 1px 4px #0001',
                  fontSize: 15
                }}>
                  <div style={{ fontWeight: 500, marginBottom: 2 }}>{m.sender_id === selectedUser.id ? selectedUser.name : "You"}</div>
                  <div>{m.message}</div>
                  <div style={{ fontSize: 11, color: m.sender_id === selectedUser.id ? '#888' : '#e0e7ff', marginTop: 4 }}>{m.created_at}</div>
                </div>
              ))
            )
          )}
        </div>
        {selectedUser && (
          <form onSubmit={handleSend} style={{ display: "flex", flexDirection: 'column', borderTop: "1px solid #e5e7eb", background: '#fff', padding: 16, gap: 10 }}>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                style={{ flex: 1, padding: 12, border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 15, outline: 'none' }}
                disabled={sending}
              />
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', background: '#f3f4f6', borderRadius: 8, padding: '0 12px', border: '1px solid #e5e7eb' }}>
                📎
                <input type="file" style={{ display: 'none' }} onChange={handleFileChange} disabled={sending} />
              </label>
              <button type="submit" style={{ padding: "0 28px", borderRadius: 8, background: '#6366f1', color: '#fff', border: 'none', fontWeight: 600, fontSize: 15, cursor: 'pointer', opacity: sending ? 0.7 : 1 }} disabled={sending}>
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
            {attachmentPreview && (
              <div style={{ marginTop: 8 }}>
                <img src={attachmentPreview} alt="Preview" style={{ maxHeight: 120, borderRadius: 8, border: '1px solid #e5e7eb' }} />
              </div>
            )}
            {attachment && !attachmentPreview && (
              <div style={{ marginTop: 8, color: '#6366f1', fontSize: 14 }}>
                {attachment.name}
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminMessageBox;
