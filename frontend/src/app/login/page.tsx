'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Lock, Mail, User as UserIcon, Loader2, AlertCircle, Shield, CheckCircle2, UserCheck } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Campos de formulario
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Errores inline por campo y del servidor
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cambiar entre login y registro
  const handleSwitchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setServerError(null);
    setFieldErrors({});
  };

  // Validaciones inline antes de enviar
  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (mode === 'register') {
      if (!name.trim()) {
        errors.name = 'El nombre completo es obligatorio.';
      } else if (name.trim().length < 2) {
        errors.name = 'El nombre debe tener al menos 2 caracteres.';
      }
    }

    if (!email.trim()) {
      errors.email = 'El correo electrónico es obligatorio.';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Ingresa un formato de correo válido (ej: usuario@ejemplo.com).';
    }

    if (!password) {
      errors.password = 'La contraseña es obligatoria.';
    } else if (password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres.';
    }

    if (mode === 'register') {
      if (!confirmPassword) {
        errors.confirmPassword = 'Por favor confirma tu contraseña.';
      } else if (password !== confirmPassword) {
        errors.confirmPassword = 'Las contraseñas no coinciden.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const response = await api.post('/auth/login', {
          email: email.trim(),
          password,
        });

        const { token, user } = response.data;
        login(token, user);
      } else {
        // Registro de usuario (Rol 'agent' por defecto en el backend)
        const response = await api.post('/auth/register', {
          name: name.trim(),
          email: email.trim(),
          password,
        });

        const { token, user } = response.data;
        login(token, user);
      }
    } catch (err: any) {
      const status = err.response?.status;
      const data = err.response?.data;

      if (status === 409) {
        setServerError('Este correo electrónico ya está registrado. Por favor inicia sesión.');
        setFieldErrors((prev) => ({ ...prev, email: 'Correo ya existente' }));
      } else if (status === 401) {
        setServerError('Credenciales inválidas. Verifica tu correo y contraseña.');
      } else if (status === 400 && data?.error) {
        setServerError(data.error);
      } else if (data?.error) {
        setServerError(data.error);
      } else if (data?.message) {
        setServerError(data.message);
      } else {
        setServerError('Error al conectar con el servidor. Verifica que el backend esté disponible.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4 font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6">
        {/* Header con Marca */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-600/10 border border-indigo-500/20 rounded-2xl text-indigo-400 mb-1 shadow-inner">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            CrazySupportHub
          </h1>
          <p className="text-xs text-slate-400">
            {mode === 'login'
              ? 'Inicia sesión para atender tickets con enriquecimiento IA'
              : 'Regístrate para comenzar a gestionar tickets de soporte'}
          </p>
        </div>

        {/* Pestañas Login / Registro */}
        <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleSwitchMode('login')}
            className={`py-2 rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode('register')}
            className={`py-2 rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Crear Cuenta
          </button>
        </div>

        {/* Mensaje de error general del servidor */}
        {serverError && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Notificación informativa para Registro */}
        {mode === 'register' && (
          <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 p-3 rounded-xl text-xs">
            <UserCheck className="w-4 h-4 shrink-0 text-indigo-400" />
            <span>Tu cuenta se creará automáticamente con el rol de <strong>Agente de Soporte</strong>.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Nombre Completo (Solo en Registro) */}
          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Nombre Completo <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: undefined }));
                  }}
                  placeholder="Ej: Daniel Morales"
                  className={`w-full bg-slate-950 border rounded-xl pl-9 pr-4 py-2 text-slate-100 text-sm focus:outline-none transition-colors ${
                    fieldErrors.name
                      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/20'
                      : 'border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                  }`}
                />
              </div>
              {fieldErrors.name && (
                <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.name}</span>
                </p>
              )}
            </div>
          )}

          {/* Correo Electrónico */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Correo Electrónico <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }}
                placeholder="usuario@crazysupporthub.com"
                className={`w-full bg-slate-950 border rounded-xl pl-9 pr-4 py-2 text-slate-100 text-sm focus:outline-none transition-colors ${
                  fieldErrors.email
                    ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/20'
                    : 'border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                }`}
              />
            </div>
            {fieldErrors.email && (
              <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.email}</span>
              </p>
            )}
          </div>

          {/* Contraseña */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Contraseña <span className="text-red-400">*</span>
              </label>
              {mode === 'register' && (
                <span className="text-[11px] text-slate-500">Mínimo 6 caracteres</span>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }}
                placeholder="••••••••"
                className={`w-full bg-slate-950 border rounded-xl pl-9 pr-4 py-2 text-slate-100 text-sm focus:outline-none transition-colors ${
                  fieldErrors.password
                    ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/20'
                    : 'border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                }`}
              />
            </div>
            {fieldErrors.password && (
              <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fieldErrors.password}</span>
              </p>
            )}
          </div>

          {/* Confirmar Contraseña (Solo en Registro) */}
          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                Confirmar Contraseña <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }}
                  placeholder="••••••••"
                  className={`w-full bg-slate-950 border rounded-xl pl-9 pr-4 py-2 text-slate-100 text-sm focus:outline-none transition-colors ${
                    fieldErrors.confirmPassword
                      ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/20'
                      : 'border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                  }`}
                />
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.confirmPassword}</span>
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20 mt-3"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{mode === 'login' ? 'Iniciando sesión...' : 'Creando cuenta...'}</span>
              </>
            ) : (
              <span>{mode === 'login' ? 'Iniciar Sesión' : 'Registrarse como Agente'}</span>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}