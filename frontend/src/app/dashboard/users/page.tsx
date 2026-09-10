'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  ArrowLeft,
  Search,
  Shield,
  UserCheck,
  Edit3,
  Trash2,
  Ticket as TicketIcon,
  RefreshCw,
  LogOut,
  AlertCircle
} from 'lucide-react';
import { UserModal } from '@/components/UserModal';

interface SystemUser {
  id: number;
  name: string;
  email: string;
  role: 'agent' | 'admin';
  createdAt: string;
  _count?: {
    assignedTickets: number;
    createdTickets: number;
  };
}

export default function UsersPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SystemUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (err: any) {
      console.error('Error al cargar usuarios:', err);
      setError('No se pudo cargar la lista de usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      if (user.role !== 'admin') {
        // Los agentes no tienen acceso a la gestión de usuarios
        router.push('/dashboard');
      } else {
        fetchUsers();
      }
    }
  }, [user, authLoading, router]);

  const handleDeleteUser = async (userToDelete: SystemUser) => {
    if (userToDelete.id === user?.id) {
      alert('No puedes eliminar tu propia cuenta de administrador.');
      return;
    }

    const confirmed = window.confirm(`¿Estás seguro de eliminar a "${userToDelete.name}" (${userToDelete.email})?`);
    if (!confirmed) return;

    try {
      await api.delete(`/users/${userToDelete.id}`);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al eliminar usuario');
    }
  };

  if (authLoading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        Verificando permisos de administrador...
      </div>
    );
  }

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const adminCount = users.filter(u => u.role === 'admin').length;
  const agentCount = users.filter(u => u.role === 'agent').length;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/60 backdrop-blur sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="bg-indigo-600 p-2 rounded-lg group-hover:scale-105 transition-transform">
              <TicketIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">CrazySupportHub</h1>
          </Link>

          <nav className="hidden md:flex items-center gap-1 bg-slate-800/60 p-1 rounded-xl border border-slate-800 text-xs">
            <Link
              href="/dashboard"
              className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              Tickets
            </Link>
            <span className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-medium">
              Usuarios y Roles
            </span>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-200">{user.name}</p>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">
              <Shield className="w-3 h-3" /> Administrador
            </span>
          </div>
          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Header con botón de volver */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium mb-2 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a la bandeja de Tickets</span>
            </Link>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-400" />
              Gestión de Usuarios y Roles
            </h2>
            <p className="text-sm text-slate-400">
              Administra las cuentas del equipo de soporte técnico y sus permisos en la plataforma.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchUsers}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
              title="Recargar usuarios"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => {
                setSelectedUser(null);
                setIsModalOpen(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>Nuevo Usuario</span>
            </button>
          </div>
        </div>

        {/* Resumen de cuentas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Total Usuarios</p>
              <p className="text-xl font-bold text-white">{users.length}</p>
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Agentes de Soporte</p>
              <p className="text-xl font-bold text-white">{agentCount}</p>
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5">
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Administradores</p>
              <p className="text-xl font-bold text-white">{adminCount}</p>
            </div>
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o correo..."
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <span className="text-xs text-slate-400 hidden sm:block">
            Mostrando {filteredUsers.length} de {users.length} usuarios
          </span>
        </div>

        {/* Tabla de Usuarios */}
        <div className="bg-slate-800/40 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">Usuario</th>
                  <th className="px-6 py-3.5 font-semibold">Rol</th>
                  <th className="px-6 py-3.5 font-semibold">Tickets Asignados</th>
                  <th className="px-6 py-3.5 font-semibold">Fecha Registro</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-500">
                      Cargando lista de usuarios...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-500">
                      No se encontraron usuarios con ese criterio.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white text-xs">
                            {u.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-white flex items-center gap-2">
                              {u.name}
                              {u.id === user.id && (
                                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Tú</span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {u.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs px-2.5 py-1 rounded-full font-medium">
                            <Shield className="w-3 h-3" /> Administrador
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-1 rounded-full font-medium">
                            <UserCheck className="w-3 h-3" /> Agente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-400">
                        {u._count?.assignedTickets ?? 0} tickets
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {new Date(u.createdAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Editar usuario"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {u.id !== user.id && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal para Crear / Editar Usuario */}
      <UserModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedUser(null);
        }}
        onSuccess={fetchUsers}
        userToEdit={selectedUser}
      />
    </div>
  );
}
