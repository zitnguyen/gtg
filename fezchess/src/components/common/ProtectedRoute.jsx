import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import authService from '../../services/authService';
import { getDashboardPathByRole } from '../../constants/roleRoutes';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = authService.getCurrentUser();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Khi user đã login nhưng truy cập sai role, đẩy về dashboard đúng role
    // thay vì rớt về public homepage (gây cảm giác "bị đăng xuất").
    const fallback = getDashboardPathByRole(user.role) || '/';
    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default ProtectedRoute;
