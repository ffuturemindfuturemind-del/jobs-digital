import React, { useState } from 'react';
import { Usuario, Empresa } from '../types';
import { X, Lock, Mail, Building2, User, Phone, CheckCircle2, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';

interface ModalAuthProps {
  onFechar: () => void;
  onLoginSucesso: (usuario: Usuario, empresa: Empresa) => void;
}

export const ModalAuth: React.FC<ModalAuthProps> = ({ onFechar, onLoginSucesso }) => {
  const [modo, setModo] = useState<'login' | 'cadastro'>('login');
  const [carregando, setCarregando] = useState(false);
  const [erroMsg, setErroMsg] = useState('');

  // Login
  const [emailLogin, setEmailLogin] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');

  // Cadastro
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [segmento, setSegmento] = useState('');
  const [whatsapp, setWhatsapp] = useState('');


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailLogin || !senhaLogin) {
      setErroMsg('Informe e-mail e senha.');
      return;
    }
    setCarregando(true);
    setErroMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailLogin, senha: senhaLogin }),
      });
      const data = await res.json();
      if (data.sucesso && data.usuario) {
        onLoginSucesso(data.usuario, data.empresa);
        onFechar();
      } else {
        setErroMsg(data.error || 'Credenciais inválidas.');
      }
    } catch (err) {
      console.error(err);
      setErroMsg('Falha de conexão com o servidor.');
    } finally {
      setCarregando(false);
    }
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !email || !senha) {
      setErroMsg('Preencha nome, e-mail e senha.');
      return;
    }
    setCarregando(true);
    setErroMsg('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          email,
          senha,
          nomeEmpresa: nomeEmpresa || `${nome} Escritório`,
          segmento: segmento || 'Escritório & Serviços',
          whatsapp: whatsapp || '+55 11 98888-7777',
        }),
      });
      const data = await res.json();
      if (data.sucesso && data.usuario) {
        onLoginSucesso(data.usuario, data.empresa);
        onFechar();
      } else {
        setErroMsg(data.error || 'Erro ao realizar cadastro.');
      }
    } catch (err) {
      console.error(err);
      setErroMsg('Falha de conexão com o servidor.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 my-8">
        {/* Fechar */}
        <button
          onClick={onFechar}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header */}
        <div className="space-y-1 text-center pb-4 border-b border-slate-800">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            Portal de Acesso Seguro
          </div>
          <h3 className="text-2xl font-black text-white tracking-tight">
            {modo === 'login' ? 'Entrar no seu Escritório' : 'Cadastrar seu Escritório'}
          </h3>
          <p className="text-xs text-slate-400">
            Acesse seu painel com login e senha para gerenciar seus agentes e clientes.
          </p>
        </div>

        {/* Alternar Abas Login / Cadastro */}
        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 mt-4 text-xs font-bold">
          <button
            onClick={() => {
              setModo('login');
              setErroMsg('');
            }}
            className={`flex-1 py-2 rounded-xl transition-all ${
              modo === 'login' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Já tenho conta (Login)
          </button>
          <button
            onClick={() => {
              setModo('cadastro');
              setErroMsg('');
            }}
            className={`flex-1 py-2 rounded-xl transition-all ${
              modo === 'cadastro' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Criar Escritório (Cadastro)
          </button>
        </div>

        {/* Mensagem de Erro */}
        {erroMsg && (
          <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
            {erroMsg}
          </div>
        )}

        {/* Formulário de Login */}
        {modo === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4 mt-4 text-xs">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">E-mail do Escritório</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="ex: contato@meuescritorio.com.br"
                  value={emailLogin}
                  onChange={(e) => setEmailLogin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={senhaLogin}
                  onChange={(e) => setSenhaLogin(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 transition-transform hover:scale-[1.01] disabled:opacity-50 mt-2"
            >
              {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              <span>ACESSAR PAINEL DO DONO</span>
            </button>
          </form>
        ) : (
          /* Formulário de Cadastro */
          <form onSubmit={handleCadastro} className="space-y-3 mt-4 text-xs">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">Seu Nome Completo *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ex: Dr. Roberto Guimarães"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">Nome do Escritório / Empresa *</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ex: Guimarães Advocacia & Consultoria"
                  value={nomeEmpresa}
                  onChange={(e) => setNomeEmpresa(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">E-mail *</label>
                <input
                  type="email"
                  placeholder="contato@escritorio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Senha *</label>
                <input
                  type="password"
                  placeholder="Criar senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Segmento</label>
                <input
                  type="text"
                  placeholder="Ex: Jurídico, Contábil"
                  value={segmento}
                  onChange={(e) => setSegmento(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-300 block mb-1">WhatsApp</label>
                <input
                  type="text"
                  placeholder="+55 11 99999-9999"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={carregando}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 transition-transform hover:scale-[1.01] disabled:opacity-50 mt-2"
            >
              {carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>CRIAR CONTA DO ESCRITÓRIO</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
