import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Truck, Factory, Clock, Save, X, Plus, 
  ChevronLeft, ChevronRight, FileText, Settings, 
  Trash2, ArrowRight, AlertCircle, Printer,
  CornerDownRight
} from 'lucide-react';

// --- FIREBASE CONFIGURACIÓN E IMPORTACIONES ---
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot
} from 'firebase/firestore';

// Configuración Firebase
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- UTILIDADES ---

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit' }).format(date);
};

const getDayOfWeek = (dateString) => {
  if (!dateString) return '';
  const days = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  return days[new Date(dateString).getDay()];
};

// Obtener fecha actual en YYYY-MM-DD
const getTodayStr = () => new Date().toISOString().split('T')[0];

// Sumar días a una fecha
const addDays = (dateStr, days) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
};

// --- COMPONENTE DE CONFIGURACIÓN (SOLO FESTIVOS Y PUENTES) ---
const ConfigPanel = ({ onClose, user }) => {
  const [holidays, setHolidays] = useState([]);
  const [holidayPlans, setHolidayPlans] = useState([]);
  
  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState('');

  // --- Estados para el Calendario de Planes ---
  const [calendarDate, setCalendarDate] = useState(new Date()); // Mes actual visible
  const [selectedRange, setSelectedRange] = useState({ start: null, end: null });
  const [newPlanName, setNewPlanName] = useState('');


  // 1. Carga de Datos (Solo Festivos y Planes)
  useEffect(() => {
    if (!user) return;
    
    // Festivos Individuales
    const qHolidays = collection(db, 'artifacts', appId, 'public', 'data', 'holidays');
    const unsub1 = onSnapshot(qHolidays, (snap) => {
      setHolidays(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Error holidays:", err));

    // Planes de Festivos (Puentes)
    const qPlans = collection(db, 'artifacts', appId, 'public', 'data', 'holiday_plans');
    const unsub2 = onSnapshot(qPlans, (snap) => {
      setHolidayPlans(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error("Error plans:", err));

    return () => { unsub1(); unsub2(); };
  }, [user]);

  
  // 2. Manejadores de Festivos Individuales
  const handleAddHoliday = async () => {
    if (!newHolidayName.trim() || !newHolidayDate) return;
    
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'holidays'), {
      name: newHolidayName,
      date: newHolidayDate, 
      createdAt: new Date().toISOString()
    });
    setNewHolidayName('');
    setNewHolidayDate('');
  };

   const handleDeleteHoliday = async (id) => {
    if(window.confirm('¿Borrar este festivo de la lista?')) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'holidays', id));
    }
  };

  // 3. Manejadores de Planes de Festivos (Puentes)
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const handleDateClick = (dateStr) => {
    if (!selectedRange.start || selectedRange.end) {
        // Iniciar un nuevo rango o reiniciar
        setSelectedRange({ start: dateStr, end: null });
    } else if (dateStr < selectedRange.start) {
        // El nuevo día es anterior al inicio, se convierte en el nuevo inicio
        setSelectedRange({ start: dateStr, end: selectedRange.start });
    } else if (dateStr === selectedRange.start) {
         // Clickeado el mismo día de inicio, limpia el rango
         setSelectedRange({ start: null, end: null });
    } else {
        // El nuevo día es posterior al inicio, se convierte en el fin
        setSelectedRange(prev => ({ ...prev, end: dateStr }));
    }
  };

  const handleAddPlan = async () => {
    if (!selectedRange.start || !selectedRange.end || !newPlanName.trim()) {
        console.error("Debes seleccionar un rango de fechas (Inicio y Fin) y darle un nombre al plan.");
        return;
    }
    
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'holiday_plans'), {
      name: newPlanName.trim(),
      startDate: selectedRange.start,
      endDate: selectedRange.end,
      createdAt: new Date().toISOString()
    });
    
    setNewPlanName('');
    setSelectedRange({ start: null, end: null });
  };
  
  const handleDeletePlan = async (id) => {
    if(window.confirm('¿Borrar este plan de festivo?')) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'holiday_plans', id));
    }
  };

  const renderCalendar = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth(); // 0-indexed
    const numDays = getDaysInMonth(year, month);
    let firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) - 6 (Sat)
    
    // Ajuste para empezar la semana en Lunes (Lunes=0, Domingo=6)
    const startPlaceholder = (firstDayOfMonth === 0) ? 6 : firstDayOfMonth - 1; 

    const days = [];
    for (let i = 0; i < startPlaceholder; i++) {
        days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    for (let i = 1; i <= numDays; i++) {
        const dayDate = new Date(year, month, i);
        const dateStr = dayDate.toISOString().split('T')[0];
        
        // Comprobaciones de estado
        const isToday = dateStr === getTodayStr();
        const isStart = selectedRange.start === dateStr;
        const isEnd = selectedRange.end === dateStr;
        
        // Manejo de rango. Aseguramos que start sea siempre la fecha menor.
        const rangeStart = selectedRange.start < selectedRange.end ? selectedRange.start : selectedRange.end;
        const rangeEnd = selectedRange.start < selectedRange.end ? selectedRange.end : selectedRange.start;
        const isBetween = rangeStart && rangeEnd && dateStr > rangeStart && dateStr < rangeEnd;
        
        const isFixedHoliday = holidays.some(h => h.date === dateStr);
        const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;

        let dayClasses = "p-2 text-center rounded-lg cursor-pointer transition-colors text-sm font-medium relative";
        
        if (isStart || isEnd) {
            dayClasses += " bg-blue-600 text-white shadow-lg ring-2 ring-blue-300 transform scale-105";
        } else if (isBetween) {
            dayClasses += " bg-blue-200 text-blue-800 hover:bg-blue-300";
        } else if (isFixedHoliday) {
            dayClasses += " bg-red-100 text-red-700 hover:bg-red-200 border border-red-300";
        } else if (isWeekend) {
            dayClasses += " bg-gray-50 text-gray-500 hover:bg-gray-100";
        } else {
            dayClasses += " text-gray-800 hover:bg-gray-100";
        }
        
        if (isToday && !isStart && !isEnd) {
            dayClasses += " border-2 border-green-500";
        }


        days.push(
            <div 
                key={dateStr}
                className={dayClasses}
                onClick={() => handleDateClick(dateStr)}
            >
                {i}
                {isFixedHoliday && (
                    <AlertCircle size={10} className="absolute top-1 right-1 text-red-500" />
                )}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-7 gap-1 text-xs">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(day => (
                <div key={day} className="text-center font-bold text-gray-500 p-2 border-b border-gray-200">{day}</div>
            ))}
            {days}
        </div>
    );
  };

  const changeMonth = (delta) => {
    setCalendarDate(prev => {
        const newDate = new Date(prev.getFullYear(), prev.getMonth() + delta, 1);
        return newDate;
    });
    setSelectedRange({ start: null, end: null });
  };

  // --- Render del ConfigPanel (Solo Festivos) ---
  return (
    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-6xl mx-auto mt-4 ring-8 ring-white/50">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Settings size={24} /> Configuración de Festivos y Puentes
        </h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1"><X /></button>
      </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* SECCIÓN 1: Festivos Individuales */}
            <div className="space-y-4">
                <h3 className="text-xl font-semibold border-b pb-2 flex items-center gap-2 text-gray-700"><CornerDownRight size={18}/> Días Festivos Sueltos (Días Rojos Fijos)</h3>
                <p className="text-sm text-gray-500 bg-red-50 p-3 rounded border border-red-200">
                    Introduce aquí los días que siempre deben aparecer en rojo (Navidad, Año Nuevo, etc.).
                </p>
                <div className="flex gap-2 items-end">
                    <div className="flex-1">
                        <label className="text-sm text-gray-600">Nombre</label>
                        <input 
                            type="text" 
                            placeholder="Ej: Inmaculada" 
                            className="w-full border p-2 rounded focus:ring-red-500 focus:border-red-500"
                            value={newHolidayName}
                            onChange={(e) => setNewHolidayName(e.target.value)}
                        />
                    </div>
                    <div className="w-40">
                        <label className="text-sm text-gray-600">Fecha</label>
                        <input 
                            type="date" 
                            className="w-full border p-2 rounded focus:ring-red-500 focus:border-red-500"
                            value={newHolidayDate}
                            onChange={(e) => setNewHolidayDate(e.target.value)}
                        />
                    </div>
                    <button onClick={handleAddHoliday} className="bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2 h-10 mb-0.5 hover:bg-green-700 transition-colors">
                        <Plus size={18} /> Añadir
                    </button>
                </div>
                <div className="space-y-2 max-h-80 overflow-y-auto p-2 border rounded-lg bg-gray-50">
                    {holidays.length === 0 && <p className="text-center text-gray-500 italic">No hay festivos individuales configurados.</p>}
                    {holidays.sort((a,b) => a.date.localeCompare(b.date)).map(h => (
                        <div key={h.id} className="flex justify-between items-center p-3 bg-white border rounded shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="bg-red-100 text-red-800 font-bold px-3 py-1 rounded text-sm border border-red-200">
                                    {formatDate(h.date)}
                                </div>
                                <span className="font-bold">{h.name}</span>
                            </div>
                            <button onClick={() => handleDeleteHoliday(h.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"><Trash2 size={16}/></button>
                        </div>
                    ))}
                </div>
            </div>

            {/* SECCIÓN 2: Planes de Festivos (Puentes) */}
            <div className="space-y-4">
                <h3 className="text-xl font-semibold border-b pb-2 flex items-center gap-2 text-gray-700"><CornerDownRight size={18}/> Puentes y Rangos de Planificación</h3>
                
                {/* CALENDARIO SELECTOR */}
                <div className="bg-white p-4 rounded-lg shadow-inner border">
                    {/* Navegación del mes */}
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-100 text-gray-600"><ChevronLeft size={20}/></button>
                        <h4 className="text-lg font-bold text-blue-700">
                            {calendarDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                        </h4>
                        <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-100 text-gray-600"><ChevronRight size={20}/></button>
                    </div>
                    
                    {renderCalendar()}

                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                        <p className="text-sm font-bold text-blue-700 mb-1">Rango Seleccionado:</p>
                        <p className="text-sm">
                            {selectedRange.start ? formatDate(selectedRange.start) : '??/??'} 
                            <ArrowRight size={14} className="inline mx-2 text-blue-500"/> 
                            {selectedRange.end ? formatDate(selectedRange.end) : '??/??'}
                        </p>
                    </div>

                    {/* GUARDAR PLAN */}
                    <div className="mt-4 flex gap-2">
                         <input 
                            type="text" 
                            placeholder="Nombre del Plan (Ej: Puente Diciembre)" 
                            className="flex-1 border p-2 rounded focus:ring-blue-500 focus:border-blue-500"
                            value={newPlanName}
                            onChange={(e) => setNewPlanName(e.target.value)}
                            disabled={!selectedRange.start || !selectedRange.end}
                        />
                        <button onClick={handleAddPlan} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700 transition-colors" disabled={!selectedRange.start || !selectedRange.end || !newPlanName.trim()}>
                            <Plus size={18}/> Añadir Plan
                        </button>
                    </div>
                </div>

                {/* LISTA DE PLANES GUARDADOS */}
                <div className="space-y-2 max-h-48 overflow-y-auto p-2 border rounded-lg bg-gray-50">
                    {holidayPlans.length === 0 && <p className="text-center text-gray-500 italic">No hay planes de festivos guardados.</p>}
                    {holidayPlans.sort((a,b) => a.startDate.localeCompare(b.startDate)).map(p => (
                        <div key={p.id} className="flex justify-between items-center p-3 bg-white border rounded shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded text-sm border border-blue-200">
                                    {formatDate(p.startDate)} - {formatDate(p.endDate)}
                                </div>
                                <span className="font-bold">{p.name}</span>
                            </div>
                            <button onClick={() => handleDeletePlan(p.id)} className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"><Trash2 size={16}/></button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};


// 3. VISTA DE INFORMES
const ReportsView = ({ dateRange, orders, holidays }) => {
    const [selectedTransport, setSelectedTransport] = useState('all');

    const reportData = useMemo(() => {
        if (!orders.length) return [];

        let filtered = orders.filter(o => o.delivers && o.transportCompany);
        
        if (selectedTransport !== 'all') {
            filtered = filtered.filter(o => o.transportCompany === selectedTransport);
        }

        const grouped = {};
        filtered.forEach(order => {
            const loadDate = order.loadingDate || 'Sin fecha de carga';
            if (!grouped[loadDate]) grouped[loadDate] = [];
            grouped[loadDate].push({
                ...order,
                // El clientName ahora se queda vacío ya que viene de la API
                clientName: 'Cliente (API Pendiente)' 
            });
        });

        return Object.keys(grouped).sort().map(date => ({
            date,
            items: grouped[date]
        }));

    }, [orders, selectedTransport]);

    return (
        <div className="p-6 max-w-6xl mx-auto bg-white min-h-screen print:p-0">
            <div className="flex justify-between items-center mb-8 print:hidden">
                <h2 className="text-2xl font-bold text-gray-800">Informe de Cargas</h2>
                <div className="flex gap-4">
                    <select 
                        className="border p-2 rounded"
                        value={selectedTransport}
                        onChange={e => setSelectedTransport(e.target.value)}
                    >
                        <option value="all">Todas las compañías</option>
                        <option value="Innova">Innova</option>
                        <option value="Primafrío">Primafrío</option>
                        <option value="Disfrimur">Disfrimur</option>
                        <option value="Otros">Otros</option>
                    </select>
                    <button onClick={() => window.print()} className="bg-gray-800 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-black">
                        <Printer size={18} /> Imprimir / PDF
                    </button>
                </div>
            </div>

            <div className="mb-8 border-b pb-4">
                <h1 className="text-3xl font-bold uppercase tracking-wide text-gray-900">Planificación de Cargas</h1>
                <div className="mt-2 flex gap-8 text-gray-600">
                    <p><span className="font-bold">Rango:</span> {formatDate(dateRange.start)} - {formatDate(dateRange.end)}</p>
                    <p><span className="font-bold">Compañía:</span> {selectedTransport === 'all' ? 'TODAS' : selectedTransport}</p>
                    <p><span className="font-bold">Fecha Emisión:</span> {new Date().toLocaleDateString()}</p>
                </div>
            </div>

            {reportData.length === 0 ? (
                <div className="text-center py-10 text-gray-500">No hay datos de carga registrados para este rango.</div>
            ) : (
                <div className="space-y-8">
                    {reportData.map((group) => {
                        const isHolidayLoad = holidays.some(h => h.date === group.date);
                        return (
                            <div key={group.date} className="break-inside-avoid">
                                <h3 className={`text-xl font-bold p-2 border-l-4 mb-3 flex items-center gap-2 ${isHolidayLoad ? 'bg-red-50 border-red-500 text-red-800' : 'bg-gray-100 border-orange-500 text-gray-800'}`}>
                                    {isHolidayLoad && <AlertCircle size={20}/>}
                                    Fecha de Carga: {group.date === 'Sin fecha de carga' ? 'FECHA NO ASIGNADA' : `${getDayOfWeek(group.date)} ${formatDate(group.date)}`}
                                    {isHolidayLoad && <span className="text-sm font-normal ml-2">(Festivo)</span>}
                                </h3>
                                <table className="w-full text-sm text-left text-gray-600 border border-gray-200">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 border-b">Cliente / Plataforma</th>
                                            <th className="px-4 py-3 border-b">Transporte</th>
                                            <th className="px-4 py-3 border-b">Entrega Prevista</th>
                                            <th className="px-4 py-3 border-b w-1/3">Comentarios Transporte</th>
                                            <th className="px-4 py-3 border-b w-1/4">Notas Internas (Fab)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {group.items.map((item, idx) => (
                                            <tr key={idx} className="bg-white border-b hover:bg-gray-50">
                                                {/* Cliente temporal hasta que venga de la API */}
                                                <td className="px-4 py-3 font-medium text-gray-900">{item.clientName}</td> 
                                                <td className="px-4 py-3 font-bold">{item.transportCompany}</td>
                                                <td className="px-4 py-3">{getDayOfWeek(item.receptionDate)} {formatDate(item.receptionDate)} {item.receptionTime}</td>
                                                <td className="px-4 py-3 italic">{item.transportComments || '-'}</td>
                                                <td className="px-4 py-3 text-xs text-gray-500">{item.manufacturingNotes || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};


// 2. MODAL EDITOR DE CASILLA (Unchanged)
const CellEditor = ({ isOpen, onClose, data, onSave, clientName, dateStr }) => {
  if (!isOpen) return null;

  const initialFormState = {
    delivers: true,
    receptionDate: dateStr,
    receptionTime: '',
    manufacturingDate: '',
    manufacturingNotes: '',
    loadingDate: '',
    transportCompany: '',
    transportComments: '',
    ...data
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    setFormData({
        delivers: true,
        receptionDate: dateStr,
        receptionTime: '',
        manufacturingDate: '',
        manufacturingNotes: '',
        loadingDate: '',
        transportCompany: '',
        transportComments: '',
        ...data
    });
  }, [data, dateStr]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  // Usamos un simple div con estilo para reemplazar el alert/confirm
  const confirmDelete = () => {
    if (window.confirm('¿Borrar esta entrada de planificación?')) {
        onSave({ delivers: false, delete: true });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
        <div className="bg-blue-700 text-white p-4 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold">{clientName || 'Cliente (API Pendiente)'}</h3>
            <p className="text-sm opacity-90">Planificación para {getDayOfWeek(dateStr)} {formatDate(dateStr)}</p>
          </div>
          <button onClick={onClose}><X /></button>
        </div>

        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between bg-gray-100 p-3 rounded">
            <span className="font-medium text-gray-700">¿Hay entrega este día?</span>
            <button 
              onClick={() => handleChange('delivers', !formData.delivers)}
              className={`px-4 py-1 rounded-full font-bold transition-colors ${formData.delivers ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
            >
              {formData.delivers ? 'SÍ ENTREGA' : 'NO ENTREGA'}
            </button>
          </div>

          {formData.delivers && (
            <>
              {/* Recepción */}
              <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded-r">
                <h4 className="text-blue-700 font-bold text-sm mb-2 flex items-center gap-2"><Calendar size={14}/> Fecha/Hora Recepción</h4>
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="date" 
                    className="border p-2 rounded text-sm w-full" 
                    value={formData.receptionDate}
                    onChange={e => handleChange('receptionDate', e.target.value)}
                  />
                  <input 
                    type="time" 
                    className="border p-2 rounded text-sm w-full" 
                    value={formData.receptionTime}
                    onChange={e => handleChange('receptionTime', e.target.value)}
                  />
                </div>
              </div>

               {/* Transporte */}
               <div className="border-l-4 border-gray-800 pl-4 py-2 bg-gray-50 rounded-r">
                <h4 className="text-gray-800 font-bold text-sm mb-2 flex items-center gap-2"><Truck size={14}/> Transporte</h4>
                <div className="space-y-2">
                    <select 
                        className="border p-2 rounded text-sm w-full bg-white"
                        value={formData.transportCompany}
                        onChange={e => handleChange('transportCompany', e.target.value)}
                    >
                        <option value="">-- Seleccionar Compañía --</option>
                        <option value="Innova">Innova</option>
                        <option value="Primafrío">Primafrío</option>
                        <option value="Disfrimur">Disfrimur</option>
                        <option value="Otros">Otros</option>
                    </select>
                    <textarea 
                        placeholder="Comentarios para el transportista..."
                        className="border p-2 rounded text-sm w-full h-16 resize-none"
                        value={formData.transportComments}
                        onChange={e => handleChange('transportComments', e.target.value)}
                    />
                </div>
              </div>

              {/* Fabricación */}
              <div className="border-l-4 border-green-500 pl-4 py-2 bg-green-50 rounded-r">
                <h4 className="text-green-700 font-bold text-sm mb-2 flex items-center gap-2"><Factory size={14}/> Fabricación</h4>
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="col-span-2 sm:col-span-1">
                        <label className="text-xs text-gray-500 block">Día Fabricación</label>
                         <input 
                            type="date" 
                            className="border p-2 rounded text-sm w-full" 
                            value={formData.manufacturingDate}
                            onChange={e => handleChange('manufacturingDate', e.target.value)}
                        />
                    </div>
                </div>
                <input 
                    type="text" 
                    placeholder="Notas (ej: Piking, A previsión)" 
                    className="border p-2 rounded text-sm w-full" 
                    value={formData.manufacturingNotes}
                    onChange={e => handleChange('manufacturingNotes', e.target.value)}
                />
              </div>

              {/* Carga */}
              <div className="border-l-4 border-orange-500 pl-4 py-2 bg-orange-50 rounded-r">
                <h4 className="text-orange-700 font-bold text-sm mb-2 flex items-center gap-2"><Clock size={14}/> Fecha de Carga</h4>
                <input 
                    type="date" 
                    className="border p-2 rounded text-sm w-full" 
                    value={formData.loadingDate}
                    onChange={e => handleChange('loadingDate', e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t flex justify-between gap-2 bg-gray-50">
            {data && data.id && (
                <button 
                    onClick={confirmDelete} 
                    className="px-4 py-2 text-red-600 border border-red-200 rounded hover:bg-red-50 flex items-center gap-2"
                >
                    <Trash2 size={18}/> Borrar
                </button>
            )}
            <div className="flex gap-2">
                <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded">Cancelar</button>
                <button onClick={handleSubmit} className="px-6 py-2 bg-blue-600 text-white rounded font-medium shadow hover:bg-blue-700 flex items-center gap-2">
                    <Save size={18}/> Guardar
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};


// --- COMPONENTE PRINCIPAL (BOARD) ---

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('board'); 
  
  // Datos Globales
  // Eliminamos el estado `clients` ya que vendrá de la API
  const [holidays, setHolidays] = useState([]);
  const [holidayPlans, setHolidayPlans] = useState([]); 
  const [orders, setOrders] = useState([]);
  
  // Datos simulados de Clientes (MOCK)
  const [mockClients, setMockClients] = useState([
    { id: 'cli1', name: 'Mercadona Sur' },
    { id: 'cli2', name: 'Día Central' },
    { id: 'cli3', name: 'Carrefour Norte' },
    { id: 'cli4', name: 'Alcampo Levante' },
    { id: 'cli5', name: 'Lidl Regional' },
  ]);
  
  // Rango de fechas seleccionado
  const [startDate, setStartDate] = useState(addDays(getTodayStr(), -2));
  const [endDate, setEndDate] = useState(addDays(getTodayStr(), 12));
  const [selectedPlanId, setSelectedPlanId] = useState('');
  
  // Editor State
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCell, setEditingCell] = useState(null);

  // 1. AUTENTICACIÓN
  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  // 2. CARGA DE DATOS MAESTROS (Festivos y Planes)
  useEffect(() => {
    if (!user) return;
    
    // Festivos Individuales
    const unsubHolidays = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'holidays'), (snap) => {
      setHolidays(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    
    // Planes de Festivos (Puentes)
    const unsubPlans = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'holiday_plans'), (snap) => {
      setHolidayPlans(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubHolidays();
      unsubPlans(); 
    };
  }, [user]);

  // 3. CARGA DE PEDIDOS (Filtrados por RANGO DE FECHAS)
  useEffect(() => {
    if (!user) return;
    
    const q = collection(db, 'artifacts', appId, 'public', 'data', 'orders');

    const unsubOrders = onSnapshot(q, (snap) => {
      const allOrders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Filtramos en memoria. Nota: Se recomienda filtrado en BD (query) para colecciones grandes.
      const visibleOrders = allOrders.filter(o => o.date >= startDate && o.date <= endDate);
      setOrders(visibleOrders);
    });

    return () => unsubOrders();
  }, [user, startDate, endDate]);


  // 4. LÓGICA DE VISUALIZACIÓN
  const dateColumns = useMemo(() => {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) return []; 
    
    for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
        dates.push(new Date(dt).toISOString().split('T')[0]);
    }
    return dates;
  }, [startDate, endDate]);

  const ordersMap = useMemo(() => {
    const map = {};
    orders.forEach(o => {
      if (!map[o.clientId]) map[o.clientId] = {};
      map[o.clientId][o.date] = o;
    });
    return map;
  }, [orders]);


  // 5. MANEJADORES
  const handleCellClick = (clientId, dateStr) => {
    const existing = ordersMap[clientId]?.[dateStr] || null;
    const client = mockClients.find(c => c.id === clientId); // Usamos mockClients

    setEditingCell({
      clientId,
      dateStr,
      clientName: client?.name || 'Cliente (API Pendiente)',
      data: existing
    });
    setEditorOpen(true);
  };

  const handleSaveCell = async (formData) => {
    const { clientId, dateStr, data } = editingCell;
    const isDelete = formData.delete; // flag for deletion

    if (isDelete && data && data.id) {
        // Lógica de borrado
        try {
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', data.id));
            setEditorOpen(false);
        } catch (error) {
            console.error("Error borrando:", error);
        }
        return;
    }
    
    try {
        const payload = {
            ...formData,
            clientId,
            date: dateStr,
            updatedAt: new Date().toISOString()
        };
        // Remove the delete flag if it exists
        delete payload.delete; 

        if (data && data.id) {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'orders', data.id), payload);
        } else {
            // Solo añadir si realmente hay contenido (delivers=true, o no es un no-entrega vacío)
            if (payload.delivers) {
                 await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'orders'), payload);
            }
        }
        setEditorOpen(false);
    } catch (error) {
        console.error("Error guardando:", error);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-blue-600 animate-pulse">Cargando Planificación...</div>;

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
      {/* HEADER DE NAVEGACIÓN */}
      <nav className="bg-white shadow-sm border-b px-4 py-3 flex justify-between items-center sticky top-0 z-40 print:hidden">
        <div className="flex items-center gap-4 flex-wrap">
            <div className="bg-blue-600 text-white p-2 rounded-lg shrink-0">
                <Truck size={20} />
            </div>
            
            {/* SELECTOR DE RANGO DE FECHAS */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
                
                {/* 1. Selector de Plan Guardado */}
                <select 
                    value={selectedPlanId}
                    onChange={(e) => {
                        const id = e.target.value;
                        setSelectedPlanId(id);
                        if (id) {
                            const plan = holidayPlans.find(p => p.id === id);
                            if (plan) {
                                setStartDate(plan.startDate);
                                setEndDate(plan.endDate);
                            }
                        }
                    }}
                    className="bg-white border border-gray-300 text-gray-700 py-1 px-2 rounded text-sm focus:outline-none focus:border-blue-500 font-medium h-10 w-48 sm:w-auto"
                >
                    <option value="">-- Rango Personalizado --</option>
                    {holidayPlans.map(plan => (
                        <option key={plan.id} value={plan.id}>{plan.name} ({formatDate(plan.startDate)} - {formatDate(plan.endDate)})</option>
                    ))}
                </select>

                {/* 2. Fechas Personalizadas */}
                <div className="flex items-center gap-2 text-sm">
                    <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => {setStartDate(e.target.value); setSelectedPlanId('')}} // Limpia selección al cambiar manualmente
                        className="bg-white border border-gray-300 text-gray-700 py-1 px-2 rounded text-sm focus:outline-none focus:border-blue-500 font-medium w-32"
                    />
                    <ArrowRight size={16} className="text-gray-400 shrink-0"/>
                    <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => {setEndDate(e.target.value); setSelectedPlanId('')}} // Limpia selección al cambiar manualmente
                        className="bg-white border border-gray-300 text-gray-700 py-1 px-2 rounded text-sm focus:outline-none focus:border-blue-500 font-medium w-32"
                    />
                </div>
            </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
            <button 
                onClick={() => setView('board')} 
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${view === 'board' ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-gray-100 text-gray-600'}`}
            >
                <Calendar size={18} /> <span className="hidden sm:inline">Pizarra</span>
            </button>
            <button 
                onClick={() => setView('reports')} 
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${view === 'reports' ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-gray-100 text-gray-600'}`}
            >
                <FileText size={18} /> <span className="hidden sm:inline">Informes</span>
            </button>
            <button 
                onClick={() => setView('settings')} 
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${view === 'settings' ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-gray-100 text-gray-600'}`}
            >
                <Settings size={18} /> <span className="hidden sm:inline">Config</span>
            </button>
        </div>
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <main className="p-2 md:p-4">
        
        {view === 'settings' && <ConfigPanel user={user} onClose={() => setView('board')} />}
        
        {view === 'reports' && (
            <ReportsView 
                dateRange={{start: startDate, end: endDate}}
                orders={orders} 
                holidays={holidays}
            />
        )}

        {view === 'board' && (
            <div className="overflow-x-auto shadow-xl rounded-lg border border-gray-300 bg-white">
                <table className="min-w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="sticky left-0 z-20 bg-gray-100 border-b border-r border-gray-300 p-3 text-left min-w-[150px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                <span className="text-gray-500 text-xs uppercase tracking-wider font-bold">Cliente / Día</span>
                            </th>
                            {dateColumns.map(date => {
                                // COMPROBAMOS SI ESTE DÍA COINCIDE CON ALGÚN FESTIVO REGISTRADO
                                const matchedHoliday = holidays.find(h => h.date === date);
                                const isHoliday = !!matchedHoliday;

                                return (
                                    <th key={date} className={`min-w-[140px] border-b border-gray-200 p-2 text-center ${isHoliday ? 'bg-red-50 border-red-200' : 'bg-white'}`}>
                                        <div className={`text-xs font-bold ${isHoliday ? 'text-red-600' : 'text-gray-400'}`}>
                                            {getDayOfWeek(date)}
                                        </div>
                                        <div className={`text-sm flex flex-col items-center ${isHoliday ? 'text-red-800 font-extrabold' : 'text-gray-800 font-medium'}`}>
                                            <span>{formatDate(date)}</span>
                                            {isHoliday && <span className="text-[10px] text-red-500 font-normal truncate max-w-[100px]">{matchedHoliday.name}</span>}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {mockClients.length === 0 && (
                            <tr><td colSpan={dateColumns.length + 1} className="p-8 text-center text-gray-500">No hay clientes (Usando mock).</td></tr>
                        )}
                        {mockClients.map(client => (
                            <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                                {/* Columna Cliente */}
                                <td className="sticky left-0 z-10 bg-white border-r border-b border-gray-300 p-3 font-medium text-gray-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                    {client.name}
                                </td>
                                
                                {/* Celdas de Días */}
                                {dateColumns.map(date => {
                                    const order = ordersMap[client.id]?.[date];
                                    const isHoliday = holidays.some(h => h.date === date);

                                    return (
                                        <td 
                                            key={`${client.id}-${date}`} 
                                            onClick={() => handleCellClick(client.id, date)}
                                            className={`border-b border-r border-gray-200 h-28 relative cursor-pointer select-none group transition-all
                                                ${!order ? 'hover:bg-blue-50' : 'bg-white hover:ring-2 hover:ring-blue-300 hover:z-10'}
                                                ${isHoliday ? 'bg-red-50/30' : ''}
                                            `}
                                        >
                                            {!order ? (
                                                <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-30">
                                                    <Plus size={20} className="text-blue-500"/>
                                                </div>
                                            ) : (
                                                <>
                                                    {!order.delivers ? (
                                                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                            <span className="text-2xl font-bold text-gray-300">NO</span>
                                                        </div>
                                                    ) : (
                                                        <div className="w-full h-full p-1 text-[10px] leading-tight relative">
                                                            <div className="absolute top-1 left-1 text-blue-700 font-bold max-w-[60%] truncate">
                                                                {formatDate(order.receptionDate)} {order.receptionTime}
                                                            </div>
                                                            <div className="absolute top-1 right-1 text-right text-black font-bold max-w-[60%] truncate">
                                                                {order.transportCompany || <span className="text-red-400">???</span>}
                                                            </div>
                                                            {order.transportComments && (
                                                                <div className="absolute inset-x-1 top-6 bottom-6 flex items-center justify-center text-center text-gray-400 italic text-[9px] overflow-hidden">
                                                                    "{order.transportComments.substring(0,20)}..."
                                                                </div>
                                                            )}
                                                            <div className="absolute bottom-1 left-1 text-green-700 font-bold max-w-[50%]">
                                                                <div className="flex flex-col">
                                                                    <span>Fab: {formatDate(order.manufacturingDate)}</span>
                                                                    <span className="text-[9px] font-normal text-green-600 truncate">{order.manufacturingNotes}</span>
                                                                </div>
                                                            </div>
                                                            <div className="absolute bottom-1 right-1 text-right text-orange-600 font-bold max-w-[50%]">
                                                                <div className="flex flex-col items-end">
                                                                    <span className="text-[9px] text-gray-400">Carga</span>
                                                                    <span className="text-sm">{getDayOfWeek(order.loadingDate)} {formatDate(order.loadingDate)}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </main>

      <CellEditor 
        isOpen={editorOpen} 
        onClose={() => setEditorOpen(false)}
        data={editingCell?.data}
        clientName={editingCell?.clientName}
        dateStr={editingCell?.dateStr}
        onSave={handleSaveCell}
      />
    </div>
  );
}