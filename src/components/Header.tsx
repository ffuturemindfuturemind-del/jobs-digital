import React, { useState } from 'react';
import { Bot, Bell, Shield, Cloud, Building2, User, Search, LogIn, ExternalLink, LogOut, Check } from 'lucide-react';
import { Usuario } from '../types';
import { BotaoInstalarPWA } from './BotaoInstalarPWA';

interface HeaderProps {
  busca: string;
  setBusca: (val: string) => void;
  pedidosPendentesHITL: number;
  abaAtual: string;
  setAbaAtual: (aba: string) => void;
  modoAdmin: boolean;
  setModoAdmin: (val: boolean) => void;
  nomeEmpresa: string;
  usuarioLogado: Usuario | null;
  onAbrirAuth: () => void;
  onLogout: () => void;
  onAbrirPortalPublico: () => void;
  temAgentesAtivos: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  busca,
  setBusca,
  pedidosPendentesHITL,
  setAbaAtual,
  modoAdmin,
  setModoAdmin,
  nomeEmpresa,
  usuarioLogado,
  onAbrirAuth,
  onLogout,
  onAbrirPortalPublico,
  temAgentesAtivos,
}) => {
  const [copiadoLink, setCopiadoLink] = useState(false);
  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo e Identidade */}
          <div
            className="flex items-center gap-3 cursor-pointer group shrink-0"
            onClick={() => setAbaAtual('vitrine')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-amber-500 to-purple-600 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-orange-400 bg-clip-text text-transparent">
                  JOBS DIGITAL
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  AGI v5.0
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                Inteligência Técnica, Comercial & Operacional
              </p>
            </div>
          </div>

          {/* Busca Global */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar profissão, agente ou recurso..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-9 pr-4 py-1.5 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
              />
            </div>
          </div>

          {/* Status da Nuvem & Controles */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Status Nuvem */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
              <Cloud className="w-3.5 h-3.5 animate-pulse" />
              <span>Nuvem Ativa</span>
            </div>

            {/* Botão Instalar App (PWA / Mobile / Desktop) */}
            <BotaoInstalarPWA />

            {/* Botão Copiar Link Independente */}
            <button
              onClick={() => {
                const url = window.location.origin.includes('ais-pre-')
                  ? window.location.origin
                  : 'https://ais-pre-tbnhuomh23pgmphu627xzn-244294915589.us-west2.run.app';
                navigator.clipboard.writeText(url);
                setCopiadoLink(true);
                setTimeout(() => setCopiadoLink(false), 3000);
              }}
              title="Copiar Link Oficial para abrir fora do Studio ou mandar no WhatsApp"
              className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 shadow-sm ${
                copiadoLink
                  ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                  : 'border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/20 text-orange-300'
              }`}
            >
              {copiadoLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline text-emerald-300">Link Copiado!</span>
                </>
              ) : (
                <>
                  <ExternalLink className="w-3.5 h-3.5 text-orange-400" />
                  <span className="hidden sm:inline">Copiar Link Independente</span>
                </>
              )}
            </button>

            {/* Alternador de Modo Admin e Sino HITL (Apenas visível se o Dono estiver logado) */}
            {usuarioLogado && (
              <>
                <button
                  onClick={() => setModoAdmin(!modoAdmin)}
                  title="Alternar entre Painel do Dono e Gestão Admin"
                  className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                    modoAdmin
                      ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{modoAdmin ? 'Admin Platform' : 'Visão Dono'}</span>
                </button>

                <button
                  onClick={() => setAbaAtual('hitl')}
                  title="Caixa de Decisões Human-in-the-Loop"
                  className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {pedidosPendentesHITL > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-600 text-white text-[11px] font-bold flex items-center justify-center animate-bounce shadow-md shadow-orange-600/50">
                      {pedidosPendentesHITL}
                    </span>
                  )}
                </button>
              </>
            )}

            {/* Botão Ver Canal do Escritório (Visão do Cliente) */}
            {temAgentesAtivos && (
              <button
                onClick={onAbrirPortalPublico}
                title="Abrir Canal de Atendimento do Escritório para Clientes"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-md shadow-orange-600/20 transition-all hover:scale-105"
              >
                <span>Canal do Escritório</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Usuário / Login */}
            {usuarioLogado ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div
                  onClick={() => setAbaAtual('painel')}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200">
                    <User className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="hidden xl:block text-left">
                    <div className="text-xs font-bold text-slate-200 truncate max-w-[120px]">
                      {usuarioLogado.nome}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                      {nomeEmpresa}
                    </div>
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  title="Sair da conta"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onAbrirAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-md shadow-orange-600/20"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Entrar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
