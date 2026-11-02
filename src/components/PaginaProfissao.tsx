import { Profissao, AgenteTemplate } from '../types';
import { Card4D } from './Card4D';
import { ArrowLeft, Shield, Check, Zap, Bell, Sparkles, Cuboid, Gift, Clock, Lock } from 'lucide-react';

interface PaginaProfissaoProps {
  profissao: Profissao;
  templates: AgenteTemplate[];
  onVoltar: () => void;
  onContratarTemplate: (template: AgenteTemplate) => void;
  onTestarGratis?: (template: AgenteTemplate) => void;
  testeJaUtilizado?: boolean;
  agenteTestadoInfo?: { agenteId?: string; templateId?: string; nomeAgente?: string; expirado?: boolean } | null;
  onAbrirAtendimentoAgente?: (agenteId: string) => void;
}

export const PaginaProfissao: React.FC<PaginaProfissaoProps> = ({
  profissao,
  templates,
  onVoltar,
  onContratarTemplate,
  onTestarGratis,
  testeJaUtilizado,
  agenteTestadoInfo,
  onAbrirAtendimentoAgente,
}) => {
  const templatesDaProfissao = templates.filter((t) => t.profissaoId === profissao.id && t.ativo);

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Botão Voltar */}
      <button
        onClick={onVoltar}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Voltar ao Catálogo de Profissões</span>
      </button>

      {/* Header da Profissão com Efeito 4D */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 p-6 sm:p-8 shadow-2xl neon-glow-purple">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-orange-500/60 shadow-2xl shrink-0 bg-slate-800">
              <img
                src={profissao.fotoAvatar || '/avatars/atendimento.jpg'}
                alt={profissao.nome}
                className="w-full h-full object-cover object-center"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {profissao.nome}
                </h1>
                <span className="px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  Cérebro v5.0 · Travas Ativas 🔒
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 text-xs font-bold border border-orange-500/40 flex items-center gap-1">
                  <Cuboid className="w-3.5 h-3.5" />
                  Visual 4D
                </span>
              </div>
              <p className="text-slate-300 text-sm sm:text-base font-medium">
                {profissao.descricao}
              </p>
            </div>
          </div>

          <div className="sm:text-right shrink-0">
            <div className="text-xs text-slate-400">Total disponível</div>
            <div className="text-2xl font-black text-white">
              {templatesDaProfissao.length} {templatesDaProfissao.length === 1 ? 'modelo' : 'modelos'}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Agentes da Categoria */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-orange-400" />
          Modelos Especializados Prontos para Ativação
        </h2>

        {templatesDaProfissao.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/60 rounded-3xl border border-dashed border-slate-800 p-8 space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <Bell className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Em breve novos agentes desta profissão</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Estamos finalizando o treinamento dos modelos com as regras específicas do Cérebro v5.0 para este segmento.
              </p>
            </div>
            <button
              onClick={() => alert('Você será notificado assim que novos agentes forem publicados!')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
            >
              <Bell className="w-4 h-4 text-orange-400" />
              <span>Avise-me quando lançar</span>
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {templatesDaProfissao.map((template) => (
              <Card4D key={template.id} maxTilt={8} className="rounded-2xl">
                <div className="relative overflow-hidden rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 hover:border-orange-500/50 p-6 transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-xl transform-style-3d">
                  {template.destaque && (
                    <div className="absolute top-0 right-0 bg-gradient-to-l from-orange-500 to-amber-500 text-white font-black text-[10px] uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-md z-10">
                      Destaque da Categoria
                    </div>
                  )}

                  <div className="space-y-3 max-w-2xl transform-style-3d">
                    <div className="flex flex-wrap items-center gap-2 translate-z-20">
                      <span className="text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 rounded-full">
                        Foco: {template.segmento}
                      </span>
                      <span className="text-xs text-slate-400">
                        Plano: {template.plano}
                      </span>
                      <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        {template.cerebroVersao}
                      </span>
                    </div>

                    <div className="flex items-start gap-4 translate-z-10">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-orange-500/40 shadow-xl shrink-0 bg-slate-800 hidden sm:block">
                        <img
                          src={template.fotoAvatar || profissao.fotoAvatar || '/avatars/atendimento.jpg'}
                          alt={template.nome}
                          className="w-full h-full object-cover object-center"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white tracking-tight">
                          {template.nome}
                        </h3>
                        <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                          {template.descricaoCurta}
                        </p>
                      </div>
                    </div>

                    {/* Chips de Recursos Inclusos */}
                    <div className="flex flex-wrap gap-1.5 pt-1 translate-z-20">
                      {template.recursos.map((rec, idx) => (
                        <span
                          key={idx}
                          className="text-xs font-medium bg-slate-800/90 text-slate-300 border border-slate-700/60 px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm"
                        >
                          <Check className="w-3 h-3 text-emerald-400" />
                          {rec.replace('✅', '').trim()}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Preço e Botão Contratar */}
                  <div className="flex sm:flex-row lg:flex-col items-center sm:justify-between lg:items-end gap-4 shrink-0 pt-4 lg:pt-0 border-t sm:border-t-0 border-slate-800 translate-z-30">
                    <div className="lg:text-right">
                      <span className="text-xs text-slate-400 block font-medium">Assinatura Mensal</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-white">
                          R$ {template.precoMensal.toFixed(2)}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">/mês</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 block font-medium">
                        🎁 5 Horas Grátis ou Pix Direto
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
                      {testeJaUtilizado ? (
                        template.id === agenteTestadoInfo?.templateId ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (agenteTestadoInfo?.agenteId && onAbrirAtendimentoAgente) {
                                onAbrirAtendimentoAgente(agenteTestadoInfo.agenteId);
                              } else if (onTestarGratis) {
                                onTestarGratis(template);
                              }
                            }}
                            className="px-4 py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
                            title="Seu agente de degustação escolhido"
                          >
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            <span>SEU TESTE</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              alert(
                                `🔒 Trava de Degustação Única: Cada empresa pode testar apenas 1 agente gratuitamente (você escolheu o ${
                                  agenteTestadoInfo?.nomeAgente || 'agente anterior'
                                }).\n\nPara contratar o ${template.nome} para sua empresa, ative o plano mensal no Pix!`
                              );
                              onContratarTemplate(template);
                            }}
                            className="px-4 py-3 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-slate-400 hover:text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                            title="Limite de 1 teste por empresa já utilizado. Clique para assinar."
                          >
                            <Lock className="w-4 h-4 text-amber-400" />
                            <span>1 TESTE POR EMPRESA</span>
                          </button>
                        )
                      ) : (
                        onTestarGratis && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onTestarGratis(template);
                            }}
                            className="px-5 py-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all hover:scale-105 active:scale-95"
                          >
                            <Gift className="w-4 h-4 text-emerald-400" />
                            <span>TESTAR 5H GRÁTIS</span>
                          </button>
                        )
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onContratarTemplate(template);
                        }}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-orange-600/40 transition-transform hover:scale-105 active:scale-95"
                      >
                        <Zap className="w-4 h-4 fill-current" />
                        <span>ASSINAR PLANO</span>
                      </button>
                    </div>
                  </div>
                </div>
              </Card4D>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
