import React, { useState } from 'react';
import { ContratacaoPedido, CatalogoItem } from '../types';
import confetti from 'canvas-confetti';
import {
  Building2,
  Phone,
  ShoppingBag,
  Sliders,
  Rocket,
  CheckCircle2,
  Plus,
  Trash2,
  FileText,
  Loader2,
  X,
} from 'lucide-react';

interface EsteiraAtivacaoModalProps {
  pedido: ContratacaoPedido;
  onFechar: () => void;
  onAtivacaoConcluida: (agenteId: string, conversaId?: string) => void;
}

export const EsteiraAtivacaoModal: React.FC<EsteiraAtivacaoModalProps> = ({
  pedido,
  onFechar,
  onAtivacaoConcluida,
}) => {
  const [passo, setPasso] = useState<number>(1);
  const [salvando, setSalvando] = useState(false);

  // Passo 1: Dados da Empresa
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [cnpjOuCpf, setCnpjOuCpf] = useState('');
  const [segmento, setSegmento] = useState('');
  const [descricao, setDescricao] = useState('');
  const [site, setSite] = useState('');

  // Passo 2: Canais Reais da Empresa
  const [whatsapp, setWhatsapp] = useState('');
  const [telegram, setTelegram] = useState('');
  const [emailComercial, setEmailComercial] = useState('');
  const [webchat, setWebchat] = useState(true);

  // Passo 3: Catálogo
  const [catalogo, setCatalogo] = useState<CatalogoItem[]>([
    {
      id: 'item-1',
      nome: 'Plano ou Produto Principal',
      categoria: 'Geral',
      preco: 197.0,
      descricao: 'Descrição detalhada do produto que o agente vai atender e vender.',
      estoque: 50,
      ativo: true,
    },
  ]);
  const [novoItemNome, setNovoItemNome] = useState('');
  const [novoItemPreco, setNovoItemPreco] = useState('');
  const [novoItemDesc, setNovoItemDesc] = useState('');

  // Passo 4: Políticas, Alçada & Termos
  const [horarioAtendimento, setHorarioAtendimento] = useState('Segunda a Sábado, das 08h às 20h');
  const [tempoEntrega, setTempoEntrega] = useState('Em até 24h úteis');
  const [alcadaReais, setAlcadaReais] = useState<number>(500);
  const [descontoMaximo, setDescontoMaximo] = useState<number>(10);
  const [tomDeVoz, setTomDeVoz] = useState('Consultivo, acolhedor, rápido e com emojis moderados');
  const [nomePersonalizado, setNomePersonalizado] = useState(`${pedido.nomeAgente}`);
  const [termosAceitos, setTermosAceitos] = useState(true);

  const adicionarItemCatalogo = () => {
    if (!novoItemNome || !novoItemPreco) return;
    const item: CatalogoItem = {
      id: `item-${Date.now()}`,
      nome: novoItemNome,
      categoria: 'Geral',
      preco: parseFloat(novoItemPreco),
      descricao: novoItemDesc || 'Item comercial cadastrado na ativação.',
      estoque: 100,
      ativo: true,
    };
    setCatalogo([...catalogo, item]);
    setNovoItemNome('');
    setNovoItemPreco('');
    setNovoItemDesc('');
  };

  const removerItemCatalogo = (id: string) => {
    setCatalogo(catalogo.filter((c) => c.id !== id));
  };

  const handleFinalizarAtivacao = async () => {
    if (!termosAceitos) {
      alert('É necessário aceitar os termos de serviço e LGPD para ativar o agente.');
      return;
    }
    setSalvando(true);

    try {
      const payload = {
        pedidoId: pedido.id,
        nomePersonalizado: nomePersonalizado.trim() || pedido.nomeAgente,
        modoSupervisao: false,
        empresa: {
          razaoSocial: razaoSocial || 'Empresa Cadastrada LTDA',
          nomeFantasia: nomeFantasia || 'Minha Empresa',
          cnpjOuCpf: cnpjOuCpf || '00.000.000/0001-00',
          segmento: segmento || 'Comércio & Serviços',
          descricao: descricao || 'Empresa atendida com agente autônomo Jobs Digital.',
          site,
          canais: {
            whatsapp: whatsapp || '+55 11 98765-4321',
            whatsappConectado: true,
            telegram: telegram || '@minhaempresa',
            telegramConectado: !!telegram,
            emailComercial: emailComercial || 'atendimento@minhaempresa.com.br',
            webchat,
          },
          catalogo,
          politicas: {
            horarioAtendimento,
            tempoMedioEntrega: tempoEntrega,
            politicaCancelamento: 'Cancelamento em até 7 dias conforme CDC e termos contratuais.',
            politicaGarantia: 'Garantia de 90 dias com suporte contínuo.',
            observacoes: 'Atendimento estritamente pautado no Cérebro v5.0.',
          },
          permissoes: {
            alcadaMaximaAutonomiaReais: alcadaReais,
            descontoMaximoPermitidoPercent: descontoMaximo,
            permitirReembolsoAutonomo: false,
            permitirExclusaoDados: false,
            ferramentasHabilitadas: {
              whatsapp: true,
              pix: true,
              crm: true,
              consultarEstoque: true,
              emitirBoleto: false,
              notificacoes: true,
            },
          },
          tomDeVoz,
        },
      };

      const res = await fetch('/api/agentes/ativar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.sucesso && data.agente) {
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.5 },
        });
        onAtivacaoConcluida(data.agente.id, data.conversaInicialId);
      } else {
        alert(data.error || 'Falha ao ativar o agente.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de comunicação com o servidor na ativação.');
    } finally {
      setSalvando(false);
    }
  };

  const steps = [
    { num: 1, title: 'Empresa', icon: Building2 },
    { num: 2, title: 'Canais', icon: Phone },
    { num: 3, title: 'Catálogo', icon: ShoppingBag },
    { num: 4, title: 'Alçadas & Regras', icon: Sliders },
    { num: 5, title: 'Ativação 🚀', icon: Rocket },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 my-6 max-h-[92vh] flex flex-col justify-between overflow-hidden">
        {/* Header da Esteira */}
        <div className="pb-4 border-b border-slate-800 flex items-start justify-between">
          <div>
            <span className="text-[11px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
              Esteira de Ativação do Agente
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
              Configuração da Sua Empresa na Nuvem
            </h3>
            <p className="text-xs text-slate-400">
              Modelo liberado: <strong>{pedido.nomeAgente}</strong> (Plano R$ {pedido.precoMensal.toFixed(2)}/mês pago via Pix)
            </p>
          </div>
          <button
            onClick={onFechar}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Progresso dos Passos */}
        <div className="py-4 border-b border-slate-800/80">
          <div className="flex items-center justify-between">
            {steps.map((st) => {
              const Icon = st.icon;
              const isCurrent = passo === st.num;
              const isDone = passo > st.num;
              return (
                <div
                  key={st.num}
                  onClick={() => isDone && setPasso(st.num)}
                  className={`flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                    isCurrent
                      ? 'text-orange-400 font-bold'
                      : isDone
                      ? 'text-emerald-400 font-semibold'
                      : 'text-slate-500 font-medium'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs transition-transform ${
                      isCurrent
                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/40 scale-110'
                        : isDone
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className="text-[11px] hidden sm:block">{st.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Corpo do Passo com Scroll */}
        <div className="py-6 overflow-y-auto max-h-[55vh] pr-2 space-y-4">
          {/* PASSO 1: EMPRESA */}
          {passo === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-orange-400" />
                  Passo 1: Dados da Empresa Contratante
                </h4>
                <p className="text-xs text-slate-400">
                  O agente utiliza esses dados para se apresentar como membro oficial da sua equipe.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Nome Fantasia da Empresa *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Future & Mind"
                    value={nomeFantasia}
                    onChange={(e) => setNomeFantasia(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Razão Social
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Future & Mind Digital LTDA"
                    value={razaoSocial}
                    onChange={(e) => setRazaoSocial(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    CNPJ ou CPF
                  </label>
                  <input
                    type="text"
                    placeholder="00.000.000/0001-00"
                    value={cnpjOuCpf}
                    onChange={(e) => setCnpjOuCpf(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Segmento de Atuação
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: E-commerce, Saúde, Imobiliária, Serviços"
                    value={segmento}
                    onChange={(e) => setSegmento(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 text-xs block mb-1">
                  Breve Descrição do Negócio & Missão
                </label>
                <textarea
                  rows={3}
                  placeholder="Explique o que sua empresa faz para que o agente entenda o contexto das dúvidas dos clientes."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          )}

          {/* PASSO 2: CANAIS */}
          {passo === 2 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <Phone className="w-4 h-4 text-orange-400" />
                  Passo 2: Canais de Atendimento da Empresa
                </h4>
                <p className="text-xs text-slate-400">
                  Informe os canais onde seus clientes falam com sua empresa para que o agente opere conectado.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-200 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      WhatsApp Oficial da Empresa (com DDD) *
                    </label>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                      Canal Primário
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="Ex: +55 11 98765-4321"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-orange-500"
                  />
                  <p className="text-[11px] text-slate-400">
                    O agente receberá e responderá conversas direcionadas a este número.
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <label className="font-bold text-slate-200 block">
                    Telegram da Empresa (Username ou Bot)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: @minhaempresa_atendimento"
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <label className="font-bold text-slate-200 block">
                    E-mail Comercial de Atendimento
                  </label>
                  <input
                    type="email"
                    placeholder="Ex: contato@minhaempresa.com.br"
                    value={emailComercial}
                    onChange={(e) => setEmailComercial(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <input
                    type="checkbox"
                    id="webchatCheck"
                    checked={webchat}
                    onChange={(e) => setWebchat(e.target.checked)}
                    className="w-4 h-4 text-orange-600 rounded bg-slate-950 border-slate-700"
                  />
                  <label htmlFor="webchatCheck" className="text-slate-300 text-xs font-semibold cursor-pointer">
                    Habilitar Widget de Webchat no site da empresa
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* PASSO 3: CATÁLOGO */}
          {passo === 3 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-orange-400" />
                  Passo 3: Catálogo de Produtos / Serviços & Preços
                </h4>
                <p className="text-xs text-slate-400">
                  Trava Anti-Alucinação: O agente vende e consulta SOMENTE os itens cadastrados aqui.
                </p>
              </div>

              {/* Lista Atual */}
              <div className="space-y-2">
                {catalogo.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">{item.nome}</div>
                      <div className="text-slate-400 text-[11px]">{item.descricao}</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono font-black text-emerald-400 text-sm">
                        R$ {item.preco.toFixed(2)}
                      </span>
                      <button
                        onClick={() => removerItemCatalogo(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Formulário Novo Item */}
              <div className="rounded-2xl bg-slate-950 border border-slate-800/80 p-4 space-y-3 text-xs">
                <span className="font-bold text-orange-400 block">Adicionar Produto / Serviço</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Nome do produto/serviço"
                    value={novoItemNome}
                    onChange={(e) => setNovoItemNome(e.target.value)}
                    className="sm:col-span-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                  <input
                    type="number"
                    placeholder="Preço (R$)"
                    value={novoItemPreco}
                    onChange={(e) => setNovoItemPreco(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Breve descrição ou diferenciais deste item"
                  value={novoItemDesc}
                  onChange={(e) => setNovoItemDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={adicionarItemCatalogo}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-orange-400" />
                  <span>Incluir no Catálogo</span>
                </button>
              </div>
            </div>
          )}

          {/* PASSO 4: POLÍTICAS, ALÇADA & TERMOS */}
          {passo === 4 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-orange-400" />
                  Passo 4: Políticas, Limites de Alçada & Termos Contratuais
                </h4>
                <p className="text-xs text-slate-400">
                  Defina as regras de negócio e os limites exatos onde o agente deve chamar um humano.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Nome Interno do Agente
                  </label>
                  <input
                    type="text"
                    value={nomePersonalizado}
                    onChange={(e) => setNomePersonalizado(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Horário de Atendimento
                  </label>
                  <input
                    type="text"
                    value={horarioAtendimento}
                    onChange={(e) => setHorarioAtendimento(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Alçada Máxima de Autonomia (R$) *
                  </label>
                  <input
                    type="number"
                    value={alcadaReais}
                    onChange={(e) => setAlcadaReais(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Pedidos acima deste valor serão escalados para aprovação humana (HITL).
                  </span>
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Desconto Máximo Permitido (%) *
                  </label>
                  <input
                    type="number"
                    value={descontoMaximo}
                    onChange={(e) => setDescontoMaximo(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Pedidos de desconto acima deste percentual são bloqueados pela alçada.
                  </span>
                </div>
              </div>

              <div className="text-xs">
                <label className="font-semibold text-slate-300 block mb-1">
                  Tom de Voz Desejado
                </label>
                <input
                  type="text"
                  value={tomDeVoz}
                  onChange={(e) => setTomDeVoz(e.target.value)}
                  placeholder="Ex: Formal e técnico, ou descontraído com emojis"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Termos Reais de Contratação */}
              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-white font-bold">
                  <FileText className="w-4 h-4 text-orange-400" />
                  <span>Termos Reais de Prestação de Serviços & Conformidade LGPD</span>
                </div>
                <div className="text-slate-400 text-[11px] leading-relaxed max-h-24 overflow-y-auto pr-2 border-y border-slate-800 py-2">
                  A Jobs Digital fornece a infraestrutura de inteligência artificial autônoma sob o Cérebro AGI v5.0. O cliente contratante mantém total controle sobre as regras de negócio, limites de alçada e decisões escaladas (Human-in-the-Loop). Os dados dos clientes são estritamente isolados por empresa_id em nível de linha, em total conformidade com a LGPD (Lei 13.709/2018).
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="termosCheck"
                    checked={termosAceitos}
                    onChange={(e) => setTermosAceitos(e.target.checked)}
                    className="w-4 h-4 text-orange-600 rounded bg-slate-900 border-slate-700"
                  />
                  <label htmlFor="termosCheck" className="text-slate-200 font-semibold cursor-pointer">
                    Li e concordo com os Termos de Prestação de Serviços e Governança Jobs Digital
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* PASSO 5: RESUMO E ATIVAÇÃO */}
          {passo === 5 && (
            <div className="space-y-4 text-center py-4">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-orange-500/60 shadow-2xl mx-auto bg-slate-800">
                <img
                  src={
                    pedido.profissaoId === 2
                      ? '/avatars/whatsapp.jpg'
                      : pedido.profissaoId === 3
                      ? '/avatars/vendas.jpg'
                      : pedido.profissaoId === 4
                      ? '/avatars/prospeccao.jpg'
                      : pedido.profissaoId === 5
                      ? '/avatars/marketing.jpg'
                      : pedido.profissaoId === 6
                      ? '/avatars/rh.jpg'
                      : pedido.profissaoId === 7
                      ? '/avatars/financeiro.jpg'
                      : pedido.profissaoId === 8
                      ? '/avatars/dados.jpg'
                      : pedido.profissaoId === 9
                      ? '/avatars/operacional.jpg'
                      : pedido.profissaoId === 10
                      ? '/avatars/tecnico.jpg'
                      : '/avatars/atendimento.jpg'
                  }
                  alt={pedido.nomeAgente}
                  className="w-full h-full object-cover object-center"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="space-y-1">
                <h4 className="text-xl font-black text-white">
                  Tudo Pronto para Lançar seu Agente na Nuvem!
                </h4>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  Seu agente <strong>{nomePersonalizado}</strong> será instanciado na nuvem dedicado para a <strong>{nomeFantasia || 'Sua Empresa'}</strong>.
                </p>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-left text-xs space-y-2 max-w-lg mx-auto font-mono text-slate-300">
                <div>🏢 <strong>Empresa:</strong> {nomeFantasia || 'Minha Empresa'}</div>
                <div>📱 <strong>Canal Principal:</strong> {whatsapp || '+55 11 98765-4321'}</div>
                <div>📦 <strong>Itens no Catálogo:</strong> {catalogo.length} itens</div>
                <div>🛡️ <strong>Alçada Máxima:</strong> R$ {alcadaReais.toFixed(2)} (desc. máx: {descontoMaximo}%)</div>
                <div>💳 <strong>Assinatura:</strong> Confirmada via Pix (ffuturemindfuturemind@gmail.com)</div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com Navegação */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          {passo > 1 ? (
            <button
              onClick={() => setPasso(passo - 1)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
            >
              Voltar
            </button>
          ) : (
            <span />
          )}

          {passo < 5 ? (
            <button
              onClick={() => setPasso(passo + 1)}
              className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-colors shadow-lg shadow-orange-600/20"
            >
              Próximo Passo
            </button>
          ) : (
            <button
              disabled={salvando}
              onClick={handleFinalizarAtivacao}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white text-xs font-black flex items-center gap-2 shadow-xl shadow-orange-600/40 transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {salvando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Ativando na nuvem...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  <span>🚀 ATIVAR AGENTE NA NUVEM</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
