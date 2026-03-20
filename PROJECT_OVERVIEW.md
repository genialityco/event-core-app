# 📱 AchoApp - Descripción del Proyecto

## 📋 Información General

**Nombre del Proyecto:** AchoApp  
**Versión:** 1.0.9  
**Tipo:** Aplicación Móvil Multiplataforma (React Native + Expo)  
**Platform:** Android, iOS, Web  
**Slug:** gen-notifications  
**ID del Paquete (Android):** com.geniality.achoapp  
**ID del Bundle (iOS):** com.acho.eventosactualidad

---

## 🏗️ Arquitectura Tecnológica

### Stack Principal
- **Framework:** React Native 0.79.6
- **Herramienta de Construcción:** Expo 53.0.23
- **Enrutamiento:** Expo Router 5.1.7
- **Backend:** Firebase 10.14.1
- **Lenguaje:** TypeScript 5.8.3
- **React Version:** 19.0.0

### Dependencias Clave
- **Navegación:** React Navigation (Drawer, Material Top Tabs)
- **Estado y Formularios:** Formik + Yup (validación)
- **API:** Axios
- **Asincronía:** AsyncStorage para almacenamiento local
- **UI Components:** React Native Paper 5.12.5
- **Mapas:** React Native Maps 1.20.1
- **Gráficos:** React Native Chart Kit
- **PDF:** React Native PDF 7.0.0
- **Videos:** React Native Video
- **Notificaciones:** Expo Notifications 0.31.4
- **Ubicación:** Expo Location
- **Fechas:** Dayjs 1.11.13

---

## 📂 Estructura de Carpetas

```
AchoApp/
├── app/                          # Rutas principales (Expo Router)
│   ├── _layout.tsx              # Layout raíz con contextos
│   ├── login.tsx                 # Pantalla de login
│   ├── register.tsx              # Pantalla de registro
│   └── (app)/                    # Rutas autenticadas
│       ├── _layout.tsx
│       └── (tabs)/               # Navegación con tabs
│           ├── home/             # Pantalla principal
│           ├── achoinfo/         # Información de AchoApp
│           ├── menu/             # Menú principal
│           └── eventosbefore/    # Eventos anteriores
├── components/                   # Componentes reutilizables
│   ├── navigation/              # Componentes de navegación
│   ├── event/                   # Componentes relacionados con eventos
│   │   ├── EventDetail.tsx
│   │   ├── Speakers.tsx
│   │   ├── Program.tsx
│   │   ├── Venue.tsx
│   │   ├── Certificates.tsx
│   │   ├── Documents.tsx
│   │   ├── PostersList.tsx
│   │   └── Posters.tsx
│   ├── CustomDrawer.tsx
│   ├── CustomTextInput.tsx
│   ├── ParallaxScrollView.tsx
│   ├── ResultsScreen.tsx
│   ├── SurveyForm.tsx
│   └── UI Components (ThemedText, ThemedView, etc.)
├── services/                     # Servicios de API y Firebase
│   ├── firebaseConfig.ts        # Configuración de Firebase
│   └── api/                     # Servicios de API REST
│       ├── api.ts               # Configuración de Axios
│       ├── eventService.ts      # Gestión de eventos
│       ├── userService.ts       # Gestión de usuarios
│       ├── agendaService.ts     # Gestión de agendas
│       ├── attendeeService.ts   # Gestión de asistentes
│       ├── certificateService.ts # Certificados
│       ├── documentService.ts   # Documentos
│       ├── highlightService.ts  # Destacados
│       ├── memberService.ts     # Miembros
│       ├── newsService.ts       # Noticias
│       ├── notificationService.ts # Notificaciones
│       ├── organizationService.ts # Organizaciones
│       ├── posterService.ts     # Posters
│       ├── speakerService.ts    # Oradores
│       └── surveyService.ts     # Encuestas
├── context/                      # Context API (Estado global)
│   ├── AuthContext.tsx          # Autenticación
│   ├── NotificationsContext.tsx # Notificaciones
│   ├── OrganizationContext.tsx  # Información de organización
│   └── UserProfileContext.tsx   # Perfil de usuario
├── hooks/                        # Custom hooks
│   ├── useColorScheme.ts
│   ├── useColorScheme.web.ts
│   └── useThemeColor.ts
├── constants/                    # Constantes
│   └── Colors.ts               # Paleta de colores
├── utils/                        # Funciones utilitarias
│   ├── CalendarLayout.tsx
│   ├── LinkifyText.tsx
│   └── ZoomableImage.tsx
├── assets/                       # Recursos estáticos
│   ├── images/
│   ├── icons/
│   ├── fonts/
│   └── events.json
└── plugins/                      # Plugins de Expo personalizados
    └── withCustomPodfileConfig.js
```

---

## 🔐 Autenticación y Seguridad

- **Firebase Authentication** integrado
- **AsyncStorage** para tokens locales
- **AuthContext** global para gestión de sesiones
- Rutas protegidas que requieren autenticación

---

## 🔔 Funcionalidades Principales

### 1. **Gestión de Eventos**
   - Listado de eventos próximos
   - Detalles de eventos
   - Visualización de agenda/programa
   - Información de oradores
   - Ubicación del evento (Google Maps integrado)

### 2. **Perfil y Autenticación**
   - Registro de nuevos usuarios
   - Inicio de sesión
   - Perfil de usuario personalizado

### 3. **Notificaciones**
   - Sistema de notificaciones push
   - Gestión de preferencias de notificación

### 4. **Documentos y Certificados**
   - Visualización y descarga de certificados
   - Acceso a documentos relacionados con eventos
   - Visualización de PDFs

### 5. **Encuestas**
   - Formularios de encuestas dinámicas
   - Integración con Survey Core

### 6. **Contenido Multimedia**
   - Reproducción de videos
   - Visualización de imágenes con zoom
   - Posters de eventos

### 7. **Información de Organización**
   - Datos de miembros
   - Información de la organización
   - Noticias y destacados

---

## 📱 Plataformas Soportadas

### Android
- **Version Code:** 37
- **Permisos:** Acceso a ubicación (GPS)
- **Permisos Bloqueados:** Lectura de almacenamiento (privacidad)
- **Google Services:** Configurado en `google-services.json`

### iOS
- **Build Number:** 1.0.9
- **Bundle ID:** com.acho.eventosactualidad
- **Soporte para Tablets:** Habilitado
- **Google Services:** Configurado en `GoogleService-Info.plist`
- **Modes de Fondo:** Fetch, Remote Notifications

### Web
- Soportado mediante `expo start --web`

---

## 🎨 Diseño y Temas

- **Sistema de Temas:** React Navigation DefaultTheme + React Native Paper
- **Soporte para Modo Oscuro/Claro:** Automático según preferencia del sistema
- **Tema Personalizado:** Definido en `theme.tsx`

---

## 📊 State Management

### Context API Providers
1. **OrganizationProvider** - Información organizacional
2. **AuthProvider** - Estado de autenticación
3. **NotificationsProvider** - Estado de notificaciones
4. **PaperProvider** - Tema Material Design

---

## 🔌 Integraciones Externas

- **Firebase:** Autenticación y servicios en la nube
- **Google Maps API:** Mapas de ubicaciones
- **Google Services:** Analytics y servicios de Google
- **Expo Updates:** Actualizaciones OTA

---

## 📜 Scripts Disponibles

```bash
npm start          # Inicia el servidor de desarrollo
npm run android    # Ejecuta en Android
npm run ios        # Ejecuta en iOS
npm run web        # Ejecuta en navegador
npm test           # Ejecuta tests con Jest
npm run lint       # Análisis de código
npm run reset-project  # Reinicia el proyecto
```

---

## 🔧 Herramientas de Desarrollo

- **Babel:** Compilación de código JavaScript/TypeScript
- **Jest:** Framework de testing
- **Expo Lint:** Linting personalizado para Expo
- **Metro:** Bundler para React Native
- **EAS:** Expo Application Services para builds

---

## 📦 Versiones Importantes

- React: 19.0.0
- React Native: 0.79.6
- Expo: 53.0.23
- TypeScript: 5.8.3
- Firebase: 10.14.1

---

## 🚀 Estado del Proyecto

- **Versión Actual:** 1.0.9
- **Nuevo Arquitecto React (New Arch):** Habilitado
- **Modo Desarrollador Expo:** Habilitado con `expo-dev-client`

---

## 📝 Configuración Importante

### Archivo `app.config.js`
- Configuración de plataformas (iOS, Android, Web)
- Variables de entorno para APIs
- Configuración de permisos
- Splash screen personalizado

### Archivo `tsconfig.json`
- TypeScript estrictamente tipado
- Paths alias configurados

### Archivo `babel.config.js`
- Configuración de transformación de código
- Presets de Expo y React Native

### Archivo `metro.config.js`
- Configuración del bundler Metro
- Resolución de módulos personalizada

---

## 📸 Recursos

- **Splash Screen:** `assets/icons/APP_ACHO_SPLASH_FULL.png`
- **Icono App (Android):** `assets/icons/icon-android.png`
- **Datos de Eventos:** `assets/events.json`
- **Fuentes Personalizadas:** `assets/fonts/`

---

## 🔐 Configuración de Firebase

El proyecto incluye credenciales para:
- **Android:** `google-services.json`
- **iOS:** `GoogleService-Info.plist`
- **Admin SDK:** `global-auth-*.json`

---

## ⚡ Características Técnicas

✅ **TypeScript** - Tipado estático completo  
✅ **Expo Router** - Enrutamiento basado en archivos  
✅ **Context API** - Gestión de estado global  
✅ **Firebase** - Backend y autenticación  
✅ **Responsive Design** - Soporta múltiples tamaños de pantalla  
✅ **Offline Support** - AsyncStorage para datos locales  
✅ **Push Notifications** - Expo Notifications integrado  
✅ **Mapping** - Google Maps integrado  

---

**Última actualización:** Marzo 2026

