import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Send, AlertCircle, CheckCircle2, MessageSquare } from 'lucide-react';

// Definimos el contrato con el Backend
interface AnalisisResultado {
  texto: string;
  sentimiento: 'Positivo' | 'Negativo' | 'Neutro';
  categoria: 'App' | 'Servicio' | 'Precio' | 'Calidad';
  urgencia: number;
  resumen: string;
}

const App: React.FC = () => {
  const [inputText, setInputText] = useState<string>("");
  const [data, setData] = useState<AnalisisResultado[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Datos agregados por categoría: promedio de urgencia
  const aggregatedData = useMemo(() => {
    if (data.length === 0) return [] as { categoria: string; urgencia: number }[];
    const map: Record<string, { urgenciaTotal: number; count: number }> = {};
    data.forEach(d => {
      if (!map[d.categoria]) map[d.categoria] = { urgenciaTotal: 0, count: 0 };
      map[d.categoria].urgenciaTotal += d.urgencia;
      map[d.categoria].count += 1;
    });
    return Object.keys(map).map((k) => ({ categoria: k, urgencia: map[k].urgenciaTotal / map[k].count }));
  }, [data]);

  const handleAnalizar = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    const lineas = inputText.split('\n').filter(l => l.trim() !== "");
    
    try {
      const response = await axios.post('http://127.0.0.1:8000/analizar', { textos: lineas });
      setData(response.data.resultado);
    } catch (error) {
      console.error("Error conectando con el backend de Python:", error);
    } finally {
      setLoading(false);
    }
  };

  // Colores para los gráficos basados en tus variables CSS
  const COLORS = ['#aa3bff', '#c084fc', '#6b6375', '#e5e4e7'];

  return (
    <main className="p-6 md:p-12 space-y-8">
      <header className="text-left border-b border-[var(--border)] pb-8">
        <h1 className="!m-0">Customer Insights IA</h1>
        <p className="text-[var(--text)]">Análisis semántico en tiempo real con Gemini 2.5 Flash</p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Entrada de datos */}
        <div className="space-y-4">
          <h2 className="flex items-center gap-2"><MessageSquare size={20}/> Entrada de Feedback</h2>
          <textarea 
            className="w-full h-64 p-4 rounded-lg bg-[var(--code-bg)] border border-[var(--border)] focus:border-[var(--accent)] outline-none transition-all resize-none"
            placeholder="Pega comentarios aquí..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button 
            onClick={handleAnalizar}
            disabled={loading}
            className="w-full bg-[var(--accent)] text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Procesando..." : <><Send size={18}/> Analizar Comentarios</>}
          </button>
        </div>

        {/* Visualización Rápida */}
        <div className="bg-[var(--social-bg)] p-6 rounded-2xl border border-[var(--border)] min-h-[300px] flex items-center justify-center">
              {data.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={aggregatedData}>
                <XAxis dataKey="categoria" stroke="var(--text)" fontSize={12}/>
                <YAxis stroke="var(--text)" fontSize={12}/>
                <Tooltip contentStyle={{backgroundColor: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--border)'}} />
                <Bar dataKey="urgencia" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="italic text-[var(--text)]">Los gráficos aparecerán tras el análisis</p>
          )}
        </div>
      </section>

      {/* Tabla de Resultados */}
      {data.length > 0 && (
        <section className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-[var(--code-bg)] text-[var(--text-h)]">
              <tr>
                <th className="p-4 border-b border-[var(--border)]">Comentario</th>
                <th className="p-4 border-b border-[var(--border)]">Sentimiento</th>
                <th className="p-4 border-b border-[var(--border)]">Urgencia</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, i) => (
                <tr key={i} className="hover:bg-[var(--accent-bg)] transition-colors">
                  <td className="p-4 border-b border-[var(--border)] text-sm">{item.texto}</td>
                  <td className="p-4 border-b border-[var(--border)]">
                    <span className={`flex items-center gap-1 text-xs font-bold uppercase ${item.sentimiento === 'Positivo' ? 'text-green-500' : 'text-red-500'}`}>
                      {item.sentimiento === 'Positivo' ? <CheckCircle2 size={14}/> : <AlertCircle size={14}/>}
                      {item.sentimiento}
                    </span>
                  </td>
                  <td className="p-4 border-b border-[var(--border)]">
                    <div className="flex items-center gap-3">
                      {/* El número de urgencia con fuente mono para que se vea pro */}
                      <span className="font-mono font-bold text-[var(--accent)] w-4">
                        {item.urgencia}
                      </span>
                      
                      {/* La barra de progreso */}
                      <div className="flex-1 bg-[var(--border)] h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-[var(--accent)] h-full transition-all duration-500" 
                          style={{ width: `${(item.urgencia / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
};

export default App;