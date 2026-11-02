import React, { useState } from 'react';
import { AgenteAtivo, Empresa, CatalogoItem } from '../types';
import { X, Save, Plus, Trash2, Sliders, ShoppingBag, ShieldAlert, Loader2 } from 'lucide-react';

interface ModalAjustarAgenteProps {
  agente: AgenteAtivo;
  empresa: Empresa;
  onFechar: () => void;
  onSalvo: () => void;
}

export const ModalAjustarAgente: React.FC<ModalAjustarAgenteProps> = ({
  agente,
  empresa,
  onFechar,
  onSalvo,
}) => {
  const [abaConfig, setAbaConfig] = useState<'catalogo' | 'politicas' | 'alcada' | 'canais'>('catalogo');
  const [salvando, setSalvando] = useState(false);

  // States
  const [nomePersonalizado, setNomePersonalizado] = useState(agente.nomePersonalizado);
  const [catalogo, setCatalogo] = useState<CatalogoItem[]>(empresa.catalogo || []);
  const [horarioAtendimento, setHorarioAtendimento] = useState(empresa.politicas?.horarioAtendimento || '');
  const [tempoEntrega, setTempoEntrega] = useState(empresa.politicas?.tempoMedioEntrega || '');
  const [alcadaReais, setAlcadaReais] = useState<number>(empresa.permissoes?.alcadaMaximaAutonomiaReais || 500);
  const [descontoMaximo, setDescontoMaximo] = useState<number>(empresa.permissoes?.descontoMaximoPermitidoPercent || 10);
  const [tomDeVoz, setTomDeVoz] = useState(empresa.tomDeVoz || '');
  const [whatsapp, setWhatsapp] = useState(empresa.canais?.whatsapp || '');
  const [telegram, setTelegram] = useState(empresa.canais?.telegram || '');
  const [emailComercial, setEmailComercial] = useState(empresa.canais?.emailComercial || '');

  // Novo item catálogo
  const [novoItemNome, setNovoItemNome] = useState('');
  const [novoItemPreco, setNovoItemPreco] = useState('');
  const [novoItemDesc, setNovoItemDesc] = useState('');

  const adicionarItem = () => {
    if (!novoItemNome || !novoItemPreco) return;
    const item: CatalogoItem = {
      id: `item-${Date.now()}`,
      nome: novoItemNome,
      categoria: 'Geral',
      preco: parseFloat(novoItemPreco),
      descricao: novoItemDesc,
      estoque: 100,
      ativo: true,
    };
    setCatalogo([...catalogo, item]);
    setNovoItemNome('');
    setNovoItemPreco('');
    setNovoItemDesc('');
  };

  const removerItem = (id: string) => {
    setCatalogo(catalogo.filter((c) => c.id !== id));
  };

  const handleSalvar = async () => {
    setSalvando(true);
    try {
      const res = await fetch(`/api/meus-agentes/${agente.id}/ajustar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomePersonalizado,
          catalogo,
          politicas: {
            horarioAtendimento,
            tempoMedioEntrega: tempoEntrega,
          },
          permissoes: {
            alcadaMaximaAutonomiaReais: alcadaReais,
            descontoMaximoPermitidoPercent: descontoMaximo,
          },
          tomDeVoz,
          canais: {
            whatsapp,
            telegram,
            emailComercial,
          },
        }),
      });
      const data = await res.json();
      if (data.sucesso) {
        onSalvo();
        onFechar();
      } else {
        alert(data.error || 'Erro ao salvar alterações.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de comunicação.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 my-6 max-h-[90vh] flex flex-col justify-between">
        {/* Header */}
        <div className="pb-4 border-b border-slate-800 flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 rounded-full uppercase">
              Ajustes do Agente (Hot-Reload)
            </span>
            <h3 className="text-xl font-bold text-white mt-1">
              {agente.nomePersonalizado}
            </h3>
            <p className="text-xs text-slate-400">
              As alterações entram em vigor na próxima interação com os clientes.
            </p>
          </div>
          <button
            onClick={onFechar}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas de Configuração */}
        <div className="flex border-b border-slate-800 py-3 gap-2 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setAbaConfig('catalogo')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
              abaConfig === 'catalogo'
                ? 'bg-orange-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Catálogo ({catalogo.length})
          </button>
          <button
            onClick={() => setAbaConfig('alcada')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
              abaConfig === 'alcada'
                ? 'bg-orange-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Alçadas & Permissões
          </button>
          <button
            onClick={() => setAbaConfig('politicas')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
              abaConfig === 'politicas'
                ? 'bg-orange-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Políticas & Tom de Voz
          </button>
          <button
            onClick={() => setAbaConfig('canais')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
              abaConfig === 'canais'
                ? 'bg-orange-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Canais (WhatsApp)
          </button>
        </div>

        {/* Conteúdo da Aba */}
        <div className="py-4 overflow-y-auto max-h-[50vh] pr-2 space-y-4 text-xs">
          {abaConfig === 'catalogo' && (
            <div className="space-y-3">
              <div className="space-y-2">
                {catalogo.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-white text-xs">{item.nome}</div>
                      <div className="text-slate-400 text-[11px]">{item.descricao}</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono font-bold text-emerald-400">
                        R$ {item.preco.toFixed(2)}
                      </span>
                      <button
                        onClick={() => removerItem(item.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Adicionar */}
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-2">
                <span className="font-bold text-orange-400 block">Adicionar Novo Item ao Catálogo</span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Nome"
                    value={novoItemNome}
                    onChange={(e) => setNovoItemNome(e.target.value)}
                    className="col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
                  />
                  <input
                    type="number"
                    placeholder="Preço R$"
                    value={novoItemPreco}
                    onChange={(e) => setNovoItemPreco(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Descrição do item"
                  value={novoItemDesc}
                  onChange={(e) => setNovoItemDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
                />
                <button
                  type="button"
                  onClick={adicionarItem}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3 text-orange-400" />
                  <span>Incluir</span>
                </button>
              </div>
            </div>
          )}

          {abaConfig === 'alcada' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">
                    Alçada Máxima de Autonomia (R$)
                  </label>
                  <input
                    type="number"
                    value={alcadaReais}
                    onChange={(e) => setAlcadaReais(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-100"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Pedidos acima deste valor acionam automaticamente a Caixa de Decisões do Dono (HITL).
                  </span>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">
                    Desconto Máximo Permitido (%)
                  </label>
                  <input
                    type="number"
                    value={descontoMaximo}
                    onChange={(e) => setDescontoMaximo(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-slate-100"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 flex items-start gap-2 text-xs">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  O cérebro v5.0 bloqueia qualquer desconto ou alteração contratual que ultrapasse esta alçada sem autorização expressa do dono.
                </span>
              </div>
            </div>
          )}

          {abaConfig === 'politicas' && (
            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Horário de Atendimento</label>
                <input
                  type="text"
                  value={horarioAtendimento}
                  onChange={(e) => setHorarioAtendimento(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
                />
              </div>
              <div>
                <label className="font-bold text-slate-300 block mb-1">Prazo Médio de Entrega</label>
                <input
                  type="text"
                  value={tempoEntrega}
                  onChange={(e) => setTempoEntrega(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
                />
              </div>
              <div>
                <label className="font-bold text-slate-300 block mb-1">Tom de Voz do Agente</label>
                <input
                  type="text"
                  value={tomDeVoz}
                  onChange={(e) => setTomDeVoz(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
                />
              </div>
            </div>
          )}

          {abaConfig === 'canais' && (
            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-300 block mb-1">WhatsApp da Empresa</label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-slate-300 block mb-1">Telegram da Empresa</label>
                <input
                  type="text"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-slate-300 block mb-1">E-mail Comercial</label>
                <input
                  type="email"
                  value={emailComercial}
                  onChange={(e) => setEmailComercial(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-100"
                />
              </div>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onFechar}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
          >
            Cancelar
          </button>
          <button
            disabled={salvando}
            onClick={handleSalvar}
            className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-orange-600/30 disabled:opacity-50"
          >
            {salvando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Salvar Regras</span>
          </button>
        </div>
      </div>
    </div>
  );
};
