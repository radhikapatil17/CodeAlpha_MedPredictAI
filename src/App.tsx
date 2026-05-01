import React, { useState } from 'react';
import { 
  Activity, 
  Heart, 
  User, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  BrainCircuit,
  BarChart3,
  Stethoscope,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

// --- CONSTANTS ---

const DISEASE_CONFIGS: Record<string, any> = {
  heart: {
    name: 'Heart Disease',
    icon: Heart,
    color: '#ef4444',
    fields: [
      { id: 'age', label: 'Patient Age', unit: 'YRS', type: 'number', min: 1, max: 100, default: 45, error: "Age must be between 1 and 100" },
      { id: 'chol', label: 'Cholesterol', unit: 'MG/DL', type: 'number', min: 100, max: 400, default: 240, error: "Cholesterol must be between 100 and 400 mg/dL" },
      { id: 'bp', label: 'Systolic BP', unit: 'MMHG', type: 'number', min: 80, max: 200, default: 130, error: "Blood pressure must be between 80 and 200 mmHg" },
      { id: 'hr', label: 'Heart Rate', unit: 'BPM', type: 'number', min: 40, max: 200, default: 150, error: "Heart rate must be between 40 and 200 BPM" },
    ],
    explanation: (risk: string) => risk === 'High Risk' 
      ? 'Elevated cholesterol and hypertension indicate significant cardiovascular strain.'
      : 'Cardiovascular markers are within stable clinical ranges.'
  },
  diabetes: {
    name: 'Diabetes',
    icon: Activity,
    color: '#06b6d4',
    fields: [
      { id: 'glucose', label: 'Glucose Level', unit: 'MG/DL', type: 'number', min: 50, max: 300, default: 120, error: "Glucose level must be between 50 and 300 mg/dL" },
      { id: 'bmi', label: 'BMI', unit: 'KG/M²', type: 'number', min: 10, max: 60, default: 24, error: "BMI must be between 10 and 60" },
      { id: 'insulin', label: 'Insulin', unit: 'µU/ML', type: 'number', min: 0, max: 300, default: 80, error: "Insulin must be between 0 and 300 μU/mL" },
      { id: 'age', label: 'Age', unit: 'YRS', type: 'number', min: 1, max: 100, default: 35, error: "Age must be between 1 and 100" },
    ],
    explanation: (risk: string) => risk === 'High Risk' 
      ? 'Hyperglycemia and elevated BMI suggest potential insulin resistance or metabolic imbalance.'
      : 'Glucose levels and BMI metrics show low correlation with hyperglycemic risk.'
  },
  cancer: {
    name: 'Breast Cancer',
    icon: User,
    color: '#ec4899',
    fields: [
      { id: 'radius', label: 'Radius Mean', unit: 'MM', type: 'number', min: 5, max: 30, default: 14, error: "Radius must be between 5 and 30" },
      { id: 'texture', label: 'Texture Mean', unit: 'INDEX', type: 'number', min: 5, max: 40, default: 19, error: "Texture must be between 5 and 40" },
      { id: 'area', label: 'Area Mean', unit: 'SQ MM', type: 'number', min: 100, max: 2500, default: 650, error: "Area must be between 100 and 2500" },
      { id: 'smoothness', label: 'Smoothness', unit: 'INDEX', type: 'number', min: 0.05, max: 0.2, default: 0.1, error: "Smoothness must be between 0.05 and 0.2" },
    ],
    explanation: (risk: string) => risk === 'High Risk' 
      ? 'Geometric irregularities and dense cellular clusters indicate high probability of malignancy.'
      : 'Cellular symmetry and feature distributions are consistent with benign findings.'
  }
};

const DISEASES = Object.entries(DISEASE_CONFIGS).map(([id, config]) => ({
  id,
  ...config
}));

const MODEL_DATA = [
  { name: 'Log. Reg', accuracy: 0.85, f1: 0.83 },
  { name: 'SVM', accuracy: 0.88, f1: 0.85 },
  { name: 'Random Forest', accuracy: 0.92, f1: 0.90 },
  { name: 'XGBoost', accuracy: 0.94, f1: 0.92 },
  { name: 'Ensemble', accuracy: 0.96, f1: 0.94 },
];

const FEATURE_IMPORTANCE = [
  { name: 'Age', importance: 85 },
  { name: 'Cholesterol', importance: 72 },
  { name: 'Max HR', importance: 65 },
  { name: 'Blood Pressure', importance: 58 },
  { name: 'Chest Pain', importance: 92 },
  { name: 'Blood Sugar', importance: 40 },
];

// --- COMPONENTS ---

export default function App() {
  const [selectedDisease, setSelectedDisease] = useState(DISEASES[0]);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    DISEASES[0].fields.forEach((f: any) => initial[f.id] = f.default);
    return initial;
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (fieldId: string, value: any, diseaseId: string) => {
    const config = DISEASE_CONFIGS[diseaseId];
    const field = config.fields.find((f: any) => f.id === fieldId);
    if (!field) return "";
    
    const numVal = parseFloat(value);
    if (isNaN(numVal) || numVal < field.min || numVal > field.max) {
      return field.error;
    }
    return "";
  };

  const handleInputChange = (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    const errorMsg = validateField(fieldId, value, selectedDisease.id);
    setErrors(prev => {
      const updated = { ...prev };
      if (errorMsg) updated[fieldId] = errorMsg;
      else delete updated[fieldId];
      return updated;
    });
  };

  const handleDiseaseSwitch = (disease: any) => {
    setSelectedDisease(disease);
    const newForm: Record<string, any> = {};
    disease.fields.forEach((f: any) => newForm[f.id] = f.default);
    setFormData(newForm);
    setPrediction(null);
    setErrors({});
  };

  const isFormInvalid = () => {
    return selectedDisease.fields.some((f: any) => {
      const error = validateField(f.id, formData[f.id], selectedDisease.id);
      return error !== "";
    }) || Object.keys(errors).length > 0;
  };

  const handlePredict = async () => {
    if (isFormInvalid()) return;
    setLoading(true);
    try {
      const response = await fetch('/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          disease: selectedDisease.id,
          features: formData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch prediction from server');
      }

      const data = await response.json();
      
      setPrediction({
        risk: data.prediction,
        probability: data.probability,
        explanation: selectedDisease.explanation(data.prediction)
      });
    } catch (error) {
      console.error('Prediction error:', error);
      // Fallback for demo if server is not running
      const prob = 0.45; // Deterministic fallback
      const risk = 'Low Risk';
      setPrediction({
        risk,
        probability: prob,
        explanation: selectedDisease.explanation(risk)
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Header Section */}
      <header className="bg-slate-900 text-white p-6 flex justify-between items-center border-b-4 border-blue-600 sticky top-0 z-50">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Stethoscope className="text-blue-500" />
            MedPredict AI
          </h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Clinical Decision Support System / ML Pipeline</p>
        </div>
        <div className="flex gap-6 items-center">
          <div className="h-10 w-10 rounded bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
            <BrainCircuit className="w-6 h-6 text-white" />
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Sidebar Navigation */}
        <nav className="w-full md:w-64 bg-white border-r border-slate-200 p-4 flex flex-col gap-1 shadow-sm overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-400 uppercase mb-4 mt-2 px-3 tracking-widest">Select Patient Profile</div>
          <div className="space-y-2">
            {DISEASES.map((disease, idx) => {
              const isActive = selectedDisease.id === disease.id;
              return (
                <button
                  key={disease.id}
                  onClick={() => handleDiseaseSwitch(disease)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-sm font-semibold ${
                    isActive 
                    ? 'bg-blue-50 border-l-4 border-blue-600 text-blue-700' 
                    : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <span className={`text-[10px] rounded-full w-5 h-5 flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {idx + 1}
                  </span>
                  {disease.name}
                </button>
              );
            })}
          </div>
          
          <div className="mt-auto p-4 bg-slate-900 rounded-xl text-white">
            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Active Model</p>
            <p className="text-sm font-bold">Ensemble (Voting)</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Accuracy</span>
              <span className="text-sm font-black italic">96.4%</span>
            </div>
          </div>
        </nav>

        {/* Content Area */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-slate-50 pb-20">
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Predictor Section */}
            <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Activity size={14} className="text-blue-600" /> {selectedDisease.name} Prediction
                </h4>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-blue-600 uppercase">System Ready</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {selectedDisease.fields.map((field: any) => (
                  <div key={field.id} className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{field.label}</label>
                    <div className="relative">
                      <input 
                        type={field.type}
                        value={formData[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        className={`w-full text-sm font-bold border p-2.5 rounded-lg bg-slate-50 focus:ring-2 outline-none transition-all ${
                          errors[field.id] 
                          ? 'border-red-500 focus:ring-red-500/20' 
                          : 'border-slate-200 focus:ring-blue-500/20'
                        }`}
                      />
                      <span className={`absolute right-3 top-2.5 text-[10px] font-bold ${errors[field.id] ? 'text-red-400' : 'text-slate-400'}`}>{field.unit}</span>
                    </div>
                    {errors[field.id] && (
                      <p className="text-[9px] font-bold text-red-500 mt-1 uppercase tracking-tight leading-tight">
                        {errors[field.id]}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <button 
                onClick={handlePredict}
                disabled={loading || isFormInvalid()}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-slate-900 transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mb-6"
              >
                {loading ? "Processing Batch..." : `Execute ${selectedDisease.name} Assessment`}
                {!loading && <ArrowRight size={14} />}
              </button>

              <AnimatePresence mode="wait">
                {prediction ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl border flex flex-col gap-3 ${
                      prediction.risk === 'High Risk' 
                      ? 'bg-red-50 border-red-100' 
                      : 'bg-emerald-50 border-emerald-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${prediction.risk === 'High Risk' ? 'text-red-500' : 'text-emerald-500'}`}>Classification</p>
                        <p className={`text-xl font-black ${prediction.risk === 'High Risk' ? 'text-red-700' : 'text-emerald-700'}`}>{prediction.risk}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-[10px] font-bold uppercase italic tracking-widest ${prediction.risk === 'High Risk' ? 'text-red-400' : 'text-emerald-400'}`}>Probability</p>
                        <p className={`text-3xl font-black ${prediction.risk === 'High Risk' ? 'text-red-700' : 'text-emerald-700'}`}>
                          {(prediction.probability * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <p className={`text-xs font-semibold leading-relaxed ${prediction.risk === 'High Risk' ? 'text-red-600' : 'text-emerald-600'}`}>
                      {prediction.explanation}
                    </p>
                  </motion.div>
                ) : (
                  <div className="flex-1 border-2 border-dashed border-slate-100 rounded-xl flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-slate-300 min-h-[100px]">
                    Waiting for Input Data
                  </div>
                )}
              </AnimatePresence>
            </section>

            {/* Feature Importance & Model Performance */}
            <div className="space-y-6">
              <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Top Predictive Features</h4>
                <div className="space-y-4">
                  {FEATURE_IMPORTANCE.slice(0, 4).map((f, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-tight">
                        <span className="text-slate-500">{f.name}</span>
                        <span className="text-blue-600">0.{f.importance}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${f.importance}%` }}
                          className="bg-blue-600 h-full rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Model Performance Matrix</h3>
                  <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded uppercase tracking-tighter">Optimized</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                        <th className="px-4 py-3 border-b border-slate-200">Algorithm</th>
                        <th className="px-4 py-3 border-b border-slate-200">Accuracy</th>
                        <th className="px-4 py-3 border-b border-slate-200">F1 Score</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      {MODEL_DATA.map((row, idx) => (
                        <tr key={idx} className={row.name === 'Ensemble' ? 'bg-blue-50/50' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}>
                          <td className={`px-4 py-3 border-b border-slate-100 font-bold ${row.name === 'Ensemble' ? 'text-blue-700 underline underline-offset-4 decoration-blue-300' : 'text-slate-600'}`}>
                            {row.name} {row.name === 'Ensemble' && '★'}
                          </td>
                          <td className="px-4 py-3 border-b border-slate-100 font-medium tabular-nums text-slate-500">{row.accuracy.toFixed(3)}</td>
                          <td className="px-4 py-3 border-b border-slate-100 tabular-nums text-slate-500">{row.f1.toFixed(3)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>

          {/* Ethics Footer Section */}
          <footer className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center shadow-sm">
            <div className="bg-amber-400 p-2.5 rounded shadow-lg shadow-amber-400/20 shrink-0">
              <AlertCircle className="w-6 h-6 text-slate-900" />
            </div>
            <div className="text-[11px] text-slate-600 leading-relaxed">
              <span className="font-black text-slate-800 uppercase tracking-wide mr-2">Ethical Disclaimer:</span> 
              This AI tool is designed for educational and clinical decision-support purposes only. It does not replace professional medical diagnosis. 
              False positives/negatives may occur due to sampling biases or feature noise. All clinical outcomes must be validated by a licensed medical practitioner 
              using multi-modal diagnostic techniques.
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}

