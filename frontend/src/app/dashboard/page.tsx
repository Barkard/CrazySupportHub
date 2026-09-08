'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { 
  LogOut, 
  Ticket as TicketIcon, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { CreateTicketModal } from '@/components/CreateTicketModal';
import { TicketDetailModal } from '@/components/TicketDetailModal';

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | null;
  category: string | null;
  enrichmentStatus: 'pending' | 'completed' | 'failed';
  createdAt: string;
  creator: { name: string; email: string };
  assignee?: { name: string; email: string };
}

export default function DashboardPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const router = useRouter();

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const response = await api.get('/tickets');
      setTickets(response.data);
    } catch (error) {
      console.error('Error al cargar tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchTickets();
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        Cargando sesión...
      </div>
    );
  }

  // Filtrado local de tickets
  const filteredTickets = filterStatus === 'all' 
    ? tickets 
    : tickets.filter(t => t.status === filterStatus);

  // Contadores para las tarjetas de métricas
  const totalCount = tickets.length;
  const openCount = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved').length;

  const getPriorityBadge = (priority: Ticket['priority']) => {
    switch (priority) {
      case 'URGENT':
        return <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-xs px-2 py-0.5 rounded-full font-medium">Urgente</span>;
      case 'HIGH':
        return <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs px-2 py-0.5 rounded-full font-medium">Alta</span>;
      case 'MEDIUM':
        return <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs px-2 py-0.5 rounded-full font-medium">Media</span>;
      case 'LOW':
        return <span className="bg-slate-500/10 text-slate-400 border border-slate-500/20 text-xs px-2 py-0.5 rounded-full font-medium">Baja</span>;
      default:
        return <span className="bg-slate-800 text-slate-500 text-xs px-2 py-0.5 rounded-full">Sin clasificar</span>;
    }
  };

  const getStatusBadge = (status: Ticket['status']) => {
    switch (status) {
      case 'open':
        return <span className="bg-blue-500/10 text-blue-400 text-xs px-2 py-0.5 rounded">Abierto</span>;
      case 'in_progress':
        return <span className="bg-purple-500/10 text-purple-400 text-xs px-2 py-0.5 rounded">En Progreso</span>;
      case 'resolved':
        return <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-0.5 rounded">Resuelto</span>;
      default:
        return <span className="bg-slate-700 text-slate-400 text-xs px-2 py-0.5 rounded">Cerrado</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <TicketIcon className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">CrazySupportHub</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-200">{user.name}</p>
            <p className="text-xs text-slate-500 capitalize">{user.role}</p>
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
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Panel de Control</h2>
            <p className="text-sm text-slate-400">Gestiona y monitorea los tickets entrantes del sistema.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchTickets}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
              title="Recargar datos"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Ticket</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-5 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
              <TicketIcon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Total Tickets</p>
              <p className="text-2xl font-bold text-white">{totalCount}</p>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-5 flex items-center gap-4">
            <div className="p-3 bg-yellow-500/10 text-yellow-400 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Abiertos</p>
              <p className="text-2xl font-bold text-white">{openCount}</p>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-5 flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">En Progreso</p>
              <p className="text-2xl font-bold text-white">{inProgressCount}</p>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-5 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">Resueltos</p>
              <p className="text-2xl font-bold text-white">{resolvedCount}</p>
            </div>
          </div>
        </div>

        {/* Filters & Table Section */}
        <div className="bg-slate-800/40 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {['all', 'open', 'in_progress', 'resolved'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`text-xs px-3 py-1.5 rounded-lg capitalize transition-colors ${
                    filterStatus === st
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {st === 'all' ? 'Todos' : st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/60 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">ID</th>
                  <th className="px-6 py-3.5 font-semibold">Título</th>
                  <th className="px-6 py-3.5 font-semibold">Estado</th>
                  <th className="px-6 py-3.5 font-semibold">Prioridad</th>
                  <th className="px-6 py-3.5 font-semibold">IA Status</th>
                  <th className="px-6 py-3.5 font-semibold">Creado por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                      Cargando lista de tickets...
                    </td>
                  </tr>
                ) : filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">
                      No se encontraron tickets en esta sección.
                    </td>
                  </tr>
                ) : (
                  filteredTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 text-xs font-mono text-slate-400">#{ticket.id}</td>
                      <td className="px-6 py-4 font-medium text-white max-w-xs truncate">
                        {ticket.title}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(ticket.status)}</td>
                      <td className="px-6 py-4">{getPriorityBadge(ticket.priority)}</td>
                      <td className="px-6 py-4">
                        {ticket.enrichmentStatus === 'completed' ? (
                          <span className="inline-flex items-center gap-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs px-2 py-0.5 rounded-full">
                            <Sparkles className="w-3 h-3" /> Enriquecido
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">Pendiente</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-400">{ticket.creator?.name || 'Anónimo'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modales */}
      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchTickets}
      />

      <TicketDetailModal
        ticketId={selectedTicketId}
        isOpen={selectedTicketId !== null}
        onClose={() => setSelectedTicketId(null)}
        onTicketUpdated={fetchTickets}
      />
    </div>
  );
}