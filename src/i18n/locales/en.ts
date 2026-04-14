const en = {
  // Tabs / módulos
  modules: {
    traveler: 'Traveler',
    hotels: 'Hotels',
    agenda: 'Agenda',
    attendance: 'Attendance',
    speakers: 'Speakers',
    usefulInfo: 'Info',
    photos: 'Photos',
  },

  // Pantalla base
  base: {
    loading: 'Loading...',
    error: 'Something went wrong',
    empty: 'No information available',
    retry: 'Retry',
  },

  // Módulo Viajero
  traveler: {
    title: 'Traveler Information',
    subtitle: 'Complete your travel details',
    saved: 'Information saved successfully',
    saveButton: 'Save',
    saving: 'Saving...',
    sections: {
      professional: 'Professional Identification',
      outbound_flight: 'Outbound Flight',
      return_flight: 'Return Flight',
      dietary: 'Special Requirements',
      whatsapp: 'WhatsApp Community',
    },
    fields: {
      tvChannel: 'TV Channel or Organization',
      position: 'Position',
      outboundOriginCity: 'Origin city',
      outboundFlightNumber: 'Flight number',
      outboundArrivalTime: 'Local arrival time',
      returnOriginCity: 'Origin city (return)',
      returnFlightNumber: 'Return flight number',
      returnArrivalTime: 'Local return time',
      dietaryRestrictions: 'Food allergies or dietary restrictions',
    },
    whatsapp: {
      description: 'Join the event WhatsApp group',
      joinButton: 'Join WhatsApp group',
    },
  },

  // Módulo Hoteles
  hotels: {
    title: 'Hotels',
    subtitle: 'Event accommodation',
    empty: 'No hotels available',
    mainBadge: 'Main Hotel',
    distanceMinutes: 'min walk',
    bookingButton: 'Book now',
    websiteButton: 'View hotel',
    address: 'Address',
    phone: 'Phone',
    price: 'Rates',
    distance: 'Distance',
    alternativeTitle: 'Other options',
  },

  // Módulo Agenda
  agenda: {
    title: 'Agenda',
    subtitle: 'Event schedule',
    empty: 'No sessions available',
    comingSoon: 'Agenda coming soon',
    comingSoonSub: 'We are preparing the event schedule',
    attend: "I'll attend",
    attending: "I'll attend ✓",
    cancelAttend: 'Cancel',
    dressCode: 'Dress code',
    room: 'Room',
    speakers: 'Speakers',
  },

  // Speaker module
  speaker: {
    title: 'Speaker',
    sessions: 'Sessions',
    noSessions: 'No sessions assigned',
    international: 'International',
  },

  // Módulo Asistencia
  attendance: {
    title: 'Attendance',
    subtitle: 'Confirm your attendance to sessions',
    empty: 'No sessions require attendance',
    attend: "I'll attend",
    confirmed: 'Confirmed',
    pending: 'Pending',
    total: 'Total',
  },

  // Módulo Info útil
  usefulInfo: {
    title: 'Useful Info',
    subtitle: 'Everything you need to know for your trip',
    empty: 'No information available yet',
  },

  // Módulo Fotos
  photos: {
    title: 'Photos',
    subtitle: 'Shared event gallery',
    empty: 'Be the first to upload a photo',
    uploading: 'Uploading...',
    uploadError: 'Error uploading photo',
    deleteConfirm: 'Delete this photo?',
    deleteYes: 'Delete',
    deleteNo: 'Cancel',
    deleteError: 'Error deleting photo',
    permissionDenied: 'Permission required to access gallery',
  },

  // Pantalla de bienvenida (antes de auth)
  welcome: {
    title: 'Welcome',
    subtitle: 'Access the event experience',
    signIn: 'Sign in',
    signInSub: 'Already have an account',
    signUp: 'Sign up',
    signUpSub: 'New here? Create your account',
  },

  // Autenticación
  auth: {
    login: {
      title: 'Welcome',
      subtitleOtp: "Enter your email and we'll send you an access code",
      subtitlePassword: 'Already registered? Sign in to continue',
      emailPlaceholder: 'Email address',
      passwordPlaceholder: 'Password',
      loginButton: 'Sign in',
      registerButton: 'Sign up',
      forgotPassword: 'Forgot password?',
      resetTitle: 'Reset Password',
      resetSend: 'Send link',
      cancel: 'Cancel',
      error: 'Incorrect email or password',
    },
    register: {
      title: 'Create account',
      subtitle: 'Enter your details to register',
      subtitleOtp: 'Enter your name and email to register for {{appName}}',
      namePlaceholder: 'Full name',
      emailPlaceholder: 'Email address',
      registerButton: 'Sign up',
      loginLink: 'Already have an account? Sign in',
      loading: 'Loading registration form...',
      required: 'Required',
      errorName: 'Please enter your name.',
      errorEmail: 'Please enter a valid email address.',
      errorOrgTitle: 'Configuration error',
      errorOrg: 'Organization not configured. Contact the administrator.',
      error: 'Error creating account',
    },
    otp: {
      title: 'Verification',
      subtitle: 'Enter the code we sent to your email',
      resend: 'Resend code',
      verify: 'Verify',
      error: 'Incorrect code',
    },
  },

  // Configuración
  settings: {
    title: 'Settings',
    language: 'Language',
    spanish: 'Spanish',
    english: 'English',
    account: 'Account',
    signOut: 'Sign out',
    signingOut: 'Signing out...',
    signOutTitle: 'Sign out',
    signOutMessage: 'Are you sure you want to sign out?',
    signOutConfirm: 'Sign out',
    signOutCancel: 'Cancel',
    deleteAccount: 'Delete account',
    deletingAccount: 'Deleting account...',
    deleteAccountTitle: 'Delete account',
    deleteAccountMessage: 'This action is permanent. All your data will be deleted and you will not be able to recover your account. Do you want to continue?',
    deleteAccountConfirm: 'Delete account',
  },
} as const;

export default en;
