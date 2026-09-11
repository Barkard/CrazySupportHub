'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, Send, Loader2, AlertCircle } from 'lucide-react';

export default function NewTicketPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ title?: string; description?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const validateFields = (): boolean => {
    const errors: { title?: string; description?: string } = {};

    if (!title.trim()) {
      errors.title = 'El título del ticket es obligatorio.';
    } else if (title.trim().length < 5) {
      errors.title = 'El título debe tener al menos 5 caracteres.';
    }

    if (!description.trim()) {
      errors.description = 'La descripción del problema es obligatoria.';
    } else if (description.trim().length < 10) {
      errors.description = 'La descripción debe tener al menos 10 caracteres.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validateFields()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await api.post('/tickets', {
        title: title.trim(),
        description: description.trim(),
      });

      router.push('/dashboard');
    } catch (err: any) {
      if (err.response?.data?.error) {
        setServerError(err.response.data.error);
      } else {
        setServerError('Error al crear el ticket. Inténtalo nuevamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 font-sans">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header / Back Link */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Dashboard</span>
        </button>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 shadow-xl">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Crear Nuevo Ticket</h1>
            <p className="text-sm text-slate-400 mt-1">
              Describe tu requerimiento o problema. La IA analizará y priorizará tu solicitud.
            </p>
          </div>

          {serverError && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 p-3.5 rounded-xl text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
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
                  if (fieldErrors.title) setFieldErrors((prev) => ({ ...prev, title: undefined }));
                }}
                onBlur={() => {
                  if (title && title.trim().length < 5) {
                    setFieldErrors((prev) => ({ ...prev, title: 'El título debe tener al menos 5 caracteres.' }));
                  }
                }}
                placeholder="Ej: Falla de conexión a la base de datos de producción"
                className={`w-full bg-slate-950 border rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none transition-colors ${
                  fieldErrors.title
                    ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/20'
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

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Descripción Detallada <span className="text-red-400">*</span>
                </label>
                <span className="text-[11px] text-slate-500">Mínimo 10 caracteres</span>
              </div>
              <textarea
                rows={6}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (fieldErrors.description) setFieldErrors((prev) => ({ ...prev, description: undefined }));
                }}
                onBlur={() => {
                  if (description && description.trim().length < 10) {
                    setFieldErrors((prev) => ({ ...prev, description: 'La descripción debe tener al menos 10 caracteres.' }));
                  }
                }}
                placeholder="Explica detalladamente los pasos para reproducir el problema o los detalles de tu solicitud..."
                className={`w-full bg-slate-950 border rounded-xl p-4 text-slate-100 text-sm focus:outline-none transition-colors resize-none ${
                  fieldErrors.description
                    ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/20'
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

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2.5 border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm rounded-xl transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"
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
    </div>
  );
}