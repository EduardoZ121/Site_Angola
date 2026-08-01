/**
 * Auth copy — pt-AO (MVP). Keys reserved for en without EN UI in MVP.
 * Source: docs/backlog/PRD_001_CONTENT_INVENTORY.md + PRD §18 wireframes.
 */
export const authCopyPt = {
  brand: {
    name: 'Kuteka',
  },
  common: {
    loading: 'A carregar…',
    networkError: 'Não foi possível concluir o pedido. Verifique a ligação e tente novamente.',
    configMissing:
      'A autenticação ainda não está disponível neste ambiente. Pode explorar a Landing ou voltar mais tarde.',
    nextStepRetry: 'Tente novamente dentro de alguns minutos.',
    rateLimited:
      'Demasiados pedidos neste momento. Aguarde cerca de uma hora e tente novamente — ou entre se já criou a conta.',
    sessionExpired: 'A sua sessão expirou ou não foi iniciada. Entre novamente para continuar.',
    showPassword: 'Mostrar',
    hidePassword: 'Ocultar',
  },
  register: {
    title: 'Criar conta',
    subtitle: 'Comece em minutos. Uma conta, os seus papéis, o seu espaço Kuteka.',
    email: {
      label: 'Email',
      hint: 'Usamos o email para proteger e recuperar a conta.',
      placeholder: 'nome@email.com',
    },
    password: {
      label: 'Password',
      placeholder: 'Crie uma password segura',
      ruleMin: 'Pelo menos 8 caracteres',
      ruleUpper: 'Uma letra maiúscula',
      ruleNumber: 'Um número',
    },
    confirm: { label: 'Confirmar password', placeholder: 'Repita a password' },
    terms: {
      label: 'Aceito os Termos de utilização',
      linkLabel: 'Termos de utilização',
    },
    submit: 'Criar conta',
    submitLoading: 'A criar conta…',
    submitSuccess: 'Conta criada',
    ctaLogin: 'Já tem conta? Entrar',
    duplicate: {
      title: 'Este email já tem uma conta Kuteka.',
      body: 'Em vez de criar outra conta, entre ou recupere o acesso com o mesmo email.',
      login: 'Entrar',
      recover: 'Recuperar acesso',
    },
  },
  verify: {
    title: 'Verifique o seu email',
    subtitle:
      'Se pedimos confirmação, abra o email da Kuteka. Caso já tenha sessão activa, pode continuar.',
    sentTo: 'Enviado para',
    resend: 'Reenviar email',
    resendLoading: 'A reenviar…',
    resendSuccess: 'Email reenviado. Verifique também a pasta de Spam.',
    cooldown: 'Pode reenviar dentro de {seconds}s.',
    confirming: 'Estamos a confirmar a sua conta…',
    already: {
      title: 'A sua conta já se encontra confirmada.',
      cta: 'Entrar na Kuteka',
    },
  },
  login: {
    title: 'Entrar',
    subtitle: 'Bem-vindo de volta ao seu espaço Kuteka.',
    email: { label: 'Email', placeholder: 'nome@email.com' },
    password: { label: 'Password', show: 'Mostrar', placeholder: 'A sua password' },
    submit: 'Entrar',
    submitLoading: 'A entrar…',
    submitSuccess: 'Sessão iniciada',
    ctaRegister: 'Criar conta',
    ctaRecover: 'Esqueceu a password?',
    errorGeneric:
      'Não foi possível entrar. Verifique o email e a password. Se precisar, use Recuperar acesso.',
  },
  logout: {
    title: 'A terminar sessão',
    pending: 'A terminar a sua sessão com segurança…',
    done: 'Terminou a sua sessão com sucesso. Pode voltar a entrar sempre que desejar.',
    expired: 'A sua sessão expirou. Entre novamente para continuar.',
    action: 'Terminar sessão',
  },
  recover: {
    request: {
      title: 'Recuperar acesso',
      subtitle: 'Não se preocupe. Vamos ajudá-lo a recuperar o acesso de forma segura.',
      email: { label: 'Email' },
      submit: 'Enviar instruções',
      submitLoading: 'A enviar…',
      back: 'Voltar a Entrar',
      noemail: 'Sem acesso ao email? Contacto',
      success: 'Se existir uma conta com este email, enviámos instruções.',
    },
    confirm: {
      title: 'Nova password',
      subtitle: 'Defina uma password segura para recuperar o acesso à sua conta.',
      password: { label: 'Password' },
      confirm: { label: 'Confirmar password' },
      submit: 'Guardar',
      submitLoading: 'A guardar…',
      submitSuccess: 'Password actualizada',
    },
  },
  onboarding: {
    welcomeTitle: 'Bem-vindo à Kuteka',
    welcomeSubtitle: 'A sua conta está quase pronta. Vamos concluir uma configuração rápida.',
    roles: {
      title: 'Como quer usar a Kuteka?',
      hint: 'Indique como pretende usar a Kuteka. Pode alterar ou acrescentar papéis mais tarde.',
      client: 'Cliente',
      clientDesc: 'Procurar, reservar ou gerir o seu percurso habitacional.',
      partner: 'Parceiro Patrimonial',
      partnerDesc: 'Disponibilizar e gerir patrimónios.',
      multiRole:
        'Pode seleccionar um ou ambos. A mesma conta pode assumir vários papéis conforme as suas necessidades.',
      selectAtLeastOne: 'Escolha pelo menos um papel para continuar.',
      agentNote: 'Agente e Administrador são atribuídos pela Kuteka.',
      submit: 'Continuar',
      submitLoading: 'A activar…',
      success: 'A sua conta está pronta. Bem-vindo à Kuteka.',
    },
    profile: {
      title: 'Como prefere ser chamado?',
      subtitle: 'Este nome aparece no seu espaço Kuteka. Pode alterá-lo depois.',
      displayName: { label: 'Nome de apresentação' },
      submit: 'Continuar',
      submitLoading: 'A guardar…',
      skip: 'Continuar sem nome',
    },
  },
  app: {
    title: 'Painel Kuteka',
    welcome: 'Bem-vindo',
    welcomeAnonymous: 'Bem-vindo à plataforma',
    emailLabel: 'Email',
    userFallback: 'Utilizador Kuteka',
    active: 'Conta activa',
    accountStatusTitle: 'Estado da conta',
    accountStatusHint: 'Conta pronta para utilizar os módulos disponíveis.',
    accountSummaryAria: 'Resumo da conta',
    dashboardHint: 'Aceda aos módulos activos da plataforma a partir daqui ou da navegação.',
    rolesLabel: 'Papéis activos',
    rolesHint: 'A mesma conta pode assumir vários papéis.',
    noRoles: 'Ainda sem papéis activos',
    modulesTitle: 'Módulos',
    modulesHint: 'Módulos activos e áreas ainda em desenvolvimento.',
    upcomingTitle: 'Módulos',
    moduleAvailable: 'Activo',
    moduleUnavailable: 'Em desenvolvimento',
    loadError: 'Não foi possível carregar o seu espaço. Tente novamente dentro de momentos.',
    stub: 'Utilize os módulos activos com a mesma conta e os seus papéis.',
    ctaLanding: 'Voltar à Landing',
    ctaProfile: 'Perfil',
    ctaRoles: 'Gerir papéis',
    adminTitle: 'Administração',
    adminStub:
      'Área administrativa (permissão admin.panel). Os painéis de negócio serão disponibilizados nas próximas fases.',
    adminForbidden:
      'Não tem permissão para aceder a esta área (admin.panel). Se acredita que isto é um erro, contacte a Kuteka.',
    configMissing:
      'A área autenticada requer a configuração do Supabase. Defina as variáveis de ambiente e volte a tentar.',
  },
} as const;

export type AuthCopy = typeof authCopyPt;
