import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const useAuth = () => {
    // Consumir el contexto OIDC
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth debe usarse dentro de un AuthProvider");
    }

    const { user, role, isAuthenticated, login, logout, isLoading } = context;

    // Métodos de ayuda para verificar roles
    const checkRole = (targetRole) => {
        if (!role) return false;
        // Si el rol es un array, verifica si incluye el target
        if (Array.isArray(role)) return role.includes(targetRole);
        // Si es string, comparación directa
        return role === targetRole;
    };

    const isAdmin = () => checkRole('admin');
    const canEdit = () => checkRole('admin'); 
    const isInvitado = () => checkRole('invitado');

    return {
        user,
        role,
        isAuthenticated,
        isLoading,
        isAdmin,
        canEdit,
        isInvitado,
        login,
        logout,
        token: user?.access_token
    };
};
