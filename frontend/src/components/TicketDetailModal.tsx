'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  X,
  Sparkles,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Clock,
  Tag,
  User as UserIcon,
  Layers,
  Send,
  CornerDownLeft,
  RefreshCw,
  UserCheck,
  Shield
} from 'lucide-react';

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | null;
  category: string | null;
  tags?: string[];
  suggestedReply?: string | null;
  enrichmentStatus: 'pending' | 'processing' | 'completed' | 'done' | 'failed';
  createdAt: string;
  creator?: { id?: number; name?: string; email?: string };
  assignee?: { id?: number; name?: string; email?: string } | null;
}

interface SimpleUser {
  id: number;
  name: string;
  email: string;
  role: 'agent' | 'admin';
}

interface TicketDetailModalProps {
  ticketId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onTicketUpdated?: () => void;
}

export function TicketDetailModal({
  ticketId,
  isOpen,
  onClose,
  onTicketUpdated,
}: TicketDetailModalProps) {
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [agents, setAgents] = useState<SimpleUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [retryingEnrichment, setRetryingEnrichment] = useState(false);
  const [copied, setCopied] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replySent, setReplySent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar ticket y lista de agentes (si es admin)
  useEffect(() => {
    if (isOpen && ticketId) {
      setLoading(true);
      setError(null);
      setCopied(false);
      setReplySent(false);

      api.get(`/tickets/${ticketId}`)
        .then((response) => {
          setTicket(response.data);
          setReplyText(response.data.suggestedReply || '');
        })
        .catch((err) => {
          console.error('Error al cargar ticket:', err);
          setError('No se pudo cargar la información del ticket.');
        })
        .finally(() => {
          setLoading(false);
        });

      // Cargar usuarios si es admin para permitir reasignación
      if (user?.role === 'admin') {
        api.get('/users')
          .then((res) => setAgents(res.data))
          .catch((e) => console.error('Error al cargar agentes para asignación:', e));
      }
    } else {
      setTicket(null);
      setError(null);
      setReplyText('');
    }
  }, [isOpen, ticketId, user]);

  // Escuchar actualizaciones en tiempo real vía SSE para el ticket abierto
  useEffect(() => {
    if (!isOpen || !ticketId) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    const eventSource = new EventSource(`${apiUrl}/tickets/events/stream`);

    eventSource.addEventListener('ticket_updated', (e) => {
      try {
        const updated: Ticket = JSON.parse(e.data);
        if (updated.id === ticketId) {
          setTicket((prev) => (prev ? { ...prev, ...updated } : updated));
          if (updated.suggestedReply) {
            setReplyText((current) => current || updated.suggestedReply || '');
          }
        }
      } catch (err) {
        console.error('Error al procesar SSE en modal de ticket:', err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [isOpen, ticketId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Actualizar estado del ticket
  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return;
    setUpdating(true);
    try {
      const response = await api.patch(`/tickets/${ticket.id}`, {
        status: newStatus,
      });
      setTicket(response.data);
      if (onTicketUpdated) onTicketUpdated();
    } catch (err) {
      console.error('Error al actualizar estado:', err);
    } finally {
      setUpdating(false);
    }
  };

  // Reasignar agente (Admin o Autoasignación)
  const handleAssignTicket = async (assigneeId: number | null) => {
    if (!ticket) return;
    setUpdating(true);
    try {
      const response = await api.patch(`/tickets/${ticket.id}`, {
        assignedTo: assigneeId,
      });
      setTicket(response.data);
      if (onTicketUpdated) onTicketUpdated();
    } catch (err) {
      console.error('Error al asignar ticket:', err);
    } finally {
      setUpdating(false);
    }
  };

  // Reintentar Enriquecimiento IA (Admin)
  const handleRetryEnrichment = async () => {
    if (!ticket) return;
    setRetryingEnrichment(true);
    try {
      const response = await api.post(`/tickets/${ticket.id}/retry`);
      setTicket(response.data);
      if (onTicketUpdated) onTicketUpdated();
    } catch (err) {
      console.error('Error al reintentar enriquecimiento:', err);
      alert('Error al reintentar enriquecimiento por IA.');
    } finally {
      setRetryingEnrichment(false);
    }
  };

  // Copiar respuesta sugerida al portapapeles
  const handleCopyReply = () => {
    if (ticket?.suggestedReply) {
      navigator.clipboard.writeText(ticket.suggestedReply);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Insertar respuesta de IA en el editor del agente
  const handleInsertReply = () => {
    if (ticket?.suggestedReply) {
      setReplyText(ticket.suggestedReply);
    }
  };

  // Enviar respuesta y opcionalmente resolver ticket
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
      if (onTicketUpdated) onTicketUpdated();
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

  const isEnriched = ticket?.enrichmentStatus === 'completed' || ticket?.enrichmentStatus === 'done';
  const isAssignedToMe = ticket?.assignee?.id === user?.id;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/90 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xs font-mono font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-lg shrink-0">
              #{ticket?.id || ticketId}
            </span>
            <h2 className="text-lg font-bold text-white truncate">
              {ticket ? ticket.title : 'Cargando ticket...'}
            </h2>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {ticket && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 hidden sm:inline">Estado:</span>
                <select
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={updating}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  <option value="open">Abierto</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="resolved">Resuelto</option>
                  <option value="closed">Cerrado</option>
                </select>
              </div>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
              title="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <span className="text-sm">Cargando detalles del ticket...</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : ticket ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content (Left / 2 Columns) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Banner de Autoasignación para Agentes si no está asignado */}
                {user?.role === 'agent' && !isAssignedToMe && (
                  <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-indigo-300">
                      <UserCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span>
                        {ticket.assignee 
                          ? `Asignado actualmente a: ${ticket.assignee.name}` 
                          : 'Este ticket no tiene un agente asignado.'}
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

                {/* Descripción */}
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Descripción del Problema
                  </span>
                  <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-line">
                    {ticket.description}
                  </p>
                </div>

                {/* AI Enriched Section */}
                {isEnriched && ticket.suggestedReply ? (
                  <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-900/60 border border-indigo-500/30 rounded-xl p-5 space-y-3 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                        <Sparkles className="w-4 h-4" />
                        <span>Respuesta Sugerida por IA</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleInsertReply}
                          className="flex items-center gap-1.5 text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-lg transition-colors font-medium"
                          title="Cargar texto en el editor de respuesta"
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

                    <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-4 text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                      {ticket.suggestedReply}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4 flex items-center justify-between gap-3 text-xs text-slate-400">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400/60 shrink-0" />
                      <span>
                        {ticket.enrichmentStatus === 'processing'
                          ? 'La IA está procesando y clasificando este ticket...'
                          : ticket.enrichmentStatus === 'failed'
                          ? 'El enriquecimiento por IA ha fallado.'
                          : 'Enriquecimiento por IA pendiente de procesamiento.'}
                      </span>
                    </div>
                    {/* Botón de reintento para Administrador */}
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

                {/* Área de Redacción y Respuesta del Agente */}
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                      Redactar Respuesta al Cliente
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
                    placeholder="Escribe aquí la respuesta oficial o utiliza la sugerida por la IA..."
                    rows={4}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 resize-y"
                  />
                  <div className="flex items-center justify-end gap-2.5 pt-1">
                    <button
                      onClick={() => handleSendResponse(false)}
                      disabled={updating || !replyText.trim()}
                      className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg transition-colors font-medium disabled:opacity-40"
                    >
                      Guardar Borrador
                    </button>
                    <button
                      onClick={() => handleSendResponse(true)}
                      disabled={updating || !replyText.trim()}
                      className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-lg shadow-indigo-600/20 disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar y Marcar Resuelto</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Sidebar Info (Right Column) */}
              <div className="space-y-4">
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-4 text-sm">
                  <h3 className="font-bold text-white uppercase text-xs tracking-wider border-b border-slate-800 pb-2">
                    Metadatos del Ticket
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <span className="text-slate-500 text-xs block mb-1">Prioridad IA</span>
                      <div>{getPriorityBadge(ticket.priority)}</div>
                    </div>

                    {/* Asignación de Agente (Extendido para Admin, Simple para Agente) */}
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
                            Como admin puedes forzar la reasignación.
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-200 text-sm font-medium">
                            {ticket.assignee?.name || (
                              <span className="text-amber-400/90 text-xs">Sin asignar</span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="text-slate-500 text-xs block mb-1">Creado por</span>
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-200 text-sm font-medium">
                          {ticket.creator?.name || 'Anónimo'}
                        </span>
                      </div>
                      {ticket.creator?.email && (
                        <span className="text-xs text-slate-500 pl-6 block truncate">
                          {ticket.creator.email}
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-slate-500 text-xs block mb-1">Categoría</span>
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-200 capitalize text-sm">
                          {ticket.category || 'Sin categoría'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 text-xs block mb-1.5">Etiquetas IA</span>
                      <div className="flex flex-wrap gap-1.5">
                        {ticket.tags && ticket.tags.length > 0 ? (
                          ticket.tags.map((tag, idx) => (
                            <span 
                              key={idx} 
                              className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs px-2 py-0.5 rounded-md flex items-center gap-1"
                            >
                              <Tag className="w-2.5 h-2.5" />
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 text-xs">Sin etiquetas</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 text-xs block mb-1">Fecha de Creación</span>
                      <div className="flex items-center gap-2 text-slate-300 text-xs">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          {new Date(ticket.createdAt).toLocaleString('es-ES', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
