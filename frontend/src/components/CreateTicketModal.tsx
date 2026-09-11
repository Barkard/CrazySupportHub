'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { X, Send, Loader2, AlertCircle, UserCheck } from 'lucide-react';

interface SimpleUser {
  id: number;
  name: string;
  email: string;
  role: 'agent' | 'admin';
}

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateTicketModal({ isOpen, onClose, onSuccess }: CreateTicketModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [agents, setAgents] = useState<SimpleUser[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; description?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setAssignedTo('');
      setServerError(null);
      setFieldErrors({});
      setIsSubmitting(false);

      // Si el usuario es administrador, cargar la lista de agentes/usuarios para asignación
      if (user?.role === 'admin') {
        api.get('/users')
          .then((res) => setAgents(res.data))
          .catch((err) => console.error('Error al cargar agentes para asignación:', err));
      }
    }
  }, [isOpen, user]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const validateFields = (): boolean => {
    const errors: { title?: string; description?: string } = {};

    if (!title.trim()) {
      errors.title = 'El título del ticket es obligatorio.';
    } else if (title.trim().length < 5) {
      errors.title = 'El título debe tener al menos 5 caracteres descriptivos.';
    }

    if (!description.trim()) {
      errors.description = 'La descripción del problema es obligatoria.';
    } else if (description.trim().length < 10) {
      errors.description = 'La descripción debe tener al menos 10 caracteres para que la IA pueda clasificarla.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    // Validación inline antes de enviar (sin alert())
    if (!validateFields()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post('/tickets', {
        title: title.trim(),
        description: description.trim(),
        assignedTo: assignedTo ? Number(assignedTo) : undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      if (err.response?.data?.error) {
        setServerError(err.response.data.error);
      } else if (err.response?.data?.message) {
        setServerError(err.response.data.message);
      } else {
        setServerError('No se pudo conectar con el servidor. Inténtalo nuevamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div 
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80 bg-slate-900/80">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Crear Nuevo Ticket</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Describe el problema. El sistema IA analizará y priorizará tu solicitud.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5 overflow-y-auto">
          {/* Error general del servidor */}
          {serverError && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Campo Título con validación inline */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Título del Ticket <span className="text-red-400">*</span>
              </label>
              <span className="text-[11px] text-slate-500">Mínimo 5 caracteres</span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (fieldErrors.title) {
                  setFieldErrors((prev) => ({ ...prev, title: undefined }));
                }
              }}
              onBlur={() => {
                if (title && title.trim().length < 5) {
                  setFieldErrors((prev) => ({ ...prev, title: 'El título debe tener al menos 5 caracteres.' }));
                }
              }}
              placeholder="Ej: Falla de conexión a la base de datos de producción"
              className={`w-full bg-slate-950 border rounded-lg px-4 py-2.5 text-slate-100 text-sm focus:outline-none transition-colors ${
                fieldErrors.title
                  ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/30'
                  : 'border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
              }`}
            />
            {fieldErrors.title && (
              <p className="text-xs text-red-400 flex items-center gap-1 mt-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.title}</span>
              </p>
            )}
          </div>

          {/* Campo Descripción con validación inline */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Descripción Detallada <span className="text-red-400">*</span>
              </label>
              <span className="text-[11px] text-slate-500">Mínimo 10 caracteres</span>
            </div>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (fieldErrors.description) {
                  setFieldErrors((prev) => ({ ...prev, description: undefined }));
                }
              }}
              onBlur={() => {
                if (description && description.trim().length < 10) {
                  setFieldErrors((prev) => ({ ...prev, description: 'La descripción debe tener al menos 10 caracteres.' }));
                }
              }}
              placeholder="Explica detalladamente el problema o solicitud para que la IA sugiera una respuesta precisa..."
              className={`w-full bg-slate-950 border rounded-lg p-4 text-slate-100 text-sm focus:outline-none transition-colors resize-none ${
                fieldErrors.description
                  ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/30'
                  : 'border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
              }`}
            />
            {fieldErrors.description && (
              <p className="text-xs text-red-400 flex items-center gap-1 mt-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.description}</span>
              </p>
            )}
          </div>

          {/* Asignación de Agente (Visible solo para Administradores) */}
          {user?.role === 'admin' && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                  Asignar a Agente / Usuario (Opcional)
                </label>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-medium">
                  Solo Admin
                </span>
              </div>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer"
              >
                <option value="">Sin asignar (Auto-asignación posterior)</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.role === 'admin' ? 'Admin' : 'Agente'}) - {agent.email}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/80">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creando ticket...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Crear Ticket</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
