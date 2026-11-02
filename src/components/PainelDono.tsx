import React, { useState, useEffect, useRef } from 'react';
import {
  AgenteAtivo,
  Empresa,
  EscalaHumana,
  Conversa,
  RouterLog,
  Profissao,
  AgenteTemplate,
} from '../types';
import {
  AlertTriangle,
  MessageSquare,
  BarChart3,
  Bot,
  DollarSign,
  Users,
  CheckCircle,
  XCircle,
  PhoneCall,
  Send,
  Play,
  Pause,
  Settings,
  Sparkles,
  ShieldCheck,
  Zap,
  Clock,
  ThumbsUp,
  FileText,
  UserCheck,
  Plus,
  Loader2,
} from 'lucide-react';

interface PainelDonoProps {
  agentes: (AgenteAtivo & { profissao?: Profissao; template?: AgenteTemplate; empresa?: Empresa })[];
  empresa: Empresa;
  abaInterna: string;
  setAbaInterna: (aba: string) => void;
  onAbrirAjuste: (agente: AgenteAtivo, empresa: Empresa) => void;
  modoAdmin: boolean;
  onCriarTemplateVitrine: (dados: any) => void;
  conversaInicialId?: string;
  onAbrirWidgetEmbed?: (agente: AgenteAtivo, empresa: Empresa) => void;
  onAbrirCanalCliente?: (agente: AgenteAtivo) => void;
}

export const PainelDono: React.FC<PainelDonoProps> = ({
  agentes,
  empresa,
  abaInterna,
  setAbaInterna,
  onAbrirAjuste,
  modoAdmin,
  onCriarTemplateVitrine,
  conversaInicialId,
  onAbrirWidgetEmbed,
  onAbrirCanalCliente,
}) => {
  // Sub-abas do Painel do Dono
  // 'hitl' | 'conversas' | 'kpis' | 'agentes' | 'router' | 'equipe' | 'admin_vitrine'
  const [escalas, setEscalas] = useState<EscalaHumana[]>([]);
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [conversaAtiva, setConversaAtiva] = useState<Conversa | null>(null);
  const [routerLogs, setRouterLogs] = useState<RouterLog[]>([]);
  const [kpis, setKpis] = useState<any>(null);

  // Chat Interativo
  const [inputMsg, setInputMsg] = useState('');
  const [enviandoMsg, setEnviandoMsg] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // HITL Modal Responder
  const [modalDecisao, setModalDecisao] = useState<{ escala: EscalaHumana; tipo: 'APROVADO' | 'RECUSADO' } | null>(null);
  const [justificativaHumano, setJustificativaHumano] = useState('');

  // Formulário Admin Novo Agente Vitrine
  const [novoProfissaoId, setNovoProfissaoId] = useState('1');
  const [novoNome, setNovoNome] = useState('');
  const [novoSegmento, setNovoSegmento] = useState('');
  const [novoDescricao, setNovoDescricao] = useState('');
  const [novoPreco, setNovoPreco] = useState('197');
  const [novoDestaque, setNovoDestaque] = useState(false);

  // Carregar dados das APIs
  const carregarDados = async () => {
    try {
      const [resEscalas, resConversas, resLogs, resKpis] = await Promise.all([
        fetch('/api/decisoes').then((r) => r.json()),
        fetch('/api/conversas').then((r) => r.json()),
        fetch('/api/router/logs').then((r) => r.json()),
        fetch('/api/kpis').then((r) => r.json()),
      ]);

      if (Array.isArray(resEscalas)) setEscalas(resEscalas);
      if (Array.isArray(resConversas)) {
        setConversas(resConversas);
        if (!conversaAtiva && resConversas.length > 0) {
          if (conversaInicialId) {
            const achada = resConversas.find((c) => c.id === conversaInicialId);
            setConversaAtiva(achada || resConversas[0]);
          } else {
            setConversaAtiva(resConversas[0]);
          }
        }
      }
      if (Array.isArray(resLogs)) setRouterLogs(resLogs);
      if (resKpis) setKpis(resKpis);
    } catch (err) {
      console.error('Erro ao carregar dados do painel:', err);
    }
  };

  useEffect(() => {
    carregarDados();
    const interval = setInterval(carregarDados, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [conversaAtiva?.mensagens]);

  // Ação HITL Decidir
  const handleDecidirEscala = async (
    escalaId: string,
    decisao: 'APROVADO' | 'RECUSADO' | 'ASSUMIDO',
    resposta?: string
  ) => {
    try {
      const res = await fetch(`/api/decisoes/${escalaId}/decidir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisao, respostaHumano: resposta || justificativaHumano }),
      });
      const data = await res.json();
      if (data.sucesso) {
        setModalDecisao(null);
        setJustificativaHumano('');
        carregarDados();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Enviar Mensagem no Chat Interativo (Canal WhatsApp do Agente)
  const handleEnviarMensagemChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMsg.trim() || enviandoMsg || !conversaAtiva) return;

    const texto = inputMsg.trim();
    setInputMsg('');
    setEnviandoMsg(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agenteId: conversaAtiva.agenteId,
          conversaId: conversaAtiva.id,
          mensagem: texto,
          clienteNome: conversaAtiva.clienteNome,
        }),
      });
      const data = await res.json();
      if (data.sucesso && data.conversa) {
        setConversaAtiva(data.conversa);
        carregarDados();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEnviandoMsg(false);
    }
  };

  // Assumir ou Devolver conversa
  const handleToggleAssumirConversa = async () => {
    if (!conversaAtiva) return;
    try {
      const res = await fetch(`/api/conversas/${conversaAtiva.id}/assumir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assumir: !conversaAtiva.assumidoPorHumano }),
      });
      const data = await res.json();
      if (data.sucesso) {
        setConversaAtiva(data.conversa);
        carregarDados();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Pausar / Retomar agente
  const handleToggleStatusAgente = async (agente: AgenteAtivo) => {
    const novoStatus = agente.status === 'ATIVO' ? 'PAUSADO' : 'ATIVO';
    try {
      await fetch(`/api/meus-agentes/${agente.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus }),
      });
      carregarDados();
    } catch (err) {
      console.error(err);
    }
  };

  // Cadastrar Template de Agente (Admin)
  const handleSubmitNovoTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome || !novoPreco) return;
    onCriarTemplateVitrine({
      profissaoId: parseInt(novoProfissaoId, 10),
      nome: novoNome,
      segmento: novoSegmento || 'Geral',
      descricaoCurta: novoDescricao || 'Agente autônomo com cérebro AGI v5.0 Jobs Digital.',
      precoMensal: parseFloat(novoPreco),
      destaque: novoDestaque,
    });
    setNovoNome('');
    setNovoSegmento('');
    setNovoDescricao('');
    alert('Novo agente cadastrado com sucesso na Vitrine Pública!');
  };

  const pendentesHITL = escalas.filter((e) => e.decisao === 'PENDENTE');

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Top Header do Painel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-black text-white">
              Painel do Dono v1.0
            </span>
            <span className="text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 rounded-full">
              Centro de Comando
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Supervisão Human-in-the-Loop, conversas no canal WhatsApp, controle de alçadas e métricas.
          </p>
        </div>

        {/* Abas Superiores do Painel */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setAbaInterna('hitl')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              abaInterna === 'hitl'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Decisões HITL</span>
            {pendentesHITL.length > 0 && (
              <span className="px-1.5 py-0.2 bg-red-600 text-white rounded-full text-[10px]">
                {pendentesHITL.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setAbaInterna('conversas')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              abaInterna === 'conversas'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Conversas & Teste</span>
          </button>

          <button
            onClick={() => setAbaInterna('kpis')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              abaInterna === 'kpis'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Resultados</span>
          </button>

          <button
            onClick={() => setAbaInterna('agentes')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              abaInterna === 'agentes'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Meus Agentes ({agentes.length})</span>
          </button>

          <button
            onClick={() => setAbaInterna('router')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              abaInterna === 'router'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Router & Custos</span>
          </button>

          <button
            onClick={() => setAbaInterna('equipe')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              abaInterna === 'equipe'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Equipe & Termos</span>
          </button>

          {modoAdmin && (
            <button
              onClick={() => setAbaInterna('admin_vitrine')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                abaInterna === 'admin_vitrine'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-purple-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Admin Vitrine</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= ABA 1: CAIXA DE DECISÕES (HITL) ================= */}
      {abaInterna === 'hitl' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                Caixa de Decisões Human-in-the-Loop (Regra 36 v5.0)
              </h2>
              <p className="text-xs text-slate-400">
                Toda solicitação que ultrapassa alçadas ou envolve incidentes críticos chega aqui para sua decisão imediata.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-300 bg-slate-800 px-3 py-1 rounded-full">
              {pendentesHITL.length} pendentes
            </span>
          </div>

          {escalas.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/60 rounded-3xl border border-slate-800 p-8 space-y-2">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-white">Nenhuma decisão pendente no momento</h3>
              <p className="text-xs text-slate-400">
                Seus agentes estão operando de forma 100% autônoma dentro dos limites de alçada definidos.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {escalas.map((escala) => {
                const isPendente = escala.decisao === 'PENDENTE';
                const prioridadeColor =
                  escala.prioridade === 'URGENTE'
                    ? 'border-red-500/50 bg-red-500/5'
                    : escala.prioridade === 'ALCADA'
                    ? 'border-amber-500/50 bg-amber-500/5'
                    : 'border-blue-500/50 bg-blue-500/5';

                return (
                  <div
                    key={escala.id}
                    className={`rounded-2xl border p-5 space-y-4 transition-all bg-slate-900/90 ${prioridadeColor}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wide ${
                              escala.prioridade === 'URGENTE'
                                ? 'bg-red-500 text-white'
                                : escala.prioridade === 'ALCADA'
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-blue-500 text-white'
                            }`}
                          >
                            {escala.prioridade}
                          </span>
                          <span className="text-xs font-bold text-slate-300">
                            {escala.agenteNome}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white">
                          Cliente: {escala.clienteNome}
                        </h4>
                      </div>

                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-lg ${
                          isPendente
                            ? 'bg-amber-500/20 text-amber-300'
                            : escala.decisao === 'APROVADO'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : escala.decisao === 'RECUSADO'
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-purple-500/20 text-purple-300'
                        }`}
                      >
                        {escala.decisao}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <span className="font-bold text-slate-400 block mb-0.5">Motivo da Escala:</span>
                        <p className="text-slate-200">{escala.motivo}</p>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <span className="font-bold text-slate-400 block mb-0.5">Contexto da Conversa:</span>
                        <p className="text-slate-300 italic">{escala.contexto}</p>
                      </div>

                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <span className="font-bold text-orange-400 block mb-0.5">Ação Recomendada pelo Agente:</span>
                        <p className="text-slate-200">{escala.acaoRecomendada}</p>
                      </div>

                      {escala.respostaHumano && (
                        <div className="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/30 text-emerald-200">
                          <strong>Decisão do Dono:</strong> {escala.respostaHumano}
                        </div>
                      )}
                    </div>

                    {/* Botões de Ação HITL */}
                    {isPendente && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-xs font-bold">
                        <button
                          onClick={() => setModalDecisao({ escala, tipo: 'APROVADO' })}
                          className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1 transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Aprovar</span>
                        </button>

                        <button
                          onClick={() => setModalDecisao({ escala, tipo: 'RECUSADO' })}
                          className="py-2 px-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-1 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Recusar</span>
                        </button>

                        <button
                          onClick={() => {
                            setAbaInterna('conversas');
                          }}
                          className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center gap-1 border border-slate-700 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Ver Chat</span>
                        </button>

                        <button
                          onClick={() => handleDecidirEscala(escala.id, 'ASSUMIDO')}
                          className="py-2 px-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-1 transition-colors"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>Assumir</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= ABA 2: CONVERSAS & TESTE INTERATIVO ================= */}
      {abaInterna === 'conversas' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[72vh]">
          {/* Coluna 1: Lista de Conversas / Canais */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 flex flex-col space-y-3 overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-orange-400" />
                <span>Canais & Conversas</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                {conversas.length} ativas
              </span>
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {conversas.map((c) => {
                const isSelected = conversaAtiva?.id === c.id;
                const ultMsg = c.mensagens[c.mensagens.length - 1];
                return (
                  <div
                    key={c.id}
                    onClick={() => setConversaAtiva(c)}
                    className={`p-3 rounded-2xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-slate-800 border-orange-500/50 shadow-md'
                        : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate max-w-[140px]">
                        {c.clienteNome}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          c.assumidoPorHumano
                            ? 'bg-purple-500/20 text-purple-300'
                            : c.estadoAtual === 'AGUARDANDO_HUMANO'
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {c.assumidoPorHumano ? 'HUMANO' : c.estadoAtual}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-1">
                      {ultMsg ? ultMsg.texto : 'Nova conversa iniciada'}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2 font-mono">
                      <span>WhatsApp Oficial</span>
                      <span>•</span>
                      <span>{new Date(c.atualizadoEm).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coluna 2 & 3: Simulador do WhatsApp Oficial & Chat ao Vivo */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col justify-between overflow-hidden shadow-2xl">
            {conversaAtiva ? (
              <>
                {/* Header do Chat */}
                <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                      WA
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">
                          {conversaAtiva.clienteNome}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {conversaAtiva.clienteContato}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          WhatsApp Conectado
                        </span>
                        <span>•</span>
                        <span className="text-[11px] font-mono text-orange-400 font-semibold">
                          Estado: {conversaAtiva.estadoAtual}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botão Assumir / Devolver */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleToggleAssumirConversa}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                        conversaAtiva.assumidoPorHumano
                          ? 'bg-purple-600 text-white border-purple-500'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                      }`}
                    >
                      {conversaAtiva.assumidoPorHumano ? (
                        <>
                          <Bot className="w-3.5 h-3.5" />
                          <span>Devolver ao Agente</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-orange-400" />
                          <span>Assumir Conversa</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Área de Mensagens */}
                <div
                  ref={chatScrollRef}
                  className="flex-1 p-4 overflow-y-auto space-y-3 bg-gradient-to-b from-slate-950/80 to-slate-900"
                >
                  {conversaAtiva.mensagens.map((msg) => {
                    const isAgente = msg.remetente === 'agente';
                    const isHumano = msg.remetente === 'humano';
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          isAgente
                            ? 'items-start'
                            : isHumano
                            ? 'items-end'
                            : 'items-end'
                        }`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-md ${
                            isAgente
                              ? 'bg-slate-800 text-slate-100 rounded-tl-sm border border-slate-700/60'
                              : isHumano
                              ? 'bg-purple-700 text-white rounded-tr-sm'
                              : 'bg-emerald-700 text-white rounded-tr-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 text-[10px] font-bold opacity-75 mb-1">
                            <span className="flex items-center gap-1.5">
                              {isAgente && (
                                <img
                                  src={agentes.find((a) => a.id === conversaAtiva.agenteId)?.fotoAvatar || '/avatars/vendas.jpg'}
                                  alt="Agente"
                                  className="w-4 h-4 rounded-full object-cover inline-block"
                                  referrerPolicy="no-referrer"
                                />
                              )}
                              <span>
                                {isAgente
                                  ? (agentes.find((a) => a.id === conversaAtiva.agenteId)?.nomePersonalizado || 'Agente Autônomo')
                                  : isHumano
                                  ? 'Você (Dono)'
                                  : 'Cliente'}
                              </span>
                            </span>
                            <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="whitespace-pre-wrap">{msg.texto}</p>

                          {/* Metadados Operacionais do Cérebro v5.0 */}
                          {isAgente && (msg.estadoInterno || msg.nivelRouter || msg.ferramentaAcionada) && (
                            <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex flex-wrap items-center gap-1.5 text-[10px]">
                              {msg.estadoInterno && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-900 text-orange-400 font-mono font-bold">
                                  {msg.estadoInterno}
                                </span>
                              )}
                              {msg.nivelRouter && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-900 text-amber-400 font-mono font-bold">
                                  Router: {msg.nivelRouter}
                                </span>
                              )}
                              {msg.ferramentaAcionada && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-900 text-emerald-400 font-mono">
                                  🔧 {msg.ferramentaAcionada}
                                </span>
                              )}
                              {msg.escalaGeradaId && (
                                <span className="px-1.5 py-0.5 rounded bg-red-950 text-red-300 font-bold border border-red-500/40">
                                  ⚠️ HITL Criado
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {enviandoMsg && (
                    <div className="flex items-center gap-2 text-xs text-slate-400 italic py-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
                      <span>Agente processando com Cérebro v5.0 na nuvem...</span>
                    </div>
                  )}
                </div>

                {/* Input de Mensagem */}
                <form
                  onSubmit={handleEnviarMensagemChat}
                  className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder={
                      conversaAtiva.assumidoPorHumano
                        ? 'Você assumiu este atendimento. Digite como dono...'
                        : 'Simular mensagem do cliente (ex: Me dá 20% de desconto no Pix?)...'
                    }
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="submit"
                    disabled={enviandoMsg || !inputMsg.trim()}
                    className="p-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold transition-transform hover:scale-105 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="py-24 text-center text-slate-400 space-y-2">
                <MessageSquare className="w-10 h-10 mx-auto opacity-30" />
                <p className="text-sm font-semibold">Nenhuma conversa selecionada</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= ABA 3: RESULTADOS & KPIS ================= */}
      {abaInterna === 'kpis' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-400 block">Vendas Totais do Mês</span>
              <div className="text-2xl font-black text-emerald-400">
                R$ {(kpis?.vendasTotaisMesReais || 4280).toFixed(2)}
              </div>
              <span className="text-[10px] text-emerald-400/80 font-medium flex items-center gap-1">
                <ThumbsUp className="w-3 h-3" />
                100% verificado via Pix
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-400 block">Tempo 1ª Resposta</span>
              <div className="text-2xl font-black text-amber-400">
                {kpis?.tempoMedioPrimeiraRespostaSeg || 1.8}s
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                SLA instantâneo no WhatsApp
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-400 block">Resolução no 1º Contato</span>
              <div className="text-2xl font-black text-purple-400">
                {kpis?.resolucaoPrimeiroContatoPct || 88.4}%
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                Alta assertividade com catálogo
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-400 block">Satisfação ⭐</span>
              <div className="text-2xl font-black text-orange-400">
                {kpis?.satisfacaoMediaEstrelas || 4.9} / 5.0
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                Avaliação de atendimento
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="font-bold text-white text-sm">Comercial (Vendas & Prospecção)</h4>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span>Conversas Atendidas</span>
                  <strong className="text-white">128</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span>Oportunidades Quentes</span>
                  <strong className="text-emerald-400">42</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span>Ticket Médio</span>
                  <strong className="text-white">R$ 380,00</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span>Taxa de Conversão</span>
                  <strong className="text-emerald-400">32.8%</strong>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="font-bold text-white text-sm">Atendimento (WhatsApp & SAC)</h4>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span>Demandas Resolvidas</span>
                  <strong className="text-white">214</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span>Escalados ao Humano (HITL)</span>
                  <strong className="text-amber-400">6 (2.8%)</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span>Reincidência de Dúvidas</span>
                  <strong className="text-emerald-400">1.2%</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span>Opt-outs Registrados</span>
                  <strong className="text-slate-400">0</strong>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <h4 className="font-bold text-white text-sm">Operação & Segurança (⚙️ Travas v5.0)</h4>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span>Travas de Alçada Acionadas</span>
                  <strong className="text-amber-400">14</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span>Tentativas de Alucinação Barradas</span>
                  <strong className="text-emerald-400">100%</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span>Disponibilidade da Nuvem</span>
                  <strong className="text-emerald-400">99.98%</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span>Auditoria de Decisões</span>
                  <strong className="text-white">Auditável</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= ABA 4: MEUS AGENTES ================= */}
      {abaInterna === 'agentes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                <Bot className="w-5 h-5 text-orange-400" />
                Agentes Contratados na Nuvem
              </h2>
              <p className="text-xs text-slate-400">
                Gerencie status, volume e ajuste catálogo ou regras de alçada com hot-reload imediato.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agentes.map((agente) => (
              <div
                key={agente.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg hover:border-slate-700 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-orange-500/50 shadow-lg shrink-0 bg-slate-800">
                      <img
                        src={agente.fotoAvatar || agente.profissao?.fotoAvatar || '/avatars/vendas.jpg'}
                        alt={agente.nomePersonalizado}
                        className="w-full h-full object-cover object-center"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-orange-400 bg-orange-500/10 px-2.5 py-0.5 rounded-full">
                          {agente.profissao?.nome}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            agente.status === 'ATIVO'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {agente.status === 'ATIVO' ? '🟢 ATIVO' : '⏸️ PAUSADO'}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white">
                        {agente.nomePersonalizado}
                      </h3>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-300">
                      R$ {agente.planoPrecoMensal.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">/mês (Pix)</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Conversas Hoje</span>
                    <strong className="text-white text-base">
                      {agente.volumeHoje.conversas}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Escalas HITL</span>
                    <strong className="text-amber-400 text-base">
                      {agente.volumeHoje.escalasHumanas}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Tarefas</span>
                    <strong className="text-emerald-400 text-base">
                      {agente.volumeHoje.tarefasConcluidas}
                    </strong>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatusAgente(agente)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-1.5 transition-colors"
                    >
                      {agente.status === 'ATIVO' ? (
                        <>
                          <Pause className="w-3.5 h-3.5 text-amber-400" />
                          <span>Pausar</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Retomar</span>
                        </>
                      )}
                    </button>

                    {onAbrirWidgetEmbed && (
                      <button
                        onClick={() => onAbrirWidgetEmbed(agente, agente.empresa || empresa)}
                        title="Ver link público e canais onde o agente atende"
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-1.5 border border-slate-700 transition-colors"
                      >
                        <span>🔗 Onde Atende</span>
                      </button>
                    )}

                    {onAbrirCanalCliente && (
                      <button
                        onClick={() => onAbrirCanalCliente(agente)}
                        title="Testar como cliente final no canal do escritório"
                        className="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white font-bold flex items-center gap-1.5 border border-emerald-500/40 transition-colors"
                      >
                        <span>💬 Ver como Cliente</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => onAbrirAjuste(agente, agente.empresa || empresa)}
                    className="px-4 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-orange-600/30"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>⚙️ Ajustar Regras & Catálogo</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= ABA 5: ROUTER & CUSTOS ================= */}
      {abaInterna === 'router' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  Router Inteligente — Níveis de Inteligência Dinâmicos
                </h3>
                <p className="text-xs text-slate-400">
                  O Router escolhe o recurso ideal para produzir o menor custo real por tarefa concluída com sucesso.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                Otimização Ativa
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-1">
                <span className="font-black text-emerald-400 block text-sm">🟢 LUNA (Nível 1)</span>
                <p className="text-slate-400 text-[11px]">Saudações, triagens iniciais e confirmações simples.</p>
                <span className="text-[10px] text-slate-500 block pt-1">Custo: ~R$ 0,0004 / req</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-1">
                <span className="font-black text-amber-400 block text-sm">🟡 TERRA (Nível 2)</span>
                <p className="text-slate-400 text-[11px]">Busca em catálogo, recomendações e dúvidas de produtos.</p>
                <span className="text-[10px] text-slate-500 block pt-1">Custo: ~R$ 0,0008 / req</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-orange-500/30 space-y-1">
                <span className="font-black text-orange-400 block text-sm">🟠 SOL (Nível 3)</span>
                <p className="text-slate-400 text-[11px]">Negociação de fechamento, cálculo de Pix e diagnósticos técnicos.</p>
                <span className="text-[10px] text-slate-500 block pt-1">Custo: ~R$ 0,0018 / req</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-red-500/30 space-y-1">
                <span className="font-black text-red-400 block text-sm">🔴 ASTRA (Nível 4)</span>
                <p className="text-slate-400 text-[11px]">Raciocínio profundo, travas de alçada, disputas e HITL.</p>
                <span className="text-[10px] text-slate-500 block pt-1">Custo: ~R$ 0,0035 / req</span>
              </div>
            </div>
          </div>

          {/* Logs Recentes de Roteamento */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Logs de Execução do Router
            </h4>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-800 text-xs">
                {routerLogs.length === 0 ? (
                  <div className="p-4 text-center text-slate-500">Nenhum log registrado ainda.</div>
                ) : (
                  routerLogs.map((log) => (
                    <div key={log.id} className="p-3 flex items-center justify-between gap-4 font-mono">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.nivelEscolhido === 'ASTRA'
                              ? 'bg-red-500/20 text-red-300'
                              : log.nivelEscolhido === 'SOL'
                              ? 'bg-orange-500/20 text-orange-300'
                              : log.nivelEscolhido === 'TERRA'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {log.nivelEscolhido}
                        </span>
                        <span className="text-slate-300 truncate max-w-xs">{log.tarefa}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                        <span>{log.tempoMs}ms</span>
                        <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= ABA 6: EQUIPE & TERMOS DE CONTRATO ================= */}
      {abaInterna === 'equipe' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-400" />
                Membros da Empresa
              </h3>
              <button
                onClick={() => alert('Convite enviado por e-mail com sucesso!')}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center gap-1 border border-slate-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Convidar</span>
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Administrador (Dono)</div>
                  <div className="text-slate-400 text-[11px]">ffuturemindfuturemind@gmail.com</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 font-bold text-[10px]">
                  DONO_TOTAL
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Supervisor de Atendimento</div>
                  <div className="text-slate-400 text-[11px]">supervisao@futuremind.com.br</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold text-[10px]">
                  SUPERVISOR
                </span>
              </div>
            </div>
          </div>

          {/* Contrato Assinado */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              Contrato Digital & SLA Jobs Digital
            </h3>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-2 text-slate-300 font-mono">
              <div><strong>Contratante:</strong> {empresa.nomeFantasia} ({empresa.razaoSocial})</div>
              <div><strong>CNPJ/CPF:</strong> {empresa.cnpjOuCpf}</div>
              <div><strong>Data de Assinatura:</strong> {new Date().toLocaleDateString('pt-BR')}</div>
              <div><strong>Chave de Autenticação:</strong> JD-AGI-v50-{Date.now().toString(16).toUpperCase()}</div>
              <div><strong>Status:</strong> <span className="text-emerald-400 font-bold">VIGENTE & ATIVO</span></div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              O contrato estabelece o isolamento absoluto dos dados de atendimento da sua empresa, garantindo privacidade, integridade e supervisão humana permanente.
            </p>
          </div>
        </div>
      )}

      {/* ================= ABA 7: ADMIN VITRINE (JOBS DIGITAL PLATFORM) ================= */}
      {abaInterna === 'admin_vitrine' && (
        <div className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 space-y-6">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-purple-400 bg-purple-500/20 border border-purple-500/40 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Painel Admin da Plataforma Jobs Digital
            </span>
            <h3 className="text-xl font-black text-white">
              Cadastrar Novo Agente na Vitrine Pública
            </h3>
            <p className="text-xs text-slate-400">
              Somente o perfil ADMIN publica novos modelos para contratação na tela inicial.
            </p>
          </div>

          <form onSubmit={handleSubmitNovoTemplate} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  Profissão Cérebro v5.0 *
                </label>
                <select
                  value={novoProfissaoId}
                  onChange={(e) => setNovoProfissaoId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="1">1. Agente de Atendimento</option>
                  <option value="2">2. Agente de WhatsApp</option>
                  <option value="3">3. Agente de Vendas</option>
                  <option value="4">4. Agente de Prospecção</option>
                  <option value="5">5. Agente de Marketing</option>
                  <option value="6">6. Agente de RH / Recrutamento</option>
                  <option value="7">7. Agente Financeiro</option>
                  <option value="8">8. Agente de Dados e BI</option>
                  <option value="9">9. Agente Operacional</option>
                  <option value="10">10. Agente de Suporte Técnico</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  Nome Comercial do Modelo *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Closer B2B Enterprise"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  Segmento Foco
                </label>
                <input
                  type="text"
                  placeholder="Ex: Restaurantes, Saúde, Construtoras"
                  value={novoSegmento}
                  onChange={(e) => setNovoSegmento(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">
                  Preço da Assinatura Mensal (R$) *
                </label>
                <input
                  type="number"
                  placeholder="297.00"
                  value={novoPreco}
                  onChange={(e) => setNovoPreco(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300 block mb-1">
                Descrição Curta dos Recursos
              </label>
              <textarea
                rows={2}
                placeholder="Diferenciais e capacidades deste agente na operação..."
                value={novoDescricao}
                onChange={(e) => setNovoDescricao(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="destaqueCheck"
                checked={novoDestaque}
                onChange={(e) => setNovoDestaque(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded bg-slate-950 border-slate-700"
              />
              <label htmlFor="destaqueCheck" className="text-slate-300 font-bold cursor-pointer">
                Marcar como Selo DESTAQUE ⭐ na Vitrine
              </label>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-all shadow-lg shadow-purple-600/30"
            >
              Publicar Agente na Vitrine
            </button>
          </form>
        </div>
      )}

      {/* Modal de Confirmação de Decisão HITL */}
      {modalDecisao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-white">
              {modalDecisao.tipo === 'APROVADO' ? '✅ Aprovar Escala Humana' : '❌ Recusar Solicitação'}
            </h3>
            <p className="text-xs text-slate-300">
              {modalDecisao.escala.motivo}
            </p>
            <div>
              <label className="text-xs text-slate-400 block mb-1">
                Mensagem ou Instrução para o Agente e Cliente (opcional):
              </label>
              <textarea
                rows={3}
                placeholder="Ex: Condição de 12% autorizada em caráter especial para pagamento hoje."
                value={justificativaHumano}
                onChange={(e) => setJustificativaHumano(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
              />
            </div>
            <div className="flex justify-end gap-2 text-xs font-bold">
              <button
                onClick={() => setModalDecisao(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDecidirEscala(modalDecisao.escala.id, modalDecisao.tipo)}
                className={`px-5 py-2 rounded-xl text-white ${
                  modalDecisao.tipo === 'APROVADO' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                Confirmar Decisão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
