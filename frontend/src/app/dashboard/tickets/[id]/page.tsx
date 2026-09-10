'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { 
  ArrowLeft, 
  Sparkles, 
  Clock, 
  Tag, 
  Copy, 
  Check, 
  Loader2, 
  AlertCircle,
  Send,
  CornerDownLeft,
  RefreshCw,
  UserCheck,
  User as UserIcon,
  Layers,
  Shield
} from 'lucide-react';

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | null;
  category: string | null;
  tags: string[];
  suggestedReply: string | null;
  enrichmentStatus: 'pending' | 'processing' | 'completed' | 'done' | 'failed';
  createdAt: string;
  creator: { id: number; name: string; email: string };
  assignee?: { id: number; name: string; email: string } | null;
}

interface SimpleUser {
  id: number;
  name: string;
  email: string;
  role: 'agent' | 'admin';
}

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const ticketId = resolvedParams.id;
  const { user } = useAuth();
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [agents, setAgents] = useState<SimpleUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [retryingEnrichment, setRetryingEnrichment] = useState(false);
  const [copied, setCopied] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replySent, setReplySent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchTicket = async () => {
    try {
      const response = await api.get(`/tickets/${ticketId}`);
      setTicket(response.data);
      setReplyText(response.data.suggestedReply || '');
    } catch (err: any) {
      setError('No se pudo cargar el ticket.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();

    if (user?.role === 'admin') {
      api.get('/users')
        .then((res) => setAgents(res.data))
        .catch((e) => console.error('Error al cargar agentes:', e));
    }
  }, [ticketId, user]);

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return;
    setUpdating(true);
    try {
      const response = await api.patch(`/tickets/${ticket.id}`, {
        status: newStatus,
      });
      setTicket(response.data);
    } catch (err) {
      console.error('Error al actualizar estado:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignTicket = async (assigneeId: number | null) => {
    if (!ticket) return;
    setUpdating(true);
    try {
      const response = await api.patch(`/tickets/${ticket.id}`, {
        assignedTo: assigneeId,
      });
      setTicket(response.data);
    } catch (err) {
      console.error('Error al asignar ticket:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleRetryEnrichment = async () => {
    if (!ticket) return;
    setRetryingEnrichment(true);
    try {
      const response = await api.post(`/tickets/${ticket.id}/retry`);
      setTicket(response.data);
    } catch (err) {
      console.error('Error al reintentar enriquecimiento:', err);
      alert('Error al reintentar enriquecimiento por IA.');
    } finally {
      setRetryingEnrichment(false);
    }
  };

  const handleCopyReply = () => {
    if (ticket?.suggestedReply) {
      navigator.clipboard.writeText(ticket.suggestedReply);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleInsertReply = () => {
    if (ticket?.suggestedReply) {
      setReplyText(ticket.suggestedReply);
    }
  };

  const handleSendResponse = async (resolveTicket = false) => {
    if (!ticket || !replyText.trim()) return;
    setUpdating(true);
    try {
      const payload: any = {
        suggestedReply: replyText,
      };
      if (resolveTicket) {
        payload.status = 'resolved';
      } else if (ticket.status === 'open') {
        payload.status = 'in_progress';
      }

      const response = await api.patch(`/tickets/${ticket.id}`, payload);
      setTicket(response.data);
      setReplySent(true);
      setTimeout(() => setReplySent(false), 3000);
    } catch (err) {
      console.error('Error al guardar respuesta:', err);
    } finally {
      setUpdating(false);
    }
  };

  const getPriorityBadge = (priority: Ticket['priority']) => {
    const p = priority?.toLowerCase();
    switch (p) {
      case 'urgent':
        return <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-xs px-2.5 py-0.5 rounded-full font-medium">Urgente</span>;
      case 'high':
        return <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs px-2.5 py-0.5 rounded-full font-medium">Alta</span>;
      case 'medium':
        return <span className="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs px-2.5 py-0.5 rounded-full font-medium">Media</span>;
      case 'low':
        return <span className="bg-slate-500/10 text-slate-400 border border-slate-500/20 text-xs px-2.5 py-0.5 rounded-full font-medium">Baja</span>;
      default:
        return <span className="bg-slate-800 text-slate-400 text-xs px-2.5 py-0.5 rounded-full">Sin clasificar</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-slate-900 p-6 flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h1 className="text-xl font-bold text-white mb-2">Error al cargar el ticket</h1>
        <p className="text-slate-400 mb-6">{error || 'Ticket no encontrado.'}</p>
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          Volver al Dashboard
        </button>
      </div>
    );
  }

  const isEnriched = ticket.enrichmentStatus === 'completed' || ticket.enrichmentStatus === 'done';
  const isAssignedToMe = ticket.assignee?.id === user?.id;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header & Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Dashboard</span>
          </button>

          {/* Status Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Estado:</span>
            <select
              value={ticket.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={updating}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="open">Abierto</option>
              <option value="in_progress">En Progreso</option>
              <option value="resolved">Resuelto</option>
              <option value="closed">Cerrado</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content (Title, Description, AI Reply, Response Form) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Auto-asignación para Agente */}
            {user?.role === 'agent' && !isAssignedToMe && (
              <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-indigo-300">
                  <UserCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>
                    {ticket.assignee 
                      ? `Asignado actualmente a: ${ticket.assignee.name}` 
                      : 'Este ticket aún no tiene un agente asignado.'}
                  </span>
                </div>
                <button
                  onClick={() => handleAssignTicket(user.id)}
                  disabled={updating}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors shrink-0 shadow-sm"
                >
                  Asignármelo a mí
                </button>
              </div>
            )}

            {/* Ticket Body */}
            <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md">
                  #{ticket.id}
                </span>
                <h1 className="text-xl font-bold text-white">{ticket.title}</h1>
              </div>
              <hr className="border-slate-800" />
              <p className="text-slate-300 whitespace-pre-line text-sm leading-relaxed">
                {ticket.description}
              </p>
            </div>

            {/* AI Enriched Section */}
            {isEnriched && ticket.suggestedReply ? (
              <div className="bg-gradient-to-br from-indigo-950/40 via-slate-800/50 to-slate-800/50 border border-indigo-500/30 rounded-xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                    <Sparkles className="w-5 h-5" />
                    <span>Respuesta Sugerida por IA</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleInsertReply}
                      className="flex items-center gap-1.5 text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-lg transition-colors font-medium"
                    >
                      <CornerDownLeft className="w-3.5 h-3.5" />
                      <span>Insertar en Respuesta</span>
                    </button>
                    <button
                      onClick={handleCopyReply}
                      className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-3 py-1.5 rounded-lg transition-colors font-medium"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                  {ticket.suggestedReply}
                </div>
              </div>
            ) : (
              <div className="bg-slate-800/40 border border-slate-800/60 rounded-xl p-4 flex items-center justify-between gap-3 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400/60 shrink-0" />
                  <span>
                    {ticket.enrichmentStatus === 'processing'
                      ? 'La IA está procesando y enriqueciendo este ticket...'
                      : ticket.enrichmentStatus === 'failed'
                      ? 'El enriquecimiento por IA ha fallado.'
                      : 'Enriquecimiento por IA pendiente de procesamiento.'}
                  </span>
                </div>
                {user?.role === 'admin' && (
                  <button
                    onClick={handleRetryEnrichment}
                    disabled={retryingEnrichment}
                    className="flex items-center gap-1.5 text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-lg transition-colors shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${retryingEnrichment ? 'animate-spin' : ''}`} />
                    <span>Reintentar IA</span>
                  </button>
                )}
              </div>
            )}

            {/* Editor de Respuesta para Agentes */}
            <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  Redactar Respuesta
                </span>
                {replySent && (
                  <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Respuesta enviada exitosamente
                  </span>
                )}
              </div>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Escribe la respuesta al cliente o pulsa 'Insertar en Respuesta' desde la sugerencia de IA..."
                rows={5}
                className="w-full bg-slate-900 border border-slate-700/70 rounded-xl p-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
              />
              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  onClick={() => handleSendResponse(false)}
                  disabled={updating || !replyText.trim()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl transition-colors font-medium disabled:opacity-40"
                >
                  Guardar Borrador
                </button>
                <button
                  onClick={() => handleSendResponse(true)}
                  disabled={updating || !replyText.trim()}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar y Marcar Resuelto</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-6 space-y-4 text-sm">
              <h3 className="font-bold text-white uppercase text-xs tracking-wider border-b border-slate-800 pb-2">
                Información del Ticket
              </h3>

              <div className="space-y-4">
                <div>
                  <span className="text-slate-500 text-xs block mb-1">Prioridad</span>
                  <div>{getPriorityBadge(ticket.priority)}</div>
                </div>

                {/* Asignación */}
                <div>
                  <span className="text-slate-500 text-xs block mb-1">Agente Asignado</span>
                  {user?.role === 'admin' ? (
                    <div className="space-y-1">
                      <select
                        value={ticket.assignee?.id ?? ''}
                        onChange={(e) => handleAssignTicket(e.target.value ? Number(e.target.value) : null)}
                        disabled={updating}
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="">-- Sin asignar --</option>
                        {agents.map((ag) => (
                          <option key={ag.id} value={ag.id}>
                            {ag.name} ({ag.role === 'admin' ? 'Admin' : 'Agente'})
                          </option>
                        ))}
                      </select>
                      <span className="text-[11px] text-slate-500 block">
                        Supervisión: reasigna a cualquier agente registrado.
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-200 text-sm font-medium">
                        {ticket.assignee?.name || (
                          <span className="text-amber-400 text-xs">Sin asignar</span>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-slate-500 text-xs block mb-1">Creado por</span>
                  <span className="text-slate-200 font-medium block">{ticket.creator?.name || 'Anónimo'}</span>
                  {ticket.creator?.email && (
                    <span className="text-xs text-slate-500 block truncate">{ticket.creator.email}</span>
                  )}
                </div>

                <div>
                  <span className="text-slate-500 text-xs block mb-1">Categoría</span>
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-200 capitalize text-sm">{ticket.category || 'Sin categoría'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 text-xs block mb-1">Etiquetas IA</span>
                  <div className="flex flex-wrap gap-1">
                    {ticket.tags && ticket.tags.length > 0 ? (
                      ticket.tags.map((tag, idx) => (
                        <span key={idx} className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs px-2 py-0.5 rounded flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5" />
                          #{tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 text-xs">Sin etiquetas</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 text-xs block mb-1">Fecha de creación</span>
                  <div className="flex items-center gap-1.5 text-slate-300 text-xs">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}