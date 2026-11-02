import { Profissao, AgenteTemplate } from '../types';
import { Card4D } from './Card4D';
import { Sparkles, ArrowRight, ShieldCheck, Zap, ChevronRight, CheckCircle2, Cuboid, Gift, Clock } from 'lucide-react';

interface VitrineHomeProps {
  profissoes: (Profissao & { agentesDisponiveis?: number })[];
  templates: AgenteTemplate[];
  onSelecionarProfissao: (profissao: Profissao) => void;
  onContratarTemplate: (template: AgenteTemplate) => void;
  onTestarGratis?: (template: AgenteTemplate) => void;
  busca: string;
}

export const VitrineHome: React.FC<VitrineHomeProps> = ({
  profissoes,
  templates,
  onSelecionarProfissao,
  onContratarTemplate,
  onTestarGratis,
  busca,
}) => {
  // Helpers para gradientes estilizados conforme especificação
  const getCardGradient = (gradiente: string) => {
    switch (gradiente) {
      case 'laranja':
        return 'from-orange-600 via-orange-500 to-amber-600 hover:from-orange-500 hover:to-amber-500 shadow-orange-500/10';
      case 'roxo':
        return 'from-purple-800 via-purple-700 to-indigo-800 hover:from-purple-700 hover:to-indigo-700 shadow-purple-500/10';
      case 'laranja_roxo':
        return 'from-orange-600 via-rose-600 to-purple-800 hover:from-orange-500 hover:to-purple-700 shadow-rose-500/10';
      case 'roxo_laranja':
        return 'from-purple-800 via-purple-700 to-orange-600 hover:from-purple-700 hover:to-orange-500 shadow-orange-500/10';
      default:
        return 'from-slate-800 to-slate-900 shadow-slate-500/10';
    }
  };

  const termoBusca = busca.trim().toLowerCase();

  // Filtragem inteligente por busca
  const profissoesFiltradas = profissoes.filter((p) => {
    if (!termoBusca) return true;
    const matchProfissao =
      p.nome.toLowerCase().includes(termoBusca) ||
      p.descricao.toLowerCase().includes(termoBusca);
    const matchTemplate = templates.some(
      (t) =>
        t.profissaoId === p.id &&
        (t.nome.toLowerCase().includes(termoBusca) ||
          t.segmento.toLowerCase().includes(termoBusca) ||
          t.descricaoCurta.toLowerCase().includes(termoBusca))
    );
    return matchProfissao || matchTemplate;
  });

  // Obter exatamente os 10 modelos de agentes prontos na nuvem (1 para cada uma das 10 profissões v5.0)
  const dezModelosDestaque = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    .map((pId) => {
      return (
        templates.find((t) => t.profissaoId === pId && t.destaque) ||
        templates.find((t) => t.profissaoId === pId)
      );
    })
    .filter((t): t is AgenteTemplate => Boolean(t));

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Banner Vitrine */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-500/10 via-purple-500/10 to-transparent blur-3xl pointer-events-none rounded-full" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            Catálogo Oficial de Profissões Jobs Digital
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Escolha sua <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-purple-400 bg-clip-text text-transparent">Profissão</span>
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            Agentes autônomos com o Cérebro AGI v5.0 prontos para trabalhar na nuvem da sua empresa.
            Equipados com travas absolutas de segurança, controle de alçada e supervisão humana em 1 clique.
          </p>

          <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-300 font-bold">
              <Gift className="w-4 h-4 text-emerald-400" />
              <span>5 Horas de Teste Gratuito em Todos os Agentes</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Sem Alucinação & Verdade Operacional</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-slate-300">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Assinatura Mensal no Pix</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid 2 Colunas com os 10 cards de profissão */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Vitrine de Agentes por Área
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Toque no card para ver os modelos disponíveis e contratar
            </p>
          </div>
          <span className="text-xs font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/30 px-3 py-1 rounded-full">
            10 Especialidades v5.0
          </span>
        </div>

        {profissoesFiltradas.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800">
            <p className="text-slate-400 text-sm">Nenhuma profissão encontrada para "{busca}".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
            {profissoesFiltradas.map((profissao) => {
              const gradientClass = getCardGradient(profissao.gradiente);
              const qtdAgentes = profissao.agentesDisponiveis || 0;

              return (
                <Card4D
                  key={profissao.id}
                  onClick={() => onSelecionarProfissao(profissao)}
                  className="rounded-2xl"
                  maxTilt={12}
                >
                  <div
                    className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradientClass} p-5 sm:p-6 transition-all duration-300 border border-white/20 shadow-xl transform-style-3d`}
                  >
                    <div className="relative z-10 flex flex-col justify-between h-full space-y-4 transform-style-3d">
                      <div className="flex items-start justify-between gap-3 transform-style-3d">
                        {/* Foto Perfil 3D Realista projetada em Z */}
                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-black/40 backdrop-blur-md border-2 border-white/30 shadow-2xl group-hover:scale-105 group-hover:border-orange-400 transition-all translate-z-30 shrink-0">
                          <img
                            src={profissao.fotoAvatar || `/avatars/atendimento.jpg`}
                            alt={profissao.nome}
                            className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Badge Contagem Real projetada em Z */}
                        <div className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-white font-bold text-xs tracking-tight shadow-md translate-z-20">
                          {qtdAgentes} {qtdAgentes === 1 ? 'agente ativo' : 'agentes ativos'}
                        </div>
                      </div>

                      <div className="transform-style-3d translate-z-20">
                        <h3 className="text-xl font-black text-white tracking-tight group-hover:translate-x-1 transition-transform flex items-center gap-1.5 drop-shadow-md">
                          {profissao.nome}
                          <ChevronRight className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                        </h3>
                        <p className="text-sm text-white/90 font-medium mt-1 leading-snug line-clamp-2">
                          "{profissao.descricao}"
                        </p>
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-white/20 text-xs font-bold text-white/95 translate-z-10">
                        <span className="flex items-center gap-1">
                          <Cuboid className="w-3.5 h-3.5 text-orange-200" />
                          <span>Módulo 4D Ativo</span>
                        </span>
                        <span className="flex items-center gap-1 group-hover:underline">
                          Acessar modelos <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Card4D>
              );
            })}
          </div>
        )}
      </div>

      {/* Destaques Rápidos da Vitrine em 4D: TODOS OS 10 AGENTES PRONTOS NA NUVEM */}
      <div className="space-y-6 pt-8 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              10 / 10 Agentes Ativos na Nuvem Jobs Digital
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-400" />
              Modelos em Destaque Prontos na Nuvem (Todos os 10 Agentes)
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Cada uma das 10 profissões possui um agente especialista pronto no Cérebro AGI v5.0. Toque para contratar e ativar na hora.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 bg-slate-900/90 px-3.5 py-2 rounded-xl border border-slate-800 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping inline-block" />
            <span>Cards Espaciais com Tilt 4D</span>
          </div>
        </div>

        {/* Grid com Todos os 10 Agentes Ativos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {dezModelosDestaque.map((template, idx) => {
            const profissaoPai = profissoes.find((p) => p.id === template.profissaoId);

            return (
              <Card4D key={template.id} maxTilt={12} className="rounded-2xl h-full">
                <div className="rounded-2xl bg-gradient-to-b from-slate-900/95 to-slate-950/95 backdrop-blur-xl border border-slate-800/90 hover:border-orange-500/60 p-5 flex flex-col justify-between transition-all space-y-4 h-full shadow-2xl hover:shadow-orange-500/10 transform-style-3d group">
                  <div className="space-y-3 transform-style-3d">
                    {/* Header do Card com Foto 3D Realista e Profissão */}
                    <div className="flex items-center justify-between gap-3 translate-z-20">
                      <div className="flex items-center gap-2.5">
                        <div className="w-11 h-11 rounded-xl overflow-hidden border-2 border-orange-500/40 shadow-lg shrink-0 bg-slate-800">
                          <img
                            src={template.fotoAvatar || profissaoPai?.fotoAvatar || '/avatars/atendimento.jpg'}
                            alt={template.nome}
                            className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-orange-400 truncate max-w-[130px]">
                            {profissaoPai?.nome || 'Agente'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Cérebro v5.0 AGI
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Gift className="w-3 h-3 text-emerald-400" />
                          5h Grátis
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-800/80 border border-slate-700/60 px-2 py-0.5 rounded-full">
                          0{idx + 1}
                        </span>
                      </div>
                    </div>

                    {/* Nome do Agente e Segmento */}
                    <div className="translate-z-20">
                      <h4 className="text-base sm:text-lg font-black text-white tracking-tight group-hover:text-orange-400 transition-colors">
                        {template.nome}
                      </h4>
                      {template.segmento && (
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5 line-clamp-1">
                          🎯 {template.segmento}
                        </p>
                      )}
                    </div>

                    {/* Descrição */}
                    <p className="text-xs text-slate-300 leading-relaxed translate-z-10 line-clamp-2">
                      {template.descricaoCurta}
                    </p>

                    {/* Recursos em Chips */}
                    {template.recursos && template.recursos.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1 translate-z-15">
                        {template.recursos.slice(0, 2).map((rec, rIdx) => (
                          <span
                            key={rIdx}
                            className="text-[10px] font-semibold text-slate-300 bg-slate-800/80 border border-slate-700/50 px-2 py-0.5 rounded-md flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" />
                            <span className="truncate max-w-[140px]">{rec.replace('✅', '').trim()}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Rodapé com Preço Pix e Ações (Testar 5h Grátis ou Contratar) */}
                  <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 translate-z-25">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
                        Assinatura Mensal
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-white">
                          R$ {template.precoMensal.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-amber-400 font-bold">/mês</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {onTestarGratis && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTestarGratis(template);
                          }}
                          className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 font-bold text-xs flex items-center gap-1 shadow-sm transition-all hover:scale-105 active:scale-95"
                          title="Testar agente por 5 horas sem custos"
                        >
                          <Gift className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Testar 5h</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onContratarTemplate(template);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs flex items-center gap-1 shadow-lg shadow-orange-600/30 transition-all hover:scale-105 active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>Contratar</span>
                      </button>
                    </div>
                  </div>
                </div>
              </Card4D>
            );
          })}
        </div>
      </div>
    </div>
  );
};
