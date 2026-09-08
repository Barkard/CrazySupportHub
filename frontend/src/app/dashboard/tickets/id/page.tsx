'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { 
  ArrowLeft, 
  Sparkles, 
  User, 
  Clock, 
  Tag, 
  Copy, 
  Check, 
  Loader2, 
  AlertCircle,
  Send
} from 'lucide-react';

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | null;
  category: string | null;
  tags: string[];
  suggestedReply: string | null;
  enrichmentStatus: 'pending' | 'completed' | 'failed';
  createdAt: string;
  creator: { id: number; name: string; email: string };
  assignee?: { id: number; name: string; email: string };
}

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const ticketId = resolvedParams.id;
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchTicket = async () => {
    try {
      const response = await api.get(`/tickets/${ticketId}`);
      setTicket(response.data);
    } catch (err: any) {
      setError('No se pudo cargar el ticket.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();
  }, [ticketId]);

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

  const handleCopyReply = () => {
    if (ticket?.suggestedReply) {
      navigator.clipboard.writeText(ticket.suggestedReply);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
            >
              <option value="open">Abierto</option>
              <option value="in_progress">En Progreso</option>
              <option value="resolved">Resuelto</option>
              <option value="closed">Cerrado</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content (Title, Description, AI Reply) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Body */}
            <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-slate-500">#{ticket.id}</span>
                <h1 className="text-xl font-bold text-white">{ticket.title}</h1>
              </div>
              <hr className="border-slate-800" />
              <p className="text-slate-300 whitespace-pre-line text-sm leading-relaxed">
                {ticket.description}
              </p>
            </div>

            {/* AI Enriched Section */}
            {ticket.enrichmentStatus === 'completed' && ticket.suggestedReply && (
              <div className="bg-gradient-to-br from-indigo-950/40 via-slate-800/50 to-slate-800/50 border border-indigo-500/30 rounded-xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                    <Sparkles className="w-5 h-5" />
                    <span>Respuesta Sugerida por IA</span>
                  </div>
                  <button
                    onClick={handleCopyReply}
                    className="flex items-center gap-1.5 text-xs bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-lg transition-colors"
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

                <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 text-sm text-slate-200 leading-relaxed font-mono">
                  {ticket.suggestedReply}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-6 space-y-4 text-sm">
              <h3 className="font-bold text-white uppercase text-xs tracking-wider border-b border-slate-800 pb-2">
                Información del Ticket
              </h3>

              <div className="space-y-3">
                <div>
                  <span className="text-slate-500 text-xs block">Creado por</span>
                  <span className="text-slate-200 font-medium">{ticket.creator?.name || 'Anónimo'}</span>
                </div>

                <div>
                  <span className="text-slate-500 text-xs block">Categoría</span>
                  <span className="text-slate-200">{ticket.category || 'Sin categoría'}</span>
                </div>

                <div>
                  <span className="text-slate-500 text-xs block mb-1">Etiquetas IA</span>
                  <div className="flex flex-wrap gap-1">
                    {ticket.tags && ticket.tags.length > 0 ? (
                      ticket.tags.map((tag, idx) => (
                        <span key={idx} className="bg-slate-700/50 text-slate-300 text-xs px-2 py-0.5 rounded">
                          #{tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 text-xs">Sin etiquetas</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 text-xs block">Fecha de creación</span>
                  <span className="text-slate-300 text-xs">
                    {new Date(ticket.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}