import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { VitrineHome } from './components/VitrineHome';
import { PaginaProfissao } from './components/PaginaProfissao';
import { ModalContratarPix } from './components/ModalContratarPix';
import { EsteiraAtivacaoModal } from './components/EsteiraAtivacaoModal';
import { ModalAjustarAgente } from './components/ModalAjustarAgente';
import { PainelDono } from './components/PainelDono';
import { ModalAuth } from './components/ModalAuth';
import { PortalAtendimentoPublico } from './components/PortalAtendimentoPublico';
import { WidgetEmbedModal } from './components/WidgetEmbedModal';
import { ModalTesteGratis5h } from './components/ModalTesteGratis5h';
import { Profissao, AgenteTemplate, AgenteAtivo, Empresa, ContratacaoPedido, Usuario } from './types';
import { PROFISSOES_SEED, AGENTE_TEMPLATES_SEED } from './data/seedData';
import { Spatial4DCanvas } from './components/Spatial4DCanvas';
import { ControlDock4D } from './components/ControlDock4D';
import { Lock } from 'lucide-react';

export default function App() {
  const [profissoes, setProfissoes] = useState<(Profissao & { agentesDisponiveis?: number })[]>(PROFISSOES_SEED);
  const [templates, setTemplates] = useState<AgenteTemplate[]>(AGENTE_TEMPLATES_SEED);
  const [meusAgentes, setMeusAgentes] = useState<(AgenteAtivo & { profissao?: Profissao; template?: AgenteTemplate; empresa?: Empresa })[]>([]);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);

  // Espaço 4D & Linha do Tempo
  const [modoVisual4D, setModoVisual4D] = useState<'matriz' | 'cyber' | 'holograma'>('cyber');
  const [velocidadeTempo4D, setVelocidadeTempo4D] = useState<number>(1.0);

  // Usuário / Autenticação
  const [usuarioLogado, setUsuarioLogado] = useState<Usuario | null>(null);
  const [modalAuthAberto, setModalAuthAberto] = useState<boolean>(false);

  // Navegação
  const [abaAtual, setAbaAtual] = useState<string>('vitrine');
  const [abaPainelInterna, setAbaPainelInterna] = useState<string>('hitl');
  const [profissaoSelecionada, setProfissaoSelecionada] = useState<Profissao | null>(null);
  const [busca, setBusca] = useState<string>('');
  const [modoAdmin, setModoAdmin] = useState<boolean>(false);
  const [pedidosPendentesHITL, setPedidosPendentesHITL] = useState<number>(1);
  const [conversaInicialId, setConversaInicialId] = useState<string | undefined>(undefined);

  // Modais de Fluxo & Canais
  const [templateParaContratar, setTemplateParaContratar] = useState<AgenteTemplate | null>(null);
  const [templateParaTestarGratis, setTemplateParaTestarGratis] = useState<AgenteTemplate | null>(null);
  const [pedidoLiberado, setPedidoLiberado] = useState<ContratacaoPedido | null>(null);
  const [agenteParaAjustar, setAgenteParaAjustar] = useState<{ agente: AgenteAtivo; empresa: Empresa } | null>(null);
  const [modalWidgetEmbed, setModalWidgetEmbed] = useState<{ agente: AgenteAtivo; empresa: Empresa } | null>(null);

  // Portal de Atendimento do Cliente (Visualização Exclusiva do Canal do Escritório)
  const [visualizandoPortalCliente, setVisualizandoPortalCliente] = useState<boolean>(false);
  const [agenteSelecionadoPortal, setAgenteSelecionadoPortal] = useState<AgenteAtivo | null>(null);

  // Carregar dados iniciais da API
  const carregarDadosIniciais = async () => {
    try {
      const [resProfissoes, resTemplates, resMeusAgentes, resDecisoes, resAuth] = await Promise.all([
        fetch('/api/profissoes').then((r) => r.json()),
        fetch('/api/templates').then((r) => r.json()),
        fetch('/api/meus-agentes').then((r) => r.json()),
        fetch('/api/decisoes').then((r) => r.json()),
        fetch('/api/auth/me').then((r) => r.json()),
      ]);

      if (Array.isArray(resProfissoes)) setProfissoes(resProfissoes);
      if (Array.isArray(resTemplates)) setTemplates(resTemplates);
      if (Array.isArray(resMeusAgentes)) {
        setMeusAgentes(resMeusAgentes);
        if (resMeusAgentes.length > 0 && resMeusAgentes[0].empresa) {
          setEmpresa(resMeusAgentes[0].empresa);
        }
      }
      if (Array.isArray(resDecisoes)) {
        const pendentes = resDecisoes.filter((d) => d.decisao === 'PENDENTE').length;
        setPedidosPendentesHITL(pendentes);
      }
      if (resAuth && resAuth.autenticado && resAuth.usuario) {
        setUsuarioLogado(resAuth.usuario);
        if (resAuth.empresa) setEmpresa(resAuth.empresa);
        if (resAuth.usuario.perfil === 'ADMIN_PLATAFORMA') setModoAdmin(true);
      }
    } catch (err) {
      console.error('Erro ao conectar com a API:', err);
    }
  };

  useEffect(() => {
    carregarDadosIniciais();
  }, []);

  // Quando o usuário clica em contratar um agente na vitrine
  const handleContratarTemplate = (template: AgenteTemplate) => {
    setTemplateParaContratar(template);
  };

  // Quando o pagamento Pix é identificado e liberado com sucesso
  const handlePagamentoConfirmado = (pedido: ContratacaoPedido) => {
    setTemplateParaContratar(null);
    setPedidoLiberado(pedido);
  };

  // Quando o teste gratuito de 5 horas é iniciado com sucesso
  const handleTesteIniciado = (novoAgente: AgenteAtivo, novaEmpresa: Empresa) => {
    setTemplateParaTestarGratis(null);
    carregarDadosIniciais();
    setAgenteSelecionadoPortal(novoAgente);
    setVisualizandoPortalCliente(true);
  };

  // Quando a esteira de ativação (5 passos) é finalizada
  const handleAtivacaoConcluida = (agenteId: string, convId?: string) => {
    setPedidoLiberado(null);
    carregarDadosIniciais();
    if (convId) setConversaInicialId(convId);
    setAbaAtual('conversas');
    setAbaPainelInterna('conversas');
  };

  // Login e Logout
  const handleLoginSucesso = (usr: Usuario, emp: Empresa) => {
    setUsuarioLogado(usr);
    setEmpresa(emp);
    if (usr.perfil === 'ADMIN_PLATAFORMA') setModoAdmin(true);
    carregarDadosIniciais();
  };

  const handleLogout = () => {
    setUsuarioLogado(null);
    setModoAdmin(false);
  };

  // Abrir Portal do Cliente do Escritório
  const handleAbrirCanalCliente = (agente?: AgenteAtivo) => {
    const ag = agente || meusAgentes[0];
    if (ag) {
      setAgenteSelecionadoPortal(ag);
      setVisualizandoPortalCliente(true);
    } else {
      alert('Contrate ou ative um agente primeiro para ver seu canal de atendimento.');
    }
  };

  // Admin: Criar novo template
  const handleCriarTemplateAdmin = async (dados: any) => {
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      });
      const data = await res.json();
      if (data && data.id) {
        carregarDadosIniciais();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Roteamento de telas
  const renderConteudo = () => {
    // Se estiver visualizando o canal público do escritório
    if (visualizandoPortalCliente && (agenteSelecionadoPortal || meusAgentes[0])) {
      const ag = agenteSelecionadoPortal || meusAgentes[0];
      const emp = (ag as any).empresa || empresa || {
        id: 'demo-empresa',
        razaoSocial: 'Future & Mind Inovações Digitais LTDA',
        nomeFantasia: 'Future & Mind',
        cnpjOuCpf: '45.123.890/0001-44',
        segmento: 'Comércio & Serviços',
        descricao: 'Empresa conectada ao Cérebro AGI v5.0',
        canais: {
          whatsapp: '+55 11 98765-4321',
          whatsappConectado: true,
          telegram: '@futuremind',
          telegramConectado: true,
          emailComercial: 'contato@futuremind.com.br',
          webchat: true,
        },
        catalogo: [],
        politicas: {
          horarioAtendimento: '08h às 20h',
          tempoMedioEntrega: '24h',
          politicaCancelamento: '7 dias CDC',
          politicaGarantia: '90 dias',
          observacoes: '',
        },
        permissoes: {
          alcadaMaximaAutonomiaReais: 500,
          descontoMaximoPermitidoPercent: 10,
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
        tomDeVoz: 'Acolhedor e profissional',
        termosAceitosEm: new Date().toISOString(),
        criadaEm: new Date().toISOString(),
      };

      return (
        <PortalAtendimentoPublico
          agente={ag}
          empresa={emp}
          onVoltarPainel={() => setVisualizandoPortalCliente(false)}
          onAssinarMensal={(agenteAlvo) => {
            const tmpl = templates.find((t) => t.id === agenteAlvo.templateId) || {
              id: agenteAlvo.templateId,
              profissaoId: agenteAlvo.profissaoId,
              nome: agenteAlvo.nomePersonalizado,
              segmento: 'Escritório',
              descricaoCurta: 'Agente autônomo com cérebro AGI v5.0',
              recursos: ['WhatsApp ✅', 'Pix ✅', 'CRM ✅'],
              plano: 'Mensal Pro',
              precoMensal: agenteAlvo.planoPrecoMensal,
              destaque: true,
              ativo: true,
              criadoEm: agenteAlvo.criadoEm,
              cerebroVersao: 'v5.0 AGI',
            };
            setTemplateParaContratar(tmpl);
          }}
          onAtualizarAgente={(agenteAtualizado) => {
            setAgenteSelecionadoPortal(agenteAtualizado);
            carregarDadosIniciais();
          }}
        />
      );
    }

    // Se estiver na tela de profissão específica
    if (profissaoSelecionada && abaAtual === 'vitrine') {
      return (
        <PaginaProfissao
          profissao={profissaoSelecionada}
          templates={templates}
          onVoltar={() => setProfissaoSelecionada(null)}
          onContratarTemplate={handleContratarTemplate}
          onTestarGratis={(tmpl) => setTemplateParaTestarGratis(tmpl)}
        />
      );
    }

    if (abaAtual === 'vitrine') {
      return (
        <VitrineHome
          profissoes={profissoes}
          templates={templates}
          onSelecionarProfissao={(prof) => setProfissaoSelecionada(prof)}
          onContratarTemplate={handleContratarTemplate}
          onTestarGratis={(tmpl) => setTemplateParaTestarGratis(tmpl)}
          busca={busca}
        />
      );
    }

    // Se o visitante público tentar acessar Painel ou HITL sem login
    if (!usuarioLogado && (abaAtual === 'painel' || abaAtual === 'hitl')) {
      return (
        <div className="max-w-md mx-auto my-12 p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center mx-auto shadow-lg">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Área Exclusiva do Dono</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            O Painel de Controle, Métricas de Faturamento e Decisões de Alçada são protegidos. Faça login para acessar sua plataforma.
          </p>
          <button
            onClick={() => setModalAuthAberto(true)}
            className="w-full py-3 px-6 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-lg shadow-orange-600/30 transition-transform hover:scale-105"
          >
            Fazer Login como Administrador
          </button>
        </div>
      );
    }

    // Painel do Dono ou Telas Específicas
    const subAba =
      abaAtual === 'conversas'
        ? 'conversas'
        : abaAtual === 'meus-agentes'
        ? 'agentes'
        : abaAtual === 'hitl'
        ? 'hitl'
        : abaPainelInterna;

    return (
      <PainelDono
        agentes={meusAgentes}
        empresa={
          empresa || {
            id: 'demo-empresa',
            razaoSocial: 'Future & Mind Inovações Digitais LTDA',
            nomeFantasia: 'Future & Mind',
            cnpjOuCpf: '45.123.890/0001-44',
            segmento: 'Comércio & Serviços',
            descricao: 'Empresa conectada ao Cérebro AGI v5.0',
            canais: {
              whatsapp: '+55 11 98765-4321',
              whatsappConectado: true,
              telegram: '@futuremind',
              telegramConectado: true,
              emailComercial: 'contato@futuremind.com.br',
              webchat: true,
            },
            catalogo: [],
            politicas: {
              horarioAtendimento: '08h às 20h',
              tempoMedioEntrega: '24h',
              politicaCancelamento: '7 dias CDC',
              politicaGarantia: '90 dias',
              observacoes: '',
            },
            permissoes: {
              alcadaMaximaAutonomiaReais: 500,
              descontoMaximoPermitidoPercent: 10,
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
            tomDeVoz: 'Acolhedor e profissional',
            termosAceitosEm: new Date().toISOString(),
            criadaEm: new Date().toISOString(),
          }
        }
        abaInterna={subAba}
        setAbaInterna={(aba) => {
          setAbaPainelInterna(aba);
          if (aba === 'hitl') setAbaAtual('hitl');
          else if (aba === 'conversas') setAbaAtual('conversas');
          else if (aba === 'agentes') setAbaAtual('meus-agentes');
          else setAbaAtual('painel');
        }}
        onAbrirAjuste={(agente, emp) => setAgenteParaAjustar({ agente, empresa: emp })}
        onAbrirWidgetEmbed={(agente, emp) => setModalWidgetEmbed({ agente, empresa: emp })}
        onAbrirCanalCliente={(agente) => handleAbrirCanalCliente(agente)}
        modoAdmin={modoAdmin}
        onCriarTemplateVitrine={handleCriarTemplateAdmin}
        conversaInicialId={conversaInicialId}
      />
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-x-hidden cyber-grid selection:bg-cyan-500 selection:text-slate-950">
      {/* Canvas 4D Espacial WebGL Hiper-Espaço */}
      <Spatial4DCanvas
        modoVisual={modoVisual4D}
        velocidadeTempo={velocidadeTempo4D}
      />

      {/* Camada Superior da Interface (Relativa com profundidade 3D) */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header Fixo */}
        <Header
          busca={busca}
          setBusca={setBusca}
          pedidosPendentesHITL={pedidosPendentesHITL}
          abaAtual={abaAtual}
          setAbaAtual={(novaAba) => {
            setVisualizandoPortalCliente(false);
            setAbaAtual(novaAba);
            if (novaAba === 'vitrine') setProfissaoSelecionada(null);
          }}
          modoAdmin={modoAdmin}
          setModoAdmin={setModoAdmin}
          nomeEmpresa={empresa?.nomeFantasia || 'Future & Mind'}
          usuarioLogado={usuarioLogado}
          onAbrirAuth={() => setModalAuthAberto(true)}
          onLogout={handleLogout}
          onAbrirPortalPublico={() => handleAbrirCanalCliente()}
          temAgentesAtivos={meusAgentes.length > 0}
        />

        {/* Conteúdo Principal com Profundidade */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24">
          {renderConteudo()}
        </main>

        {/* Dock Flutuante 4D (Controle de Matriz Quântica e Linha Temporal) */}
        {!visualizandoPortalCliente && (
          <ControlDock4D
            modoVisual={modoVisual4D}
            setModoVisual={setModoVisual4D}
            velocidadeTempo={velocidadeTempo4D}
            setVelocidadeTempo={setVelocidadeTempo4D}
          />
        )}

        {/* Barra de Navegação Inferior */}
        {!visualizandoPortalCliente && (
          <BottomNav
            abaAtual={abaAtual}
            setAbaAtual={(novaAba) => {
              setVisualizandoPortalCliente(false);
              setAbaAtual(novaAba);
              if (novaAba === 'vitrine') setProfissaoSelecionada(null);
            }}
            pedidosPendentesHITL={pedidosPendentesHITL}
            totalAgentesAtivos={meusAgentes.length}
            usuarioLogado={usuarioLogado}
            onAbrirAuth={() => setModalAuthAberto(true)}
          />
        )}
      </div>

      {/* Modal Autenticação (Login e Cadastro do Escritório) */}
      {modalAuthAberto && (
        <ModalAuth
          onFechar={() => setModalAuthAberto(false)}
          onLoginSucesso={handleLoginSucesso}
        />
      )}

      {/* Modal 1: Contratação e Pagamento Pix */}
      {templateParaContratar && (
        <ModalContratarPix
          template={templateParaContratar}
          onFechar={() => setTemplateParaContratar(null)}
          onPagamentoConfirmado={handlePagamentoConfirmado}
        />
      )}

      {/* Modal Teste Gratuito de 5 Horas */}
      {templateParaTestarGratis && (
        <ModalTesteGratis5h
          template={templateParaTestarGratis}
          profissao={profissoes.find((p) => p.id === templateParaTestarGratis.profissaoId)}
          onFechar={() => setTemplateParaTestarGratis(null)}
          onTesteIniciado={handleTesteIniciado}
          onEscolherAssinarDireto={() => {
            const t = templateParaTestarGratis;
            setTemplateParaTestarGratis(null);
            setTemplateParaContratar(t);
          }}
        />
      )}

      {/* Modal 2: Esteira de Ativação do Agente */}
      {pedidoLiberado && (
        <EsteiraAtivacaoModal
          pedido={pedidoLiberado}
          onFechar={() => setPedidoLiberado(null)}
          onAtivacaoConcluida={handleAtivacaoConcluida}
        />
      )}

      {/* Modal 3: Ajustar Agente (Hot-Reload) */}
      {agenteParaAjustar && (
        <ModalAjustarAgente
          agente={agenteParaAjustar.agente}
          empresa={agenteParaAjustar.empresa}
          onFechar={() => setAgenteParaAjustar(null)}
          onSalvo={carregarDadosIniciais}
        />
      )}

      {/* Modal 4: Onde Atende (Widget Embed, Link Público & WhatsApp) */}
      {modalWidgetEmbed && (
        <WidgetEmbedModal
          agente={modalWidgetEmbed.agente}
          empresa={modalWidgetEmbed.empresa}
          onFechar={() => setModalWidgetEmbed(null)}
          onAbrirPortal={() => {
            setModalWidgetEmbed(null);
            handleAbrirCanalCliente(modalWidgetEmbed.agente);
          }}
        />
      )}
    </div>
  );
}
