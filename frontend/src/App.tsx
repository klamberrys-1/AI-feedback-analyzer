import React, { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Send,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  Loader2,
  RefreshCw,
} from 'lucide-react';

// Contrato con el backend
interface AnalisisResultado {
  texto: string;
  sentimiento: 'Positivo' | 'Negativo' | 'Neutro';
  categoria: string;
  urgencia: number; // 0-5
  resumen?: string;
}

const SAMPLE_EXAMPLES = [
  'La app se cierra al intentar pagar, necesito solución urgente',
  'Me encanta la nueva interfaz, mucho más intuitiva y rápida',
  'El precio es muy alto para las funcionalidades ofrecidas',
  'El servicio al cliente tardó mucho en responder, mala experiencia',
  'Encontré muchos bugs al usar la sección de reportes',
  'La calidad del audio en llamadas es excelente',
];

const sentimentColors: Record<string, string> = {
  Positivo: '#16a34a',
  Negativo: '#dc2626',
  Neutro: '#f59e0b',
};

const App: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [data, setData] = useState<AnalisisResultado[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Datos para charts
  const urgencyByCategory = useMemo(() => {
    const normalizeCategory = (raw: string) => {
      if (!raw) return 'Otro';
      const s = raw.toLowerCase();
      if (s.includes('app')) return 'App';
      if (s.includes('servic') || s.includes('servicio')) return 'Servicio';
      if (s.includes('precio') || s.includes('price')) return 'Precio';
      if (s.includes('calidad') || s.includes('quality')) return 'Calidad';
      return 'Otro';
    };

    const map: Record<string, { categoria: string; urgencia: number; count: number }> = {};
    data.forEach((d) => {
      const cat = normalizeCategory(d.categoria || '');
      if (!map[cat]) map[cat] = { categoria: cat, urgencia: 0, count: 0 };
      map[cat].urgencia += d.urgencia;
      map[cat].count += 1;
    });
    return Object.values(map).map((m) => ({ categoria: m.categoria, urgencia: +(m.urgencia / Math.max(1, m.count)).toFixed(2) }));
  }, [data]);

  const sentimentDistribution = useMemo(() => {
    const counts: Record<string, number> = { Positivo: 0, Negativo: 0, Neutro: 0 };
    data.forEach((d) => {
      counts[d.sentimiento] = (counts[d.sentimiento] || 0) + 1;
    });
    return Object.keys(counts).map((k) => ({ name: k, value: counts[k] }));
  }, [data]);

  useEffect(() => {
    // Placeholder: could trigger analytics or animations on data change
  }, [data]);

  const handleAnalizar = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setExpandedRow(null);
    const lineas = inputText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

    try {
      const res = await axios.post('http://127.0.0.1:8000/analizar', { textos: lineas });
      console.log('Respuesta del servidor:', res.data);

      // Normalizar resultado a un arreglo
      let resultado = res.data && res.data.resultado;
      if (typeof resultado === 'string') {
        try {
          resultado = JSON.parse(resultado);
        } catch (err) {
          console.error('No se pudo parsear resultado string:', err);
          resultado = [];
        }
      } else if (!Array.isArray(resultado)) {
        // Si viene como objeto o undefined, intentar parsear o fallback
        try {
          resultado = resultado ? Object.values(resultado) : [];
        } catch (err) {
          resultado = [];
        }
      }

      setData(resultado || []);
    } catch (err) {
      console.error('Error al analizar:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadExamples = () => {
    setInputText(SAMPLE_EXAMPLES.join('\n'));
  };

  return (
    <main className="min-h-screen p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400">Dashboard de Análisis Semántico</h1>
            <p className="text-sm text-slate-400">Insights de feedback con modelos generativos — Dark Mode</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleLoadExamples}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700"
            >
              <RefreshCw size={16} /> Cargar ejemplos aleatorios
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Input (glass) */}
          <div className="space-y-4 p-6 rounded-xl bg-slate-900/40 backdrop-blur-md border border-slate-800/50">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400"><MessageSquare size={18} /> Entrada de Feedback</h2>
              <div className="text-sm text-slate-400">Líneas: {inputText.split('\n').filter(Boolean).length}</div>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Pega o escribe feedback aquí, cada comentario en una línea..."
              className="w-full min-h-[280px] p-4 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
            />

            <div className="flex gap-3">
              <button
                onClick={handleAnalizar}
                disabled={loading}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold hover:opacity-95 disabled:opacity-60 shadow-[0_0_20px_-5px_rgba(139,92,246,0.5)]"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={16} />}
                {loading ? 'Analizando...' : 'Analizar'}
              </button>

              <button
                onClick={handleLoadExamples}
                className="px-4 py-3 rounded-lg border border-slate-800 bg-slate-800 text-slate-200 hover:bg-slate-700"
              >
                Cargar ejemplos
              </button>
            </div>
          </div>

          {/* Right: Results (glass) */}
          <div className="space-y-4 p-6 rounded-xl bg-slate-900/40 backdrop-blur-md border border-slate-800/50">
            <div className="p-4 rounded-xl border border-slate-800 bg-gradient-to-b from-slate-900/50 to-slate-900/30">
              <h3 className="text-sm text-slate-300 font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 mb-3">Resumen Visual</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-56 p-2 bg-slate-900 rounded-lg border border-slate-800">
                  {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={urgencyByCategory} margin={{ top: 10, right: 8, left: 8, bottom: 10 }}>
                        <XAxis dataKey="categoria" tick={{ fill: '#cbd5e1' }} interval={0} height={50} />
                        <YAxis tick={{ fill: '#cbd5e1' }} />
                        <Tooltip wrapperStyle={{ background: '#0f172a', borderRadius: 8, border: '1px solid #1f2937' }} />
                        <Bar dataKey="urgencia" fill="url(#grad)" radius={[6, 6, 0, 0]} />
                        <defs>
                          <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#06b6d4" />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-500">Ejecuta un análisis para ver la urgencia por categoría</div>
                  )}
                </div>

                <div className="h-56 p-2 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-center">
                  {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={sentimentDistribution} dataKey="value" nameKey="name" innerRadius={36} outerRadius={70} paddingAngle={4}>
                          {sentimentDistribution.map((entry, idx) => (
                            <Cell key={entry.name} fill={["#8b5cf6", "#06b6d4", "#64748b"][idx % 3]} />
                          ))}
                        </Pie>
                        <Legend verticalAlign="bottom" align="center" wrapperStyle={{ color: '#cbd5e1' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-slate-500">Distribución de sentimiento aparecerá aquí</div>
                  )}
                </div>
              </div>
            </div>

            {/* Tabla de resultados (moderna) */}
            <div className="rounded-xl overflow-hidden bg-slate-900/40 backdrop-blur-md border border-slate-800/50">
              <table className="w-full table-auto text-sm divide-y divide-slate-800/50">
                <thead className="text-slate-300">
                  <tr>
                    <th className="p-3 text-left">Comentario</th>
                    <th className="p-3 text-left">Sentimiento</th>
                    <th className="p-3 text-left">Urgencia</th>
                  </tr>
                </thead>
                <tbody className="bg-transparent">
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-4 text-slate-500">No hay resultados — ejecuta un análisis.</td>
                    </tr>
                  ) : (
                    data.map((row, i) => (
                      <React.Fragment key={i}>
                        <tr
                          onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                          className="odd:bg-slate-950/20 hover:bg-slate-950/10 cursor-pointer"
                        >
                          <td className="p-3 align-top max-w-xl break-words">{row.texto}</td>
                          <td className="p-3 align-top">
                            <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-semibold`} style={{ background: 'rgba(255,255,255,0.03)' }}>
                              <span className="w-2 h-2 rounded-full" style={{ background: sentimentColors[row.sentimiento] || '#64748b' }} />
                              <span className="text-slate-200">{row.sentimiento}</span>
                            </span>
                          </td>
                          <td className="p-3 align-top">
                            <div className="flex items-center gap-3">
                              <div className="font-mono font-semibold text-violet-300 w-8">{row.urgencia}</div>
                              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-violet-600 to-cyan-400 transition-all" style={{ width: `${(row.urgencia / 5) * 100}%` }} />
                              </div>
                            </div>
                          </td>
                        </tr>

                        {expandedRow === i && (
                          <tr>
                            <td colSpan={3} className="p-3 bg-slate-900/60">
                              <div className="p-4 bg-slate-800 rounded-md text-slate-200">
                                <div className="font-semibold text-slate-100">Respuesta sugerida de la IA:</div>
                                <div className="mt-2 whitespace-pre-wrap">{row.respuesta_sugerida || 'No hay respuesta sugerida.'}</div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default App;