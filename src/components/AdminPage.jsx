import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/AdminPage.css";

export default function AdminPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [message, setMessage] = useState({ text: "", type: "" });
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userTypes, setUserTypes] = useState([]);
  
  // Modal message states (for errors inside modals)
  const [editModalMessage, setEditModalMessage] = useState({ text: "", type: "" });
  const [createModalMessage, setCreateModalMessage] = useState({ text: "", type: "" });
  
  // Form states
  const [editForm, setEditForm] = useState({
    username: "",
    email: "",
    role: ""
  });
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    type: "Free User"
  });

  // Lock body scroll when modals are open
  useEffect(() => {
    if (showEditModal || showCreateModal) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    
    // Cleanup function
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showEditModal, showCreateModal]);

  // Fetch user types on component mount
  useEffect(() => {
    fetchUserTypes();
    fetchUsers();
  }, []);

  // Fetch users when search or page changes
  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm]);

  const fetchUserTypes = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/user-types");
      const data = await res.json();
      setUserTypes(data);
    } catch (err) {
      console.error("Error fetching user types:", err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/admin/users?search=${searchTerm}&page=${currentPage}&limit=10`
      );
      const data = await res.json();
      setUsers(data.users);
      setTotalPages(data.totalPages);
    } catch (err) {
      showMessage("Error fetching users", "error");
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const showEditModalMessage = (text, type) => {
    setEditModalMessage({ text, type });
    setTimeout(() => setEditModalMessage({ text: "", type: "" }), 3000);
  };

  const showCreateModalMessage = (text, type) => {
    setCreateModalMessage({ text, type });
    setTimeout(() => setCreateModalMessage({ text: "", type: "" }), 3000);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setEditForm({
      username: user.username,
      email: user.email,
      role: user.type
    });
    setEditModalMessage({ text: "", type: "" }); // Clear any previous messages
    setShowEditModal(true);
  };

  const handleUpdateUser = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: editForm.username,
          email: editForm.email,
          type: editForm.role
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showMessage("User updated successfully", "success");
        setShowEditModal(false);
        fetchUsers();
      } else {
        showEditModalMessage(data.message || "Error updating user", "error");
      }
    } catch (err) {
      showEditModalMessage("Network error", "error");
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      const data = await res.json();

      if (res.ok) {
        showMessage("User created successfully", "success");
        setShowCreateModal(false);
        setNewUser({ username: "", email: "", password: "", type: "Free User" });
        fetchUsers();
      } else {
        showCreateModalMessage(data.message || "Error creating user", "error");
      }
    } catch (err) {
      showCreateModalMessage("Network error", "error");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok) {
        showMessage("User deleted successfully", "success");
        fetchUsers();
      } else {
        showMessage(data.message, "error");
      }
    } catch (err) {
      showMessage("Network error", "error");
    }
  };

  const getRoleBadgeClass = (role) => {
    const roleClasses = {
      'Admin': 'badge-admin',
      'Staff': 'badge-staff',
      'Premium User': 'badge-premium',
      'Free User': 'badge-free',
      'Youth User': 'badge-youth',
      'Psychiatrist': 'badge-psychiatrist',
      'Psychologist': 'badge-psychologist',
      'Therapist': 'badge-therapist'
    };
    return roleClasses[role] || 'badge-default';
  };

  // Close modal when clicking on backdrop
  const handleBackdropClick = (e) => {
    if (e.target.classList.contains('modal')) {
      setShowEditModal(false);
      setShowCreateModal(false);
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header-section">
        <h1>Admin Panel</h1>
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
      </div>

      {/* Main message - only show when no modals are open */}
      {message.text && !showEditModal && !showCreateModal && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="admin-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search users by username, email or role..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <button 
          className="btn-create"
          onClick={() => {
            setCreateModalMessage({ text: "", type: "" });
            setShowCreateModal(true);
          }}
        >
          + Create New User
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading users...</div>
      ) : (
        <>
          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="no-data">No users found</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge ${getRoleBadgeClass(user.type)}`}>
                          {user.type}
                        </span>
                      </td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn-edit"
                          onClick={() => handleEditClick(user)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="modal" onClick={handleBackdropClick}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Edit User</h2>
            
            {/* Modal message */}
            {editModalMessage.text && (
              <div className={`message ${editModalMessage.type}`}>
                {editModalMessage.text}
              </div>
            )}
            
            <div className="form-group">
              <label>Username:</label>
              <input
                type="text"
                value={editForm.username}
                onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                required
                placeholder="Enter username"
              />
            </div>

            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                required
                placeholder="Enter email"
              />
            </div>

            <div className="form-group">
              <label>Select Role:</label>
              <select
                value={editForm.role}
                onChange={(e) => setEditForm({...editForm, role: e.target.value})}
              >
                {userTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn-save" onClick={handleUpdateUser}>
                Update User
              </button>
              <button className="btn-cancel" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal" onClick={handleBackdropClick}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New User</h2>
            
            {/* Modal message */}
            {createModalMessage.text && (
              <div className={`message ${createModalMessage.type}`}>
                {createModalMessage.text}
              </div>
            )}
            
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label>Username:</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  required
                  placeholder="Enter username"
                />
              </div>

              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  required
                  placeholder="Enter email"
                />
              </div>

              <div className="form-group">
                <label>Password:</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  required
                  placeholder="Enter password"
                />
              </div>

              <div className="form-group">
                <label>Role:</label>
                <select
                  value={newUser.type}
                  onChange={(e) => setNewUser({...newUser, type: e.target.value})}
                >
                  {userTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-save">
                  Create User
                </button>
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}