import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Terms() {
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
            <h1 className="text-3xl font-bold tracking-tight mb-2">Termos de Serviço</h1>
            <p className="text-muted-foreground text-sm">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>

          <div className="prose prose-sm md:prose-base prose-zinc dark:prose-invert">
            <h2>1. Aceitação dos Termos</h2>
            <p>
              Ao criar uma conta e utilizar o BrazeFlow, você concorda com estes Termos de Serviço. 
              Se você não concordar com qualquer parte destes termos, não deverá usar o aplicativo.
            </p>

            <h2>2. Descrição do Serviço</h2>
            <p>
              O BrazeFlow é uma plataforma de gestão financeira pessoal que permite aos usuários 
              acompanhar receitas, despesas e metas financeiras. Oferecemos ferramentas de 
              análise e visualização para ajudar no controle do seu dinheiro.
            </p>

            <h2>3. Contas de Usuário</h2>
            <p>
              Você é responsável por manter a confidencialidade da sua conta e senha. Você 
              concorda em aceitar a responsabilidade por todas as atividades que ocorram sob 
              sua conta. Seus dados são de sua inteira responsabilidade.
            </p>

            <h2>4. Privacidade e Segurança dos Dados</h2>
            <p>
              O BrazeFlow leva a segurança dos seus dados a sério. Utilizamos práticas 
              padrões da indústria para proteger suas informações financeiras contra acessos 
              não autorizados, e não comercializamos nenhuma das suas atividades e hábitos de consumo. 
              Consulte nossa <strong>Política de Privacidade</strong> para mais detalhes.
            </p>

            <h2>5. Limitação de Responsabilidade</h2>
            <p>
              O BrazeFlow é uma ferramenta de gestão e não oferece aconselhamento financeiro, 
              legal ou de investimentos. Qualquer decisão financeira é de sua total 
              responsabilidade. Não nos responsabilizamos sobre eventuais perdas financeiras.
            </p>

            <h2>6. Cancelamento e Encerramento</h2>
            <p>
              Você pode excluir sua conta e todos os seus dados a qualquer momento diretamente 
              pelas configurações do aplicativo. Nos reservamos o direito de suspender ou encerrar 
              contas que violem estes Termos.
            </p>

            <h2>7. Modificações dos Termos</h2>
            <p>
              Podemos atualizar estes termos ocasionalmente. Mudanças significativas serão 
              notificadas através do aplicativo. O uso contínuo do serviço após tais mudanças 
              constitui aceitação dos novos termos.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
