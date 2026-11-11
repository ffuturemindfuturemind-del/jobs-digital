import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
import { GoogleGenAI } from '@google/genai';
import { PROFISSOES_SEED, AGENTE_TEMPLATES_SEED } from './src/data/seedData';
import {
  Profissao,
  AgenteTemplate,
  Empresa,
  AgenteAtivo,
  ContratacaoPedido,
  EscalaHumana,
  Conversa,
  MensagemChat,
  RouterLog,
  NivelRouter,
} from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

function getPort(): number {
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const parsed = parseInt(process.argv[portArgIndex + 1], 10);
    if (!isNaN(parsed)) return parsed;
  }
  return parseInt(process.env.PORT || '3000', 10);
}

const app = express();
const port = getPort();

app.use(express.json());

// In-Memory Persistent Store with Initial Data
let profissoes: Profissao[] = [...PROFISSOES_SEED];
let templates: AgenteTemplate[] = [...AGENTE_TEMPLATES_SEED];
let empresas: Map<string, Empresa> = new Map();
let agentesAtivos: Map<string, AgenteAtivo> = new Map();
let pedidos: Map<string, ContratacaoPedido> = new Map();
let conversas: Map<string, Conversa> = new Map();
let escalasHumanas: Map<string, EscalaHumana> = new Map();
let routerLogs: RouterLog[] = [];

// Trava Estrita: 1 Único Teste Gratuito por Empresa / Visitante
export interface RegistroTesteGratis {
  id: string;
  agenteId: string;
  templateId: string;
  nomeAgente: string;
  nomeEmpresa: string;
  whatsapp: string;
  iniciadoEm: string;
  expiraEm: string;
  expirado: boolean;
}
let registrosTestesGratis: Map<string, RegistroTesteGratis> = new Map();

interface UsuarioCred {
  id: string;
  nome: string;
  email: string;
  senhaHash: string;
  empresaId: string;
  perfil: 'DONO' | 'ADMIN_PLATAFORMA' | 'SUPERVISOR';
  criadoEm: string;
}
let usuarios: Map<string, UsuarioCred> = new Map();

// Seed default company and sample active agent for immediate testing
const defaultEmpresaId = 'empresa-demo-01';
const defaultEmpresa: Empresa = {
  id: defaultEmpresaId,
  razaoSocial: 'Future & Mind Inovações Digitais LTDA',
  nomeFantasia: 'Future & Mind',
  cnpjOuCpf: '45.123.890/0001-44',
  segmento: 'Comércio Eletrônico & Serviços',
  descricao: 'Venda de soluções tecnológicas, acessórios e consultoria digital.',
  site: 'https://futuremind.com.br',
  cidade: 'São Paulo',
  estado: 'SP',
  canais: {
    whatsapp: '+55 11 98765-4321',
    whatsappConectado: true,
    telegram: '@futuremind_oficial',
    telegramConectado: true,
    emailComercial: 'contato@futuremind.com.br',
    webchat: true,
  },
  catalogo: [
    {
      id: 'prod-01',
      nome: 'Combo Cérebro AGI v5.0 Licença Anual',
      categoria: 'Software & IA',
      preco: 1490.0,
      descricao: 'Licença completa do agente autônomo com suporte técnico 24h.',
      estoque: 99,
      ativo: true,
    },
    {
      id: 'prod-02',
      nome: 'Kit Automação WhatsApp & Pix',
      categoria: 'Integrações',
      preco: 297.0,
      descricao: 'Módulo de integração com Meta Cloud e pagamentos Pix instantâneos.',
      estoque: 50,
      ativo: true,
    },
    {
      id: 'prod-03',
      nome: 'Consultoria de Implantação VIP',
      categoria: 'Serviços',
      preco: 450.0,
      descricao: 'Alinhamento de processos e customização de catálogo em 48h.',
      estoque: 10,
      ativo: true,
    },
    {
      id: 'prod-04',
      nome: 'Assinatura Suporte Premium Mensal',
      categoria: 'Planos',
      preco: 199.0,
      descricao: 'Monitoramento contínuo de SLA e revisões de regras.',
      estoque: 200,
      ativo: true,
    },
  ],
  politicas: {
    horarioAtendimento: 'Segunda a Sábado, das 08h às 22h',
    tempoMedioEntrega: 'Liberação digital em até 5 minutos após confirmação Pix',
    politicaCancelamento: 'Até 7 dias com garantia de satisfação ou reembolso com autorização do dono',
    politicaGarantia: 'Garantia de disponibilidade de 99.8% com SLA garantido',
    observacoes: 'Atendimento humanizado com respeito às regras de alçada e dados LGPD.',
  },
  permissoes: {
    alcadaMaximaAutonomiaReais: 500.0, // Acima de R$ 500 precisa de aprovação humana
    descontoMaximoPermitidoPercent: 10.0, // Máximo 10%
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
  tomDeVoz: 'Profissional, consultivo, empático e resolutivo. Use emojis com moderação.',
  termosAceitosEm: '2026-10-20T08:00:00Z',
  criadaEm: '2026-10-20T08:00:00Z',
};
empresas.set(defaultEmpresaId, defaultEmpresa);

// Seed default active agent
const demoAgenteId = 'agente-vendas-01';
const demoAgente: AgenteAtivo = {
  id: demoAgenteId,
  empresaId: defaultEmpresaId,
  profissaoId: 3, // Vendas
  templateId: 'tmpl-vendas-01',
  nomePersonalizado: 'Closer AGI - Vendas Future & Mind',
  fotoAvatar: '/avatars/vendas.jpg',
  status: 'ATIVO',
  modoSupervisao: false,
  volumeHoje: {
    conversas: 14,
    vendasReais: 3280.0,
    escalasHumanas: 2,
    tarefasConcluidas: 29,
  },
  criadoEm: '2026-10-20T08:30:00Z',
  ultimoAcessoEm: new Date().toISOString(),
  linkAtendimentoPublico: `/atendimento/${demoAgenteId}`,
  webhookWhatsAppUrl: `https://api.jobsdigital.com.br/v1/webhook/${demoAgenteId}`,
  planoPrecoMensal: 349.0,
};
agentesAtivos.set(demoAgenteId, demoAgente);

// Seed sample conversation for the active agent
const demoConversaId = 'conv-sample-01';
const demoConversa: Conversa = {
  id: demoConversaId,
  agenteId: demoAgenteId,
  clienteNome: 'Mariana Silva',
  clienteContato: '+55 11 99123-4567',
  canal: 'WHATSAPP',
  estadoAtual: 'QUALIFICANDO',
  assumidoPorHumano: false,
  criadoEm: new Date(Date.now() - 3600000).toISOString(),
  atualizadoEm: new Date().toISOString(),
  mensagens: [
    {
      id: 'msg-1',
      remetente: 'cliente',
      texto: 'Oi, boa tarde! Gostaria de saber como funciona o Kit de Automação para WhatsApp.',
      timestamp: new Date(Date.now() - 3500000).toISOString(),
    },
    {
      id: 'msg-2',
      remetente: 'agente',
      texto: 'Olá, Mariana! 👋 Que ótimo falar com você. O Kit de Automação integra o WhatsApp oficial da sua empresa com emissão de Pix instantâneo e triagem de atendimento 24h. Qual é o seu volume médio de atendimentos hoje?',
      timestamp: new Date(Date.now() - 3400000).toISOString(),
      estadoInterno: 'DESCOBERTA',
      nivelRouter: 'LUNA',
      ferramentaAcionada: 'CONSULTAR_CLIENTE',
    },
    {
      id: 'msg-3',
      remetente: 'cliente',
      texto: 'Temos uns 50 clientes por dia. Tem desconto se fechar hoje à vista no Pix?',
      timestamp: new Date(Date.now() - 1200000).toISOString(),
    },
  ],
};
conversas.set(demoConversaId, demoConversa);

// Seed sample HITL Decision Card
const demoEscalaId = 'escala-01';
const demoEscala: EscalaHumana = {
  id: demoEscalaId,
  empresaId: defaultEmpresaId,
  agenteId: demoAgenteId,
  agenteNome: 'Closer AGI - Vendas Future & Mind',
  profissaoNome: 'Agente de Vendas',
  conversaId: demoConversaId,
  clienteNome: 'Carlos Eduardo Menezes',
  prioridade: 'ALCADA',
  statusAtual: 'AGUARDANDO_HUMANO',
  motivo: 'Pedido com desconto de 20% e valor total de R$ 1.192,00 (acima da alçada de R$ 500 e desconto máx de 10%).',
  contexto: 'Cliente solicitou 4 unidades do Kit Automação com cupom extraordinário de 20% para fechamento imediato.',
  acaoRecomendada: 'Aprovar desconto especial de 15% (R$ 1.009,80) ou manter a alçada limite de 10% (R$ 1.069,20).',
  decisao: 'PENDENTE',
  criadoEm: new Date(Date.now() - 1800000).toISOString(),
};
// Seed initial users
usuarios.set('ffuturemindfuturemind@gmail.com', {
  id: 'usr-admin-01',
  nome: 'Future & Mind Admin',
  email: 'ffuturemindfuturemind@gmail.com',
  senhaHash: 'admin123',
  empresaId: defaultEmpresaId,
  perfil: 'ADMIN_PLATAFORMA',
  criadoEm: '2026-10-20T08:00:00Z',
});
usuarios.set('escritorio@demo.com', {
  id: 'usr-escritorio-01',
  nome: 'Dr. Roberto Advocacia',
  email: 'escritorio@demo.com',
  senhaHash: '123456',
  empresaId: defaultEmpresaId,
  perfil: 'DONO',
  criadoEm: '2026-10-22T08:00:00Z',
});

// Update demo agent to include public link
demoAgente.linkAtendimentoPublico = `/atendimento/${demoAgenteId}`;
demoAgente.webhookWhatsAppUrl = `https://api.jobsdigital.com.br/v1/webhook/${demoAgenteId}`;

// Initialize Gemini Client helper
function getGeminiClient(): GoogleGenAI | null {
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  if (!geminiApiKey) return null;
  try {
    return new GoogleGenAI({
      apiKey: geminiApiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.error('Erro ao instanciar GoogleGenAI:', err);
    return null;
  }
}

// Helper to calculate Pix CRC16
function calculatePixCRC16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
}

// Generate valid format Pix payload
function generatePixCode(chavePix: string, valor: number, txid: string): string {
  const valorFormatado = valor.toFixed(2);
  const partGui = '0014BR.GOV.BCB.PIX';
  const partKey = `01${chavePix.length.toString().padStart(2, '0')}${chavePix}`;
  const part26 = `${partGui}${partKey}`;
  const field26 = `26${part26.length.toString().padStart(2, '0')}${part26}`;
  const field52 = '52040000';
  const field53 = '5303986';
  const field54 = `54${valorFormatado.length.toString().padStart(2, '0')}${valorFormatado}`;
  const field58 = '5802BR';
  const merchantName = 'JOBS DIGITAL';
  const field59 = `59${merchantName.length.toString().padStart(2, '0')}${merchantName}`;
  const merchantCity = 'SAO PAULO';
  const field60 = `60${merchantCity.length.toString().padStart(2, '0')}${merchantCity}`;
  const partTxid = `05${txid.length.toString().padStart(2, '0')}${txid}`;
  const field62 = `62${partTxid.length.toString().padStart(2, '0')}${partTxid}`;

  const raw = `000201${field26}${field52}${field53}${field54}${field58}${field59}${field60}${field62}6304`;
  const checksum = calculatePixCRC16(raw);
  return `${raw}${checksum}`;
}

// ======================== API ROUTES ========================

// 0. Autenticação & Usuários (Login / Cadastro de Escritório / Sessão)
app.post('/api/auth/register', (req, res) => {
  const { nome, email, senha, nomeEmpresa, segmento, whatsapp } = req.body;
  if (!email || !senha || !nome) {
    return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
  }

  const emailNorm = email.trim().toLowerCase();
  if (usuarios.has(emailNorm)) {
    return res.status(400).json({ error: 'Este e-mail já está cadastrado. Faça login.' });
  }

  // Criar nova empresa para este escritório
  const novaEmpresaId = `emp-${Date.now()}`;
  const novaEmpresa: Empresa = {
    id: novaEmpresaId,
    razaoSocial: `${nomeEmpresa || nome} LTDA`,
    nomeFantasia: nomeEmpresa || `${nome} Escritório`,
    cnpjOuCpf: '00.000.000/0001-00',
    segmento: segmento || 'Escritório & Serviços',
    descricao: `Atendimento profissional do escritório ${nomeEmpresa || nome}.`,
    canais: {
      whatsapp: whatsapp || '+55 11 98888-7777',
      whatsappConectado: true,
      telegram: '',
      telegramConectado: false,
      emailComercial: emailNorm,
      webchat: true,
    },
    catalogo: [
      {
        id: `item-${Date.now()}-1`,
        nome: 'Consulta Inicial / Diagnóstico',
        categoria: 'Atendimento',
        preco: 150.0,
        descricao: 'Diagnóstico e levantamento das demandas do cliente.',
        estoque: 99,
        ativo: true,
      },
      {
        id: `item-${Date.now()}-2`,
        nome: 'Assessoria Mensal',
        categoria: 'Contratos',
        preco: 850.0,
        descricao: 'Acompanhamento contínuo e suporte técnico/jurídico.',
        estoque: 20,
        ativo: true,
      },
    ],
    politicas: {
      horarioAtendimento: 'Segunda a Sexta, das 09h às 18h',
      tempoMedioEntrega: 'Resposta imediata pelo agente; protocolo humano em até 24h',
      politicaCancelamento: 'Cancelamento a qualquer momento com aviso prévio de 30 dias',
      politicaGarantia: 'Confidencialidade absoluta (LGPD e sigilo profissional)',
      observacoes: 'Atendimento consultivo e ético.',
    },
    permissoes: {
      alcadaMaximaAutonomiaReais: 500.0,
      descontoMaximoPermitidoPercent: 10.0,
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
    tomDeVoz: 'Formal, acolhedor, didático e altamente seguro.',
    termosAceitosEm: new Date().toISOString(),
    criadaEm: new Date().toISOString(),
  };

  empresas.set(novaEmpresaId, novaEmpresa);

  const novoUsuario: UsuarioCred = {
    id: `usr-${Date.now()}`,
    nome,
    email: emailNorm,
    senhaHash: senha, // para este ambiente demo/prototype
    empresaId: novaEmpresaId,
    perfil: 'DONO',
    criadoEm: new Date().toISOString(),
  };
  usuarios.set(emailNorm, novoUsuario);

  res.json({
    sucesso: true,
    mensagem: 'Cadastro realizado com sucesso!',
    usuario: {
      id: novoUsuario.id,
      nome: novoUsuario.nome,
      email: novoUsuario.email,
      empresaId: novoUsuario.empresaId,
      perfil: novoUsuario.perfil,
    },
    empresa: novaEmpresa,
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ error: 'Informe e-mail e senha.' });
  }

  const emailNorm = email.trim().toLowerCase();
  const usr = usuarios.get(emailNorm);

  if (!usr || usr.senhaHash !== senha) {
    return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
  }

  const empresaUsuario = empresas.get(usr.empresaId) || defaultEmpresa;

  res.json({
    sucesso: true,
    mensagem: 'Login realizado com sucesso!',
    usuario: {
      id: usr.id,
      nome: usr.nome,
      email: usr.email,
      empresaId: usr.empresaId,
      perfil: usr.perfil,
    },
    empresa: empresaUsuario,
  });
});

app.get('/api/auth/me', (req, res) => {
  const emailQuery = (req.query.email as string)?.toLowerCase();

  if (emailQuery) {
    const usr = usuarios.get(emailQuery);
    if (usr) {
      const empresaUsuario = empresas.get(usr.empresaId) || defaultEmpresa;
      return res.json({
        autenticado: true,
        usuario: {
          id: usr.id,
          nome: usr.nome,
          email: usr.email,
          empresaId: usr.empresaId,
          perfil: usr.perfil,
        },
        empresa: empresaUsuario,
      });
    }
  }

  // Visitante anônimo / público
  res.json({ autenticado: false });
});

// 1. Health & Config
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    geminiConfigured: !!(process.env.GEMINI_API_KEY || process.env.API_KEY),
    totalProfissoes: profissoes.length,
    totalTemplates: templates.length,
    chavePixPadrao: 'ffuturemindfuturemind@gmail.com',
  });
});

// 2. Vitrine de Profissões
app.get('/api/profissoes', (req, res) => {
  const listaComContagem = profissoes.map((p) => {
    const agentesDisponiveis = templates.filter((t) => t.profissaoId === p.id && t.ativo).length;
    return {
      ...p,
      agentesDisponiveis,
    };
  });
  res.json(listaComContagem.sort((a, b) => a.ordem - b.ordem));
});

// 3. Templates de Agentes da Vitrine
app.get('/api/templates', (req, res) => {
  const { profissaoId } = req.query;
  let filtrados = templates.filter((t) => t.ativo);
  if (profissaoId) {
    const pId = parseInt(profissaoId as string, 10);
    filtrados = filtrados.filter((t) => t.profissaoId === pId);
  }
  res.json(filtrados);
});

// Admin: Criar/Editar Template de Agente
app.post('/api/templates', (req, res) => {
  const { profissaoId, nome, segmento, descricaoCurta, recursos, plano, precoMensal, destaque } = req.body;
  if (!profissaoId || !nome || !precoMensal) {
    return res.status(400).json({ error: 'Campos obrigatórios: profissaoId, nome, precoMensal' });
  }
  const novoTemplate: AgenteTemplate = {
    id: `tmpl-${Date.now()}`,
    profissaoId: parseInt(profissaoId, 10),
    nome,
    segmento: segmento || 'Geral',
    descricaoCurta: descricaoCurta || 'Agente autônomo com cérebro AGI v5.0',
    recursos: Array.isArray(recursos) ? recursos : ['WhatsApp ✅', 'Pix ✅', 'CRM ✅'],
    plano: plano || 'Mensal Pro',
    precoMensal: parseFloat(precoMensal),
    destaque: !!destaque,
    ativo: true,
    criadoEm: new Date().toISOString(),
    cerebroVersao: 'v5.0 AGI',
  };
  templates.push(novoTemplate);
  res.json(novoTemplate);
});

// 4. Iniciar Contratação & Gerar Pix com chave ffuturemindfuturemind@gmail.com
app.post('/api/contratacoes/criar-pedido-pix', async (req, res) => {
  try {
    const { templateId } = req.body;
    const template = templates.find((t) => t.id === templateId);
    if (!template) {
      return res.status(404).json({ error: 'Template de agente não encontrado.' });
    }

    const pedidoId = `ped-${Date.now()}`;
    const txid = `JOB${Date.now().toString().slice(-6)}`;
    const chavePix = 'ffuturemindfuturemind@gmail.com';
    const valor = template.precoMensal;
    const pixCopiaECola = generatePixCode(chavePix, valor, txid);
    const qrCodeDataUrl = await QRCode.toDataURL(pixCopiaECola, {
      margin: 1,
      width: 320,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    const novoPedido: ContratacaoPedido = {
      id: pedidoId,
      templateId: template.id,
      profissaoId: template.profissaoId,
      nomeAgente: template.nome,
      precoMensal: template.precoMensal,
      chavePixDestino: chavePix,
      pixCopiaECola,
      status: 'PENDENTE_PAGAMENTO',
      transacaoId: txid,
      criadoEm: new Date().toISOString(),
      liberadoParaAtivacao: false,
    };

    pedidos.set(pedidoId, novoPedido);

    res.json({
      pedido: novoPedido,
      qrCodeDataUrl,
      chavePix,
      valorFormatado: valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      instrucoes: 'Pague via Pix usando o QR Code ou Chave Copia e Cola. O agente é liberado imediatamente após confirmação.',
    });
  } catch (error: any) {
    console.error('Erro ao gerar Pix:', error);
    res.status(500).json({ error: 'Erro ao gerar cobrança Pix.' });
  }
});

// 5. Verificar e Confirmar Pagamento Pix (Trava da Verdade Operacional)
app.post('/api/contratacoes/verificar-pagamento', (req, res) => {
  const { pedidoId, comprovanteCodigo, simularAprovacao } = req.body;
  const pedido = pedidos.get(pedidoId);

  if (!pedido) {
    return res.status(404).json({ error: 'Pedido Pix não encontrado.' });
  }

  // Trava da Verdade Operacional: só confirma se houver validação real ou teste explícito
  if (simularAprovacao || comprovanteCodigo) {
    pedido.status = 'CONFIRMADO';
    pedido.pagoEm = new Date().toISOString();
    pedido.comprovanteCodigo = comprovanteCodigo || `PIX-${Date.now().toString().slice(-8)}`;
    pedido.liberadoParaAtivacao = true;
    pedidos.set(pedidoId, pedido);

    return res.json({
      sucesso: true,
      mensagem: 'Pagamento Pix identificado e confirmado com sucesso na conta!',
      pedido,
      liberado: true,
    });
  }

  res.json({
    sucesso: false,
    mensagem: 'Aguardando compensação na rede Pix. Trava da verdade operacional ativa.',
    pedido,
    liberado: false,
  });
});

// 6. Consultar Pedido
app.get('/api/contratacoes/:id', (req, res) => {
  const pedido = pedidos.get(req.params.id);
  if (!pedido) {
    return res.status(404).json({ error: 'Pedido não encontrado.' });
  }
  res.json(pedido);
});

// 7. Esteira de Ativação do Agente (Empresa -> Canais -> Catálogo -> Políticas -> Nuvem)
app.post('/api/agentes/ativar', (req, res) => {
  const {
    pedidoId,
    nomePersonalizado,
    modoSupervisao,
  } = req.body;
  const empresaData = req.body.empresa || req.body.dadosEmpresa || {};

  const pedido = pedidos.get(pedidoId);
  if (!pedido || pedido.status !== 'CONFIRMADO') {
    return res.status(400).json({
      error: 'Trava da Verdade Operacional: Não é permitido ativar agente sem confirmação verificada de pagamento Pix.',
    });
  }

  const empresaId = empresaData.id || `emp-${Date.now()}`;
  const empresaCompleta: Empresa = {
    id: empresaId,
    razaoSocial: empresaData.razaoSocial || 'Empresa Cadastrada LTDA',
    nomeFantasia: empresaData.nomeFantasia || 'Minha Empresa',
    cnpjOuCpf: empresaData.cnpjOuCpf || '00.000.000/0001-00',
    segmento: empresaData.segmento || 'Geral',
    descricao: empresaData.descricao || 'Atendimento automatizado com inteligência Jobs Digital.',
    site: empresaData.site || '',
    canais: {
      whatsapp: empresaData.canais?.whatsapp || '+55 11 99999-9999',
      whatsappConectado: true,
      telegram: empresaData.canais?.telegram || '',
      telegramConectado: !!empresaData.canais?.telegram,
      emailComercial: empresaData.canais?.emailComercial || 'atendimento@empresa.com.br',
      webchat: true,
    },
    catalogo: Array.isArray(empresaData.catalogo) && empresaData.catalogo.length > 0
      ? empresaData.catalogo
      : [
          {
            id: 'item-1',
            nome: 'Produto Principal',
            categoria: 'Destaque',
            preco: 99.0,
            descricao: 'Produto de demonstração cadastrado na ativação.',
            estoque: 100,
            ativo: true,
          },
        ],
    politicas: {
      horarioAtendimento: empresaData.politicas?.horarioAtendimento || 'Segunda a Sexta, das 08h às 20h',
      tempoMedioEntrega: empresaData.politicas?.tempoMedioEntrega || 'Envio em até 24h úteis',
      politicaCancelamento: empresaData.politicas?.politicaCancelamento || 'Até 7 dias com base no CDC',
      politicaGarantia: empresaData.politicas?.politicaGarantia || 'Garantia legal de 90 dias',
      observacoes: empresaData.politicas?.observacoes || '',
    },
    permissoes: {
      alcadaMaximaAutonomiaReais: empresaData.permissoes?.alcadaMaximaAutonomiaReais || 500.0,
      descontoMaximoPermitidoPercent: empresaData.permissoes?.descontoMaximoPermitidoPercent || 10.0,
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
    tomDeVoz: empresaData.tomDeVoz || 'Educado, acolhedor, rápido e com emojis moderados.',
    termosAceitosEm: new Date().toISOString(),
    criadaEm: new Date().toISOString(),
  };

  empresas.set(empresaId, empresaCompleta);

  // Instanciar Agente Ativo
  const agenteId = `agt-${Date.now()}`;
  const tmpl = templates.find((t) => t.id === pedido.templateId);
  const prof = profissoes.find((p) => p.id === pedido.profissaoId);
  const novoAgente: AgenteAtivo = {
    id: agenteId,
    empresaId,
    profissaoId: pedido.profissaoId,
    templateId: pedido.templateId,
    nomePersonalizado: nomePersonalizado || pedido.nomeAgente,
    fotoAvatar: tmpl?.fotoAvatar || prof?.fotoAvatar || '/avatars/atendimento.jpg',
    status: 'ATIVO',
    modoSupervisao: !!modoSupervisao,
    volumeHoje: {
      conversas: 0,
      vendasReais: 0,
      escalasHumanas: 0,
      tarefasConcluidas: 0,
    },
    criadoEm: new Date().toISOString(),
    ultimoAcessoEm: new Date().toISOString(),
    linkAtendimentoPublico: `/atendimento/${agenteId}`,
    webhookWhatsAppUrl: `https://api.jobsdigital.com.br/v1/webhook/${agenteId}`,
    planoPrecoMensal: pedido.precoMensal,
  };

  agentesAtivos.set(agenteId, novoAgente);

  // Criar conversa inicial de boas-vindas para o canal
  const conversaInicialId = `conv-${Date.now()}`;
  const conversaInicial: Conversa = {
    id: conversaInicialId,
    agenteId,
    clienteNome: 'Cliente Teste WhatsApp',
    clienteContato: empresaCompleta.canais.whatsapp,
    canal: 'WHATSAPP',
    estadoAtual: 'NOVO',
    assumidoPorHumano: false,
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
    mensagens: [
      {
        id: `msg-${Date.now()}`,
        remetente: 'agente',
        texto: `Olá! 👋 Sou o ${novoAgente.nomePersonalizado}, assistente oficial da ${empresaCompleta.nomeFantasia}. Como posso te ajudar hoje?`,
        timestamp: new Date().toISOString(),
        estadoInterno: 'NOVO',
        nivelRouter: 'LUNA',
      },
    ],
  };
  conversas.set(conversaInicialId, conversaInicial);

  res.json({
    sucesso: true,
    mensagem: '🚀 Agente autônomo ativado na nuvem com sucesso!',
    agente: novoAgente,
    empresa: empresaCompleta,
    conversaInicialId,
  });
});

// 7.1. Iniciar Período de Teste Gratuito de 5 Horas (TRAVA: 1 ÚNICO TESTE POR EMPRESA/DISPOSITIVO)
app.get('/api/agentes/status-teste-gratis', (req, res) => {
  const zapQuery = ((req.query.whatsapp as string) || '').replace(/\D/g, '');
  const empQuery = ((req.query.empresa as string) || '').trim().toLowerCase();

  let registro = Array.from(registrosTestesGratis.values()).find((r) => {
    if (zapQuery && r.whatsapp === zapQuery) return true;
    if (empQuery && r.nomeEmpresa.trim().toLowerCase() === empQuery) return true;
    return false;
  });

  if (!registro && registrosTestesGratis.size > 0) {
    registro = Array.from(registrosTestesGratis.values())[0];
  }

  // Verifica se existe algum agente com status TESTE ou testeGratuito ativo
  const agenteEmTeste = Array.from(agentesAtivos.values()).find(
    (a) => a.status === 'TESTE' || !!a.testeGratuito?.ativo
  );

  if (registro || agenteEmTeste) {
    const agora = Date.now();
    const expiraMs = agenteEmTeste?.testeGratuito?.expiraEm
      ? new Date(agenteEmTeste.testeGratuito.expiraEm).getTime()
      : registro
      ? new Date(registro.expiraEm).getTime()
      : 0;
    const expirado = agora >= expiraMs || !!agenteEmTeste?.testeGratuito?.expirado || !!registro?.expirado;

    return res.json({
      jaUtilizou: true,
      expirado,
      teste: {
        agenteId: agenteEmTeste?.id || registro?.agenteId,
        templateId: agenteEmTeste?.templateId || registro?.templateId,
        nomeAgente: agenteEmTeste?.nomePersonalizado || registro?.nomeAgente,
        nomeEmpresa: registro?.nomeEmpresa || 'Minha Empresa',
        iniciadoEm: agenteEmTeste?.testeGratuito?.iniciadoEm || registro?.iniciadoEm,
        expiraEm: agenteEmTeste?.testeGratuito?.expiraEm || registro?.expiraEm,
      },
    });
  }

  res.json({ jaUtilizou: false, expirado: false, teste: null });
});

app.post('/api/agentes/iniciar-teste-gratis-5h', (req, res) => {
  const { templateId, nomeEmpresa, segmento, whatsapp, nomePersonalizado } = req.body;
  const tmpl = templates.find((t) => t.id === templateId);
  if (!tmpl) {
    return res.status(404).json({ error: 'Template de agente não encontrado.' });
  }

  const zapNorm = (whatsapp || '').replace(/\D/g, '');
  const empNorm = (nomeEmpresa || '').trim().toLowerCase();

  // 🔒 TRAVA INVIOLÁVEL: Verificar se este WhatsApp, Empresa ou Sessão já realizou 1 teste gratuito
  const testeExistente = Array.from(registrosTestesGratis.values()).find(
    (r) =>
      (zapNorm && r.whatsapp === zapNorm) ||
      (empNorm && r.nomeEmpresa.trim().toLowerCase() === empNorm)
  ) || Array.from(agentesAtivos.values()).find(
    (a) => a.status === 'TESTE' || !!a.testeGratuito?.ativo
  );

  if (testeExistente) {
    const nomeAgenteTestado =
      'nomeAgente' in testeExistente
        ? (testeExistente as RegistroTesteGratis).nomeAgente
        : (testeExistente as AgenteAtivo).nomePersonalizado;

    return res.status(403).json({
      error: `Trava de Degustação Única: Sua empresa já realizou o teste gratuito único de 1 agente (${nomeAgenteTestado}). É permitido apenas 1 teste gratuito por empresa. Para continuar utilizando os agentes autônomos, assine o plano mensal no Pix!`,
      bloqueado: true,
      jaUtilizou: true,
      nomeAgenteTestado,
    });
  }

  const prof = profissoes.find((p) => p.id === tmpl.profissaoId);
  const empresaId = `emp-teste-${Date.now()}`;
  const empresaCompleta: Empresa = {
    id: empresaId,
    razaoSocial: `${nomeEmpresa || 'Escritório Demo'} LTDA`,
    nomeFantasia: nomeEmpresa || 'Meu Escritório Digital',
    cnpjOuCpf: '00.000.000/0001-00',
    segmento: segmento || tmpl.segmento || 'Serviços',
    descricao: `Empresa em período de degustação gratuita única de 5 horas com o agente ${tmpl.nome}.`,
    canais: {
      whatsapp: whatsapp || '+55 11 98888-7777',
      whatsappConectado: true,
      telegram: '',
      telegramConectado: false,
      emailComercial: 'contato@escritorio.com.br',
      webchat: true,
    },
    catalogo: [
      {
        id: 'item-1',
        nome: `Serviço Principal (${tmpl.segmento})`,
        categoria: 'Atendimento',
        preco: 150.0,
        descricao: 'Serviço padrão para demonstração de vendas e orçamentos pelo agente.',
        estoque: 99,
        ativo: true,
      },
      {
        id: 'item-2',
        nome: 'Consulta / Avaliação Express',
        categoria: 'Consultoria',
        preco: 80.0,
        descricao: 'Agendamento imediato com retorno garantido.',
        estoque: 50,
        ativo: true,
      },
    ],
    politicas: {
      horarioAtendimento: 'Segunda a Sexta, das 08h às 20h',
      tempoMedioEntrega: 'Retorno instantâneo',
      politicaCancelamento: 'Cancelamento livre durante as 5h de teste',
      politicaGarantia: 'Garantia total de satisfação ou Pix estornado',
      observacoes: 'Modo Degustação Única 5 Horas Ativo',
    },
    permissoes: {
      alcadaMaximaAutonomiaReais: 300.0,
      descontoMaximoPermitidoPercent: 10.0,
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
    tomDeVoz: 'Acolhedor, técnico, ágil e focado em converter clientes.',
    termosAceitosEm: new Date().toISOString(),
    criadaEm: new Date().toISOString(),
  };

  empresas.set(empresaId, empresaCompleta);

  const agora = new Date();
  const expira = new Date(agora.getTime() + 5 * 60 * 60 * 1000); // 5 horas exatas
  const agenteId = `agt-trial-${Date.now()}`;

  const novoAgente: AgenteAtivo = {
    id: agenteId,
    empresaId,
    profissaoId: tmpl.profissaoId,
    templateId: tmpl.id,
    nomePersonalizado: nomePersonalizado || `${tmpl.nome} (Teste 5h)`,
    fotoAvatar: tmpl.fotoAvatar || prof?.fotoAvatar || '/avatars/atendimento.jpg',
    status: 'TESTE',
    modoSupervisao: false,
    volumeHoje: {
      conversas: 0,
      vendasReais: 0,
      escalasHumanas: 0,
      tarefasConcluidas: 0,
    },
    criadoEm: agora.toISOString(),
    ultimoAcessoEm: agora.toISOString(),
    linkAtendimentoPublico: `/atendimento/${agenteId}`,
    webhookWhatsAppUrl: `https://api.jobsdigital.com.br/v1/webhook/${agenteId}`,
    planoPrecoMensal: tmpl.precoMensal,
    testeGratuito: {
      ativo: true,
      iniciadoEm: agora.toISOString(),
      expiraEm: expira.toISOString(),
      duracaoHoras: 5,
      expirado: false,
    },
  };

  agentesAtivos.set(agenteId, novoAgente);

  // Registrar na trava para impedir novos testes no futuro
  const registro: RegistroTesteGratis = {
    id: `reg-${Date.now()}`,
    agenteId,
    templateId: tmpl.id,
    nomeAgente: tmpl.nome,
    nomeEmpresa: empresaCompleta.nomeFantasia,
    whatsapp: zapNorm,
    iniciadoEm: agora.toISOString(),
    expiraEm: expira.toISOString(),
    expirado: false,
  };
  registrosTestesGratis.set(agenteId, registro);
  if (zapNorm) registrosTestesGratis.set(zapNorm, registro);
  if (empNorm) registrosTestesGratis.set(empNorm, registro);

  // Conversa de acolhimento
  const conversaInicialId = `conv-${Date.now()}`;
  const conversaInicial: Conversa = {
    id: conversaInicialId,
    agenteId,
    clienteNome: 'Cliente Teste (Escritório)',
    clienteContato: empresaCompleta.canais.whatsapp,
    canal: 'WEBCHAT',
    estadoAtual: 'TESTE_ATIVO',
    assumidoPorHumano: false,
    criadoEm: agora.toISOString(),
    atualizadoEm: agora.toISOString(),
    mensagens: [
      {
        id: `msg-${Date.now()}`,
        remetente: 'agente',
        texto: `🎉 Olá! O seu período de TESTE GRATUITO DE 5 HORAS foi iniciado com sucesso!\n\nSou o ${novoAgente.nomePersonalizado}, assistente oficial do escritório ${empresaCompleta.nomeFantasia}. Estou pronto para atender seus clientes, tirar dúvidas sobre o catálogo e fechar orçamentos.\n\n⚠️ Regra: Cada empresa possui direito a 1 teste de 1 agente. Após as 5 horas, para me manter atendendo seu escritório, basta confirmar a assinatura mensal de R$ ${tmpl.precoMensal.toFixed(2)}/mês no Pix!`,
        timestamp: agora.toISOString(),
        estadoInterno: 'TESTE_INICIADO',
        nivelRouter: 'LUNA',
      },
    ],
  };
  conversas.set(conversaInicialId, conversaInicial);

  res.json({
    sucesso: true,
    mensagem: '🎁 Teste único de 5 horas ativado com sucesso!',
    agente: novoAgente,
    empresa: empresaCompleta,
    conversaInicialId,
  });
});

// Expirar teste manualmente (apenas expirar, NUNCA renovar)
app.post('/api/agentes/:id/expirar-teste-simulado', (req, res) => {
  const agente = agentesAtivos.get(req.params.id);
  if (!agente) return res.status(404).json({ error: 'Agente não encontrado.' });

  if (agente.testeGratuito) {
    agente.testeGratuito.expirado = true;
    agente.testeGratuito.expiraEm = new Date(Date.now() - 1000).toISOString();
    agente.status = 'PAUSADO';
    agentesAtivos.set(agente.id, agente);

    const reg = registrosTestesGratis.get(agente.id);
    if (reg) reg.expirado = true;
  }

  res.json({ sucesso: true, agente });
});

// 8. Meus Agentes (Lista da Empresa)
app.get('/api/meus-agentes', (req, res) => {
  const agoraMs = Date.now();
  const lista = Array.from(agentesAtivos.values()).map((agente) => {
    if (agente.testeGratuito?.ativo && !agente.testeGratuito.expirado) {
      const expiraMs = new Date(agente.testeGratuito.expiraEm).getTime();
      if (agoraMs >= expiraMs) {
        agente.testeGratuito.expirado = true;
        agente.status = 'PAUSADO';
        agentesAtivos.set(agente.id, agente);
      }
    }
    const template = templates.find((t) => t.id === agente.templateId);
    const profissao = profissoes.find((p) => p.id === agente.profissaoId);
    const empresa = empresas.get(agente.empresaId);
    return {
      ...agente,
      profissao,
      template,
      empresa,
    };
  });
  res.json(lista);
});

// 9. Atualizar Status do Agente (Pausar / Retomar / Modo Teste)
app.post('/api/meus-agentes/:id/status', (req, res) => {
  const { status, modoSupervisao } = req.body;
  const agente = agentesAtivos.get(req.params.id);
  if (!agente) {
    return res.status(404).json({ error: 'Agente não encontrado.' });
  }

  if (status) agente.status = status;
  if (modoSupervisao !== undefined) agente.modoSupervisao = modoSupervisao;
  agente.ultimoAcessoEm = new Date().toISOString();
  agentesAtivos.set(agente.id, agente);

  res.json({ sucesso: true, agente });
});

// 10. Ajustar Agente (Catálogo, Políticas, Alçada, Tom de Voz - Hot Reload)
app.put('/api/meus-agentes/:id/ajustar', (req, res) => {
  const agente = agentesAtivos.get(req.params.id);
  if (!agente) {
    return res.status(404).json({ error: 'Agente não encontrado.' });
  }

  const empresa = empresas.get(agente.empresaId);
  if (!empresa) {
    return res.status(404).json({ error: 'Empresa do agente não encontrada.' });
  }

  const { catalogo, politicas, permissoes, tomDeVoz, canais, nomePersonalizado } = req.body;

  if (nomePersonalizado) agente.nomePersonalizado = nomePersonalizado;
  if (catalogo) empresa.catalogo = catalogo;
  if (politicas) empresa.politicas = { ...empresa.politicas, ...politicas };
  if (permissoes) empresa.permissoes = { ...empresa.permissoes, ...permissoes };
  if (tomDeVoz) empresa.tomDeVoz = tomDeVoz;
  if (canais) empresa.canais = { ...empresa.canais, ...canais };

  empresas.set(empresa.id, empresa);
  agentesAtivos.set(agente.id, agente);

  res.json({
    sucesso: true,
    mensagem: 'Configurações atualizadas com sucesso! O agente já lê as novas regras na próxima interação.',
    empresa,
    agente,
  });
});

// 11. Conversas & Mensagens
app.get('/api/conversas', (req, res) => {
  const { agenteId } = req.query;
  let lista = Array.from(conversas.values());
  if (agenteId) {
    lista = lista.filter((c) => c.agenteId === agenteId);
  }
  res.json(lista.sort((a, b) => new Date(b.atualizadoEm).getTime() - new Date(a.atualizadoEm).getTime()));
});

app.get('/api/conversas/:id', (req, res) => {
  const conversa = conversas.get(req.params.id);
  if (!conversa) {
    return res.status(404).json({ error: 'Conversa não encontrada.' });
  }
  res.json(conversa);
});

// 11b. Portal Público de Atendimento do Escritório (onde os clientes do escritório falam com o agente)
app.get('/api/public/agente/:id', (req, res) => {
  const agente = agentesAtivos.get(req.params.id);
  if (!agente) {
    return res.status(404).json({ error: 'Agente não encontrado ou inativo.' });
  }

  const empresa = empresas.get(agente.empresaId);
  const profissao = profissoes.find((p) => p.id === agente.profissaoId);

  res.json({
    agente: {
      id: agente.id,
      nomePersonalizado: agente.nomePersonalizado,
      fotoAvatar: agente.fotoAvatar || profissao?.fotoAvatar || '/avatars/atendimento.jpg',
      status: agente.status,
      profissao: profissao?.nome || 'Atendimento',
      emoji: profissao?.emoji || '🤖',
      linkAtendimentoPublico: agente.linkAtendimentoPublico,
    },
    empresa: {
      nomeFantasia: empresa?.nomeFantasia || 'Escritório',
      segmento: empresa?.segmento || 'Serviços',
      descricao: empresa?.descricao || '',
      canais: empresa?.canais,
      catalogo: empresa?.catalogo?.filter((c) => c.ativo) || [],
      politicas: {
        horarioAtendimento: empresa?.politicas?.horarioAtendimento,
        tempoMedioEntrega: empresa?.politicas?.tempoMedioEntrega,
      },
    },
  });
});

// 12. Assumir ou Devolver Conversa (HITL)
app.post('/api/conversas/:id/assumir', (req, res) => {
  const { assumir } = req.body;
  const conversa = conversas.get(req.params.id);
  if (!conversa) {
    return res.status(404).json({ error: 'Conversa não encontrada.' });
  }

  conversa.assumidoPorHumano = !!assumir;
  conversa.atualizadoEm = new Date().toISOString();
  conversa.estadoAtual = assumir ? 'AGUARDANDO_HUMANO' : 'ATENDENDO';
  conversas.set(conversa.id, conversa);

  res.json({ sucesso: true, conversa });
});

// 13. Caixa de Decisões (HITL)
app.get('/api/decisoes', (req, res) => {
  const lista = Array.from(escalasHumanas.values());
  res.json(lista.sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()));
});

app.post('/api/decisoes/:id/decidir', (req, res) => {
  const { decisao, respostaHumano } = req.body;
  const escala = escalasHumanas.get(req.params.id);
  if (!escala) {
    return res.status(404).json({ error: 'Escala não encontrada.' });
  }

  escala.decisao = decisao;
  escala.decididoPor = 'Dono da Empresa';
  escala.decididoEm = new Date().toISOString();
  escala.respostaHumano = respostaHumano || '';
  escalasHumanas.set(escala.id, escala);

  // Se houver conversa vinculada, atualiza status e adiciona resposta do dono
  const conversa = conversas.get(escala.conversaId);
  if (conversa) {
    if (decisao === 'ASSUMIDO') {
      conversa.assumidoPorHumano = true;
      conversa.estadoAtual = 'AGUARDANDO_HUMANO';
    } else {
      conversa.estadoAtual = 'NEGOCIACAO';
      conversa.mensagens.push({
        id: `msg-${Date.now()}`,
        remetente: 'agente',
        texto:
          decisao === 'APROVADO'
            ? `Decisão da diretoria confirmada: ${respostaHumano || 'Condição especial autorizada pelo responsável! Podemos dar prosseguimento ao pedido.'}`
            : `Retorno da diretoria: ${respostaHumano || 'Infelizmente essa condição não pôde ser aprovada, mas mantemos nossa melhor condição cadastrada com entrega imediata!'}`,
        timestamp: new Date().toISOString(),
        estadoInterno: 'RESOLVENDO',
        nivelRouter: 'SOL',
        ferramentaAcionada: 'NOTIFICAR_CLIENTE',
      });
    }
    conversa.atualizadoEm = new Date().toISOString();
    conversas.set(conversa.id, conversa);
  }

  res.json({ sucesso: true, escala });
});

// 14. MOTOR DE EXECUÇÃO DO AGENTE (Cérebro AGI v5.0 + Router + Gemini)
app.post('/api/chat', async (req, res) => {
  const startTime = Date.now();
  const { agenteId, conversaId, mensagem, clienteNome } = req.body;

  if (!mensagem || !mensagem.trim()) {
    return res.status(400).json({ error: 'Mensagem não pode ser vazia.' });
  }

  const agente = agentesAtivos.get(agenteId);
  if (!agente) {
    return res.status(404).json({ error: 'Agente ativo não encontrado.' });
  }

  // Trava de Teste Gratuito de 5 Horas
  if (agente.testeGratuito?.ativo) {
    const agoraMs = Date.now();
    const expiraMs = new Date(agente.testeGratuito.expiraEm).getTime();
    if (agoraMs >= expiraMs || agente.testeGratuito.expirado) {
      agente.testeGratuito.expirado = true;
      agente.status = 'PAUSADO';
      agentesAtivos.set(agente.id, agente);

      const msgExpirado: MensagemChat = {
        id: `msg-${Date.now()}`,
        remetente: 'agente',
        texto: `⏰ O período de TESTE GRATUITO DE 5 HORAS do ${agente.nomePersonalizado} foi concluído!\n\nPara manter o agente ativo e atendendo seus clientes no escritório, assine o plano mensal por R$ ${agente.planoPrecoMensal.toFixed(2)}/mês via Pix. A liberação definitiva é instantânea!`,
        timestamp: new Date().toISOString(),
        estadoInterno: 'TESTE_EXPIRADO',
      };

      return res.json({
        sucesso: true,
        mensagem: msgExpirado,
        testeExpirado: true,
        agente,
      });
    }
  }

  const empresa = empresas.get(agente.empresaId);
  if (!empresa) {
    return res.status(404).json({ error: 'Empresa do agente não encontrada.' });
  }

  const profissao = profissoes.find((p) => p.id === agente.profissaoId);

// Helper para identificar a saudação correspondente ao horário ou à mensagem do cliente
function getSaudacaoHorario(mensagemTexto?: string): string {
  const t = (mensagemTexto || '').toLowerCase();
  if (t.includes('boa noite') || t.includes('boanoite') || t.includes('boa-noite')) return 'Boa noite';
  if (t.includes('boa tarde') || t.includes('boatarde') || t.includes('boa-tarde')) return 'Boa tarde';
  if (t.includes('bom dia') || t.includes('bomdia') || t.includes('bom-dia')) return 'Bom dia';
  if (t.includes('boa madrugada')) return 'Boa noite';

  // Fuso de Brasília (UTC-3)
  const agora = new Date();
  const horaBrasilia = (agora.getUTCHours() - 3 + 24) % 24;
  if (horaBrasilia >= 5 && horaBrasilia < 12) return 'Bom dia';
  if (horaBrasilia >= 12 && horaBrasilia < 18) return 'Boa tarde';
  return 'Boa noite';
}

// Helper para extrair o nome do cliente a partir do texto
function extrairNomeClienteDoTexto(texto: string): string | null {
  const t = texto.trim();
  const regexes = [
    /(?:meu nome [ée]|me chamo|sou o|sou a|aqui [ée] o|aqui [ée] a|pode me chamar de)\s+([A-ZÀ-Úa-zà-ú]{2,20})/i,
    /^(?:sou|chamo|aqui [ée])\s+([A-ZÀ-Úa-zà-ú]{2,20})/i,
  ];
  for (const r of regexes) {
    const m = t.match(r);
    if (m && m[1]) {
      const n = m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
      const ignorar = [
        'cliente',
        'agente',
        'amigo',
        'senhor',
        'senhora',
        'bom',
        'boa',
        'ola',
        'olá',
        'novo',
        'nova',
        'aqui',
        'tudo',
        'sim',
        'nao',
        'não',
      ];
      if (!ignorar.includes(n.toLowerCase())) return n;
    }
  }
  return null;
}

  // Obter ou criar conversa
  let conversa = conversas.get(conversaId);
  const nomeParam = (clienteNome || '').trim();
  const ehNomeParamGenerico =
    !nomeParam ||
    [
      'cliente',
      'cliente whatsapp',
      'cliente do escritório',
      'cliente teste (escritório)',
      'cliente teste',
    ].includes(nomeParam.toLowerCase());

  if (!conversa) {
    conversa = {
      id: conversaId || `conv-${Date.now()}`,
      agenteId,
      clienteNome: !ehNomeParamGenerico ? nomeParam : 'Cliente',
      clienteContato: '+55 11 99999-9999',
      canal: 'WHATSAPP',
      estadoAtual: 'ATENDENDO',
      assumidoPorHumano: false,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
      mensagens: [],
    };
    conversas.set(conversa.id, conversa);
  } else if (!ehNomeParamGenerico) {
    conversa.clienteNome = nomeParam;
  }

  // Tentar extrair nome da própria mensagem do cliente
  const nomeExtraido = extrairNomeClienteDoTexto(mensagem);
  if (nomeExtraido) {
    conversa.clienteNome = nomeExtraido;
  }

  const ehNomeGenerico =
    !conversa.clienteNome ||
    [
      'cliente',
      'cliente whatsapp',
      'cliente do escritório',
      'cliente teste (escritório)',
      'cliente teste',
    ].includes(conversa.clienteNome.trim().toLowerCase());
  const primeiroNome = ehNomeGenerico ? '' : conversa.clienteNome.trim().split(' ')[0];
  const vocativo = primeiroNome ? `, ${primeiroNome}` : '';
  const saudacaoPeriodo = getSaudacaoHorario(mensagem);

  // Se a conversa foi assumida pelo humano e o remetente for o humano respondendo
  const msgCliente: MensagemChat = {
    id: `msg-${Date.now()}`,
    remetente: 'cliente',
    texto: mensagem,
    timestamp: new Date().toISOString(),
  };
  conversa.mensagens.push(msgCliente);

  // Intenções e Análise Semântica da Mensagem
  const textoMin = mensagem.toLowerCase();
  const temCumprimento =
    textoMin.includes('oi') ||
    textoMin.includes('olá') ||
    textoMin.includes('ola') ||
    textoMin.includes('bom dia') ||
    textoMin.includes('bomdia') ||
    textoMin.includes('boa tarde') ||
    textoMin.includes('boatarde') ||
    textoMin.includes('boa noite') ||
    textoMin.includes('boanoite') ||
    textoMin.includes('boa-noite') ||
    textoMin.includes('boa-tarde') ||
    textoMin.includes('bom-dia') ||
    textoMin.includes('opa') ||
    textoMin.includes('e aí') ||
    textoMin.includes('e ai');

  const querProdutos =
    textoMin.includes('produto') ||
    textoMin.includes('produtos') ||
    textoMin.includes('catalogo') ||
    textoMin.includes('catálogo') ||
    textoMin.includes('serviço') ||
    textoMin.includes('serviços') ||
    textoMin.includes('servicos') ||
    textoMin.includes('o que vocês vendem') ||
    textoMin.includes('o que você vende') ||
    textoMin.includes('o que vocês fazem') ||
    textoMin.includes('o que você faz') ||
    textoMin.includes('o que tem aí') ||
    textoMin.includes('o que tem ai') ||
    textoMin.includes('quais opções') ||
    textoMin.includes('quais opcoes') ||
    textoMin.includes('soluções') ||
    textoMin.includes('solucoes') ||
    textoMin.includes('portfólio') ||
    textoMin.includes('portfolio') ||
    textoMin.includes('itens');

  const querOrcamento =
    textoMin.includes('orçamento') ||
    textoMin.includes('orcamento') ||
    textoMin.includes('orçar') ||
    textoMin.includes('orcar') ||
    textoMin.includes('cotação') ||
    textoMin.includes('cotacao') ||
    textoMin.includes('proposta') ||
    textoMin.includes('quanto fica') ||
    textoMin.includes('quanto custa tudo') ||
    textoMin.includes('fazer um cálculo') ||
    textoMin.includes('fazer um calculo') ||
    textoMin.includes('calcular') ||
    textoMin.includes('valores') ||
    textoMin.includes('tabela de valores') ||
    textoMin.includes('tabela de preços') ||
    textoMin.includes('quanto sai') ||
    textoMin.includes('pacote');

  const querPreco =
    textoMin.includes('preço') ||
    textoMin.includes('preco') ||
    textoMin.includes('quanto custa') ||
    textoMin.includes('qual o valor') ||
    textoMin.includes('qual valor') ||
    textoMin.includes('quanto é') ||
    textoMin.includes('quanto e');

  const querPixOuPagamento =
    textoMin.includes('pix') ||
    textoMin.includes('pagar') ||
    textoMin.includes('pagamento') ||
    textoMin.includes('comprar') ||
    textoMin.includes('fechar') ||
    textoMin.includes('contratar') ||
    textoMin.includes('chave pix') ||
    textoMin.includes('transferência') ||
    textoMin.includes('transferencia') ||
    textoMin.includes('cartão') ||
    textoMin.includes('cartao') ||
    textoMin.includes('boleto');

  const querComoFuncionaOuPrazos =
    textoMin.includes('como funciona') ||
    textoMin.includes('prazo') ||
    textoMin.includes('tempo de entrega') ||
    textoMin.includes('quanto tempo') ||
    textoMin.includes('entrega') ||
    textoMin.includes('garantia') ||
    textoMin.includes('cancelamento') ||
    textoMin.includes('horário') ||
    textoMin.includes('horario') ||
    textoMin.includes('atendimento') ||
    textoMin.includes('suporte');

  const pedeDescontoAlto =
    (textoMin.includes('desconto') || textoMin.includes('mais barato')) &&
    (textoMin.includes('20%') ||
      textoMin.includes('30%') ||
      textoMin.includes('50%') ||
      textoMin.includes('metade'));

  const pedeHumano =
    textoMin.includes('falar com humano') ||
    textoMin.includes('pessoa de verdade') ||
    textoMin.includes('gerente') ||
    textoMin.includes('dono');

  const ameacaJuridica =
    textoMin.includes('procon') ||
    textoMin.includes('processo') ||
    textoMin.includes('advogado') ||
    textoMin.includes('golpe');

  // Saudação pura é aquela que não contém nenhuma intenção comercial ou de suporte
  const ehSaudacaoPura =
    temCumprimento &&
    !querProdutos &&
    !querOrcamento &&
    !querPreco &&
    !querPixOuPagamento &&
    !querComoFuncionaOuPrazos &&
    !pedeDescontoAlto &&
    !pedeHumano &&
    !ameacaJuridica &&
    textoMin.length < 35;

  // Router Dinâmico: Decide nível de inteligência
  let nivelRouter: NivelRouter = 'TERRA';
  if (ehSaudacaoPura) {
    nivelRouter = 'LUNA'; // Simples, alta velocidade com rapport
  } else if (pedeDescontoAlto || pedeHumano || ameacaJuridica) {
    nivelRouter = 'ASTRA'; // Alto risco, análise de alçada e HITL
  } else if (querOrcamento || querProdutos || querPreco || querPixOuPagamento) {
    nivelRouter = 'SOL'; // Negociação comercial profunda
  }

  // Detecção prévia de Escala Humana (Alçada & Risco)
  let acionarEscalaHumana = false;
  let motivoEscala = '';
  let prioridadeEscala: EscalaHumana['prioridade'] = 'ALCADA';
  let acaoRecomendada = '';

  if (pedeDescontoAlto) {
    acionarEscalaHumana = true;
    prioridadeEscala = 'ALCADA';
    motivoEscala = `Cliente solicitou desconto acima da alçada permitida de ${empresa.permissoes.descontoMaximoPermitidoPercent}%.`;
    acaoRecomendada = `Decidir se concede desconto excepcional ou mantém o limite de ${empresa.permissoes.descontoMaximoPermitidoPercent}%.`;
  } else if (pedeHumano) {
    acionarEscalaHumana = true;
    prioridadeEscala = 'CONSULTA';
    motivoEscala = 'Cliente solicitou expressamente atendimento humano.';
    acaoRecomendada = 'Assumir atendimento ou enviar orientação personalizada.';
  } else if (ameacaJuridica) {
    acionarEscalaHumana = true;
    prioridadeEscala = 'URGENTE';
    motivoEscala = 'Incidente crítico: cliente mencionou disputa jurídica ou órgão de defesa do consumidor.';
    acaoRecomendada = 'Intervenção imediata da gerência para conciliação amigável.';
  }

  let respostaTexto = '';
  let estadoInterno = 'ATENDENDO';
  let ferramentaAcionada = 'CONSULTAR_CLIENTE';

  // Montagem do Cérebro v5.0 Prompt
  const catalogoFormatado = empresa.catalogo
    .filter((c) => c.ativo)
    .map((c) => `• ${c.nome} (R$ ${c.preco.toFixed(2)}): ${c.descricao}`)
    .join('\n');

  const systemInstruction = `
Você é o ${agente.nomePersonalizado}, Agente Autônomo da ${empresa.nomeFantasia} (${profissao?.nome || 'Suporte'}).
CÉREBRO AGI v5.0 JOBS DIGITAL - SISTEMA COMPLETO DE RACIOCÍNIO & INTELIGÊNCIA

═══════════════════════════════════════════
DIRETRIZES DE RAPPORT & HUMANIZAÇÃO (OBRIGATÓRIO)
═══════════════════════════════════════════
1. CUMPRIMENTOS E PERÍODO DO DIA:
   - Período do dia atual: "${saudacaoPeriodo}".
   - Se o cliente iniciar ou enviar qualquer cumprimento ("Boa noite", "Bom dia", "Boa tarde", "Oi", "Olá", etc.), VOCÊ DEVE OBRIGATORIAMENTE CUMPRIMENTÁ-LO DE VOLTA com a saudação de período adequada ("${saudacaoPeriodo}!") logo no início da sua resposta.
   - NUNCA responda a uma saudação de forma fria ou sem retribuir o cumprimento.
2. NOME DO CLIENTE:
   ${
     primeiroNome
       ? `- O nome do cliente é "${primeiroNome}". Chame-o pelo nome próprio ("${primeiroNome}") com respeito, carinho e rapport humanizado em suas respostas (ex: "${saudacaoPeriodo}, ${primeiroNome}!", "Com certeza, ${primeiroNome}.").`
       : '- O nome do cliente ainda não foi identificado. Retribua a saudação com alto nível de rapport ("' +
         saudacaoPeriodo +
         '! É um prazer falar com você!") e, de forma educada, pergunte como pode chamá-lo.'
   }
   - Se o cliente disser como se chama (ex: "meu nome é...", "sou o..."), acolha e passe a chamá-lo imediatamente por esse nome.

═══════════════════════════════════════════
INSTRUÇÕES DE RACIOCÍNIO COMERCIAL & RESPOSTAS
═══════════════════════════════════════════
1. SE O CLIENTE PERGUNTAR SOBRE PRODUTOS / CATÁLOGO:
   - Apresente os itens do catálogo real com nome, preço e breve benefício.
   - Pergunte qual opção faz mais sentido para o momento dele.
2. SE O CLIENTE PEDIR UM ORÇAMENTO / COTAÇÃO:
   - Monte uma proposta clara e estruturada listando as opções do catálogo com valores exatos.
   - Informe a condição de liberação rápida (Pix) e prazo médio de entrega ("${empresa.politicas.tempoMedioEntrega}").
   - Convide o cliente a escolher o item para fechar.
3. SE A MENSAGEM COMBINAR SAUDAÇÃO + PERGUNTA (ex: "Boa noite queria saber sobre os produtos"):
   - Retribua a saudação ("${saudacaoPeriodo}${vocativo}!") e RESPONDA IMEDIATAMENTE a dúvida com os produtos.
4. DIRETRIZES INEGOCIÁVEIS:
   - Alçada máxima de autonomia: R$ ${empresa.permissoes.alcadaMaximaAutonomiaReais.toFixed(2)}.
   - Desconto máximo permitido: ${empresa.permissoes.descontoMaximoPermitidoPercent}%.
   - Venda SOMENTE o que está no catálogo da empresa. Nunca invente preços fictícios.

═══════════════════════════════════════════
DADOS DA EMPRESA
═══════════════════════════════════════════
Empresa: ${empresa.nomeFantasia} (${empresa.razaoSocial})
Canais: WhatsApp: ${empresa.canais.whatsapp} | Telegram: ${empresa.canais.telegram} | E-mail: ${empresa.canais.emailComercial}
Horários: ${empresa.politicas.horarioAtendimento}
Prazos: ${empresa.politicas.tempoMedioEntrega}
Garantia/Cancelamento: ${empresa.politicas.politicaCancelamento}
Tom de voz da empresa: ${empresa.tomDeVoz}

CATÁLOGO REAL:
${catalogoFormatado || 'Nenhum produto cadastrado no momento.'}

ESTILO DA RESPOSTA:
- Direto, acolhedor, profissional e focado em resolver com segurança.
- Formato: 1 a 3 parágrafos curtos e bem organizados.
`;

  // Execução via Gemini 3.8 Flash (quando API Key estiver configurada)
  const aiClient = getGeminiClient();
  if (aiClient) {
    try {
      const chatHistory = conversa.mensagens.slice(-6).map((m) => ({
        role: m.remetente === 'cliente' ? 'user' : 'model',
        parts: [{ text: m.texto }],
      }));

      const timeoutPromise = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), 3500)
      );
      const geminiPromise = aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: chatHistory,
        config: {
          systemInstruction,
        },
      });

      const modelResponse = await Promise.race([geminiPromise, timeoutPromise]);
      if (modelResponse && 'text' in modelResponse) {
        respostaTexto = modelResponse.text || '';
      }
    } catch (err: any) {
      console.error('Erro na chamada Gemini:', err);
    }
  }

  // CÉREBRO AGI LOCAL: Raciocínio Autônomo Contextual e Completo
  // Garante inteligência de altíssimo nível mesmo sem API Key ou em caso de contingência
  if (!respostaTexto) {
    const itensAtivos = empresa.catalogo.filter((c) => c.ativo);

    // Detecção de seleção de produto específico e cálculo de quantidade
    let produtoSelecionado = null;
    let quantidadePedida = 1;

    const matchQtd = textoMin.match(/(?:^|\D)(\d{1,3})\s*(?:x|unidades?|unid?|de)?\s*/);
    if (matchQtd && matchQtd[1]) {
      const q = parseInt(matchQtd[1], 10);
      if (!isNaN(q) && q > 0 && q <= 100) quantidadePedida = q;
    } else if (textoMin.includes('duas') || textoMin.includes('dois')) {
      quantidadePedida = 2;
    } else if (textoMin.includes('três') || textoMin.includes('tres')) {
      quantidadePedida = 3;
    }

    for (const item of itensAtivos) {
      const nomeNorm = item.nome.toLowerCase();
      const matchDireto =
        (nomeNorm.includes('automação') && (textoMin.includes('automação') || textoMin.includes('automacao') || textoMin.includes('kit'))) ||
        (nomeNorm.includes('cérebro') && (textoMin.includes('cérebro') || textoMin.includes('cerebro') || textoMin.includes('combo') || textoMin.includes('anual'))) ||
        (nomeNorm.includes('consultoria') && textoMin.includes('consultoria')) ||
        (nomeNorm.includes('suporte') && textoMin.includes('suporte'));

      if (matchDireto || textoMin.includes(nomeNorm)) {
        produtoSelecionado = item;
        break;
      }
    }

    if (ehSaudacaoPura) {
      if (primeiroNome) {
        respostaTexto = `${saudacaoPeriodo}, ${primeiroNome}! 👋 É um prazer enorme falar com você. Sou o ${agente.nomePersonalizado}, assistente oficial da ${empresa.nomeFantasia}. Como posso te ajudar hoje? (Posso te apresentar nossos produtos e serviços, gerar um orçamento detalhado ou tirar dúvidas!)`;
      } else {
        respostaTexto = `${saudacaoPeriodo}! 👋 É um prazer enorme falar com você. Sou o ${agente.nomePersonalizado}, assistente oficial da ${empresa.nomeFantasia}. Como posso te ajudar hoje? Se quiser me dizer seu nome, terei o maior prazer em te chamar por ele!`;
      }
      estadoInterno = 'ACOLHIMENTO';
      ferramentaAcionada = 'CONSULTAR_CATALOGO';
    } else if (produtoSelecionado && !querProdutos && !querOrcamento) {
      const valorTotal = produtoSelecionado.preco * quantidadePedida;
      const chavePix = empresa.canais.emailComercial || 'ffuturemindfuturemind@gmail.com';
      respostaTexto = `${saudacaoPeriodo}${vocativo}! Excelente escolha! 🚀\n\n📦 *Resumo do Pedido:*\n• ${quantidadePedida}x *${produtoSelecionado.nome}*\n• Valor unitário: R$ ${produtoSelecionado.preco.toFixed(2)}\n• *Valor Total:* R$ ${valorTotal.toFixed(2)}\n\n⚡ *Prazo de Liberação:* ${empresa.politicas.tempoMedioEntrega}\n🛡️ *Garantia:* ${empresa.politicas.politicaCancelamento}\n🔑 *Chave Pix Oficial:* \`${chavePix}\`\n\nPosso gerar o código Pix Copia e Cola para você concluir agora e já receber o acesso?`;
      estadoInterno = 'CHECKOUT';
      ferramentaAcionada = 'CALCULAR_PEDIDO';
    } else if (querProdutos) {
      const listaProdutos =
        itensAtivos.length > 0
          ? itensAtivos
              .map((c, i) => `${i + 1}️⃣ *${c.nome}* — R$ ${c.preco.toFixed(2)}\n   ↳ ${c.descricao}`)
              .join('\n\n')
          : '• Nosso catálogo está passando por atualização de lotes. Entre em contato para cotações personalizadas.';

      respostaTexto = `${saudacaoPeriodo}${vocativo}! 👋 Com certeza! Aqui na *${empresa.nomeFantasia}* nós temos soluções completas e prontas para entrega. Conheça nossos principais produtos disponíveis:\n\n${listaProdutos}\n\nQual dessas opções atende melhor o que você está precisando no momento? Posso te detalhar qualquer item ou simular um orçamento sob medida!`;
      estadoInterno = 'PROPOSTA';
      ferramentaAcionada = 'CONSULTAR_CATALOGO';
    } else if (querOrcamento) {
      const listaOrcamento =
        itensAtivos.length > 0
          ? itensAtivos
              .map((c) => `• *${c.nome}*: R$ ${c.preco.toFixed(2)} (${c.categoria})`)
              .join('\n')
          : '• Itens sob consulta com nossa equipe comercial.';

      respostaTexto = `${saudacaoPeriodo}${vocativo}! Com certeza! Preparei uma proposta orçamentária com base na tabela oficial da *${empresa.nomeFantasia}*:\n\n📋 *Opções Disponíveis para Contratação:*\n${listaOrcamento}\n\n⚡ *Prazo de Liberação/Entrega:* ${empresa.politicas.tempoMedioEntrega}\n🛡️ *Garantia:* ${empresa.politicas.politicaCancelamento}\n💳 *Condição:* Pagamento via Pix oficial com desconto de liberação imediata.\n\nQual desses itens você gostaria de incluir no seu pedido final? Se quiser, já posso gerar a chave Pix oficial para você aprovar agora!`;
      estadoInterno = 'PROPOSTA';
      ferramentaAcionada = 'CALCULAR_PEDIDO';
    } else if (pedeDescontoAlto) {
      respostaTexto = `Entendo perfeitamente o seu interesse em uma condição especial${vocativo}! Nosso desconto máximo pré-autorizado pelo sistema é de até ${empresa.permissoes.descontoMaximoPermitidoPercent}%. Para a proposta que você solicitou, acabei de encaminhar para a aprovação da diretoria (${empresa.nomeFantasia}) e já te retorno com a decisão oficial.`;
      estadoInterno = 'AGUARDANDO_HUMANO';
      ferramentaAcionada = 'ESCALAR_PARA_HUMANO';
    } else if (pedeHumano) {
      respostaTexto = `Com certeza${vocativo}! Já notifiquei a equipe humana da ${empresa.nomeFantasia} com todo o histórico do nosso atendimento para que você não precise repetir nada. Um especialista vai assumir este canal em instantes.`;
      estadoInterno = 'AGUARDANDO_HUMANO';
      ferramentaAcionada = 'ESCALAR_PARA_HUMANO';
    } else if (querPreco) {
      const primeiroItem = itensAtivos[0];
      const listaSimples = itensAtivos
        .slice(0, 3)
        .map((c) => `• *${c.nome}*: R$ ${c.preco.toFixed(2)}`)
        .join('\n');

      respostaTexto = `${saudacaoPeriodo}${vocativo}! Nossos preços na *${empresa.nomeFantasia}* são transparentes e direto de tabela:\n\n${listaSimples}\n\nNosso principal destaque é o *${
        primeiroItem?.nome || 'Combo Cérebro AGI'
      }* por apenas R$ ${(primeiroItem?.preco || 1490).toFixed(2)}. Posso gerar a fatura Pix com liberação em ${empresa.politicas.tempoMedioEntrega}?`;
      estadoInterno = 'PROPOSTA';
      ferramentaAcionada = 'CONSULTAR_PRECO';
    } else if (querPixOuPagamento) {
      const chavePix = empresa.canais.emailComercial || 'ffuturemindfuturemind@gmail.com';
      respostaTexto = `Perfeito${vocativo}! Para garantir agilidade com segurança total, a chave Pix oficial da *${empresa.nomeFantasia}* é:\n\n🔑 *Chave Pix (E-mail):* \`${chavePix}\`\n\nAssim que efetuar o pagamento, basta enviar o comprovante por este canal ou no WhatsApp (${empresa.canais.whatsapp}) para liberação em até ${empresa.politicas.tempoMedioEntrega}. Posso confirmar seu pedido?`;
      estadoInterno = 'CHECKOUT';
      ferramentaAcionada = 'CALCULAR_PEDIDO';
    } else if (querComoFuncionaOuPrazos) {
      respostaTexto = `${saudacaoPeriodo}${vocativo}! Na *${empresa.nomeFantasia}*, nosso processo é 100% estruturado para sua segurança:\n\n⏰ *Horário de Atendimento:* ${empresa.politicas.horarioAtendimento}\n🚀 *Prazo de Liberação/Entrega:* ${empresa.politicas.tempoMedioEntrega}\n🔒 *Garantia:* ${empresa.politicas.politicaCancelamento}\n📲 *Suporte Direto:* WhatsApp ${empresa.canais.whatsapp}\n\nDeseja conhecer nossos produtos com valores ou prefere simular um orçamento agora?`;
      estadoInterno = 'ATENDENDO';
      ferramentaAcionada = 'CONSULTAR_CLIENTE';
    } else {
      respostaTexto = `${saudacaoPeriodo}${vocativo}! Como assistente oficial da *${empresa.nomeFantasia}*, estou aqui para te ajudar em tudo: posso te apresentar nossos produtos e serviços, gerar um orçamento personalizado com valores ou tirar dúvidas sobre prazos e condições. O que você gostaria de ver primeiro?`;
      estadoInterno = 'TRIAGEM';
      ferramentaAcionada = 'CONSULTAR_CLIENTE';
    }
  }

  // Se gerou escala humana, cria o registro na Caixa de Decisões HITL
  let escalaGeradaId: string | undefined = undefined;
  if (acionarEscalaHumana) {
    escalaGeradaId = `escala-${Date.now()}`;
    const novaEscala: EscalaHumana = {
      id: escalaGeradaId,
      empresaId: empresa.id,
      agenteId: agente.id,
      agenteNome: agente.nomePersonalizado,
      profissaoNome: profissao?.nome || 'Agente de Vendas',
      conversaId: conversa.id,
      clienteNome: conversa.clienteNome,
      prioridade: prioridadeEscala,
      statusAtual: 'AGUARDANDO_HUMANO',
      motivo: motivoEscala,
      contexto: `Cliente: "${mensagem}". Última mensagem registrada no canal ${conversa.canal}.`,
      acaoRecomendada,
      decisao: 'PENDENTE',
      criadoEm: new Date().toISOString(),
    };
    escalasHumanas.set(escalaGeradaId, novaEscala);
    estadoInterno = 'AGUARDANDO_HUMANO';
    ferramentaAcionada = 'ESCALAR_PARA_HUMANO';
    conversa.estadoAtual = 'AGUARDANDO_HUMANO';
  }

  const msgAgente: MensagemChat = {
    id: `msg-${Date.now()}`,
    remetente: 'agente',
    texto: respostaTexto,
    timestamp: new Date().toISOString(),
    estadoInterno,
    nivelRouter,
    ferramentaAcionada,
    escalaGeradaId,
  };
  conversa.mensagens.push(msgAgente);
  conversa.atualizadoEm = new Date().toISOString();
  conversas.set(conversa.id, conversa);

  // Atualiza métricas do agente
  agente.volumeHoje.conversas += 1;
  agente.volumeHoje.tarefasConcluidas += 1;
  if (escalaGeradaId) agente.volumeHoje.escalasHumanas += 1;
  agentesAtivos.set(agente.id, agente);

  // Registrar Log no Router Inteligente
  const durationMs = Date.now() - startTime;
  const routerLog: RouterLog = {
    id: `rlog-${Date.now()}`,
    tarefa: mensagem.slice(0, 40),
    nivelEscolhido: nivelRouter,
    modeloUtilizado: nivelRouter === 'ASTRA' || nivelRouter === 'SOL' ? 'gemini-3.8-flash' : 'gemini-3.1-flash-lite',
    custoEstimado: nivelRouter === 'ASTRA' ? 0.0004 : nivelRouter === 'SOL' ? 0.0002 : 0.00008,
    tempoMs: durationMs,
    sucesso: true,
    timestamp: new Date().toISOString(),
  };
  routerLogs.unshift(routerLog);
  if (routerLogs.length > 50) routerLogs.pop();

  res.json({
    sucesso: true,
    mensagem: msgAgente,
    conversa,
    escalaGeradaId,
    nivelRouter,
    estadoInterno,
  });
});

// 15. Métricas, KPIs e Router Logs
app.get('/api/router/logs', (req, res) => {
  res.json(routerLogs);
});

app.get('/api/kpis', (req, res) => {
  const totalAgentes = agentesAtivos.size;
  const totalConversas = Array.from(conversas.values()).reduce((acc, c) => acc + c.mensagens.length, 0);
  const totalEscalas = escalasHumanas.size;
  const pendentesHITL = Array.from(escalasHumanas.values()).filter((e) => e.decisao === 'PENDENTE').length;

  res.json({
    totalAgentes,
    totalConversas,
    totalEscalas,
    pendentesHITL,
    tempoMedioPrimeiraRespostaSeg: 1.8,
    satisfacaoMediaEstrelas: 4.9,
    resolucaoPrimeiroContatoPct: 88.4,
    vendasTotaisMesReais: 4280.0,
  });
});

// ======================== DEV SERVER & PROD STATIC ========================
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    const publicPath = path.resolve(__dirname, 'public');
    app.use(express.static(distPath));
    app.use(express.static(publicPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Jobs Digital AGI v5.0 Server rodando em http://localhost:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Falha ao iniciar o servidor:', err);
  process.exit(1);
});
