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
  Filter,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Layers
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
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');

  // Paginación por lotes elegibles
  const [pageSize, setPageSize] = useState<number | 'all'>(5);
  const [currentPage, setCurrentPage] = useState(1);

  // Ordenamiento de tabla
  const [sortField, setSortField] = useState<'createdAt' | 'priority' | 'status' | 'id' | 'title'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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

  // Resetear a página 1 cuando cambia algún filtro o tamaño de lote
  useEffect(() => {
    setCurrentPage(1);
  }, [agentTab, filterStatus, filterPriority, filterCategory, filterAssignee, searchQuery, pageSize, sortField, sortOrder]);

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

  // Manejar clic en encabezado de columna para ordenar
  const handleSortHeader = (field: 'createdAt' | 'priority' | 'status' | 'id' | 'title') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'title' || field === 'id' ? 'asc' : 'desc');
    }
  };

  // Filtrado y ordenación inteligente
  const filteredAndSortedTickets = useMemo(() => {
    let result = [...tickets];

    // Búsqueda por texto libre
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          String(t.id).includes(q) ||
          (t.category && t.category.toLowerCase().includes(q)) ||
          (t.creator?.name && t.creator.name.toLowerCase().includes(q)) ||
          (t.assignee?.name && t.assignee.name.toLowerCase().includes(q))
      );
    }

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

    // 6. Ordenamiento configurable
    const priorityWeights: Record<string, number> = {
      urgent: 4,
      high: 3,
      medium: 2,
      low: 1,
    };

    result.sort((a, b) => {
      let comparison = 0;

      if (sortField === 'id') {
        comparison = a.id - b.id;
      } else if (sortField === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      } else if (sortField === 'priority') {
        const weightA = a.priority ? priorityWeights[a.priority.toLowerCase()] || 0 : 0;
        const weightB = b.priority ? priorityWeights[b.priority.toLowerCase()] || 0 : 0;
        comparison = weightA - weightB;
      } else if (sortField === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [tickets, user, agentTab, filterStatus, filterPriority, filterCategory, filterAssignee, searchQuery, sortField, sortOrder]);

  // Paginación por lotes
  const totalItems = filteredAndSortedTickets.length;
  const effectiveBatchSize = pageSize === 'all' ? (totalItems || 1) : pageSize;
  const totalPages = Math.max(1, Math.ceil(totalItems / effectiveBatchSize));
  const startIndex = (currentPage - 1) * effectiveBatchSize;
  const paginatedTickets = pageSize === 'all' ? filteredAndSortedTickets : filteredAndSortedTickets.slice(startIndex, startIndex + effectiveBatchSize);

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
        return <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs px-2.5 py-0.5 rounded-full font-medium">Media</span>;
      case 'low':
        return <span className="bg-slate-500/10 text-slate-400 border border-slate-500/20 text-xs px-2.5 py-0.5 rounded-full font-medium">Baja</span>;
      default:
        return <span className="bg-slate-800 text-slate-400 text-xs px-2.5 py-0.5 rounded-full">Sin clasificar</span>;
    }
  };

  const getStatusBadge = (status: Ticket['status']) => {
    switch (status) {
      case 'open':
        return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs px-2.5 py-0.5 rounded-full font-medium">Abierto</span>;
      case 'in_progress':
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs px-2.5 py-0.5 rounded-full font-medium">En Progreso</span>;
      case 'resolved':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-0.5 rounded-full font-medium">Resuelto</span>;
      case 'closed':
        return <span className="bg-slate-800 text-slate-400 text-xs px-2.5 py-0.5 rounded-full font-medium">Cerrado</span>;
      default:
        return <span className="bg-slate-800 text-slate-400 text-xs px-2.5 py-0.5 rounded-full">{status}</span>;
    }
  };

  const renderSortIcon = (field: 'createdAt' | 'priority' | 'status' | 'id' | 'title') => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 inline ml-1" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-indigo-400 inline ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-indigo-400 inline ml-1" />
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-500/20">
              <TicketIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight flex items-center gap-2">
                CrazySupportHub
                {user.role === 'admin' ? (
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <Shield className="w-2.5 h-2.5" /> Administrador
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <UserCheck className="w-2.5 h-2.5" /> Agente
                  </span>
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Link a Gestión de Usuarios solo para Admin */}
            {user.role === 'admin' && (
              <Link
                href="/dashboard/users"
                className="flex items-center gap-2 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors border border-slate-700 font-medium"
              >
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>Gestión de Usuarios</span>
              </Link>
            )}

            <div className="text-right hidden sm:block">
              <span className="text-sm font-semibold text-white block">{user.name}</span>
              <span className="text-xs text-slate-400 block">{user.email}</span>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* Welcome & Role Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {user.role === 'admin' ? 'Panel de Control de Soporte' : `Bandeja de Trabajo de ${user.name.split(' ')[0]}`}
            </h1>
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
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mis Asignaciones</span>
                <UserCheck className="w-5 h-5 text-indigo-400" />
              </div>
              <p className="text-3xl font-extrabold text-white mt-2">{myAssignedCount}</p>
              <span className="text-xs text-slate-500 mt-1 block">Tickets bajo tu responsabilidad</span>
            </div>

            <div 
              onClick={() => setAgentTab('unassigned')}
              className={`border rounded-2xl p-5 cursor-pointer transition-all ${
                agentTab === 'unassigned' 
                  ? 'bg-indigo-950/40 border-indigo-500/50 shadow-lg shadow-indigo-500/10' 
                  : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cola Sin Asignar</span>
                <Inbox className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-3xl font-extrabold text-amber-400 mt-2">{unassignedCount}</p>
              <span className="text-xs text-slate-500 mt-1 block">Tickets listos para auto-asignarse</span>
            </div>

            <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Atención Urgente / Alta</span>
                <Zap className="w-5 h-5 text-red-400" />
              </div>
              <p className="text-3xl font-extrabold text-red-400 mt-2">{urgentHighCount}</p>
              <span className="text-xs text-slate-500 mt-1 block">Priorizadas por Gemini AI</span>
            </div>
          </div>
        ) : (
          /* ------------------------------------------------------------- */
          /* 2. VISTA DE MÉTRICAS ANALÍTICAS (Para Administrador)          */
          /* ------------------------------------------------------------- */
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-5 shadow-sm">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Total de Tickets</span>
                <p className="text-3xl font-extrabold text-white mt-2">{totalTickets}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <span>Enriquecidos: {enrichedSuccessCount}</span>
                </div>
              </div>

              <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-5 shadow-sm">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Éxito IA (n8n)</span>
                <p className="text-3xl font-extrabold text-indigo-400 mt-2">{iaSuccessRate}%</p>
                <span className="text-xs text-slate-500 mt-1 block">Tasa de respuesta de Gemini</span>
              </div>

              <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-5 shadow-sm">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Tickets Fallidos IA</span>
                <p className="text-3xl font-extrabold text-amber-400 mt-2">{enrichedFailedCount}</p>
                <span className="text-xs text-slate-500 mt-1 block">Disponibles para reintentar</span>
              </div>

              <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-5 shadow-sm">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Equipo de Soporte</span>
                <p className="text-3xl font-extrabold text-emerald-400 mt-2">{agents.length}</p>
                <span className="text-xs text-slate-500 mt-1 block">Agentes y admins registrados</span>
              </div>
            </div>

            {/* Categorías más recurrentes */}
            <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-5">
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
        )}

        {/* ------------------------------------------------------------- */}
        {/* Filtros de la Tabla, Búsqueda y Paginación por Lotes           */}
        {/* ------------------------------------------------------------- */}
        <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-xl">
          {/* Fila 1: Pestañas de Agente o Filtro de Agente Admin + Buscador */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Tabs para Agente */}
            {user.role === 'agent' ? (
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setAgentTab('my_tickets')}
                  className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                    agentTab === 'my_tickets'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Mis Tickets ({myAssignedCount})
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
                  Todos
                </button>
              </div>
            ) : (
              /* Filtro rápido por agente para Admin */
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-xs text-slate-400 whitespace-nowrap">Agente:</span>
                <select
                  value={filterAssignee}
                  onChange={(e) => setFilterAssignee(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
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

            {/* Buscador en vivo */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por ID, título, descripción, categoría..."
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Fila 2: Filtros secundarios (Estado, Prioridad, Ordenamiento y Tamaño de Lote) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {/* Botones de Estado */}
              <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
                {['all', 'open', 'in_progress', 'resolved'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                      filterStatus === st
                        ? 'bg-slate-800 text-white font-medium border border-slate-700'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st === 'all' ? 'Todos' : st === 'in_progress' ? 'En Progreso' : st === 'open' ? 'Abiertos' : 'Resueltos'}
                  </button>
                ))}
              </div>

              {/* Selector de Prioridad */}
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="all">Prioridad: Todas</option>
                <option value="urgent">🚨 Urgente</option>
                <option value="high">⚡ Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>

              {/* Selector de Ordenamiento Rápido */}
              <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 rounded-xl px-2.5 py-1">
                <span className="text-slate-400">Ordenar:</span>
                <select
                  value={`${sortField}-${sortOrder}`}
                  onChange={(e) => {
                    const [field, order] = e.target.value.split('-') as [any, any];
                    setSortField(field);
                    setSortOrder(order);
                  }}
                  className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="createdAt-desc" className="bg-slate-900">Más recientes</option>
                  <option value="createdAt-asc" className="bg-slate-900">Más antiguos</option>
                  <option value="priority-desc" className="bg-slate-900">Mayor prioridad (IA)</option>
                  <option value="priority-asc" className="bg-slate-900">Menor prioridad (IA)</option>
                  <option value="id-desc" className="bg-slate-900">ID mayor (#)</option>
                  <option value="id-asc" className="bg-slate-900">ID menor (#)</option>
                  <option value="title-asc" className="bg-slate-900">Título (A - Z)</option>
                </select>
              </div>
            </div>

            {/* Selector de Tamaño de Lote / Por Página */}
            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1 text-slate-300">
              <span className="text-slate-400">Lote por página:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="bg-transparent font-semibold text-indigo-400 focus:outline-none cursor-pointer"
              >
                <option value="5" className="bg-slate-900 text-slate-200">5 tickets</option>
                <option value="10" className="bg-slate-900 text-slate-200">10 tickets</option>
                <option value="20" className="bg-slate-900 text-slate-200">20 tickets</option>
                <option value="50" className="bg-slate-900 text-slate-200">50 tickets</option>
                <option value="all" className="bg-slate-900 text-slate-200">Ver todos</option>
              </select>
            </div>
          </div>

          {/* Tabla de Tickets */}
          <div className="overflow-x-auto rounded-xl border border-slate-800/80">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-800 select-none">
                <tr>
                  <th 
                    onClick={() => handleSortHeader('id')} 
                    className="px-6 py-3.5 font-semibold cursor-pointer hover:text-white transition-colors group"
                  >
                    ID {renderSortIcon('id')}
                  </th>
                  <th 
                    onClick={() => handleSortHeader('title')} 
                    className="px-6 py-3.5 font-semibold cursor-pointer hover:text-white transition-colors group"
                  >
                    Título {renderSortIcon('title')}
                  </th>
                  <th 
                    onClick={() => handleSortHeader('priority')} 
                    className="px-6 py-3.5 font-semibold cursor-pointer hover:text-white transition-colors group"
                  >
                    Prioridad IA {renderSortIcon('priority')}
                  </th>
                  <th 
                    onClick={() => handleSortHeader('status')} 
                    className="px-6 py-3.5 font-semibold cursor-pointer hover:text-white transition-colors group"
                  >
                    Estado {renderSortIcon('status')}
                  </th>
                  <th className="px-6 py-3.5 font-semibold">Asignado a</th>
                  <th className="px-6 py-3.5 font-semibold">IA Status</th>
                  <th 
                    onClick={() => handleSortHeader('createdAt')} 
                    className="px-6 py-3.5 font-semibold cursor-pointer hover:text-white transition-colors text-right group"
                  >
                    Fecha {renderSortIcon('createdAt')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                        <span>Cargando tickets...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedTickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-500">
                      <Inbox className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                      <p className="font-medium text-slate-400">No hay tickets que coincidan con los filtros.</p>
                      {searchQuery && (
                        <p className="text-xs text-slate-500 mt-1">Prueba limpiando el texto de búsqueda.</p>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedTickets.map((ticket) => {
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
                        <td className="px-6 py-4 text-xs font-mono font-semibold text-slate-400">
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
                          ) : user.role === 'agent' ? (
                            <button
                              onClick={(e) => handleQuickAssign(e, ticket.id)}
                              className="text-[11px] bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded transition-colors"
                            >
                              + Asignármelo
                            </button>
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
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3 animate-pulse" /> En cola IA
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right text-xs text-slate-400 font-mono">
                          {new Date(ticket.createdAt).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ------------------------------------------------------------- */}
          {/* Barra de Paginación en el Footer de la Tabla                   */}
          {/* ------------------------------------------------------------- */}
          {totalItems > 0 && pageSize !== 'all' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
              <div>
                Mostrando del <span className="font-semibold text-slate-200">{startIndex + 1}</span> al{' '}
                <span className="font-semibold text-slate-200">
                  {Math.min(startIndex + effectiveBatchSize, totalItems)}
                </span>{' '}
                de <span className="font-semibold text-slate-200">{totalItems}</span> tickets
              </div>

              <div className="flex items-center gap-1.5 self-center sm:self-auto">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 font-medium"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Anterior</span>
                </button>

                {/* Números de página */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      // Mostrar página 1, última página y adyacentes a la actual
                      return (
                        page === 1 ||
                        page === totalPages ||
                        Math.abs(page - currentPage) <= 1
                      );
                    })
                    .map((page, idx, array) => {
                      const prev = array[idx - 1];
                      return (
                        <div key={page} className="flex items-center gap-1">
                          {prev && page - prev > 1 && (
                            <span className="px-1 text-slate-600">...</span>
                          )}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                              currentPage === page
                                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            {page}
                          </button>
                        </div>
                      );
                    })}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 font-medium"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal de Creación de Tickets (Solo para Admin) */}
      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          fetchTickets();
        }}
      />

      {/* Modal de Detalle de Ticket */}
      <TicketDetailModal
        ticketId={selectedTicketId}
        isOpen={selectedTicketId !== null}
        onClose={() => setSelectedTicketId(null)}
        onTicketUpdated={() => {
          fetchTickets();
        }}
      />
    </div>
  );
}