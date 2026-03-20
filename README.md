Portal Campus Virtual UVM

El Portal Campus Virtual UVM es una plataforma web integral diseñada para optimizar la comunicación y la gestión de espacios dentro de la Universidad del Valle de México. Permite a los estudiantes reservar laboratorios, talleres y citas académicas, al mismo tiempo que facilita la comunicación en tiempo real con sus asesores mediante un chat integrado.

Características Principales

* Autenticación Basada en Roles: Acceso estrictamente controlado mediante el dominio del correo electrónico institucional (Estudiantes, Asesores y Administradores). Los usuarios deben ser pre-registrados por un administrador para poder ingresar.

* Gestión de Citas y Reservas: Los estudiantes pueden agendar espacios físicos (Laboratorios de Fisioterapia, Cocina, Impresión 3D, etc.) y servicios (Asesorías, Trámites). Incluye un indicador visual del progreso de la cita en tiempo real.

* Notificaciones Automáticas: Integración con EmailJS para el envío instantáneo de correos electrónicos de confirmación al agendar una cita.

* Mensajería en Tiempo Real (Chat): Sistema de comunicación 1 a 1 entre estudiantes y asesores para resolver dudas de manera directa, respaldado por la base de datos en tiempo real.

* Panel Administrativo: Interfaz exclusiva para administradores que permite registrar nuevos usuarios en el sistema, visualizar roles y eliminar cuentas.

* Tecnologías Utilizadas

Frontend: React 19, Vite, HTML5 y CSS3.

Estilos: Tailwind CSS (v4) para un diseño responsivo y moderno, acompañado de iconos de Lucide React.

Backend y Base de Datos (BaaS): Firebase (Authentication y Firestore) para la gestión reactiva de datos en tiempo real (mensajes y citas).

Servicios de Terceros: EmailJS para el enrutamiento de correos electrónicos sin necesidad de un servidor backend tradicional.

 Estructura del Proyecto
El proyecto sigue una arquitectura clásica de una Single Page Application (SPA) construida con React y Vite:

portal-uvm/
|-- public/
|   |-- logo.png             # Logotipo institucional
|   `-- vite.svg             # Icono de Vite
|-- src/
|   |-- assets/              # Recursos multimedia
|   |-- App.jsx              # Lógica principal, Firebase y Rutas
|   |-- main.jsx             # Punto de entrada de React
|   `-- index.css            # Estilos globales y Tailwind
|-- package.json             # Dependencias (React, Firebase, EmailJS)
|-- vite.config.js           # Configuración del proyecto
|-- .gitignore               # Archivos excluidos (node_modules)
`-- README.md

 Instalación y Configuración
1. Clonar el repositorio
Descarga el proyecto e ingresa a la carpeta raíz desde tu terminal.

2. Instalar dependencias
Asegúrate de tener Node.js instalado. Ejecuta el siguiente comando para instalar todas las librerías necesarias (React, Firebase, Tailwind, EmailJS, etc.):

npm install

3. Configuración de Credenciales (Firebase y EmailJS)
Las credenciales de acceso a la base de datos de Firebase y las llaves públicas de EmailJS se encuentran actualmente integradas en el archivo src/App.jsx. Si deseas usar tus propios entornos, deberás modificar los objetos firebaseConfig y los parámetros de la función emailjs.send() dentro de ese archivo.

4. Ejecución del Servidor de Desarrollo
Levanta la aplicación en tu entorno local ejecutando:

npm run dev

La terminal te proporcionará un enlace (generalmente http://localhost:5173) para visualizar la app en tu navegador.

 Roles y Reglas de Acceso
El sistema valida el acceso analizando el dominio del correo electrónico ingresado en el login. Además, el correo debe existir previamente en la base de datos de Firestore (creado por un Admin):

Estudiantes: Dominio @my.uvm.edu.mx (Ej. juan@my.uvm.edu.mx). Pueden crear citas y chatear con asesores.

Asesores: Dominio @myuvm.asesores.mx (Ej. asesor1@myuvm.asesores.mx). Pueden ver las citas de los alumnos y responder mensajes.

Administradores: Dominio @myuvm.admin.mx (Ej. admin@myuvm.admin.mx). Tienen acceso exclusivo al Panel de Gestión para dar de alta a nuevos usuarios.

