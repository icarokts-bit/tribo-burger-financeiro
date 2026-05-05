import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { Wallet, TrendingUp, TrendingDown, AlertCircle, Plus, Trash2, CheckCircle, Clock, Landmark, CreditCard, Truck, BarChart3, ShoppingBag, Store, Table } from 'lucide-react';

const minhasChaves = {
  apiKey: "AIzaSyCL0o0TQYbPXoo7Yo_qJpc1oa7jib8KBcc",
  authDomain: "tribo-burger-app.firebaseapp.com",
  projectId: "tribo-burger-app",
  storageBucket: "tribo-burger-app.firebasestorage.app",
  messagingSenderId: "490245681469",
  appId: "1:490245681469:web:189b1d2e35bd142cc31554",
  measurementId: "G-SQ87BWHZ1L"
};

const app = initializeApp(minhasChaves);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'tribo-burger-financeiro';

const BANK_ACCOUNTS = ['Mercado Pago', 'C6', 'Aplicação', 'Fundo Aluguel', 'Fundo C6', 'Fundo Mercado Pago', 'Fundo Rico', 'Fiado', 'iFood'];
const CREDIT_CARDS = ['Cartão Mercado Pago', 'Cartão C6'];

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [dailyRecords, setDailyRecords] = useState({});
  const [salesMonth, setSalesMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  // Formulário Lançamento
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [account, setAccount] = useState(BANK_ACCOUNTS[0]);
  const [type, setType] = useState('entrada');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('pago');

  useEffect(() => {
    signInAnonymously(auth).catch(console.error);
    onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    const path = ['artifacts', appId, 'users', user.uid];
    
    const unsubTx = onSnapshot(collection(db, ...path, 'transactions'), (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => new Date(b.date) - new Date(a.date)));
    });

    const unsubDaily = onSnapshot(collection(db, ...path, 'dailyRecords'), (snap) => {
      const recs = {}; snap.docs.forEach(d => recs[d.id] = d.data());
      setDailyRecords(recs);
    });

    return () => { unsubTx(); unsubDaily(); };
  }, [user]);

  const handleAddTx = async (e) => {
    e.preventDefault();
    if (!user || !description || !amount) return;
    const id = Date.now().toString();
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'transactions', id), {
      description, amount: parseFloat(amount), type, date, account, status
    });
    setDescription(''); setAmount('');
  };

  const formatCurrency = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  if (!user) return <div className="p-10 text-center font-bold">A carregar sistema...</div>;

  return (
    <div className="min-h-screen bg-[#FDFCF9] font-sans pb-20">
      <header className="bg-[#0B0B0B] p-4 flex justify-between items-center border-b-4 border-[#31392A]">
        <h1 className="text-[#F8CC82] font-black uppercase tracking-tighter">Tribo Financeiro</h1>
        <nav className="flex gap-4">
          <button onClick={() => setActiveTab('dashboard')} className="text-white"><TrendingUp size={20}/></button>
          <button onClick={() => setActiveTab('planilha')} className="text-white"><Table size={20}/></button>
        </nav>
      </header>

      <main className="p-4 max-w-4xl mx-auto">
        {activeTab === 'dashboard' ? (
          <div className="space-y-6">
            <form onSubmit={handleAddTx} className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
              <input type="text" placeholder="O que comprou?" className="w-full p-3 bg-slate-50 rounded-xl outline-none border" value={description} onChange={e=>setDescription(e.target.value)} />
              <div className="flex gap-2">
                <input type="number" step="0.01" placeholder="Valor" className="w-1/2 p-3 bg-slate-50 rounded-xl outline-none border font-bold" value={amount} onChange={e=>setAmount(e.target.value)} />
                <input type="date" className="w-1/2 p-3 bg-slate-50 rounded-xl outline-none border" value={date} onChange={e=>setDate(e.target.value)} />
              </div>
              <button className="w-full bg-[#31392A] text-[#F8CC82] p-4 rounded-2xl font-black uppercase">Gravar Registo</button>
            </form>

            <div className="bg-white rounded-3xl border overflow-hidden">
              <div className="p-4 bg-slate-50 font-bold border-b">Últimos Lançamentos</div>
              {transactions.map(t => (
                <div key={t.id} className="p-4 border-b last:border-0 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-[#31392A]">{t.description}</p>
                    <p className="text-[10px] text-slate-400">{t.date}</p>
                  </div>
                  <p className={`font-black ${t.type === 'entrada' ? 'text-green-600' : 'text-slate-800'}`}>{formatCurrency(t.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border overflow-hidden overflow-x-auto">
             <table className="w-full text-xs text-center border-collapse">
               <thead className="bg-[#0B0B0B] text-white">
                 <tr>
                    <th className="p-3 text-left">Dia</th>
                    <th className="p-3">Pix</th>
                    <th className="p-3">Dinheiro</th>
                    <th className="p-3">iFood</th>
                 </tr>
               </thead>
               <tbody>
                  {/* ... lógica de dias ... */}
                  <tr><td className="p-3 text-slate-400" colSpan="4">Preencha os valores diários aqui</td></tr>
               </tbody>
             </table>
          </div>
        )}
      </main>
    </div>
  );
}