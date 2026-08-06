import type { AuthCopy } from './pt';

/** Auth UI copy — es. */
export const authCopyEs: AuthCopy = {
  brand: {
    name: 'Kuteka',
  },
  common: {
    loading: 'Cargando…',
    networkError:
      'No fue posible completar la solicitud. Compruebe la conexión e inténtelo de nuevo.',
    configMissing:
      'La autenticación aún no está disponible en este entorno. Puede explorar la Landing o volver más tarde.',
    nextStepRetry: 'Inténtelo de nuevo en unos minutos.',
    rateLimited:
      'Demasiadas solicitudes en este momento. Espere cerca de una hora e inténtelo de nuevo — o inicie sesión si ya creó la cuenta.',
    sessionExpired: 'Su sesión expiró o no se inició. Entre de nuevo para continuar.',
    showPassword: 'Mostrar',
    hidePassword: 'Ocultar',
  },
  register: {
    title: 'Crear cuenta',
    subtitle: 'Empiece en minutos. Una cuenta, sus roles, su espacio Kuteka.',
    email: {
      label: 'Email',
      hint: 'Usamos el email para proteger y recuperar la cuenta.',
      placeholder: 'nombre@email.com',
    },
    password: {
      label: 'Contraseña',
      placeholder: 'Cree una contraseña segura',
      ruleMin: 'Al menos 8 caracteres',
      ruleUpper: 'Una letra mayúscula',
      ruleNumber: 'Un número',
    },
    confirm: {
      label: 'Confirmar contraseña',
      placeholder: 'Repita la contraseña',
    },
    terms: {
      label: 'Acepto los Términos de uso',
      linkLabel: 'Términos de uso',
    },
    submit: 'Crear cuenta',
    submitLoading: 'Creando cuenta…',
    submitSuccess: 'Cuenta creada',
    ctaLogin: '¿Ya tiene cuenta? Entrar',
    duplicate: {
      title: 'Este email ya tiene una cuenta Kuteka.',
      body: 'En lugar de crear otra cuenta, entre o recupere el acceso con el mismo email.',
      login: 'Entrar',
      recover: 'Recuperar acceso',
    },
  },
  verify: {
    title: 'Verifique su email',
    subtitle:
      'Confirme con el código de 6 dígitos o abra el enlace del email de Kuteka. Ambos métodos son válidos.',
    sentTo: 'Enviado a',
    dualHint:
      'Prefiera introducir el código OTP abajo si el enlace no abre en su dispositivo o cliente de correo.',
    otpLabel: 'Código de 6 dígitos',
    otpPlaceholder: '000000',
    otpSubmit: 'Confirmar con código',
    orLink: 'o',
    linkHint: 'También puede abrir el enlace de confirmación en el email (Método A).',
    sandboxHint: 'Entorno de prueba: código {code}',
    resend: 'Reenviar email y código',
    resendLoading: 'Reenviando…',
    resendSuccess: 'Email y código reenviados. Revise también Spam.',
    cooldown: 'Puede reenviar en {seconds}s.',
    confirming: 'Estamos confirmando su cuenta…',
    already: {
      title: 'Su cuenta ya está confirmada.',
      cta: 'Entrar en Kuteka',
    },
  },
  login: {
    title: 'Entrar',
    subtitle: 'Bienvenido de nuevo a su espacio Kuteka.',
    email: {
      label: 'Email',
      placeholder: 'nombre@email.com',
    },
    password: {
      label: 'Contraseña',
      show: 'Mostrar',
      placeholder: 'Su contraseña',
    },
    submit: 'Entrar',
    submitLoading: 'Entrando…',
    submitSuccess: 'Sesión iniciada',
    ctaRegister: 'Crear cuenta',
    ctaRecover: '¿Olvidó la contraseña?',
    errorGeneric:
      'No fue posible entrar. Compruebe el email y la contraseña. Si lo necesita, use Recuperar acceso.',
  },
  logout: {
    title: 'Cerrando sesión',
    pending: 'Terminando su sesión con seguridad…',
    done: 'Cerró la sesión con éxito. Puede volver a entrar cuando quiera.',
    expired: 'Su sesión expiró. Entre de nuevo para continuar.',
    action: 'Cerrar sesión',
  },
  recover: {
    request: {
      title: 'Recuperar acceso',
      subtitle: 'No se preocupe. Le ayudaremos a recuperar el acceso de forma segura.',
      channelLabel: '¿Cómo prefiere recuperar?',
      channelEmail: 'Por email',
      channelPhone: 'Por teléfono (SMS)',
      channelBoth: 'Email y teléfono',
      email: {
        label: 'Email',
      },
      phone: {
        label: 'Teléfono',
        placeholder: '+2449XXXXXXXX',
      },
      otpLabel: 'Código de 6 dígitos',
      otpSubmit: 'Validar código',
      sendOtp: 'Enviar código SMS',
      phoneSuccess:
        'Código SMS validado (sandbox). Defina una nueva contraseña cuando tenga sesión, o use también el email.',
      phonePrepared:
        'La recuperación por SMS está preparada (sandbox). En producción usará el proveedor SMS de Kuteka.',
      submit: 'Enviar instrucciones',
      submitLoading: 'Enviando…',
      back: 'Volver a Entrar',
      noemail: '¿Sin acceso al email? Contacto',
      success: 'Si existe una cuenta con este email, enviamos instrucciones.',
    },
    confirm: {
      title: 'Nueva contraseña',
      subtitle: 'Defina una contraseña segura para recuperar el acceso a su cuenta.',
      password: {
        label: 'Contraseña',
      },
      confirm: {
        label: 'Confirmar contraseña',
      },
      submit: 'Guardar',
      submitLoading: 'Guardando…',
      submitSuccess: 'Contraseña actualizada',
    },
  },
  onboarding: {
    welcomeTitle: 'Bienvenido a Kuteka',
    welcomeSubtitle: 'Su cuenta está casi lista. Completemos una configuración rápida.',
    roles: {
      title: '¿Cómo quiere usar Kuteka?',
      hint: 'Indique cómo pretende usar Kuteka. Puede cambiar o añadir roles más tarde.',
      client: 'Cliente',
      clientDesc: 'Buscar, reservar o gestionar su recorrido habitacional.',
      partner: 'Socio Patrimonial',
      partnerDesc: 'Publicar y gestionar patrimonios.',
      multiRole:
        'Puede seleccionar uno o ambos. La misma cuenta puede asumir varios roles según sus necesidades.',
      selectAtLeastOne: 'Elija al menos un rol para continuar.',
      agentNote: 'Agente y Administrador son asignados por Kuteka.',
      submit: 'Continuar',
      submitLoading: 'Activando…',
      success: 'Su cuenta está lista. Bienvenido a Kuteka.',
    },
    profile: {
      title: '¿Cómo prefiere que le llamemos?',
      subtitle: 'Este nombre aparece en su espacio Kuteka. Puede cambiarlo después.',
      displayName: {
        label: 'Nombre para mostrar',
      },
      submit: 'Continuar',
      submitLoading: 'Guardando…',
      skip: 'Continuar sin nombre',
    },
  },
  app: {
    title: 'Panel Kuteka',
    welcome: 'Bienvenido',
    welcomeAnonymous: 'Bienvenido a la plataforma',
    emailLabel: 'Email',
    userFallback: 'Usuario Kuteka',
    active: 'Cuenta activa',
    accountStatusTitle: 'Estado de la cuenta',
    accountStatusHint: 'Cuenta lista para usar los módulos disponibles.',
    accountSummaryAria: 'Resumen de la cuenta',
    dashboardHint: 'La plataforma está lista — elija una acción o abra un módulo.',
    todayTitle: '¿Qué desea hacer hoy?',
    todayHint: 'Accesos directos a las acciones más usadas.',
    quickActivateProperty: 'Activar patrimonio',
    quickExploreHousing: 'Explorar vivienda',
    quickAgent: 'Área del agente',
    quickAdmin: 'Administración',
    quickContracts: 'Contratos',
    quickTrust: 'Verificar cuenta',
    quickRoles: 'Gestionar roles',
    experienceHint: 'Cockpit y flujos de esta experiencia — cambie de rol en el menú de la cuenta.',
    feedPreparing: 'Preparando el entorno continuo…',
    rolesLabel: 'Roles activos',
    rolesHint: 'La misma cuenta puede tener varios roles.',
    noRoles: 'Aún sin roles activos',
    modulesTitle: 'Módulos de la plataforma',
    modulesHint: 'Acceso directo a los módulos del núcleo.',
    upcomingTitle: 'Módulos',
    moduleAvailable: 'Activo',
    moduleUnavailable: 'Pronto',
    loadError:
      'Estamos teniendo dificultades para abrir su espacio. Inténtelo de nuevo en unos momentos.',
    stub: 'Use los módulos activos con la misma cuenta y sus roles.',
    ctaLanding: 'Volver a la Landing',
    ctaProfile: 'Perfil',
    ctaRoles: 'Gestionar roles',
    adminTitle: 'Administración',
    adminStub:
      'Área admin (permiso admin.panel): resumen operativo, usuarios y revisión de Confianza.',
    adminForbidden:
      'No tiene permiso para esta área (admin.panel). Si cree que es un error, contacte a Kuteka.',
    configMissing:
      'El área autenticada requiere la configuración de Supabase. Defina las variables de entorno e inténtelo de nuevo.',
    loginRequired: 'Debe iniciar sesión para acceder a esta área.',
  },
};
