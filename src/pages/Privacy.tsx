import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background relative overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <motion.button 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={20} />
          <span className="font-medium text-sm">Voltar</span>
        </motion.button>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Política de Privacidade</h1>
            <p className="text-muted-foreground text-sm">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>

          <div className="prose prose-sm md:prose-base prose-zinc dark:prose-invert">
            <h2>Transparência em Primeiro Lugar</h2>
            <p>
              Acreditamos que você é o único dono dos seus dados financeiros. Nossa política é clara, 
              simples e projetada para manter a sua confiança.
            </p>

            <h2>Dados que Coletamos</h2>
            <p>
              Nós coletamos apenas as informações absolutamente necessárias para fazer o 
              aplicativo funcionar. Isso inclui:
            </p>
            <ul>
              <li><strong>Dados da Conta:</strong> Seu nome, e-mail (para fins de login e identificação) e a sua foto de perfil.</li>
              <li><strong>Dados Financeiros:</strong> As categorias, metas, despesas e receitas que você cadastra ativamente dentro da plataforma.</li>
            </ul>

            <h2>O que NÃO Fazemos com Seus Dados</h2>
            <ul>
              <li><strong>Nós NÃO vendemos seus dados:</strong> Seu fluxo de caixa não é comercializado com anunciantes ou terceiros.</li>
              <li><strong>Nós NÃO compartilhamos transações:</strong> Suas movimentações são protegidas por banco de dados com RLS (Segurança em Nível de Linha), o que significa que o sistema blinda os dados e garante que apenas você possa acessá-los.</li>
            </ul>

            <h2>Armazenamento e Segurança</h2>
            <p>
              Seus dados são armazenados na nossa infraestrutura utilizando protocolos 
              rigorosos de segurança e criptografia. Nossas comunicações utilizam criptografia 
              HTTPS ponta a ponta.
            </p>

            <h2>Exclusão Definitiva</h2>
            <p>
              Caso decida deixar de usar o aplicativo, a exclusão da sua conta nas configurações 
              garante que <strong>todos os seus dados financeiros, registros, anexos (como foto de perfil) serão 
              apagados permanentemente</strong> dos nossos servidores sem possibilidade de recuperação.
            </p>

            <h2>Contato</h2>
            <p>
              Dúvidas sobre sua privacidade? Sinta-se confortável para nos enviar qualquer 
              pergunta ou sugestão relacionada à segurança da sua conta. Nós estamos prontos 
              para esclarecer tudo que você precisar.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
