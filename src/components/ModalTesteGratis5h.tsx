import React, { useState } from 'react';
import { AgenteTemplate, AgenteAtivo, Empresa, Profissao } from '../types';
import confetti from 'canvas-confetti';
import {
  X,
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Zap,
  ArrowRight,
  Loader2,
  Building2,
  Phone,
  Tag,
  Gift,
  Lock,
} from 'lucide-react';

interface ModalTesteGratis5hProps {
  template: AgenteTemplate;
  profissao?: Profissao;
  onFechar: () => void;
  onTesteIniciado: (agente: AgenteAtivo, empresa: Empresa) => void;
  onEscolherAssinarDireto: () => void;
  testeJaUtilizado?: boolean;
  agenteTestadoNome?: string;
}

export const ModalTesteGratis5h: React.FC<ModalTesteGratis5hProps> = ({
  template,
  profissao,
  onFechar,
  onTesteIniciado,
  onEscolherAssinarDireto,
  testeJaUtilizado,
  agenteTestadoNome,
}) => {
  const [nomeEmpresa, setNomeEmpresa] = useState('Meu Escritório Digital');
  const [whatsapp, setWhatsapp] = useState('(11) 98888-7777');
  const [segmento, setSegmento] = useState(template.segmento || 'Geral');
  const [nomePersonalizado, setNomePersonalizado] = useState(`${template.nome}`);
  const [iniciando, setIniciando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const fotoAvatar = template.fotoAvatar || profissao?.fotoAvatar || '/avatars/atendimento.jpg';

  const handleIniciarTeste = async (e: React.FormEvent) => {
    e.preventDefault();
    setIniciando(true);
    setErro(null);

    try {
      const res = await fetch('/api/agentes/iniciar-teste-gratis-5h', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          nomeEmpresa: nomeEmpresa.trim(),
          segmento: segmento.trim(),
          whatsapp: whatsapp.trim(),
          nomePersonalizado: nomePersonalizado.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.sucesso) {
        throw new Error(data.error || 'Erro ao iniciar teste gratuito.');
      }

      // Celebrar com confete
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#06b6d4', '#f97316', '#a855f7'],
        });
      } catch (e) {
        // Ignora em ambientes sem canvas
      }

      onTesteIniciado(data.agente, data.empresa);
    } catch (err: any) {
      console.error(err);
      setErro(err.message || 'Falha ao ativar teste de 5 horas.');
    } finally {
      setIniciando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Decorativo com Gradiente */}
        <div className="relative p-6 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-400/50 shadow-xl shadow-emerald-500/20 shrink-0 bg-slate-800">
              <img
                src={fotoAvatar}
                alt={template.nome}
                className="w-full h-full object-cover object-center"
                referrerPolicy="no-referrer"
              />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-1">
                <Gift className="w-3 h-3 text-emerald-400" />
                Degustação Gratuita de 5 Horas
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Testar {template.nome}
              </h2>
              <p className="text-xs text-slate-300">
                {profissao?.nome || 'Especialista Jobs Digital'} • Cérebro v5.0 AGI
              </p>
            </div>
          </div>

          <button
            onClick={onFechar}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Vantagens do Teste */}
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs uppercase tracking-wide">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Como funciona o seu teste de 5 horas:</span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-200">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero custo e sem cartão de crédito</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Atendimento ao vivo liberado na hora</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Link exclusivo do escritório gerado</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Após 5h, assine o plano mensal no Pix</span>
              </li>
            </ul>
          </div>

          {testeJaUtilizado ? (
            <div className="p-6 text-center space-y-5 bg-slate-950/80 rounded-2xl border border-amber-500/40">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/30">
                <Lock className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-white">
                  Limite de 1 Teste Gratuito por Empresa Atingido
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                  Regra da Plataforma: Cada empresa tem direito a testar gratuitamente apenas <strong>1 único agente por 5 horas</strong>.
                  {agenteTestadoNome && (
                    <span className="block mt-1 text-amber-300 font-semibold">
                      Você já utilizou o seu período de teste com o {agenteTestadoNome}.
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-400">
                  Para contratar o <strong>{template.nome}</strong> ou reativar seus agentes, ative o plano mensal oficial no Pix com liberação imediata.
                </p>
              </div>

              <div className="pt-2 space-y-3">
                <button
                  type="button"
                  onClick={onEscolherAssinarDireto}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-orange-600/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>ASSINAR PLANO MENSAL NO PIX (R$ {template.precoMensal.toFixed(2)}/MÊS)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={onFechar}
                  className="w-full py-2.5 text-center text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Voltar à vitrine de agentes
                </button>
              </div>
            </div>
          ) : (
            <>
              {erro && (
                <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-500/50 text-red-300 text-xs font-medium">
                  {erro}
                </div>
              )}

              {/* Formulário Simples de Ativação do Teste */}
              <form onSubmit={handleIniciarTeste} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Nome do seu Escritório / Empresa</span>
              </label>
              <input
                type="text"
                required
                value={nomeEmpresa}
                onChange={(e) => setNomeEmpresa(e.target.value)}
                placeholder="Ex: Clínica Bem Viver, Escritório Silva, Loja Tech"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp de Notificações</span>
                </label>
                <input
                  type="text"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="(11) 98888-7777"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ramo / Segmento</span>
                </label>
                <input
                  type="text"
                  required
                  value={segmento}
                  onChange={(e) => setSegmento(e.target.value)}
                  placeholder="Ex: Odontologia, Moda, Advocacia"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Nome Personalizado do Agente</span>
              </label>
              <input
                type="text"
                required
                value={nomePersonalizado}
                onChange={(e) => setNomePersonalizado(e.target.value)}
                placeholder="Ex: Sofia Atendimento, Pedro Consultor"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Preço do Plano Mensal Após o Teste */}
            <div className="pt-2 flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Após as 5 horas de teste:</span>
                <span className="text-white font-bold">
                  Assinatura Mensal por apenas{' '}
                  <span className="text-emerald-400 font-black text-sm">
                    R$ {template.precoMensal.toFixed(2)}/mês
                  </span>{' '}
                  no Pix
                </span>
              </div>
              <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-lg">
                Sem renovação forçada
              </span>
            </div>

            {/* Ações */}
            <div className="pt-3 space-y-3">
              <button
                type="submit"
                disabled={iniciando}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {iniciando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Iniciando Teste de 5 Horas...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-current" />
                    <span>ATIVAR TESTE DE 5 HORAS AGORA (GRÁTIS)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onEscolherAssinarDireto}
                className="w-full py-2.5 text-center text-xs font-semibold text-slate-400 hover:text-orange-400 transition-colors"
              >
                Já quero assinar o plano definitivo de R$ {template.precoMensal.toFixed(2)}/mês via Pix direto →
              </button>
            </div>
            </form>
          </>
        )}
        </div>
      </div>
    </div>
  );
};
