import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, query, onSnapshot, 
  doc, updateDoc, deleteDoc, getDoc, setDoc, orderBy, where, getDocs 
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken 
} from 'firebase/auth';
import { 
  User, Calendar, MessageSquare, Shield, LogOut, 
  Clock, MapPin, CheckCircle, AlertCircle, Send, Plus, Trash2, Edit
} from 'lucide-react';
import emailjs from '@emailjs/browser';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyBDADeF_FeGgaZ8ChVK-RFEciWWqC_DhxU",
  authDomain: "portal-uvm.firebaseapp.com",
  projectId: "portal-uvm",
  storageBucket: "portal-uvm.firebasestorage.app",
  messagingSenderId: "742443508948",
  appId: "1:742443508948:web:2396ca147ceaffed4dc741",
  measurementId: "G-6N2LENS718"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'uvm-campus-app';

// --- Constants & Types ---
const ROLES = {
  STUDENT: 'estudiante',
  ADVISOR: 'asesor',
  ADMIN: 'administrador'
};

const CATEGORIES = [
  { id: 'admin', name: 'Atención Académica Administrativa', type: 'service' },
  { id: 'tutoring', name: 'Asesorías Presenciales', type: 'service' },
  { id: 'lab', name: 'Laboratorios', type: 'facility', capacity: 20, equipment: 'Equipos Especializados' },
  { id: 'workshop', name: 'Talleres', type: 'facility', capacity: 15, equipment: 'Áreas de Práctica' },
  { id: 'room', name: 'Sala de impresión', type: 'facility', capacity: 5, equipment: 'Impresoras 3D' }
];

const SUB_CATEGORIES = {
  lab: [
    "Anatomía/Biología", "Fisioterapia", "Ing Sistemas Computacionales", 
    "Cocina", "Mecatrónica/Robótica", "Ingeniería Industrial"
  ],
  workshop: [
    "Futbol (Soccer/Rápido)", "Básquetbol", "Gimnasio", 
    "Teatro/Artes Escénicas", "Tae kwondo"
  ],
  room: ["Sala de impresión 3D"]
};

// --- Helper Functions ---
const getRoleFromEmail = (email) => {
  if (email.endsWith('@myuvm.admin.mx')) return ROLES.ADMIN;
  if (email.endsWith('@myuvm.asesores.mx')) return ROLES.ADVISOR;
  if (email.endsWith('@my.uvm.edu.mx')) return ROLES.STUDENT;
  return null;
};

const App = () => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard');
  const [selectedChatUser, setSelectedChatUser] = useState(null);

  // Auth Initialization
  useEffect(() => {
    emailjs.init('OeAPd9ILG7u-tpUbd');
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth error:", err);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      try {
        if (u) {
          // Fetch or create profile if needed (simulated for this demo)
          const profileRef = doc(db, 'artifacts', appId, 'users', u.uid, 'profile', 'info');
          const snap = await getDoc(profileRef);
          if (snap.exists()) {
            setUserProfile(snap.data());
          }
          setUser(u);
        } else {
          setUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error("Error al cargar datos de Firebase:", error);
      } finally {
        // Esto garantiza que la pantalla de carga se quite, haya éxito o error
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
    </div>
  );

  if (!userProfile) {
    return <LoginView setUserProfile={setUserProfile} user={user} />;
  }
  const handleLogout = async () => {
    try {
      await auth.signOut();
      // Forzamos la recarga para limpiar estados y tokens
      window.location.reload();
    } catch (err) {
      console.error("Error al salir:", err);
    }
  };
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Navigation */}
      <nav className="bg-red-700 text-white shadow-lg px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="bg-white p-1 rounded">
            <img src="/logo.png" alt="UVM" className="h-6" />
          </div>
          <span className="font-bold text-xl hidden md:block">Portal Campus Virtual</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setView('dashboard')}
            className={`flex items-center space-x-1 px-3 py-2 rounded transition ${view === 'dashboard' ? 'bg-red-800' : 'hover:bg-red-600'}`}
          >
            <Calendar size={18} /> <span className="hidden sm:inline">Citas</span>
          </button>
          
          {(userProfile.role === ROLES.STUDENT || userProfile.role === ROLES.ADVISOR) && (
            <button 
              onClick={() => setView('chat')}
              className={`flex items-center space-x-1 px-3 py-2 rounded transition ${view === 'chat' ? 'bg-red-800' : 'hover:bg-red-600'}`}
            >
              <MessageSquare size={18} /> <span className="hidden sm:inline">Mensajería</span>
            </button>
          )}

          {userProfile.role === ROLES.ADMIN && (
            <button 
              onClick={() => setView('admin')}
              className={`flex items-center space-x-1 px-3 py-2 rounded transition ${view === 'admin' ? 'bg-red-800' : 'hover:bg-red-600'}`}
            >
              <Shield size={18} /> <span className="hidden sm:inline">Gestión</span>
            </button>
          )}

          <div className="h-8 w-[1px] bg-red-500 mx-2"></div>

          <div className="flex items-center space-x-2 bg-red-800 px-3 py-1 rounded-full text-sm">
            <User size={14} />
            <span>{userProfile.name}</span>
          </div>

          <button 
            onClick={handleLogout}
            className="p-2 hover:bg-red-600 rounded-full transition"
            title="Cerrar Sesión"
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {view === 'dashboard' && (
          <DashboardView 
            userProfile={userProfile} 
            onNavigateToChat={(targetUser) => {
              setSelectedChatUser(targetUser); 
              setView('chat'); 
            }}
          />
        )}
        {view === 'chat' && (
          <ChatView 
            userProfile={userProfile} 
            userId={user.uid} 
            initialTargetUser={selectedChatUser} 
          />
        )}
      {view === 'admin' && <AdminView userProfile={userProfile} />}
      </main>
    </div>
  );
};

// --- View Components ---

const LoginView = ({ setUserProfile, user }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
  e.preventDefault();
  setError(''); // Limpiamos errores previos
  
  const role = getRoleFromEmail(email);
  if (!role) {
    setError('Dominio de correo no válido.');
    return;
  }

  try {
    // 1. Buscamos al usuario exclusivamente en el directorio creado por el Admin
    const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'users');
    const q = query(usersRef, where("email", "==", email.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      // 2. Si existe, recuperamos los datos
      const existingUser = querySnapshot.docs[0].data();
      
      // Guardamos en el perfil local del UID actual para mantener la sesión activa
      const profileRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'info');
      await setDoc(profileRef, existingUser);
      
      setUserProfile(existingUser);
    } else {
      // 3. SI NO EXISTE: Mostramos el mensaje de error y no permitimos el acceso
      setError('El usuario no existe. Por favor, contacte a los administradores para que habiliten su acceso al sistema.');
    }
  } catch (err) {
    console.error("Error al verificar cuenta:", err);
    setError("Error de conexión con el servidor.");
  }
};

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="UVM" className="h-12" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">Bienvenido al Portal</h1>
        <p className="text-gray-500 text-center mb-8 text-sm">Inicia sesión con tu correo institucional</p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
              placeholder="Ej. Juan Pérez"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <input 
              type="email" 
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
              placeholder="usuario@my.uvm.edu.mx"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <p className="mt-1 text-xs text-gray-400 italic">
              Estudiante: @my.uvm.edu.mx | Asesor: @myuvm.asesores.mx | Admin: @myuvm.admin.mx
            </p>
          </div>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 mt-2 rounded flex items-start space-x-2 animate-pulse">
              <AlertCircle size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-red-700 text-xs font-semibold leading-relaxed">
                {error}
              </p>
            </div>
          )}
          <button 
            type="submit"
            className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition shadow-lg active:transform active:scale-95"
          >
            Ingresar al Sistema
          </button>
        </form>
      </div>
    </div>
  );
};

  const DashboardView = ({ userProfile, onNavigateToChat }) => { 
  const [appointments, setAppointments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time listener for appointments
  useEffect(() => {
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'appointments');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Simple filter for students
      if (userProfile.role === ROLES.STUDENT) {
        setAppointments(docs.filter(a => a.studentId === userProfile.uid));
      } else {
        setAppointments(docs);
      }
    }, (err) => console.error("Firestore Error:", err));

    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, [userProfile]);

  const calculateProgress = (dateStr, timeStr) => {
    try {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const start = new Date(dateStr);
      start.setHours(hours, minutes, 0);
      const end = new Date(start.getTime() + 60 * 60 * 1000); // Assume 1 hour duration
      
      const now = currentTime.getTime();
      if (now < start.getTime()) return 0;
      if (now > end.getTime()) return 100;
      
      return ((now - start.getTime()) / (60 * 60 * 1000)) * 100;
    } catch (e) {
      return 0;
    }
  };

  const getStatus = (dateStr, timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const start = new Date(dateStr);
    start.setHours(hours, minutes, 0);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    
    if (currentTime > end) return { label: 'Finalizada', color: 'bg-gray-100 text-gray-600' };
    if (currentTime >= start && currentTime <= end) return { label: 'En Progreso', color: 'bg-green-100 text-green-700 border border-green-200' };
    return { label: 'Próxima', color: 'bg-blue-100 text-blue-700 border border-blue-200' };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Mis Citas y Reservas</h2>
          <p className="text-gray-500">Gestión de espacios y atención personalizada</p>
        </div>
        {userProfile.role === ROLES.STUDENT && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-red-600 text-white px-6 py-2 rounded-full font-semibold shadow-md hover:bg-red-700 transition flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Nueva Cita</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {appointments.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-xl border-2 border-dashed border-gray-200">
            <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-400 font-medium">No tienes citas registradas.</p>
          </div>
        ) : (
          appointments.map((appo) => {
            const status = getStatus(appo.date, appo.time);
            const progress = calculateProgress(appo.date, appo.time);
            const category = CATEGORIES.find(c => c.id === appo.category);

            return (
              <div key={appo.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${status.color}`}>
                    {status.label}
                  </span>
                  <div className="flex items-center text-gray-400 space-x-1">
                    <Clock size={14} />
                    <span className="text-xs font-medium">{appo.time} - {(parseInt(appo.time) + 1)}:00</span>
                  </div>
                </div>

                <h3 className="font-bold text-gray-800 text-lg mb-1 truncate">{appo.subject}</h3>
                <p className="text-red-600 text-sm font-medium mb-4">
                  {category?.name} {appo.subCategory && <span className="text-gray-400 font-normal">| {appo.subCategory}</span>}
                </p>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600 space-x-2">
                    <Calendar size={14} />
                    <span>{new Date(appo.date).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                  </div>
                  {category?.type === 'facility' && (
                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded flex flex-col space-y-1">
                      <span className="font-semibold text-gray-700 flex items-center gap-1">
                        <MapPin size={12} /> Equipamiento: {category.equipment}
                      </span>
                      <span>Capacidad: {category.capacity} personas</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                     <div className="flex-1 bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-red-500 h-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                     </div>
                     <span className="text-[10px] text-gray-400">{Math.round(progress)}%</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${progress > 0 && progress < 100 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {progress > 0 && progress < 100 ? `OCUPADO POR: ${appo.studentName.toUpperCase()}` : 'DISPONIBLE'}
                  </span>
                </div>
                {/* Al final de la tarjeta de cita, antes del último </div> */}
            {userProfile.role === ROLES.ADVISOR && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => onNavigateToChat({
                    uid: appo.studentId,
                    name: appo.studentName,
                    email: appo.studentEmail
                  })}
                  className="w-full flex items-center justify-center space-x-2 bg-red-50 text-red-600 py-2 rounded-lg font-bold hover:bg-red-100 transition"
                >
                  <MessageSquare size={16} />
                  <span>Contactar Estudiante</span>
                </button>
              </div>
            )}
              </div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <AppointmentModal 
          onClose={() => setIsModalOpen(false)} 
          userProfile={userProfile} 
        />
      )}
    </div>
  );
};

const AppointmentModal = ({ onClose, userProfile }) => {
  const [formData, setFormData] = useState({
  subject: '',
  category: 'admin',
  subCategory: '', 
  date: '',
  time: '09:00',
  details: ''
});
  const [isSending, setIsSending] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);

    const newAppointment = {
      ...formData,
      studentId: userProfile.uid,
      studentName: userProfile.name,
      studentEmail: userProfile.email,
      timestamp: Date.now()
    };

    try {
    // 1. Guardar en Firestore (ESTO SE MANTIENE)
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'appointments'), newAppointment);

    // 2. ENVÍO REAL CON EMAILJS (REEMPLAZO)
    const templateParams = {
      user_name: userProfile.name,
      user_email: userProfile.email,
      subject: formData.subject,
      category: CATEGORIES.find(c => c.id === formData.category).name,
      date: formData.date,
      time: formData.time,
      details: formData.details || "Sin detalles adicionales"
    };

    await emailjs.send(
      'service_8sb72z3',   // Reemplaza con tu ID de EmailJS
      'template_53df5yl',  // Reemplaza con tu ID de plantilla
      templateParams,
      'OeAPd9ILG7u-tpUbd'    // Reemplaza con tu llave pública
    );

    // 3. Mostrar confirmación visual (ESTO SE MANTIENE)
    setShowConfirmation(true);
    setTimeout(() => {
      onClose();
    }, 3000);

  } catch (err) {
    // ESTA LÍNEA ES CLAVE: Mira la consola del navegador (F12) al fallar
    console.error("DETALLE TÉCNICO EMAILJS:", err); 
    
    setIsSending(false);
    alert(`Error: ${err.text || "No se pudo conectar con el servidor de correo"}`);
  }
};

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {showConfirmation ? (
          <div className="p-12 text-center space-y-4">
            <div className="bg-green-100 text-green-600 rounded-full w-20 h-20 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle size={48} />
            </div>
            <h3 className="text-2xl font-bold text-gray-800">¡Cita Confirmada!</h3>
            <p className="text-gray-500">Se ha enviado un correo de confirmación a <br/> <strong>{userProfile.email}</strong></p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="bg-red-600 p-6 text-white">
              <h2 className="text-xl font-bold">Programar Nueva Cita</h2>
              <p className="text-red-100 text-sm">Completa los datos para agendar tu espacio</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* 1. Nombre (Solo lectura) */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Completo</label>
                  <input readOnly value={userProfile.name} className="w-full px-4 py-2 bg-gray-50 border rounded-lg text-gray-500 cursor-not-allowed" />
                </div>
    
                  {/* 2. Categoría (Servicio o Instalación) - SOLO UNA VEZ */}
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Servicio o Instalación</label>
                    <select 
                      className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                      value={formData.category}
                      onChange={(e) => {
                        const cat = e.target.value;
                        setFormData({
                          ...formData, 
                          category: cat,
                          subCategory: '' // Limpia la subcategoría al cambiar de servicio
                        });
                      }}
                    >
                      {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>

                  {/* 3. Subcategoría Condicional (Labs, Talleres, etc.) */}
                  {['lab', 'workshop', 'room'].includes(formData.category) && (
                    <div className="col-span-2 animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                        Selecciona {formData.category === 'lab' ? 'el Laboratorio' : formData.category === 'workshop' ? 'el Taller' : 'la Sala'}
                      </label>
                      <select 
                        required
                        className="w-full px-4 py-2 border border-red-200 bg-red-50 rounded-lg outline-none focus:ring-2 focus:ring-red-500 font-semibold text-red-800"
                        value={formData.subCategory}
                        onChange={(e) => setFormData({...formData, subCategory: e.target.value})}
                      >
                        <option value="">-- Selecciona una opción --</option>
                        {SUB_CATEGORIES[formData.category].map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* 4. Fecha y Hora */}
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha</label>
                    <input 
                      type="date" 
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hora (60 min)</label>
                    <input 
                      type="time" 
                      required
                      className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                      onChange={(e) => setFormData({...formData, time: e.target.value})}
                    />
                  </div>

                  {/* 5. Asunto */}
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Asunto de la cita</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ej. Revisión de calificaciones"
                      className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-red-500"
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    />
                  </div>
                </div>
              </div>

            <div className="p-6 bg-gray-50 flex justify-end space-x-3">
              <button 
                type="button" 
                onClick={onClose}
                className="px-6 py-2 text-gray-600 font-semibold hover:bg-gray-200 rounded-lg transition"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={isSending}
                className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition shadow-lg flex items-center space-x-2"
              >
                {isSending ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span> : null}
                <span>Agendar y Notificar</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const ChatView = ({ userProfile, userId, initialTargetUser }) => {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [availableUsers, setAvailableUsers] = useState([]);

  // 1. Efecto para manejar la navegación desde el Dashboard
  useEffect(() => {
    if (initialTargetUser) {
      setActiveChat(initialTargetUser);
    }
  }, [initialTargetUser]);

  // 2. Cargar lista de usuarios (estudiantes o asesores)
  useEffect(() => {
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'users');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => doc.data());
    
    // Filtrar contactos: Estudiantes ven Asesores, Asesores ven Estudiantes
      if (userProfile.role === ROLES.STUDENT) {
        setAvailableUsers(users.filter(u => u.role === ROLES.ADVISOR));
      } else if (userProfile.role === ROLES.ADVISOR) {
        setAvailableUsers(users.filter(u => u.role === ROLES.STUDENT));
      }

    // Si venimos referenciados desde una cita, activar ese chat
      if (initialTargetUser) {
        setActiveChat(initialTargetUser);
      }
    }, (err) => console.error("Error cargando usuarios:", err));

    return () => unsubscribe();
  }, [userProfile, initialTargetUser]);

  // 3. Cargar mensajes del chat activo
  useEffect(() => {
    if (!activeChat) return;

    const q = collection(db, 'artifacts', appId, 'public', 'data', 'messages');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Filtro 1:1 - Mensajes entre el usuario actual y el contacto seleccionado
      const chatMessages = allMessages
        .filter(m => 
          (m.senderId === userId && m.receiverId === activeChat.uid) || 
          (m.senderId === activeChat.uid && m.receiverId === userId)
        )
        .sort((a, b) => a.timestamp - b.timestamp);
      setChats(chatMessages);
    });

    return () => unsubscribe();
  }, [activeChat, userId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeChat) return;

    const newMessage = {
      senderId: userId,
      senderName: userProfile.name,
      receiverId: activeChat.uid,
      text: messageText,
      timestamp: Date.now()
    };

    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), newMessage);
      setMessageText('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-[calc(100vh-160px)] bg-white rounded-2xl shadow-xl overflow-hidden flex border border-gray-100">
      {/* Sidebar */}
      <div className="w-1/3 border-r border-gray-100 flex flex-col bg-slate-50">
        <div className="p-4 bg-white border-b border-gray-100">
          <h3 className="font-bold text-gray-800">Contactos</h3>
          <p className="text-xs text-gray-500">
            {userProfile.role === ROLES.STUDENT ? 'Mis Asesores' : 'Estudiantes'}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {availableUsers.map(u => (
            <button 
              key={u.uid}
              onClick={() => setActiveChat(u)}
              className={`w-full p-4 flex items-center space-x-3 transition hover:bg-white ${activeChat?.uid === u.uid ? 'bg-white border-r-4 border-red-500 shadow-sm' : ''}`}
            >
              <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold uppercase">
                {u.name.charAt(0)}
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-800 text-sm leading-tight">{u.name}</p>
                <p className="text-xs text-gray-400 truncate">{u.email}</p>
              </div>
            </button>
          ))}
          {availableUsers.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">
              No hay {userProfile.role === ROLES.STUDENT ? 'asesores' : 'estudiantes'} registrados en el sistema.
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        {activeChat ? (
          <>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold uppercase">
                  {activeChat.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{activeChat.name}</h3>
                  <p className="text-xs text-green-500 flex items-center gap-1">
                    <span className="h-2 w-2 bg-green-500 rounded-full"></span> En línea
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#f0f2f5]">
              {chats.map(msg => {
                const isMe = msg.senderId === userId;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-3 rounded-2xl shadow-sm text-sm ${isMe ? 'bg-red-600 text-white rounded-br-none' : 'bg-white text-gray-800 rounded-bl-none'}`}>
                      <p>{msg.text}</p>
                      <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-red-100' : 'text-gray-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              {chats.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                  <MessageSquare size={48} className="opacity-20" />
                  <p>Inicia una conversación con {activeChat.name}</p>
                </div>
              )}
            </div>

            <form onSubmit={sendMessage} className="p-4 border-t border-gray-100 flex space-x-4">
              <input 
                type="text" 
                placeholder="Escribe un mensaje..."
                className="flex-1 px-4 py-2 bg-gray-100 rounded-full outline-none focus:ring-2 focus:ring-red-500"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
              <button 
                type="submit"
                className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
              >
                <Send size={20} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-4">
            <div className="h-24 w-24 bg-gray-50 rounded-full flex items-center justify-center">
              <MessageSquare size={48} className="opacity-20" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-600">Sistema de Mensajería UVM</h3>
              <p>Selecciona un contacto en la izquierda para chatear</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminView = () => {
  const [users, setUsers] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: ROLES.STUDENT });

  useEffect(() => {
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'users');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = async (uid) => {
    if (confirm('¿Estás seguro de eliminar este usuario?')) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', uid));
    }
  };
  const handleCreateUser = async (e) => {
  e.preventDefault();
  // Generamos un ID único manual ya que el admin lo crea fuera del flujo de auth anónimo
  const newUid = "admin_gen_" + Date.now();
  const profileData = { ...newUser, uid: newUid, email: newUser.email.toLowerCase() };

  try {
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', newUid), profileData);
    setNewUser({ name: '', email: '', role: ROLES.STUDENT });
    alert("Usuario creado exitosamente");
  } catch (err) {
    alert("Error al crear usuario");
  }
};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Panel Administrativo</h2>
          <p className="text-gray-500">Gestión de usuarios registrados en el sistema</p>
        </div>
      </div>
<div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 mb-8">
  <h3 className="font-bold mb-4">Registrar Nuevo Usuario</h3>
  <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <input 
      type="text" placeholder="Nombre" required className="border p-2 rounded"
      value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})}
    />
    <input 
      type="email" placeholder="Correo @myuvm..." required className="border p-2 rounded"
      value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})}
    />
    <select 
      className="border p-2 rounded" value={newUser.role}
      onChange={(e) => setNewUser({...newUser, role: e.target.value})}
    >
      <option value={ROLES.STUDENT}>Estudiante</option>
      <option value={ROLES.ADVISOR}>Asesor</option>
      <option value={ROLES.ADMIN}>Administrador</option>
    </select>
    <button type="submit" className="bg-green-600 text-white rounded font-bold hover:bg-green-700">
      Crear Usuario
    </button>
  </form>
</div>
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Usuario</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Correo</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Rol</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">UID</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold text-xs uppercase">
                      {u.name.charAt(0)}
                    </div>
                    <span className="font-semibold text-gray-800">{u.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-500 text-sm">{u.email}</td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                    u.role === ROLES.ADMIN ? 'bg-purple-100 text-purple-600' : 
                    u.role === ROLES.ADVISOR ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-[10px] text-gray-400">{u.uid}</td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleDelete(u.uid)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default App;
