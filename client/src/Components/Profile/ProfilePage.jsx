import React, { useContext } from 'react';
import './ProfilePage.css';
import { HiOutlineLocationMarker, HiOutlineMail } from "react-icons/hi";
import { BsPersonVcard } from "react-icons/bs";
import { FiUser, FiArrowLeft } from "react-icons/fi";
import { format as formatDate } from 'date-fns';
import { AuthContext } from '../../Auth/AuthContext';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const formatDateString = (dateString) => {
    if (!dateString) return 'Not Available';
    try {
      return formatDate(new Date(dateString), 'MMMM dd, yyyy');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getRoleName = (type) => {
    if (!type) return 'No Role';
    return type.charAt(0) + type.slice(1).toLowerCase();
  };

  return (
    <>
      <div className="animated-bg" />
      <div className="profile-container custom-scrollbar">
        <button 
          onClick={() => navigate('/dashboard')}
          className="back-button"
        >
          <FiArrowLeft className="icon" />
          <span>Back to Dashboard</span>
        </button>
        <div className="profile-header">
          <div className="profile-image">
            <div className="profile-avatar">
              <FiUser className="avatar-icon" />
            </div>
          </div>
          <div className="profile-info">
            <h1>{user?.email?.split('@')[0] || 'User'}</h1>
            <h2>
              <BsPersonVcard className="info-icon" />
              {user?.roles?.[0] ? getRoleName(user.roles[0].type) : 'Role Not Assigned'}
            </h2>
            <p>
              <HiOutlineMail className="info-icon" />
              {user?.email || 'Email Not Available'}
            </p>
            <p>
              <HiOutlineLocationMarker className="info-icon" />
              Member since {formatDateString(user?.createdAt)}
            </p>
          </div>
        </div>

        <div className="profile-section">
          <h3><FiUser className="section-icon" /> Account Details</h3>
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">User ID:</span>
              <span className="detail-value">{user?.id || 'Not Available'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Role Type:</span>
              <span className="detail-value">{user?.roles?.[0]?.type || 'Not Assigned'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Company ID:</span>
              <span className="detail-value">{user?.roles?.[0]?.companyId || 'Not Available'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Last Updated:</span>
              <span className="detail-value">{formatDateString(user?.updatedAt)}</span>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h3><BsPersonVcard className="section-icon" /> Role Information</h3>
          <div className="role-info">
            <div className="role-item">
              <span className="role-title">Role ID:</span>
              <span className="role-value">{user?.roles?.[0]?.id || 'Not Available'}</span>
            </div>
            <div className="role-item">
              <span className="role-title">Role Created:</span>
              <span className="role-value">{formatDateString(user?.roles?.[0]?.createdAt)}</span>
            </div>
            <div className="role-item">
              <span className="role-title">Admin Status:</span>
              <span className="role-value">{user?.isAdmin ? 'Administrator' : 'Regular User'}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
