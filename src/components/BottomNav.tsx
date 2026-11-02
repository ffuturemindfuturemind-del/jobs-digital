import React from 'react';
import { Sparkles, MessageSquare, Bot, AlertTriangle, BarChart3, Lock, LogIn } from 'lucide-react';
import { Usuario } from '../types';

interface BottomNavProps {
  abaAtual: string;
  setAbaAtual: (aba: string) => void;
  pedidosPendentesHITL: number;
  totalAgentesAtivos: number;
  usuarioLogado: Usuario | null;
  onAbrirAuth: () => void;
}

interface NavTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | null;
  badgeColor?: string;
  onClickOverride?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  abaAtual,
  setAbaAtual,
  pedidosPendentesHITL,
  totalAgentesAtivos,
  usuarioLogado,
  onAbrirAuth,
}) => {
  // Se o Dono/Admin estiver logado, exibe todas as abas de gestão privada
  // Se for um visitante/cliente público, exibe apenas Vitrine e Acesso Restrito
  const tabs: NavTab[] = usuarioLogado
    ? [
        {
          id: 'vitrine',
          label: 'Início',
          icon: Sparkles,
          badge: null,
        },
        {
          id: 'conversas',
          label: 'Conversas',
          icon: MessageSquare,
          badge: null,
        },
        {
          id: 'meus-agentes',
          label: 'Meus Agentes',
          icon: Bot,
          badge: totalAgentesAtivos > 0 ? totalAgentesAtivos : null,
        },
        {
          id: 'hitl',
          label: 'Decisões HITL',
          icon: AlertTriangle,
          badge: pedidosPendentesHITL > 0 ? pedidosPendentesHITL : null,
          badgeColor: 'bg-orange-500 text-white',
        },
        {
          id: 'painel',
          label: 'Painel do Dono',
          icon: BarChart3,
          badge: null,
        },
      ]
    : [
        {
          id: 'vitrine',
          label: 'Vitrine de Agentes',
          icon: Sparkles,
          badge: null,
        },
        ...(totalAgentesAtivos > 0
          ? [
              {
                id: 'meus-agentes',
                label: 'Agente em Teste',
                icon: Bot,
                badge: totalAgentesAtivos,
                badgeColor: 'bg-emerald-500 text-white',
              },
            ]
          : []),
        {
          id: 'login-dono',
          label: 'Área do Dono',
          icon: Lock,
          badge: null,
          onClickOverride: onAbrirAuth,
        },
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800 py-1.5 px-2 sm:px-6">
      <div className="max-w-md sm:max-w-2xl mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = abaAtual === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.onClickOverride) {
                  tab.onClickOverride();
                } else {
                  setAbaAtual(tab.id);
                }
              }}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 sm:px-4 rounded-xl transition-all ${
                isActive
                  ? 'text-orange-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 text-orange-400' : ''
                  }`}
                />
                {tab.badge && (
                  <span
                    className={`absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center ${
                      tab.badgeColor || 'bg-slate-700 text-slate-200'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
