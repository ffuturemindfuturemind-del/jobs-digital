import React, { useState } from 'react';
import { AgenteAtivo, Empresa } from '../types';
import { X, Copy, Check, Code, Share2, Phone, Globe, ExternalLink } from 'lucide-react';

interface WidgetEmbedModalProps {
  agente: AgenteAtivo;
  empresa: Empresa;
  onFechar: () => void;
  onAbrirPortal: () => void;
}

export const WidgetEmbedModal: React.FC<WidgetEmbedModalProps> = ({
  agente,
  empresa,
  onFechar,
  onAbrirPortal,
}) => {
  const [copiadoLink, setCopiadoLink] = useState(false);
  const [copiadoEmbed, setCopiadoEmbed] = useState(false);
  const [copiadoWebhook, setCopiadoWebhook] = useState(false);

  const linkPublico = `${window.location.origin}/atendimento/${agente.id}`;
  const scriptEmbed = `<script src="${window.location.origin}/widget.js" data-agent-id="${agente.id}" data-company="${empresa.nomeFantasia}" defer></script>`;
  const webhookUrl = `https://api.jobsdigital.com.br/v1/webhook/whatsapp/${agente.id}`;

  const copiar = (texto: string, tipo: 'link' | 'embed' | 'webhook') => {
    navigator.clipboard.writeText(texto);
    if (tipo === 'link') {
      setCopiadoLink(true);
      setTimeout(() => setCopiadoLink(false), 2000);
    } else if (tipo === 'embed') {
      setCopiadoEmbed(true);
      setTimeout(() => setCopiadoEmbed(false), 2000);
    } else {
      setCopiadoWebhook(true);
      setTimeout(() => setCopiadoWebhook(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 my-8 space-y-5">
        <button
          onClick={onFechar}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full uppercase">
            Canais de Entrega do Agente
          </span>
          <h3 className="text-xl font-black text-white">
            Onde seu Agente vai Atender os Clientes
          </h3>
          <p className="text-xs text-slate-400">
            Disponibilize o agente para o seu escritório através de link direto, WhatsApp oficial ou no site da sua empresa.
          </p>
        </div>

        {/* 1. Link Direto do Escritório */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-orange-400" />
              1. Link Direto para Clientes do Escritório
            </span>
            <button
              onClick={onAbrirPortal}
              className="text-[11px] font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1"
            >
              <span>Testar como Cliente</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          <p className="text-slate-400 text-[11px]">
            Envie este link na bio do Instagram do escritório ou por mensagem para que qualquer pessoa fale com o agente.
          </p>
          <div className="flex items-center justify-between gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
            <span className="font-mono text-slate-300 truncate text-[11px]">
              {linkPublico}
            </span>
            <button
              onClick={() => copiar(linkPublico, 'link')}
              className="px-3 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-[11px] shrink-0 flex items-center gap-1"
            >
              {copiadoLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiadoLink ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        {/* 2. WhatsApp Oficial */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
          <span className="font-bold text-white flex items-center gap-1.5">
            <Phone className="w-4 h-4 text-emerald-400" />
            2. Conexão com o WhatsApp do Escritório
          </span>
          <p className="text-slate-400 text-[11px]">
            Número cadastrado: <strong>{empresa.canais.whatsapp}</strong>. O agente processa mensagens através do webhook da Jobs Digital integrado à Meta Cloud API.
          </p>
          <div className="flex items-center justify-between gap-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
            <span className="font-mono text-slate-300 truncate text-[11px]">
              {webhookUrl}
            </span>
            <button
              onClick={() => copiar(webhookUrl, 'webhook')}
              className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] shrink-0 flex items-center gap-1"
            >
              {copiadoWebhook ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiadoWebhook ? 'Copiado!' : 'Copiar Webhook'}</span>
            </button>
          </div>
        </div>

        {/* 3. Script para o Site do Escritório */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
          <span className="font-bold text-white flex items-center gap-1.5">
            <Code className="w-4 h-4 text-purple-400" />
            3. Widget para Colar no Site do Escritório
          </span>
          <p className="text-slate-400 text-[11px]">
            Cole esta tag antes do fechamento de &lt;/body&gt; no site da sua empresa para exibir o balãozinho de chat:
          </p>
          <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 font-mono text-[11px] text-purple-300 flex items-center justify-between gap-2">
            <span className="truncate">{scriptEmbed}</span>
            <button
              onClick={() => copiar(scriptEmbed, 'embed')}
              className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] shrink-0 flex items-center gap-1"
            >
              {copiadoEmbed ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiadoEmbed ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        <button
          onClick={onFechar}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
        >
          Fechar
        </button>
      </div>
    </div>
  );
};
