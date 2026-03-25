import { Switch, Route, useLocation } from "wouter"
import { useAuth } from "./contexts/AuthContext"
import Dashboard from "./pages/Dashboard"
import { Chat } from "./pages/Chat"
import { useState } from "react"
import { auth } from "./lib/firebase"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { S, BRAND } from "./lib/design"

function Home() {
  const { user, login } = useAuth();
  const [, setLocation] = useLocation();

  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (user) {
    return (
      <div style={{ minHeight: "100vh", background: BRAND.bg, display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
        <div style={{ width: "360px", background: BRAND.white, borderRadius: "16px", border: `1px solid ${BRAND.border}`, padding: "32px", boxShadow: "0 4px 24px rgba(30,58,95,0.10)", textAlign: "center" }}>
          <p style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: "800", color: BRAND.primary }}>Road Buddies</p>
          <p style={{ margin: "0 0 24px", fontSize: "13px", color: BRAND.textMuted }}>Sessão Iniciada</p>
          <div style={{ background: BRAND.primarySurface, borderRadius: "8px", padding: "12px", marginBottom: "16px", fontSize: "13px" }}>
            <p style={{ margin: 0, fontWeight: "600", color: BRAND.primaryLight }}>Ligado(a) como</p>
            <p style={{ margin: "2px 0 0", color: BRAND.text }}>{user.email}</p>
          </div>
          <button style={S.submitBtn} onClick={() => setLocation("/dashboard")}>
            Entrar no Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleGoogleLogin = async () => {
    try {
      setErrorMsg('');
      setIsProcessing(true);
      await login();
    } catch (error: any) {
      console.error('Google login failed:', error);
      setErrorMsg('Unable to sign in with Google.');
      setIsProcessing(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!loginEmail || !loginPassword) {
      setErrorMsg('Please enter both email and password');
      return;
    }
    try {
      setIsProcessing(true);
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (error: any) {
      console.error('Email login failed:', error);
      setErrorMsg(error.message || 'Invalid email or password');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!registerName.trim()) {
      setErrorMsg('Por favor indique o seu nome.');
      return;
    }
    if (!registerEmail || !registerPassword) {
      setErrorMsg('Preencha todos os campos');
      return;
    }
    if (registerPassword !== registerConfirmPassword) {
      setErrorMsg('As palavras-passe não coincidem');
      return;
    }
    try {
      setIsProcessing(true);
      const cred = await createUserWithEmailAndPassword(auth, registerEmail, registerPassword);
      await updateProfile(cred.user, { displayName: registerName.trim() });
      setSuccessMsg('Conta criada! Aguarda aprovação de um administrador.');
    } catch (error: any) {
      console.error('Registration failed:', error);
      const msg = error.code === 'auth/email-already-in-use'
        ? 'Este e-mail já está registado.'
        : error.code === 'auth/weak-password'
        ? 'A palavra-passe deve ter pelo menos 6 caracteres.'
        : error.message || 'Não foi possível criar a conta';
      setErrorMsg(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: BRAND.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "360px", background: BRAND.white, borderRadius: "16px", border: `1px solid ${BRAND.border}`, padding: "32px", boxShadow: "0 4px 24px rgba(30,58,95,0.10)" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <p style={{ margin: "0 0 4px", fontSize: "22px", fontWeight: "800", color: BRAND.primary }}>Road Buddies</p>
          <p style={{ margin: 0, fontSize: "13px", color: BRAND.textMuted }}>A aplicação de carsharing da LOBA</p>
        </div>
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          <button style={{ ...S.tab(activeTab === "login"), flex: 1 }} onClick={() => { setActiveTab("login"); setErrorMsg(''); setSuccessMsg(''); }}>Login</button>
          <button style={{ ...S.tab(activeTab === "register"), flex: 1 }} onClick={() => { setActiveTab("register"); setErrorMsg(''); setSuccessMsg(''); }}>Registo</button>
        </div>
        
        {activeTab === "login" ? (
          <form onSubmit={handleEmailLogin}>
            <div style={S.formGroup}>
              <label style={S.label}>E-mail</label>
              <input style={S.input} type="email" placeholder="nome@empresa.pt" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} disabled={isProcessing} />
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Palavra-Passe</label>
              <input style={S.input} type="password" placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} disabled={isProcessing} />
            </div>
            {errorMsg && <p style={{ color: BRAND.danger, fontSize: "12px", marginBottom: "8px", fontWeight: "600" }}>{errorMsg}</p>}
            <button type="submit" style={{ ...S.submitBtn, marginBottom: "12px" }} disabled={isProcessing}>
              {isProcessing ? 'A entrar...' : 'Login'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div style={S.formGroup}>
              <label style={S.label}>Nome</label>
              <input style={S.input} type="text" placeholder="O seu nome" value={registerName} onChange={(e) => setRegisterName(e.target.value)} disabled={isProcessing} />
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>E-mail</label>
              <input style={S.input} type="email" placeholder="nome@empresa.pt" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} disabled={isProcessing} />
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Palavra-Passe</label>
              <input style={S.input} type="password" placeholder="••••••••" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} disabled={isProcessing} />
            </div>
            <div style={S.formGroup}>
              <label style={S.label}>Confirmar Palavra-Passe</label>
              <input style={S.input} type="password" placeholder="••••••••" value={registerConfirmPassword} onChange={(e) => setRegisterConfirmPassword(e.target.value)} disabled={isProcessing} />
            </div>
            {errorMsg && <p style={{ color: BRAND.danger, fontSize: "12px", marginBottom: "8px", fontWeight: "600" }}>{errorMsg}</p>}
            {successMsg && <p style={{ color: BRAND.success, fontSize: "12px", marginBottom: "8px", fontWeight: "600" }}>{successMsg}</p>}
            <button type="submit" style={{ ...S.submitBtn, marginBottom: "12px" }} disabled={isProcessing}>
              {isProcessing ? 'A criar...' : 'Criar Conta'}
            </button>
          </form>
        )}

        <div style={{ textAlign: "center", color: BRAND.textMuted, fontSize: "12px", marginBottom: "8px", marginTop: "12px" }}>ou Login com Google</div>
        <button type="button" onClick={handleGoogleLogin} disabled={isProcessing} style={{ ...S.btnSecondary, width: "100%", padding: "9px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z"/><path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"/><path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
          Google
        </button>
      </div>
    </div>
  );
}

function PendingVerification() {
  const { logout, user, updateDbUser } = useAuth();
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('Código enviado para o teu e-mail.');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!code.trim() || code.length !== 6) {
      setErrorMsg('Insere um código de 6 dígitos.');
      return;
    }
    try {
      setIsSubmitting(true);
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('http://localhost:3000/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Código inválido.');
        return;
      }
      updateDbUser(data.user);
    } catch {
      setErrorMsg('Erro de ligação. Tenta novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      setIsResending(true);
      const token = await auth.currentUser?.getIdToken();
      await fetch('http://localhost:3000/api/auth/resend-code', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccessMsg('Novo código enviado!');
    } catch {
      setErrorMsg('Não foi possível reenviar.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: BRAND.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "380px", background: BRAND.white, borderRadius: "16px", border: `1px solid ${BRAND.border}`, padding: "40px 32px", boxShadow: "0 4px 24px rgba(30,58,95,0.10)", textAlign: "center" }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: BRAND.accentLight, border: `2px solid ${BRAND.accent}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={BRAND.accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>
        <p style={{ margin: "0 0 6px", fontSize: "20px", fontWeight: "700", color: BRAND.text }}>Verifica o teu e-mail</p>
        <p style={{ margin: "0 0 4px", fontSize: "13px", fontWeight: "600", color: BRAND.primaryLight }}>{user?.email}</p>
        <p style={{ margin: "0 0 24px", fontSize: "13px", color: BRAND.textMuted, lineHeight: 1.6 }}>Enviamos um código de 6 dígitos para o teu e-mail. Insere-o abaixo para ativar a tua conta.</p>
        <form onSubmit={handleVerify}>
          <input
            style={{ ...S.input, textAlign: "center", fontSize: "24px", fontWeight: "700", letterSpacing: "8px", marginBottom: "12px" }}
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
          />
          {successMsg && <p style={{ color: BRAND.success, fontSize: "12px", marginBottom: "8px", fontWeight: "600" }}>{successMsg}</p>}
          {errorMsg && <p style={{ color: BRAND.danger, fontSize: "12px", marginBottom: "8px", fontWeight: "600" }}>{errorMsg}</p>}
          <button type="submit" style={{ ...S.submitBtn, marginBottom: "12px" }} disabled={isSubmitting}>
            {isSubmitting ? 'A verificar...' : 'Verificar Conta'}
          </button>
        </form>
        <button style={{ ...S.btnSecondary, width: "100%", marginBottom: "8px" }} onClick={handleResend} disabled={isResending}>
          {isResending ? 'A reenviar...' : 'Reenviar Código'}
        </button>
        <button style={{ background: "none", border: "none", color: BRAND.textMuted, fontSize: "12px", cursor: "pointer", textDecoration: "underline" }} onClick={logout}>Sair</button>
      </div>
    </div>
  );
}

function App() {
  const { user, dbUser, loading } = useAuth();

  if (loading) return (
    <div style={{ minHeight: "100vh", background: BRAND.bg, display: "flex", alignItems: "center", justifyContent: "center", color: BRAND.textMuted, fontSize: "14px", fontWeight: "500" }}>
      A carregar Road Buddies...
    </div>
  );

  if (user && !dbUser) {
    return (
      <div style={{ minHeight: "100vh", background: BRAND.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
         <div style={{ width: "380px", background: BRAND.white, borderRadius: "16px", border: `1px solid ${BRAND.danger}`, padding: "32px", textAlign: "center" }}>
            <p style={{ color: BRAND.danger, fontWeight: "700", fontSize: "18px", marginBottom: "8px" }}>Erro de Sincronização</p>
            <p style={{ color: BRAND.textMuted, fontSize: "13px", marginBottom: "20px" }}>Falha ao ligar os dados de conta ao servidor. Verifique a consola.</p>
            <button style={S.btnSecondary} onClick={() => window.location.reload()}>Tentar Novamente</button>
         </div>
      </div>
    );
  }

  if (user && dbUser && !dbUser.isVerified) {
    return <PendingVerification />;
  }

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/dashboard">
          {user ? <Dashboard /> : <Home />}
        </Route>
        <Route path="/chat/:tripId">
          {user ? <Chat /> : <Home />}
        </Route>
      </Switch>
    </div>
  )
}

export default App
