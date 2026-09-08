'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
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
  Layers
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
  assignee?: { id?: number; name?: string; email?: string };
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
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && ticketId) {
      setLoading(true);
      setError(null);
      setCopied(false);

      api.get(`/tickets/${ticketId}`)
        .then((response) => {
          setTicket(response.data);
        })
        .catch((err) => {
          console.error('Error al cargar ticket:', err);
          setError('No se pudo cargar la información del ticket.');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setTicket(null);
      setError(null);
    }
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

  const handleCopyReply = () => {
    if (ticket?.suggestedReply) {
      navigator.clipboard.writeText(ticket.suggestedReply);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition-colors"
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
                {/* Description Box */}
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
                      <button
                        onClick={handleCopyReply}
                        className="flex items-center gap-1.5 text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-lg transition-colors font-medium"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar Respuesta</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-4 text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-line">
                      {ticket.suggestedReply}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-4 flex items-center gap-3 text-xs text-slate-400">
                    <Sparkles className="w-4 h-4 text-indigo-400/60 shrink-0" />
                    <span>
                      {ticket.enrichmentStatus === 'processing'
                        ? 'La IA está procesando y enriqueciendo este ticket...'
                        : ticket.enrichmentStatus === 'failed'
                        ? 'No se pudo generar el enriquecimiento por IA para este ticket.'
                        : 'Enriquecimiento por IA pendiente de procesamiento.'}
                    </span>
                  </div>
                )}
              </div>

              {/* Sidebar Info (Right Column) */}
              <div className="space-y-4">
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-4 text-sm">
                  <h3 className="font-bold text-white uppercase text-xs tracking-wider border-b border-slate-800 pb-2">
                    Metadatos del Ticket
                  </h3>

                  <div className="space-y-3.5">
                    <div>
                      <span className="text-slate-500 text-xs block mb-1">Prioridad</span>
                      <div>{getPriorityBadge(ticket.priority)}</div>
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
