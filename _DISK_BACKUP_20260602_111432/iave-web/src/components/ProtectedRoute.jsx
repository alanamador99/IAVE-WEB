import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ allowedRoles, children }) => {
    const { user, role } = useAuth();

    // Si no hay usuario cargado (pero sí token), podríamos esperar o redirigir.
    // Asumimos que useAuth inicializa rápido desde localStorage.
    
    if (!user) {
        // Si no hay usuario en el estado (y se supone que hay sesión), redirigir a login
        // Ojo: useAuth lee de localStorage al montar. Si es null es que no hay sesión.
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(role)) {
        // Si el rol del usuario no está en la lista de permitidos
        return <Navigate to="/NoAuth" replace />; // O a una página de "No autorizado"
    }

    return children ? children : <Outlet />;
};

export default ProtectedRoute;