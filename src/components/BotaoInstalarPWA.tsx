import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const BotaoInstalarPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [podeInstalar, setPodeInstalar] = useState<boolean>(false);
  const [instalado, setInstalado] = useState<boolean>(false);
  const [mostrarModalIos, setMostrarModalIos] = useState<boolean>(false);
  const [dispIos, setDispIos] = useState<boolean>(false);

  useEffect(() => {
    // Detectar iOS
    const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as unknown as { standalone?: boolean }).standalone;
    
    if (isIos && !isStandalone) {
      setDispIos(true);
    }

    // Capturar evento padrão do Android / Chrome / Edge
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setPodeInstalar(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    window.addEventListener('appinstalled', () => {
      setInstalado(true);
      setPodeInstalar(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstalarClick = async () => {
    if (dispIos) {
      setMostrarModalIos(true);
      return;
    }

    if (!deferredPrompt) {
      // Se já está no navegador e ainda não disparou o prompt, orienta o usuário
      alert('Para instalar:\nNo Chrome ou Edge, clique no menu de 3 pontinhos (⋮) e escolha "Instalar Aplicativo" ou "Adicionar à tela de início".');
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstalado(true);
        setPodeInstalar(false);
      }
    } catch (err) {
      console.error('Erro ao acionar prompt de instalação:', err);
    }
  };

  if (instalado) return null;

  return (
    <>
      {/* Botão de Instalação no Header / Barra Superior */}
      <button
        onClick={handleInstalarClick}
        title="Instalar App no Celular ou Computador"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500/20 to-purple-500/20 hover:from-orange-500/30 hover:to-purple-500/30 border border-orange-500/40 text-orange-300 hover:text-white text-xs font-bold transition-all shadow-sm hover:scale-105"
      >
        <Smartphone className="w-3.5 h-3.5 text-orange-400" />
        <span className="hidden sm:inline">Instalar App</span>
        <Download className="w-3.5 h-3.5 text-orange-400" />
      </button>

      {/* Modal Guiado para usuários de iPhone / Safari */}
      {mostrarModalIos && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
            <button
              onClick={() => setMostrarModalIos(false)}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center mb-4">
              <Smartphone className="w-6 h-6 text-orange-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Instalar no iPhone / iPad</h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Você pode ter o <strong>Jobs Digital</strong> como aplicativo nativo na tela inicial:
            </p>
            <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 mb-5">
              <li>Toque no botão <strong>Compartilhar</strong> (ícone do quadrado com seta para cima no Safari).</li>
              <li>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>.</li>
              <li>Toque em <strong>Adicionar</strong> no canto superior direito.</li>
            </ol>
            <button
              onClick={() => setMostrarModalIos(false)}
              className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
};
