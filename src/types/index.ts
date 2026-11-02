export type GradienteTipo = 'laranja' | 'roxo' | 'laranja_roxo' | 'roxo_laranja';

export interface Profissao {
  id: number;
  nome: string;
  emoji: string;
  fotoAvatar: string;
  avatarUrl?: string;
  descricao: string;
  gradiente: GradienteTipo;
  ordem: number;
  ativo: boolean;
}

export interface AgenteTemplate {
  id: string;
  profissaoId: number;
  nome: string;
  segmento: string;
  descricaoCurta: string;
  fotoAvatar?: string;
  recursos: string[];
  plano: string;
  precoMensal: number;
  destaque: boolean;
  ativo: boolean;
  criadoEm: string;
  cerebroVersao: string;
}

export interface CanaisAtendimento {
  whatsapp: string;
  whatsappConectado: boolean;
  telegram: string;
  telegramConectado: boolean;
  emailComercial: string;
  webchat: boolean;
}

export interface CatalogoItem {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  descricao: string;
  estoque: number;
  ativo: boolean;
}

export interface PoliticasEmpresa {
  horarioAtendimento: string;
  tempoMedioEntrega: string;
  politicaCancelamento: string;
  politicaGarantia: string;
  observacoes: string;
}

export interface PermissoesAlcada {
  alcadaMaximaAutonomiaReais: number; // Ex: pedidos até R$ 500 sem aprovação humana
  descontoMaximoPermitidoPercent: number; // Ex: máx 10%
  permitirReembolsoAutonomo: boolean;
  permitirExclusaoDados: boolean;
  ferramentasHabilitadas: {
    whatsapp: boolean;
    pix: boolean;
    crm: boolean;
    consultarEstoque: boolean;
    emitirBoleto: boolean;
    notificacoes: boolean;
  };
}

export interface Empresa {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpjOuCpf: string;
  segmento: string;
  descricao: string;
  site?: string;
  cidade?: string;
  estado?: string;
  canais: CanaisAtendimento;
  catalogo: CatalogoItem[];
  politicas: PoliticasEmpresa;
  permissoes: PermissoesAlcada;
  tomDeVoz: string; // Ex: "Empático, didático e profissional com emojis moderados"
  termosAceitosEm: string;
  criadaEm: string;
}

export type PerfilUsuario = 'DONO' | 'ADMIN_PLATAFORMA' | 'SUPERVISOR' | 'ATENDENTE';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  empresaId: string;
  perfil: PerfilUsuario;
  criadoEm: string;
}

export type StatusAgente = 'TESTE' | 'ATIVO' | 'PAUSADO';

export interface AgenteAtivo {
  id: string;
  empresaId: string;
  profissaoId: number;
  templateId: string;
  nomePersonalizado: string;
  fotoAvatar?: string;
  status: StatusAgente;
  modoSupervisao: boolean;
  linkAtendimentoPublico: string;
  webhookWhatsAppUrl?: string;
  volumeHoje: {
    conversas: number;
    vendasReais: number;
    escalasHumanas: number;
    tarefasConcluidas: number;
  };
  criadoEm: string;
  ultimoAcessoEm: string;
  planoPrecoMensal: number;
  testeGratuito?: {
    ativo: boolean;
    iniciadoEm: string;
    expiraEm: string;
    duracaoHoras: number;
    expirado: boolean;
  };
}

export type StatusPedidoPix = 'PENDENTE_PAGAMENTO' | 'CONFIRMADO' | 'CANCELADO';

export interface ContratacaoPedido {
  id: string;
  templateId: string;
  profissaoId: number;
  nomeAgente: string;
  precoMensal: number;
  chavePixDestino: string; // ffuturemindfuturemind@gmail.com
  pixCopiaECola: string;
  status: StatusPedidoPix;
  transacaoId?: string;
  comprovanteCodigo?: string;
  criadoEm: string;
  pagoEm?: string;
  liberadoParaAtivacao: boolean;
}

export type PrioridadeEscala = 'URGENTE' | 'ALCADA' | 'CONSULTA' | 'INFORMATIVO';
export type DecisaoEscala = 'PENDENTE' | 'APROVADO' | 'RECUSADO' | 'ASSUMIDO';

export interface EscalaHumana {
  id: string;
  empresaId: string;
  agenteId: string;
  agenteNome: string;
  profissaoNome: string;
  conversaId: string;
  clienteNome: string;
  prioridade: PrioridadeEscala;
  statusAtual: string;
  motivo: string;
  contexto: string;
  acaoRecomendada: string;
  decisao: DecisaoEscala;
  decididoPor?: string;
  decididoEm?: string;
  respostaHumano?: string;
  criadoEm: string;
}

export type NivelRouter = 'LUNA' | 'TERRA' | 'SOL' | 'ASTRA';

export interface MensagemChat {
  id: string;
  remetente: 'cliente' | 'agente' | 'humano';
  texto: string;
  timestamp: string;
  estadoInterno?: string;
  nivelRouter?: NivelRouter;
  ferramentaAcionada?: string;
  escalaGeradaId?: string;
}

export interface Conversa {
  id: string;
  agenteId: string;
  clienteNome: string;
  clienteContato: string;
  canal: 'WHATSAPP' | 'TELEGRAM' | 'WEBCHAT';
  estadoAtual: string; // Ex: ATENDENDO, QUALIFICANDO, NEGOCIACAO, AGUARDANDO_HUMANO, RESOLVIDO
  mensagens: MensagemChat[];
  assumidoPorHumano: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface RouterLog {
  id: string;
  tarefa: string;
  nivelEscolhido: NivelRouter;
  modeloUtilizado: string;
  custoEstimado: number;
  tempoMs: number;
  sucesso: boolean;
  timestamp: string;
}
