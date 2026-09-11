'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LogOut, 
  Ticket as TicketIcon, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Sparkles,
  RefreshCw,
  Users,
  Shield,
  UserCheck,
  Zap,
  Inbox,
  AlertCircle,
  Filter
} from 'lucide-react';
import { CreateTicketModal } from '@/components/CreateTicketModal';
import { TicketDetailModal } from '@/components/TicketDetailModal';

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | null;
  category: string | null;
  enrichmentStatus: 'pending' | 'processing' | 'completed' | 'done' | 'failed';
  createdAt: string;
  creator: { id?: number; name: string; email: string };
  assignee?: { id: number; name: string; email: string } | null;
}

interface SimpleUser {
  id: number;
  name: string;
  email: string;
  role: 'agent' | 'admin';
}

export default function DashboardPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [agents, setAgents] = useState<SimpleUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros para Agente: 'my_tickets' | 'unassigned' | 'all'
  const [agentTab, setAgentTab] = useState<'my_tickets' | 'unassigned' | 'all'>('my_tickets');
  
  // Filtros comunes y de Admin
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');

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

  const fetchAgents = async () => {
    try {
      const res = await api.get('/users');
      setAgents(res.data);
    } catch (err) {
      console.error('Error al cargar agentes:', err);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      fetchTickets();
      if (user.role === 'admin') {
        fetchAgents();
      }
    }
  }, [user, authLoading, router]);

  // Suscripción en tiempo real vía Server-Sent Events (SSE)
  useEffect(() => {
    if (!user) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    const eventSource = new EventSource(`${apiUrl}/tickets/events/stream`);

    eventSource.addEventListener('ticket_created', (e) => {
      try {
        const newTicket: Ticket = JSON.parse(e.data);
        setTickets((prev) => {
          if (prev.some((t) => t.id === newTicket.id)) return prev;
          return [newTicket, ...prev];
        });
      } catch (err) {
        console.error('Error al recibir ticket_created por SSE:', err);
      }
    });

    eventSource.addEventListener('ticket_updated', (e) => {
      try {
        const updatedTicket: Ticket = JSON.parse(e.data);
        setTickets((prev) =>
          prev.map((t) => (t.id === updatedTicket.id ? { ...t, ...updatedTicket } : t))
        );
      } catch (err) {
        console.error('Error al recibir ticket_updated por SSE:', err);
      }
    });

    eventSource.addEventListener('ticket_deleted', (e) => {
      try {
        const data = JSON.parse(e.data);
        setTickets((prev) => prev.filter((t) => t.id !== data.id));
      } catch (err) {
        console.error('Error al recibir ticket_deleted por SSE:', err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [user]);

  // Auto-asignación rápida directa desde la tabla (para el Agente)
  const handleQuickAssign = async (e: React.MouseEvent, ticketId: number) => {
    e.stopPropagation();
    if (!user) return;
    try {
      await api.patch(`/tickets/${ticketId}`, { assignedTo: user.id });
      fetchTickets();
    } catch (err) {
      console.error('Error al auto-asignar ticket:', err);
    }
  };

  // Filtrado y ordenación inteligente
  const displayedTickets = useMemo(() => {
    let result = [...tickets];

    // 1. Filtrado para el Agente según su pestaña operativa
    if (user?.role === 'agent') {
      if (agentTab === 'my_tickets') {
        result = result.filter(t => t.assignee?.id === user.id);
      } else if (agentTab === 'unassigned') {
        result = result.filter(t => !t.assignee);
      }
    }

    // 2. Filtro por Estado
    if (filterStatus !== 'all') {
      result = result.filter(t => t.status === filterStatus);
    }

    // 3. Filtro por Prioridad
    if (filterPriority !== 'all') {
      result = result.filter(t => t.priority?.toLowerCase() === filterPriority.toLowerCase());
    }

    // 4. Filtro por Categoría (Admin)
    if (filterCategory !== 'all') {
      result = result.filter(t => t.category?.toLowerCase() === filterCategory.toLowerCase());
    }

    // 5. Filtro por Agente asignado (Admin)
    if (user?.role === 'admin' && filterAssignee !== 'all') {
      if (filterAssignee === 'unassigned') {
        result = result.filter(t => !t.assignee);
      } else {
        result = result.filter(t => t.assignee?.id === Number(filterAssignee));
      }
    }

    // 6. Ordenación destacando tickets URGENT y HIGH primero para Agentes
    if (user?.role === 'agent') {
      const priorityWeights: Record<string, number> = {
        urgent: 4,
        high: 3,
        medium: 2,
        low: 1,
      };
      result.sort((a, b) => {
        const weightA = a.priority ? priorityWeights[a.priority.toLowerCase()] || 0 : 0;
        const weightB = b.priority ? priorityWeights[b.priority.toLowerCase()] || 0 : 0;
        if (weightA !== weightB) {
          return weightB - weightA; // Los más urgentes arriba
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    return result;
  }, [tickets, user, agentTab, filterStatus, filterPriority, filterCategory, filterAssignee]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        Cargando sesión...
      </div>
    );
  }

  // Métricas del Agente
  const myAssignedCount = tickets.filter(t => t.assignee?.id === user.id).length;
  const unassignedCount = tickets.filter(t => !t.assignee).length;
  const urgentHighCount = tickets.filter(t => {
    const p = t.priority?.toLowerCase();
    return (p === 'urgent' || p === 'high') && (t.status === 'open' || t.status === 'in_progress');
  }).length;

  // Métricas avanzadas para Admin
  const totalTickets = tickets.length;
  const enrichedSuccessCount = tickets.filter(t => t.enrichmentStatus === 'completed' || t.enrichmentStatus === 'done').length;
  const enrichedFailedCount = tickets.filter(t => t.enrichmentStatus === 'failed').length;
  const iaSuccessRate = totalTickets > 0 ? Math.round((enrichedSuccessCount / totalTickets) * 100) : 0;

  const billingCount = tickets.filter(t => t.category?.toLowerCase() === 'billing').length;
  const technicalCount = tickets.filter(t => t.category?.toLowerCase() === 'technical').length;
  const accountCount = tickets.filter(t => t.category?.toLowerCase() === 'account').length;
  const otherCount = tickets.filter(t => t.category?.toLowerCase() === 'other').length;

  const getPriorityBadge = (priority: Ticket['priority']) => {
    const p = priority?.toLowerCase();
    switch (p) {
      case 'urgent':
        return <span className="bg-red-500/15 text-red-400 border border-red-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1">🚨 Urgente</span>;
      case 'high':
        return <span className="bg-orange-500/15 text-orange-400 border border-orange-500/30 text-xs px-2.5 py-0.5 rounded-full font-semibold inline-flex items-center gap-1">⚡ Alta</span>;
      case 'medium':
        return <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs px-2 py-0.5 rounded-full font-medium">Media</span>;
      case 'low':
        return <span className="bg-slate-500/10 text-slate-400 border border-slate-500/20 text-xs px-2 py-0.5 rounded-full font-medium">Baja</span>;
      default:
        return <span className="bg-slate-800 text-slate-500 text-xs px-2 py-0.5 rounded-full">Sin clasificar</span>;
    }
  };

  const getStatusBadge = (status: Ticket['status']) => {
    switch (status) {
      case 'open':
        return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs px-2.5 py-0.5 rounded-md font-medium">Abierto</span>;
      case 'in_progress':
        return <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs px-2.5 py-0.5 rounded-md font-medium">En Progreso</span>;
      case 'resolved':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-0.5 rounded-md font-medium">Resuelto</span>;
      default:
        return <span className="bg-slate-700/60 text-slate-400 text-xs px-2.5 py-0.5 rounded-md font-medium">Cerrado</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/60 backdrop-blur sticky top-0 z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <TicketIcon className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">CrazySupportHub</h1>
          </div>

          {/* Menú exclusivo para Administrador */}
          {user.role === 'admin' && (
            <nav className="hidden md:flex items-center gap-1 bg-slate-800/60 p-1 rounded-xl border border-slate-800 text-xs">
              <span className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-medium">
                Tickets
              </span>
              <Link
                href="/dashboard/users"
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Usuarios y Roles</span>
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-200">{user.name}</p>
            {user.role === 'admin' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full">
                <Shield className="w-3 h-3" /> Administrador
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <UserCheck className="w-3 h-3" /> Agente Operativo
              </span>
            )}
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
        {/* Header de Bienvenida y Acciones */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {user.role === 'admin' ? 'Panel de Supervisión Global' : 'Bandeja de Operaciones'}
            </h2>
            <p className="text-sm text-slate-400">
              {user.role === 'admin' 
                ? 'Monitorea el rendimiento del sistema, tickets y el enriquecimiento de IA.'
                : 'Atiende incidencias, toma tickets de la cola y utiliza las sugerencias de la IA.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchTickets}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
              title="Recargar tickets"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {user.role === 'admin' && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2.5 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-indigo-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Ticket</span>
              </button>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 1. VISTA DE MÉTRICAS OPERATIVAS (Para Agente de Soporte)      */}
        {/* ------------------------------------------------------------- */}
        {user.role === 'agent' ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div 
              onClick={() => setAgentTab('my_tickets')}
              className={`border rounded-2xl p-5 cursor-pointer transition-all ${
                agentTab === 'my_tickets' 
                  ? 'bg-indigo-950/40 border-indigo-500/50 shadow-lg shadow-indigo-500/10' 
                  : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Mis Asignados</span>
                <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white">{myAssignedCount}</p>
              <p className="text-xs text-slate-400 mt-1">Tickets bajo tu responsabilidad</p>
            </div>

            <div 
              onClick={() => setAgentTab('unassigned')}
              className={`border rounded-2xl p-5 cursor-pointer transition-all ${
                agentTab === 'unassigned' 
                  ? 'bg-amber-950/30 border-amber-500/50 shadow-lg shadow-amber-500/10' 
                  : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Cola Sin Asignar</span>
                <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl">
                  <Inbox className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white">{unassignedCount}</p>
              <p className="text-xs text-slate-400 mt-1">Esperando que un agente los tome</p>
            </div>

            <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Urgentes / Alta</span>
                <div className="p-2.5 bg-red-500/10 text-red-400 rounded-xl">
                  <Zap className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white">{urgentHighCount}</p>
              <p className="text-xs text-slate-400 mt-1">Detectados con alta criticidad por IA</p>
            </div>
          </div>
        ) : (
          /* ------------------------------------------------------------- */
          /* 2. VISTA DE ANALÍTICAS GLOBALES (Para Administrador)          */
          /* ------------------------------------------------------------- */
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Tickets */}
              <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Tickets</span>
                  <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
                    <TicketIcon className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white">{totalTickets}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                  <span className="text-emerald-400 font-medium">
                    {tickets.filter(t => t.status === 'resolved').length} resueltos
                  </span>
                  <span>•</span>
                  <span>{tickets.filter(t => t.status === 'open').length} abiertos</span>
                </div>
              </div>

              {/* Tasa de Enriquecimiento IA */}
              <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">Éxito IA (n8n)</span>
                  <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
                    <Sparkles className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-white">{iaSuccessRate}%</p>
                <div className="w-full bg-slate-700/50 h-2 rounded-full mt-3 overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full transition-all" style={{ width: `${iaSuccessRate}%` }} />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 mt-2">
                  <span>{enrichedSuccessCount} completados</span>
                  {enrichedFailedCount > 0 && (
                    <span className="text-red-400 font-medium">{enrichedFailedCount} fallidos</span>
                  )}
                </div>
              </div>

              {/* Categorías más recurrentes */}
              <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-5 col-span-1 sm:col-span-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Distribución por Categorías</span>
                  <span className="text-xs text-slate-500">Clasificación IA</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-400 font-medium">Técnico</p>
                    <p className="text-xl font-bold text-indigo-400 mt-1">{technicalCount}</p>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-400 font-medium">Facturación</p>
                    <p className="text-xl font-bold text-emerald-400 mt-1">{billingCount}</p>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-400 font-medium">Cuentas</p>
                    <p className="text-xl font-bold text-amber-400 mt-1">{accountCount}</p>
                  </div>
                  <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                    <p className="text-xs text-slate-400 font-medium">Otros</p>
                    <p className="text-xl font-bold text-slate-400 mt-1">{otherCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* Filtros de la Tabla                                            */}
        {/* ------------------------------------------------------------- */}
        <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Tabs para Agente */}
            {user.role === 'agent' ? (
              <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setAgentTab('my_tickets')}
                  className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                    agentTab === 'my_tickets'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Mis Tickets Asignados ({myAssignedCount})
                </button>
                <button
                  onClick={() => setAgentTab('unassigned')}
                  className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                    agentTab === 'unassigned'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Cola Sin Asignar ({unassignedCount})
                </button>
                <button
                  onClick={() => setAgentTab('all')}
                  className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                    agentTab === 'all'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Todos los Tickets
                </button>
              </div>
            ) : (
              /* Filtro rápido por agente para Admin */
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-400">Filtrar por Agente:</span>
                <select
                  value={filterAssignee}
                  onChange={(e) => setFilterAssignee(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">Todos los agentes</option>
                  <option value="unassigned">Sin asignar</option>
                  {agents.map((ag) => (
                    <option key={ag.id} value={ag.id}>
                      {ag.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Filtros secundarios: Estado y Prioridad */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
                {['all', 'open', 'in_progress', 'resolved'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-3 py-1 rounded-lg capitalize transition-colors ${
                      filterStatus === st
                        ? 'bg-slate-800 text-white font-medium border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st === 'all' ? 'Estados: Todos' : st.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Selector de Prioridad */}
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">Prioridad: Todas</option>
                <option value="urgent">Urgente</option>
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
            </div>
          </div>

          {/* Tabla de Tickets */}
          <div className="overflow-x-auto rounded-xl border border-slate-800/80">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-3.5 font-semibold">ID</th>
                  <th className="px-6 py-3.5 font-semibold">Título</th>
                  <th className="px-6 py-3.5 font-semibold">Prioridad IA</th>
                  <th className="px-6 py-3.5 font-semibold">Estado</th>
                  <th className="px-6 py-3.5 font-semibold">Asignado a</th>
                  <th className="px-6 py-3.5 font-semibold">IA Status</th>
                  <th className="px-6 py-3.5 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-500">
                      Cargando tickets...
                    </td>
                  </tr>
                ) : displayedTickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-500">
                      No hay tickets para los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  displayedTickets.map((ticket) => {
                    const isUrgent = ticket.priority?.toLowerCase() === 'urgent';
                    const isHigh = ticket.priority?.toLowerCase() === 'high';
                    const isAssignedToMe = ticket.assignee?.id === user.id;

                    return (
                      <tr
                        key={ticket.id}
                        onClick={() => setSelectedTicketId(ticket.id)}
                        className={`hover:bg-slate-800/50 cursor-pointer transition-colors ${
                          isUrgent ? 'bg-red-500/[0.03]' : isHigh ? 'bg-orange-500/[0.02]' : ''
                        }`}
                      >
                        <td className="px-6 py-4 text-xs font-mono text-slate-400">
                          #{ticket.id}
                        </td>
                        <td className="px-6 py-4 font-medium text-white max-w-xs truncate">
                          {ticket.title}
                          {ticket.category && (
                            <span className="block text-[11px] text-slate-500 capitalize font-normal">
                              {ticket.category}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">{getPriorityBadge(ticket.priority)}</td>
                        <td className="px-6 py-4">{getStatusBadge(ticket.status)}</td>
                        <td className="px-6 py-4">
                          {ticket.assignee ? (
                            <span className={`text-xs font-medium ${isAssignedToMe ? 'text-indigo-400' : 'text-slate-300'}`}>
                              {isAssignedToMe ? 'Tú' : ticket.assignee.name}
                            </span>
                          ) : (
                            <span className="text-amber-400 text-xs font-medium">Sin asignar</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {ticket.enrichmentStatus === 'completed' || ticket.enrichmentStatus === 'done' ? (
                            <span className="inline-flex items-center gap-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs px-2 py-0.5 rounded-full font-medium">
                              <Sparkles className="w-3 h-3" /> Enriquecido
                            </span>
                          ) : ticket.enrichmentStatus === 'failed' ? (
                            <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-400 border border-red-500/20 text-xs px-2 py-0.5 rounded-full font-medium">
                              <AlertCircle className="w-3 h-3" /> Fallido
                            </span>
                          ) : (
                            <span className="text-xs text-slate-500">Pendiente</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          {user.role === 'agent' && !ticket.assignee ? (
                            <button
                              onClick={(e) => handleQuickAssign(e, ticket.id)}
                              className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs px-3 py-1.5 rounded-lg transition-colors font-medium shadow-sm"
                            >
                              Asignármelo
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedTicketId(ticket.id)}
                              className="text-xs text-slate-400 hover:text-indigo-300 transition-colors"
                            >
                              Ver detalle →
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
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