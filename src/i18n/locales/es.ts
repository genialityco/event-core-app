const es = {
  // Tabs / módulos
  modules: {
    traveler: 'Viajero',
    hotels: 'Hoteles',
    agenda: 'Agenda',
    attendance: 'Asistencia',
    speakers: 'Speakers',
    usefulInfo: 'Info',
    photos: 'Fotos',
  },

  // Pantalla base
  base: {
    loading: 'Cargando...',
    error: 'Algo salió mal',
    empty: 'No hay información disponible',
    retry: 'Reintentar',
  },

  // Módulo Viajero
  traveler: {
    title: 'Información del Viajero',
    subtitle: 'Completa tus datos de viaje',
    saved: 'Información guardada correctamente',
    saveButton: 'Guardar',
    saving: 'Guardando...',
    sections: {
      professional: 'Identificación Profesional',
      outbound_flight: 'Vuelo de Ida',
      return_flight: 'Vuelo de Regreso',
      dietary: 'Requerimientos Especiales',
      whatsapp: 'Grupo de WhatsApp',
    },
    fields: {
      tvChannel: 'Canal de TV u Organización',
      position: 'Cargo',
      outboundOriginCity: 'Ciudad de origen',
      outboundFlightNumber: 'Número de vuelo',
      outboundArrivalTime: 'Hora local de llegada',
      returnOriginCity: 'Ciudad de origen (regreso)',
      returnFlightNumber: 'Número de vuelo (regreso)',
      returnArrivalTime: 'Hora local de regreso',
      dietaryRestrictions: 'Alergias o restricciones alimenticias',
    },
    whatsapp: {
      description: 'Únete al grupo de WhatsApp del evento',
      joinButton: 'Unirse al grupo de WhatsApp',
    },
  },

  // Módulo Hoteles
  hotels: {
    title: 'Hoteles',
    subtitle: 'Alojamiento del evento',
    empty: 'No hay hoteles disponibles',
    mainBadge: 'Hotel Principal',
    distanceMinutes: 'min caminando',
    bookingButton: 'Reservar',
    websiteButton: 'Ver hotel',
    address: 'Dirección',
    phone: 'Teléfono',
    price: 'Precios',
    distance: 'Distancia',
    alternativeTitle: 'Otras opciones',
  },

  // Módulo Agenda
  agenda: {
    title: 'Agenda',
    subtitle: 'Programa del evento',
    empty: 'No hay sesiones disponibles',
    comingSoon: 'La agenda estará disponible pronto',
    comingSoonSub: 'Estamos preparando el programa del evento',
    attend: 'Asistiré',
    attending: 'Asistiré ✓',
    cancelAttend: 'Cancelar',
    dressCode: 'Código de vestimenta',
    room: 'Salón',
    speakers: 'Conferencistas',
  },

  // Módulo Conferencista
  speaker: {
    title: 'Conferencista',
    sessions: 'Sesiones',
    noSessions: 'Sin sesiones asignadas',
    international: 'Internacional',
  },

  // Módulo Asistencia
  attendance: {
    title: 'Asistencia',
    subtitle: 'Confirma tu asistencia a las sesiones',
    empty: 'No hay sesiones con registro de asistencia',
    attend: 'Asistiré',
    confirmed: 'Confirmado',
    pending: 'Pendientes',
    total: 'Total',
  },

  // Módulo Info útil
  usefulInfo: {
    title: 'Info Útil',
    subtitle: 'Todo lo que necesitas saber para tu viaje',
    empty: 'No hay información disponible por el momento',
  },

  // Módulo Fotos
  photos: {
    title: 'Fotos',
    subtitle: 'Galería compartida del evento',
    empty: 'Sé el primero en subir una foto',
    uploading: 'Subiendo...',
    uploadError: 'Error al subir la foto',
    deleteConfirm: '¿Eliminar esta foto?',
    deleteYes: 'Eliminar',
    deleteNo: 'Cancelar',
    deleteError: 'Error al eliminar la foto',
    permissionDenied: 'Se necesita permiso para acceder a la galería',
  },

  // Autenticación
  auth: {
    login: {
      title: 'Bienvenido',
      subtitle: 'Ingresa con tu correo electrónico',
      emailPlaceholder: 'Correo electrónico',
      passwordPlaceholder: 'Contraseña',
      loginButton: 'Ingresar',
      registerLink: '¿No tienes cuenta? Regístrate',
      error: 'Correo o contraseña incorrectos',
    },
    register: {
      title: 'Crear cuenta',
      namePlaceholder: 'Nombre completo',
      emailPlaceholder: 'Correo electrónico',
      registerButton: 'Registrarse',
      loginLink: '¿Ya tienes cuenta? Inicia sesión',
      error: 'Error al crear la cuenta',
    },
    otp: {
      title: 'Verificación',
      subtitle: 'Ingresa el código que enviamos a tu correo',
      resend: 'Reenviar código',
      verify: 'Verificar',
      error: 'Código incorrecto',
    },
  },

  // Configuración
  settings: {
    title: 'Ajustes',
    language: 'Idioma',
    spanish: 'Español',
    english: 'Inglés',
    account: 'Cuenta',
    signOut: 'Cerrar sesión',
    signingOut: 'Cerrando sesión...',
    signOutTitle: 'Cerrar sesión',
    signOutMessage: '¿Estás seguro que deseas cerrar sesión?',
    signOutConfirm: 'Cerrar sesión',
    signOutCancel: 'Cancelar',
  },
} as const;

export default es;
