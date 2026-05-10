import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, TrendingUp, TrendingDown, Edit2, Check, X, Landmark, Wallet, CreditCard, DollarSign, PiggyBank } from 'lucide-react'
import { useLocalStore, useUIStore } from '../store'
import { formatAWST } from '../lib/time'
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts'

const EXPENSE_CATS = ['Food', 'Transport', 'Entertainment', 'Study', 'Clothing', 'Sport', 'Health', 'Other']
const CAT_COLORS = ['var(--dusk)', 'var(--clay)', 'var(--sage)', 'var(--teal)', 'var(--rose)', 'var(--amber)', 'var(--sand)', 'var(--muted)']

const ACCOUNT_TYPES = [
  { key: 'checking',   label: 'Checking',    icon: Landmark,   color: '#6dbf8a', emoji: '🏦' },
  { key: 'savings',    label: 'Savings',     icon: PiggyBank,  color: '#4ec9b8', emoji: '💰' },
  { key: 'credit',     label: 'Credit Card', icon: CreditCard, color: '#e8607a', emoji: '💳' },
  { key: 'paypal',     label: 'PayPal',      icon: Wallet,     color: '#9b8fd4', emoji: '🅿️' },
  { key: 'cash',       label: 'Cash',        icon: DollarSign, color: '#d4b896', emoji: '💵' },
  { key: 'investment', label: 'Investment',  icon: TrendingUp, color: '#f0a24a', emoji: '📈' },
  { key: 'other',      label: 'Other',       icon: Wallet,     color: 'rgba(240,235,225,0.4)', emoji: '💼' },
]

function getAccountType(key) {
  return ACCOUNT_TYPES.find(t => t.key === key) || ACCOUNT_TYPES[ACCOUNT_TYPES.length - 1]
}

function AccountCard({ account, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [bal, setBal] = useState(account.balance)
  const at = getAccountType(account.type)
  const isNegative = account.type === 'credit' || parseFloat(account.balance) < 0

  function save() {
    onUpdate(account.id, { balance: parseFloat(bal) || 0 })
    setEditing(false)
  }

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      style={{ position: 'relative', background: `linear-gradient(135deg, ${at.color}14 0%, rgba(255,255,255,0.04) 100%)`, border: `1px solid ${at.color}30`, borderRadius: 18, padding: 22, overflow: 'hidden' }}>
      {/* Glow orb */}
      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: `${at.color}18`, filter: 'blur(24px)', pointerEvents: 'none' }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: `${at.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
            {at.emoji}
          </div>
          <div>
            <div style={{ fontSize: '0.88rem', color: 'var(--cream)', fontWeight: 600 }}>{account.name}</div>
            <div style={{ fontSize: '0.6rem', color: at.color, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>{at.label}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setEditing(true)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 7, padding: '5px 7px', cursor: 'pointer', color: 'var(--muted)' }}>
            <Edit2 size={12} />
          </button>
          <button onClick={() => onDelete(account.id)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 7, padding: '5px 7px', cursor: 'pointer', color: 'var(--rose)', opacity: 0.7 }}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {editing ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="number" step="0.01" value={bal} onChange={e => setBal(e.target.value)} autoFocus
            style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: `1px solid ${at.color}50`, borderRadius: 9, padding: '8px 12px', color: 'var(--cream)', fontSize: '1rem', fontFamily: 'Cormorant Garamond, serif' }}
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }} />
          <button onClick={save} style={{ background: `${at.color}25`, border: 'none', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', color: at.color }}><Check size={14} /></button>
          <button onClick={() => setEditing(false)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', color: 'var(--muted)' }}><X size={14} /></button>
        </div>
      ) : (
        <div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2.2rem', color: isNegative ? 'var(--rose)' : at.color, lineHeight: 1, fontWeight: 300 }}>
            {isNegative && parseFloat(account.balance) > 0 ? '-' : ''}${Math.abs(parseFloat(account.balance || 0)).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          {account.notes && <div style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: 6 }}>{account.notes}</div>}
          <div style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.2)', marginTop: 6 }}>Click ✎ to update balance</div>
        </div>
      )}
    </motion.div>
  )
}

export default function Finance() {
  const { transactions, addTransaction, deleteTransaction, savingsGoals, addSavingsGoal, updateSavingsGoal,
    accounts, addAccount, updateAccount, deleteAccount } = useLocalStore()
  const { addToast } = useUIStore()
  const [tab, setTab] = useState('accounts')
  const [adding, setAdding] = useState(false)
  const [addingGoal, setAddingGoal] = useState(false)
  const [addingAccount, setAddingAccount] = useState(false)
  const [form, setForm] = useState({ type: 'expense', amount: '', category: 'Food', description: '', date: new Date().toISOString().split('T')[0] })
  const [goalForm, setGoalForm] = useState({ name: '', target: '', current: '', emoji: '💰' })
  const [accountForm, setAccountForm] = useState({ name: '', type: 'checking', balance: '', notes: '' })

  const thisMonth = new Date().toISOString().slice(0, 7)
  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount || 0), 0)
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount || 0), 0)
  const monthIncome = transactions.filter(t => t.type === 'income' && t.date?.startsWith(thisMonth)).reduce((s, t) => s + parseFloat(t.amount || 0), 0)
  const monthExpense = transactions.filter(t => t.type === 'expense' && t.date?.startsWith(thisMonth)).reduce((s, t) => s + parseFloat(t.amount || 0), 0)
  const net = monthIncome - monthExpense

  // Net worth from accounts
  const netWorth = accounts.reduce((sum, a) => {
    const bal = parseFloat(a.balance || 0)
    return sum + (a.type === 'credit' ? -Math.abs(bal) : bal)
  }, 0)
  const liquidAssets = accounts.filter(a => ['checking', 'savings', 'paypal', 'cash'].includes(a.type))
    .reduce((s, a) => s + parseFloat(a.balance || 0), 0)

  const catTotals = EXPENSE_CATS.map(c => ({
    name: c, value: transactions.filter(t => t.type === 'expense' && t.category === c).reduce((s, t) => s + parseFloat(t.amount || 0), 0)
  })).filter(c => c.value > 0)

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - 5 + i)
    const key = d.toISOString().slice(0, 7)
    return {
      month: d.toLocaleDateString('en-AU', { month: 'short' }),
      income: transactions.filter(t => t.type === 'income' && t.date?.startsWith(key)).reduce((s, t) => s + parseFloat(t.amount || 0), 0),
      expense: transactions.filter(t => t.type === 'expense' && t.date?.startsWith(key)).reduce((s, t) => s + parseFloat(t.amount || 0), 0),
    }
  })

  function submitTransaction() {
    if (!form.amount || !form.description) return
    addTransaction(form)
    addToast(`${form.type === 'income' ? 'Income' : 'Expense'} logged`, 'success')
    setAdding(false)
    setForm({ type: 'expense', amount: '', category: 'Food', description: '', date: new Date().toISOString().split('T')[0] })
  }

  function submitGoal() {
    if (!goalForm.name || !goalForm.target) return
    addSavingsGoal(goalForm)
    addToast('Savings goal added', 'success')
    setAddingGoal(false)
    setGoalForm({ name: '', target: '', current: '', emoji: '💰' })
  }

  function submitAccount() {
    if (!accountForm.name) return
    addAccount(accountForm)
    addToast('Account added', 'success')
    setAddingAccount(false)
    setAccountForm({ name: '', type: 'checking', balance: '', notes: '' })
  }

  const TABS = [
    { k: 'accounts', l: 'Accounts' },
    { k: 'transactions', l: 'Transactions' },
    { k: 'goals', l: 'Savings Goals' },
    { k: 'insights', l: 'Insights' },
  ]

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Finance</h1>
        <p className="page-subtitle">Accounts, budget &amp; savings goals</p>
      </div>

      {/* Net worth hero */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'linear-gradient(135deg, rgba(109,191,138,0.1) 0%, rgba(78,201,184,0.06) 50%, rgba(155,143,212,0.08) 100%)', border: '1px solid rgba(109,191,138,0.2)', borderRadius: 22, padding: '28px 32px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(109,191,138,0.08)', filter: 'blur(40px)' }} />
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          <div>
            <div style={{ fontSize: '0.6rem', color: 'rgba(109,191,138,0.7)', textTransform: 'uppercase', letterSpacing: '0.22em', fontWeight: 700, marginBottom: 8 }}>Total Net Worth</div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(2.8rem, 5vw, 4.5rem)', color: netWorth >= 0 ? 'var(--sage)' : 'var(--rose)', lineHeight: 1, fontWeight: 300 }}>
              {netWorth < 0 ? '-' : ''}${Math.abs(netWorth).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 8 }}>Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}</div>
          </div>
          <div style={{ display: 'flex', gap: 32, alignItems: 'flex-end' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.58rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 4 }}>Liquid</div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', color: 'var(--teal)', lineHeight: 1 }}>
                ${liquidAssets.toLocaleString('en-AU', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.58rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 4 }}>This Month Net</div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', color: net >= 0 ? 'var(--sage)' : 'var(--rose)', lineHeight: 1 }}>
                {net >= 0 ? '+' : '-'}${Math.abs(net).toLocaleString('en-AU', { minimumFractionDigits: 0 })}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tab nav */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map(({ k, l }) => (
          <button key={k} onClick={() => setTab(k)} style={{
            fontSize: '0.65rem', padding: '8px 20px', borderRadius: 99, border: '1px solid',
            textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', transition: 'all 0.15s',
            borderColor: tab === k ? 'var(--sage)' : 'var(--border)',
            background: tab === k ? 'rgba(109,191,138,0.12)' : 'transparent',
            color: tab === k ? 'var(--sage)' : 'var(--muted)',
          }}>{l}</button>
        ))}
      </div>

      {/* ── ACCOUNTS TAB ── */}
      {tab === 'accounts' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.14em' }}>
              {accounts.length} account{accounts.length !== 1 ? 's' : ''}
            </div>
            <button className="btn btn-primary" style={{ padding: '8px 18px' }} onClick={() => setAddingAccount(v => !v)}>
              <Plus size={14} /> {addingAccount ? 'Cancel' : 'Add Account'}
            </button>
          </div>

          <AnimatePresence>
            {addingAccount && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="glass" style={{ padding: 24, marginBottom: 20, overflow: 'hidden' }}>
                <div style={{ fontSize: '0.62rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 600, marginBottom: 16 }}>New Account</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <input className="input-base" placeholder="Account name (e.g. NAB Main)" value={accountForm.name} onChange={e => setAccountForm({ ...accountForm, name: e.target.value })} />
                  <select className="input-base" value={accountForm.type} onChange={e => setAccountForm({ ...accountForm, type: e.target.value })}>
                    {ACCOUNT_TYPES.map(t => <option key={t.key} value={t.key}>{t.emoji} {t.label}</option>)}
                  </select>
                  <input className="input-base" type="number" step="0.01" placeholder="Current balance $" value={accountForm.balance} onChange={e => setAccountForm({ ...accountForm, balance: e.target.value })} />
                  <input className="input-base" placeholder="Notes (optional)" value={accountForm.notes} onChange={e => setAccountForm({ ...accountForm, notes: e.target.value })} />
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--muted)', marginBottom: 14, lineHeight: 1.6 }}>
                  💡 For credit cards, enter the amount you owe — it'll show as a liability and reduce net worth.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" onClick={submitAccount} style={{ flex: 1 }}>Add Account</button>
                  <button className="btn btn-ghost" onClick={() => setAddingAccount(false)}>Cancel</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {accounts.length === 0 && !addingAccount ? (
            <div className="glass" style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>🏦</div>
              <div style={{ fontSize: '1rem', color: 'var(--cream)', fontFamily: 'Cormorant Garamond, serif', marginBottom: 8 }}>No accounts yet</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Add your bank accounts, PayPal, cash etc. to track your net worth.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
              <AnimatePresence>
                {accounts.map(a => (
                  <AccountCard key={a.id} account={a} onUpdate={updateAccount} onDelete={deleteAccount} />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Account type legend */}
          {accounts.length > 0 && (
            <div style={{ marginTop: 20, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {ACCOUNT_TYPES.filter(at => accounts.some(a => a.type === at.key)).map(at => {
                const total = accounts.filter(a => a.type === at.key).reduce((s, a) => s + parseFloat(a.balance || 0), 0)
                return (
                  <div key={at.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: at.color }} />
                    <span style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>{at.label}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--cream)', fontWeight: 600 }}>
                      ${Math.abs(total).toLocaleString('en-AU', { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* ── TRANSACTIONS TAB ── */}
      {tab === 'transactions' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass" style={{ padding: 24 }}>
          <div className="section-header">
            <span className="section-title">Transactions</span>
            <button className="btn btn-primary" style={{ padding: '7px 14px' }} onClick={() => setAdding(v => !v)}>
              <Plus size={14} /> {adding ? 'Cancel' : 'Add'}
            </button>
          </div>
          <AnimatePresence>
            {adding && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="glass-sm" style={{ padding: 16, marginBottom: 16, overflow: 'hidden' }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                  {['expense', 'income'].map(t => (
                    <button key={t} onClick={() => setForm({ ...form, type: t })}
                      style={{ flex: 1, padding: '9px', borderRadius: 8, border: '1px solid', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        borderColor: form.type === t ? 'var(--dusk)' : 'var(--border)',
                        background: form.type === t ? 'rgba(155,143,212,0.15)' : 'transparent',
                        color: form.type === t ? 'var(--dusk)' : 'var(--muted)' }}>
                      {t === 'expense' ? <TrendingDown size={13} /> : <TrendingUp size={13} />}
                      {t === 'expense' ? 'Expense' : 'Income'}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  <input className="input-base" type="number" placeholder="Amount $" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                  <input className="input-base" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                  {form.type === 'expense' && (
                    <select className="input-base" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                      {EXPENSE_CATS.map(c => <option key={c}>{c}</option>)}
                    </select>
                  )}
                  <input type="date" className="input-base" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-primary" onClick={submitTransaction} style={{ flex: 1 }}>Add Transaction</button>
                  <button className="btn btn-ghost" onClick={() => setAdding(false)}>Cancel</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* This month summary */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 20, padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
            {[
              { label: 'Income', value: monthIncome, color: 'var(--sage)' },
              { label: 'Spent', value: monthExpense, color: 'var(--rose)' },
              { label: 'Net', value: net, color: net >= 0 ? 'var(--teal)' : 'var(--rose)', prefix: net >= 0 ? '+' : '-' },
            ].map((item, i) => (
              <div key={item.label} style={{ flex: 1, textAlign: i === 1 ? 'center' : i === 2 ? 'right' : 'left' }}>
                <div style={{ fontSize: '0.58rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 4 }}>{item.label} this month</div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', color: item.color, lineHeight: 1 }}>
                  {item.prefix || ''}{item.prefix ? '' : ''}${Math.abs(item.value).toFixed(0)}
                </div>
              </div>
            ))}
          </div>

          {transactions.slice(0, 30).map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                background: t.type === 'income' ? 'rgba(109,191,138,0.15)' : 'rgba(232,96,122,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {t.type === 'income' ? <TrendingUp size={14} color="var(--sage)" /> : <TrendingDown size={14} color="var(--rose)" />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--cream)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.description}</div>
                <div style={{ fontSize: '0.62rem', color: 'var(--muted)', display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                  {t.category && <span style={{ padding: '1px 7px', borderRadius: 99, background: 'rgba(255,255,255,0.06)' }}>{t.category}</span>}
                  {t.date && <span>{formatAWST(new Date(t.date + 'T12:00:00'), 'dd MMM yyyy')}</span>}
                </div>
              </div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: t.type === 'income' ? 'var(--sage)' : 'var(--rose)', fontWeight: 400, flexShrink: 0 }}>
                {t.type === 'income' ? '+' : '-'}${parseFloat(t.amount).toFixed(2)}
              </div>
              <button onClick={() => deleteTransaction(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', opacity: 0.35, padding: 4 }}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          {transactions.length === 0 && <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 0', fontSize: '0.82rem' }}>No transactions yet</div>}
        </motion.div>
      )}

      {/* ── SAVINGS GOALS TAB ── */}
      {tab === 'goals' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn btn-primary" style={{ padding: '8px 18px' }} onClick={() => setAddingGoal(v => !v)}>
              <Plus size={14} /> {addingGoal ? 'Cancel' : 'Add Goal'}
            </button>
          </div>
          <AnimatePresence>
            {addingGoal && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="glass" style={{ padding: 24, marginBottom: 20, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <input className="input-base" placeholder="💰" value={goalForm.emoji} onChange={e => setGoalForm({ ...goalForm, emoji: e.target.value })} />
                  <input className="input-base" placeholder="Goal name" value={goalForm.name} onChange={e => setGoalForm({ ...goalForm, name: e.target.value })} />
                  <input className="input-base" type="number" placeholder="Target $" value={goalForm.target} onChange={e => setGoalForm({ ...goalForm, target: e.target.value })} />
                  <input className="input-base" type="number" placeholder="Saved so far $" value={goalForm.current} onChange={e => setGoalForm({ ...goalForm, current: e.target.value })} />
                </div>
                <button className="btn btn-primary" onClick={submitGoal}>Add Goal</button>
              </motion.div>
            )}
          </AnimatePresence>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
            {savingsGoals.map(g => {
              const pct = Math.min(100, (parseFloat(g.current || 0) / parseFloat(g.target || 1)) * 100)
              const remaining = parseFloat(g.target || 0) - parseFloat(g.current || 0)
              return (
                <motion.div key={g.id} layout className="glass-sm" style={{ padding: 22, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, height: 3, width: `${pct}%`, background: 'linear-gradient(90deg, var(--sage), var(--teal))', borderRadius: '0 0 0 18px', transition: 'width 0.8s ease' }} />
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
                    <span style={{ fontSize: '1.6rem' }}>{g.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.88rem', color: 'var(--cream)', fontWeight: 600 }}>{g.name}</div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--muted)', marginTop: 2 }}>
                        {remaining > 0 ? `$${remaining.toFixed(0)} to go` : '🎉 Goal reached!'}
                      </div>
                    </div>
                    <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.6rem', color: pct >= 100 ? 'var(--sage)' : 'var(--dusk)', lineHeight: 1 }}>{pct.toFixed(0)}%</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--muted)', marginBottom: 10 }}>
                    <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: 'var(--sage)' }}>${parseFloat(g.current || 0).toFixed(0)}</span>
                    <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', color: 'var(--cream)' }}>${parseFloat(g.target).toFixed(0)}</span>
                  </div>
                  <div className="progress-track" style={{ height: 6 }}>
                    <div className="progress-fill" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--sage), var(--teal))' }} />
                  </div>
                  <input type="number" className="input-base" placeholder="Update saved amount…"
                    style={{ marginTop: 14, padding: '7px 12px', fontSize: '0.75rem' }}
                    onBlur={e => { if (e.target.value) { updateSavingsGoal(g.id, { current: e.target.value }); addToast('Goal updated', 'success') }; e.target.value = '' }} />
                </motion.div>
              )
            })}
            {savingsGoals.length === 0 && !addingGoal && (
              <div className="glass" style={{ padding: 48, textAlign: 'center', gridColumn: '1/-1' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>🎯</div>
                <div style={{ fontSize: '0.88rem', color: 'var(--cream)', fontFamily: 'Cormorant Garamond, serif', marginBottom: 8 }}>No savings goals</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Set goals for things you're saving towards.</div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── INSIGHTS TAB ── */}
      {tab === 'insights' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="grid-2" style={{ marginBottom: 20 }}>
            <div className="glass" style={{ padding: 24 }}>
              <div className="section-header"><span className="section-title">6-Month Trend</span></div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={months}>
                  <defs>
                    <linearGradient id="incG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--sage)" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="var(--sage)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--rose)" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="var(--rose)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fill: 'rgba(242,237,228,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--ink3)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} formatter={(v) => `$${v}`} />
                  <Area type="monotone" dataKey="income" stroke="var(--sage)" strokeWidth={2} fill="url(#incG)" name="Income" />
                  <Area type="monotone" dataKey="expense" stroke="var(--rose)" strokeWidth={2} fill="url(#expG)" name="Expense" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="glass" style={{ padding: 24 }}>
              <div className="section-header"><span className="section-title">Spending Breakdown</span></div>
              {catTotals.length > 0 ? (
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ flexShrink: 0 }}>
                    <ResponsiveContainer width={110} height={110}>
                      <PieChart>
                        <Pie data={catTotals} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" strokeWidth={0}>
                          {catTotals.map((_, i) => <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: 'var(--ink3)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} formatter={(v) => `$${v.toFixed(0)}`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ flex: 1 }}>
                    {catTotals.slice(0, 6).map((c, i) => (
                      <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: CAT_COLORS[i % CAT_COLORS.length] }} />
                          <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{c.name}</span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--cream)', fontWeight: 600 }}>${c.value.toFixed(0)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px 0', fontSize: '0.78rem' }}>No expense data yet</div>
              )}
            </div>
          </div>

          {/* All-time summary */}
          <div className="glass" style={{ padding: 24 }}>
            <div className="section-header"><span className="section-title">All-Time Summary</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, marginTop: 8 }}>
              {[
                { label: 'Total Income', value: `$${income.toFixed(0)}`, color: 'var(--sage)' },
                { label: 'Total Spent', value: `$${expense.toFixed(0)}`, color: 'var(--rose)' },
                { label: 'All-Time Net', value: `${income - expense >= 0 ? '+' : '-'}$${Math.abs(income - expense).toFixed(0)}`, color: income >= expense ? 'var(--teal)' : 'var(--rose)' },
                { label: 'Transactions', value: transactions.length, color: 'var(--dusk)' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '16px 8px', borderRight: i < 3 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ fontSize: '0.58rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', color: s.color, lineHeight: 1 }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
