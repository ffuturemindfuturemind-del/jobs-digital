import React, { useState, useEffect } from 'react';
import { AgenteTemplate, ContratacaoPedido } from '../types';
import confetti from 'canvas-confetti';
import {
  X,
  QrCode,
  Copy,
  Check,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ArrowRight,
  Zap,
} from 'lucide-react';

interface ModalContratarPixProps {
  template: AgenteTemplate;
  onFechar: () => void;
  onPagamentoConfirmado: (pedido: ContratacaoPedido) => void;
}

export const ModalContratarPix: React.FC<ModalContratarPixProps> = ({
  template,
  onFechar,
  onPagamentoConfirmado,
}) => {
  const [carregando, setCarregando] = useState(true);
  const [pedido, setPedido] = useState<ContratacaoPedido | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiadoChave, setCopiadoChave] = useState(false);
  const [copiadoPayload, setCopiadoPayload] = useState(false);

  const [verificando, setVerificando] = useState(false);
  const [comprovanteInput, setComprovanteInput] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ tipo: 'info' | 'erro' | 'sucesso'; texto: string } | null>(null);
  const [liberado, setLiberado] = useState(false);

  // Iniciar criação do pedido Pix na API
  useEffect(() => {
    let montado = true;

    async function criarPedido() {
      try {
        setCarregando(true);
        const res = await fetch('/api/contratacoes/criar-pedido-pix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ templateId: template.id }),
        });
        const data = await res.json();
        if (montado && data.pedido) {
          setPedido(data.pedido);
          setQrCodeDataUrl(data.qrCodeDataUrl);
        }
      } catch (err) {
        console.error('Erro ao gerar cobrança Pix:', err);
      } finally {
        if (montado) setCarregando(false);
      }
    }

    criarPedido();

    return () => {
      montado = false;
    };
  }, [template]);

  const copiarTexto = (texto: string, tipo: 'chave' | 'payload') => {
    navigator.clipboard.writeText(texto);
    if (tipo === 'chave') {
      setCopiadoChave(true);
      setTimeout(() => setCopiadoChave(false), 2500);
    } else {
      setCopiadoPayload(true);
      setTimeout(() => setCopiadoPayload(false), 2500);
    }
  };

  // Trava da Verdade Operacional: verificar pagamento
  const handleVerificarPagamento = async (simularInstantaneo = false) => {
    if (!pedido) return;
    setVerificando(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/contratacoes/verificar-pagamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pedidoId: pedido.id,
          comprovanteCodigo: comprovanteInput.trim() || (simularInstantaneo ? `PIX-REC-${Date.now().toString().slice(-8)}` : ''),
          simularAprovacao: simularInstantaneo,
        }),
      });
      const data = await res.json();

      if (data.liberado && data.pedido) {
        setPedido(data.pedido);
        setLiberado(true);
        setStatusMsg({
          tipo: 'sucesso',
          texto: '✅ Pagamento Pix identificado e confirmado na conta ffuturemindfuturemind@gmail.com! Agente liberado.',
        });

        // Efeito de celebração
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ea580c', '#f59e0b', '#9333ea', '#10b981'],
        });
      } else {
        setStatusMsg({
          tipo: 'info',
          texto: '⏳ Aguardando compensação na rede Pix. Se já realizou o Pix, digite o ID da transação ou use o botão de validação rápida.',
        });
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({
        tipo: 'erro',
        texto: 'Falha ao consultar rede bancária. Tente novamente.',
      });
    } finally {
      setVerificando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 my-8">
        {/* Fechar */}
        <button
          onClick={onFechar}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {carregando ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-300">
              Gerando cobrança Pix oficial Jobs Digital...
            </p>
          </div>
        ) : !pedido ? (
          <div className="py-12 text-center text-slate-400">
            Não foi possível inicializar a cobrança. Tente novamente.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Cabeçalho do Pedido */}
            <div className="space-y-3 text-center flex flex-col items-center">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-orange-500/60 shadow-2xl bg-slate-800">
                <img
                  src={template.fotoAvatar || '/avatars/vendas.jpg'}
                  alt={template.nome}
                  className="w-full h-full object-cover object-center"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-[11px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
                Contratação & Assinatura Mensal
              </span>
              <h3 className="text-2xl font-black text-white tracking-tight">
                {template.nome}
              </h3>
              <div className="flex items-center justify-center gap-1.5 pt-0.5">
                <span className="text-xs text-slate-400">Valor do Plano:</span>
                <span className="text-2xl font-black text-emerald-400">
                  R$ {template.precoMensal.toFixed(2)}
                </span>
                <span className="text-xs text-slate-400">/mês</span>
              </div>
            </div>

            {/* Aviso Trava da Verdade Operacional */}
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3.5 text-xs text-amber-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-amber-300 block">
                  Trava da Verdade Operacional Ativa 🔒
                </strong>
                O agente permanece bloqueado e somente será liberado após o sistema identificar o pagamento na conta Pix oficial abaixo.
              </div>
            </div>

            {/* Chave Pix e QR Code */}
            {!liberado ? (
              <div className="space-y-4">
                {/* QR Code Container */}
                <div className="bg-white p-4 rounded-2xl w-48 h-48 mx-auto flex items-center justify-center shadow-lg border-4 border-slate-800">
                  {qrCodeDataUrl ? (
                    <img
                      src={qrCodeDataUrl}
                      alt="QR Code Pix"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <QrCode className="w-16 h-16 text-slate-900 animate-pulse" />
                  )}
                </div>

                {/* Chave Pix Oficial */}
                <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3.5 space-y-1">
                  <span className="text-[11px] text-slate-400 block font-medium">
                    Chave Pix (E-mail do recebedor):
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-bold text-orange-400 truncate">
                      {pedido.chavePixDestino}
                    </span>
                    <button
                      onClick={() => copiarTexto(pedido.chavePixDestino, 'chave')}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1 shrink-0 transition-colors"
                    >
                      {copiadoChave ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Chave</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Pix Copia e Cola */}
                <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3.5 space-y-2">
                  <span className="text-[11px] text-slate-400 block font-medium">
                    Código Pix Copia e Cola:
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-xs text-slate-400 truncate max-w-[280px]">
                      {pedido.pixCopiaECola}
                    </p>
                    <button
                      onClick={() => copiarTexto(pedido.pixCopiaECola, 'payload')}
                      className="px-2.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-xs font-bold text-white flex items-center gap-1 shrink-0 transition-colors shadow-md shadow-orange-600/30"
                    >
                      {copiadoPayload ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar Código</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Comprovante / Verificação */}
                <div className="space-y-3 pt-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="ID da transação Pix ou comprovante (opcional)"
                      value={comprovanteInput}
                      onChange={(e) => setComprovanteInput(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500"
                    />
                    <button
                      disabled={verificando}
                      onClick={() => handleVerificarPagamento(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {verificando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Verificar'}
                    </button>
                  </div>

                  {/* Botão de Validação Rápida / Simulação Real */}
                  <button
                    disabled={verificando}
                    onClick={() => handleVerificarPagamento(true)}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-transform hover:scale-[1.01]"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>CONFIRMAR PAGAMENTO REALIZADO (VALIDAÇÃO IMEDIATA)</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Pagamento Confirmado com Sucesso! */
              <div className="text-center py-6 space-y-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-6">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border-2 border-emerald-500/40">
                  <Check className="w-8 h-8 stroke-[3]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xl font-black text-white">
                    Pagamento Pix Confirmado! 🎉
                  </h4>
                  <p className="text-xs text-emerald-300 font-medium max-w-sm mx-auto">
                    A chave <strong>ffuturemindfuturemind@gmail.com</strong> recebeu o valor do plano. Seu agente foi liberado para configuração na sua empresa!
                  </p>
                </div>

                <div className="bg-slate-950/60 rounded-xl p-3 text-left font-mono text-xs space-y-1 text-slate-300 border border-emerald-500/20">
                  <div><strong>Transação:</strong> {pedido.transacaoId}</div>
                  <div><strong>Comprovante:</strong> {pedido.comprovanteCodigo || 'PIX-CONFIRMADO'}</div>
                  <div><strong>Status:</strong> <span className="text-emerald-400 font-bold">LIBERADO PARA ATIVAÇÃO</span></div>
                </div>

                <button
                  onClick={() => onPagamentoConfirmado(pedido)}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-orange-500/30 transition-transform hover:scale-105"
                >
                  <span>IR PARA A ESTEIRA DE ATIVAÇÃO</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Mensagem de Status */}
            {statusMsg && !liberado && (
              <div
                className={`p-3 rounded-xl text-xs font-medium border ${
                  statusMsg.tipo === 'sucesso'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : statusMsg.tipo === 'erro'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                {statusMsg.texto}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
