import React, { useMemo, useState } from 'react';
import './App.css';

function App() {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const formatSaoPaulo = (isoString: string): string => {
    const date = new Date(isoString);
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const [datePart, timePart] = formatter.format(date).split(' ');
    return `${datePart} às ${timePart}`;
  };

  const maxChars = 5000;
  const charCount = useMemo(() => text.length, [text]);
  const isDisabled = !text.trim() || isSubmitting || charCount > maxChars;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim()) {
      setMessage('Por favor, descreva seu relato antes de enviar.');
      return;
    }

    if (charCount > maxChars) {
      setMessage('O texto excede o limite de 5000 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    const timestampISO = new Date().toISOString();
    const timestampDisplay = formatSaoPaulo(timestampISO);

    try {
      // Enviar tudo para o backend: ele salva no Supabase e envia o e-mail
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000';
      const response = await fetch(`${backendUrl}/relato`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim(), timestampISO, timestampDisplay }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro inesperado ao enviar relato');
      }

      setMessage('Relato enviado com sucesso!');
      setText('');
    } catch (err: any) {
      setMessage(`Erro ao enviar: ${err?.message || 'Verifique sua conexão.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page">
      {/* Header com logo */}
      <header className="site-header">
        <div className="brand">
          <div className="brand-logo" aria-hidden>
            <img src="/fa.webp" alt="Logo" className="brand-logo-img" />
          </div>
        </div>
      </header>

      {/* Hero com título e subtítulo */}
      <section className="hero">
        <h1 className="hero-title">Canal de Denúncias</h1>
      </section>

      {/* Conteúdo principal */}
      <main className="content">
        {/* Card de política de privacidade */}
        <div className="policy-card">
          <div className="policy-icon" aria-hidden>🛡️</div>
          <div className="policy-body">
            <div className="policy-title">Política de Privacidade</div>
            <p className="policy-text">
              Este canal é seguro e anônimo. Não coletamos dados pessoais identificáveis. Seu relato
              será tratado com absoluta confidencialidade e utilizado apenas para fins de melhoria
              organizacional.
            </p>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="relato-form">
          <label className="field-label">Descreva sua experiência ou situação</label>
          <div className="textarea-wrapper">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escreva aqui seu relato de forma livre. Quanto mais detalhes você fornecer, melhor poderemos entender e agir sobre a situação..."
              className="textarea"
              rows={8}
              disabled={isSubmitting}
              maxLength={100000}
            />
          </div>
          <div className="char-counter">
            {charCount} caracteres {charCount > maxChars && (
              <span className="over-limit">(limite: {maxChars})</span>
            )}
          </div>

          <button type="submit" className="primary-button" disabled={isDisabled}> 
            Enviar relato
          </button>
        </form>
      </main>

      {/* Rodapé */}
      <footer className="site-footer">
        <span>Canal de Denúncias • 100% Anônimo</span>
      </footer>

      {/* Mensagens */}
      {message && (
        <div className={`toast ${message.toLowerCase().includes('sucesso') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </div>
  );
}

export default App;
