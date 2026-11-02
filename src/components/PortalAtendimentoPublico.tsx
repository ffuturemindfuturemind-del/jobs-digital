import React, { useState, useEffect, useRef } from 'react';
import { AgenteAtivo, Empresa, MensagemChat } from '../types';
import {
  Send,
  Bot,
  MessageCircle,
  Building2,
  Clock,
  Shield,
  Phone,
  Share2,
  QrCode,
  Check,
  Sparkles,
  Loader2,
  ArrowLeft,
  Gift,
  Zap,
  Lock,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

interface PortalAtendimentoPublicoProps {
  agente: AgenteAtivo;
  empresa: Empresa;
  onVoltarPainel: () => void;
  onAssinarMensal?: (agente: AgenteAtivo) => void;
  onAtualizarAgente?: (agente: AgenteAtivo) => void;
}

export const PortalAtendimentoPublico: React.FC<PortalAtendimentoPublicoProps> = ({
  agente,
  empresa,
  onVoltarPainel,
  onAssinarMensal,
  onAtualizarAgente,
}) => {
  const [mensagens, setMensagens] = useState<MensagemChat[]>([
    {
      id: 'msg-pub-0',
      remetente: 'agente',
      texto: `Olá! 👋 Sou o ${agente.nomePersonalizado}, assistente oficial do escritório ${empresa.nomeFantasia}. Como posso te ajudar hoje?`,
      timestamp: new Date().toISOString(),
      estadoInterno: 'ACOLHIMENTO',
      nivelRouter: 'LUNA',
    },
  ]);
  const [inputTexto, setInputTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [copiadoLink, setCopiadoLink] = useState(false);
  const [mostrarQrCode, setMostrarQrCode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Controle de Teste Gratuito de 5 Horas
  const [tempoRestanteSeg, setTempoRestanteSeg] = useState<number>(() => {
    if (agente.testeGratuito?.ativo && !agente.testeGratuito.expirado) {
      const diff = Math.floor((new Date(agente.testeGratuito.expiraEm).getTime() - Date.now()) / 1000);
      return diff > 0 ? diff : 0;
    }
    return 0;
  });
  const [testeExpirado, setTesteExpirado] = useState<boolean>(() => {
    if (!agente.testeGratuito?.ativo) return false;
    if (agente.testeGratuito.expirado) return true;
    const diff = Math.floor((new Date(agente.testeGratuito.expiraEm).getTime() - Date.now()) / 1000);
    return diff <= 0;
  });

  useEffect(() => {
    if (!agente.testeGratuito?.ativo || testeExpirado) return;

    const interval = setInterval(() => {
      const diff = Math.floor((new Date(agente.testeGratuito!.expiraEm).getTime() - Date.now()) / 1000);
      if (diff <= 0) {
        setTempoRestanteSeg(0);
        setTesteExpirado(true);
        clearInterval(interval);
      } else {
        setTempoRestanteSeg(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [agente.testeGratuito, testeExpirado]);

  const formatarTempo = (totalSeg: number) => {
    const h = Math.floor(totalSeg / 3600);
    const m = Math.floor((totalSeg % 3600) / 60);
    const s = totalSeg % 60;
    return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  };

  const handleSimularExpiracao = async () => {
    try {
      const res = await fetch(`/api/agentes/${agente.id}/expirar-teste-simulado`, { method: 'POST' });
      const data = await res.json();
      if (data.agente) {
        setTesteExpirado(true);
        setTempoRestanteSeg(0);
        onAtualizarAgente?.(data.agente);
      }
    } catch (e) {
      setTesteExpirado(true);
      setTempoRestanteSeg(0);
    }
  };

  const handleRenovarTeste = async () => {
    try {
      const res = await fetch(`/api/agentes/${agente.id}/renovar-teste-simulado`, { method: 'POST' });
      const data = await res.json();
      if (data.agente) {
        setTesteExpirado(false);
        setTempoRestanteSeg(5 * 3600);
        onAtualizarAgente?.(data.agente);
      }
    } catch (e) {
      setTesteExpirado(false);
      setTempoRestanteSeg(5 * 3600);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensagens]);

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputTexto.trim() || enviando || testeExpirado) return;

    const texto = inputTexto.trim();
    setInputTexto('');
    setEnviando(true);

    const msgCliente: MensagemChat = {
      id: `msg-${Date.now()}`,
      remetente: 'cliente',
      texto,
      timestamp: new Date().toISOString(),
    };
    setMensagens((prev) => [...prev, msgCliente]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agenteId: agente.id,
          conversaId: `conv-pub-${agente.id}`,
          mensagem: texto,
          clienteNome: 'Cliente do Escritório',
        }),
      });
      const data = await res.json();

      if (data.testeExpirado) {
        setTesteExpirado(true);
        setTempoRestanteSeg(0);
      }

      if (data.sucesso && data.mensagem) {
        setMensagens((prev) => [...prev, data.mensagem]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEnviando(false);
    }
  };

  const linkPublicoCompleto = `${window.location.origin}/atendimento/${agente.id}`;

  const copiarLink = () => {
    navigator.clipboard.writeText(linkPublicoCompleto);
    setCopiadoLink(true);
    setTimeout(() => setCopiadoLink(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-12">
      {/* Barra de Notificação de Teste Gratuito de 5 Horas */}
      {agente.testeGratuito?.ativo && (
        <div
          className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
            testeExpirado
              ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
              : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  testeExpirado ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}
              >
                {testeExpirado ? <Clock className="w-5 h-5 animate-bounce" /> : <Gift className="w-5 h-5" />}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black tracking-wider uppercase text-white">
                    {testeExpirado ? 'Teste de 5h Finalizado' : 'Período de Degustação Ativo (5 Horas)'}
                  </span>
                  {!testeExpirado && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                      ⏱️ {formatarTempo(tempoRestanteSeg)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {testeExpirado
                    ? 'O período de 5 horas gratuitas encerrou. Assine o plano mensal para continuar o atendimento sem parar!'
                    : `Seus clientes podem conversar em tempo real. Restam ${formatarTempo(tempoRestanteSeg)} para você testar tudo.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onAssinarMensal && (
                <button
                  type="button"
                  onClick={() => onAssinarMensal(agente)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg shadow-orange-600/30 transition-all hover:scale-105 active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Assinar R$ {agente.planoPrecoMensal.toFixed(2)}/mês Pix</span>
                </button>
              )}

              {/* Controles para teste rápido de demonstração */}
              {testeExpirado ? (
                <button
                  type="button"
                  onClick={handleRenovarTeste}
                  title="Reiniciar mais 5h de teste para demonstração"
                  className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 border border-slate-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Renovar 5h</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSimularExpiracao}
                  title="Simular fim das 5 horas agora para ver como funciona"
                  className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-700"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Simular Fim</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Barra de Voltar ao Painel do Dono */}
      <div className="flex items-center justify-between">
        <button
          onClick={onVoltarPainel}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Painel do Dono</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={copiarLink}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            {copiadoLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiadoLink ? 'Link Copiado!' : 'Copiar Link do Escritório'}</span>
          </button>

          <button
            onClick={() => setMostrarQrCode(!mostrarQrCode)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Code</span>
          </button>
        </div>
      </div>

      {/* Modal QR Code */}
      {mostrarQrCode && (
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2 text-xs">
          <div className="font-bold text-white">QR Code de Atendimento do Escritório</div>
          <p className="text-slate-400 text-[11px]">
            Imprima ou envie este QR Code para seus clientes escanearem e conversarem direto com seu agente no celular!
          </p>
          <div className="p-3 bg-white rounded-xl inline-block shadow-lg">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                linkPublicoCompleto
              )}`}
              alt="QR Code Atendimento"
              className="w-36 h-36"
            />
          </div>
          <div className="text-[11px] text-orange-400 font-mono truncate max-w-md mx-auto">
            {linkPublicoCompleto}
          </div>
        </div>
      )}

      {/* Card Principal: Simulador do Portal de Atendimento do Escritório */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl flex flex-col h-[75vh]">
        {/* Header do Escritório */}
        <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-orange-500/50 shadow-lg shadow-orange-600/30 shrink-0 bg-slate-800">
              <img
                src={agente.fotoAvatar || '/avatars/vendas.jpg'}
                alt={agente.nomePersonalizado}
                className="w-full h-full object-cover object-center"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base text-white tracking-tight">
                  {empresa.nomeFantasia}
                </span>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                    testeExpirado
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      testeExpirado ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'
                    }`}
                  />
                  {testeExpirado ? 'Teste Expirado' : 'Online 24/7'}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <span>{agente.nomePersonalizado}</span>
                <span>•</span>
                <span className="text-emerald-400 font-mono">WhatsApp: {empresa.canais.whatsapp}</span>
              </p>
            </div>
          </div>

          {/* Botão de WhatsApp Direto */}
          {empresa.canais?.whatsapp && (
            <a
              href={`https://wa.me/${empresa.canais.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-transform hover:scale-105"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>Abrir WhatsApp</span>
            </a>
          )}
        </div>

        {/* Mensagens do Chat */}
        <div
          ref={scrollRef}
          className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3 bg-gradient-to-b from-slate-950 via-slate-900/90 to-slate-950"
        >
          {mensagens.map((msg) => {
            const isAgente = msg.remetente === 'agente';
            const isExpiradoMsg = msg.estadoInterno === 'TESTE_EXPIRADO';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isAgente ? 'items-start' : 'items-end'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-lg ${
                    isExpiradoMsg
                      ? 'bg-amber-950/80 text-amber-100 border border-amber-500/60 rounded-tl-sm'
                      : isAgente
                      ? 'bg-slate-800 text-slate-100 rounded-tl-sm border border-slate-700/60'
                      : 'bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-tr-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[10px] font-bold opacity-75 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      {isAgente ? (
                        <>
                          <img
                            src={agente.fotoAvatar || '/avatars/vendas.jpg'}
                            alt="Agente"
                            className="w-4 h-4 rounded-full object-cover inline-block"
                            referrerPolicy="no-referrer"
                          />
                          <span>{agente.nomePersonalizado}</span>
                        </>
                      ) : (
                        <span>Você (Cliente)</span>
                      )}
                    </span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{msg.texto}</p>

                  {isAgente && msg.escalaGeradaId && (
                    <div className="mt-2.5 pt-2 border-t border-slate-700 text-[10px] font-semibold text-amber-300 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      <span>Encaminhado para validação com o dono do escritório (HITL).</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {enviando && (
            <div className="flex items-center gap-2 text-xs text-slate-400 italic py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
              <span>{agente.nomePersonalizado} está digitando...</span>
            </div>
          )}
        </div>

        {/* Input ou Tela de Bloqueio pós-teste de 5 Horas */}
        {testeExpirado ? (
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-amber-950/30 to-slate-950 border-t border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white">
                  Período de Teste Gratuito de 5 Horas Concluído!
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  Gostou da velocidade de resposta? Assine o plano mensal por apenas{' '}
                  <span className="text-amber-400 font-bold">R$ {agente.planoPrecoMensal.toFixed(2)}/mês</span> no Pix
                  para manter seu agente ativo 24h por dia.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
              {onAssinarMensal && (
                <button
                  type="button"
                  onClick={() => onAssinarMensal(agente)}
                  className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xl shadow-orange-600/40 transition-transform hover:scale-105"
                >
                  <Zap className="w-4 h-4 fill-current" />
                  <span>ASSINAR PLANO MENSAL NO PIX</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleRenovarTeste}
                title="Reiniciar mais 5h de teste para demonstração"
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 border border-slate-700"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleEnviar}
            className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Digite sua dúvida, peça orçamento ou fale sobre um produto..."
              value={inputTexto}
              onChange={(e) => setInputTexto(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />
            <button
              type="submit"
              disabled={enviando || !inputTexto.trim()}
              className="px-5 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-orange-600/30 transition-transform hover:scale-105 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Enviar</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
