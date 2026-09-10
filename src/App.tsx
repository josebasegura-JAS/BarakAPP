import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Clock3, LogOut, Pause, Play, Plus, RotateCcw, Shield, Target, Undo2, Users } from 'lucide-react'
import type { Match, MatchEvent, Rival, Shot, ShotResult, ShotZone, Team } from './types'
import { loadMatches, loadRivals, loadTeams, saveMatches, saveRivals } from './storage'
import { supabase, supabaseEnabled } from './supabase'

type Screen = 'login' | 'teams' | 'team' | 'new' | 'match'

const zoneLabel: Record<ShotZone, string> = {
  ext_left: 'Extremo izq.',
  lat_left: 'Lateral izq.',
  central: 'Central',
  lat_right: 'Lateral der.',
  ext_right: 'Extremo der.',
  pivot: 'Pivote',
  seven_m: '7 m',
}

const resultLabel: Record<ShotResult, string> = {
  goal: 'Gol',
  save: 'Parada',
  post_out: 'Fuera/Poste',
  blocked: 'Bloqueo',
}

function formatClock(total: number) {
  const mins = Math.floor(total / 60).toString().padStart(2, '0')
  const secs = Math.floor(total % 60).toString().padStart(2, '0')
  return `${mins}:${secs}`
}

function uid() {
  return crypto.randomUUID()
}

function App() {
  const [screen, setScreen] = useState<Screen>('login')
  const [teams] = useState<Team[]>(() => loadTeams())
  const [matches, setMatches] = useState<Match[]>(() => loadMatches())
  const [rivals, setRivals] = useState<Rival[]>(() => loadRivals())
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [selectedMatchId, setSelectedMatchId] = useState<string>('')
  const [demoUser, setDemoUser] = useState('demo@barakapp.local')

  useEffect(() => saveMatches(matches), [matches])
  useEffect(() => saveRivals(rivals), [rivals])

  const selectedTeam = teams.find(t => t.id === selectedTeamId)
  const selectedMatch = matches.find(m => m.id === selectedMatchId)

  async function handleLogin(email: string, password: string) {
    if (!supabaseEnabled || !supabase) {
      setDemoUser(email || 'demo@barakapp.local')
      setScreen('teams')
      return
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    setDemoUser(email)
    setScreen('teams')
  }

  function logout() {
    if (supabaseEnabled && supabase) void supabase.auth.signOut()
    setScreen('login')
  }

  function createMatch(rivalName: string, venue: 'home' | 'away', periodLengthMinutes: number) {
    if (!selectedTeam) return
    let rival = rivals.find(r => r.name.trim().toLowerCase() === rivalName.trim().toLowerCase())
    if (!rival) {
      rival = { id: uid(), name: rivalName.trim() }
      setRivals(prev => [...prev, rival!])
    }
    const match: Match = {
      id: uid(),
      teamId: selectedTeam.id,
      rivalId: rival.id,
      rivalName: rival.name,
      date: new Date().toISOString().slice(0, 10),
      venue,
      status: 'live',
      period: 1,
      periodLengthMinutes,
      clockSeconds: 0,
      scoreHome: 0,
      scoreAway: 0,
      goalkeeperId: selectedTeam.goalkeepers[0]?.id ?? '',
      exclusions: [],
      shots: [],
      events: [],
    }
    setMatches(prev => [match, ...prev])
    setSelectedMatchId(match.id)
    setScreen('match')
  }

  function updateMatch(next: Match) {
    setMatches(prev => prev.map(m => (m.id === next.id ? next : m)))
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => screen !== 'login' && setScreen('teams')}>
          <span className="brand-mark">B</span>
          <span>Barak<span>APP</span></span>
        </button>
        {screen !== 'login' && (
          <div className="topbar-actions">
            <span className="mode-badge">{supabaseEnabled ? 'Servidor Supabase' : 'Modo demo local'}</span>
            <span className="user-label">{demoUser}</span>
            <button className="icon-btn" onClick={logout} title="Cerrar sesión"><LogOut size={18} /></button>
          </div>
        )}
      </header>

      <main>
        {screen === 'login' && <Login onLogin={handleLogin} />}
        {screen === 'teams' && <TeamPicker teams={teams} onSelect={(id) => { setSelectedTeamId(id); setScreen('team') }} />}
        {screen === 'team' && selectedTeam && (
          <TeamHome
            team={selectedTeam}
            matches={matches.filter(m => m.teamId === selectedTeam.id)}
            onBack={() => setScreen('teams')}
            onNew={() => setScreen('new')}
            onOpen={(id) => { setSelectedMatchId(id); setScreen('match') }}
          />
        )}
        {screen === 'new' && selectedTeam && (
          <NewMatch team={selectedTeam} rivals={rivals} onBack={() => setScreen('team')} onCreate={createMatch} />
        )}
        {screen === 'match' && selectedTeam && selectedMatch && (
          <LiveMatch team={selectedTeam} match={selectedMatch} onUpdate={updateMatch} onBack={() => setScreen('team')} />
        )}
      </main>
    </div>
  )
}

function Login({ onLogin }: { onLogin: (email: string, password: string) => Promise<void> }) {
  const [email, setEmail] = useState('demo@barakapp.local')
  const [password, setPassword] = useState('demo1234')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  return (
    <section className="login-wrap">
      <form className="login-card" onSubmit={async (e) => {
        e.preventDefault(); setBusy(true); setError('')
        try { await onLogin(email, password) } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión') } finally { setBusy(false) }
      }}>
        <div className="eyebrow">Estadística de porteros · Club</div>
        <h1>Accede a BarakAPP</h1>
        <p>Gestiona equipos, partidos y tendencias de lanzamiento desde móvil, tablet o PC.</p>
        <label>Email<input value={email} onChange={e => setEmail(e.target.value)} type="email" required /></label>
        <label>Contraseña<input value={password} onChange={e => setPassword(e.target.value)} type="password" required /></label>
        {error && <div className="error-box">{error}</div>}
        <button className="primary-btn" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
        {!supabaseEnabled && <div className="demo-note">Sin .env configurado: cualquier usuario y contraseña entra en modo demo.</div>}
      </form>
    </section>
  )
}

function TeamPicker({ teams, onSelect }: { teams: Team[]; onSelect: (id: string) => void }) {
  return <section className="page"><div className="page-head"><div><div className="eyebrow">Club</div><h1>Selecciona equipo</h1><p>Elige el equipo del que vas a llevar el partido.</p></div></div><div className="team-grid">{teams.map(team => <button key={team.id} className="team-card" onClick={() => onSelect(team.id)}><div className="team-icon"><Users /></div><strong>{team.name}</strong><span>{team.category}</span><small>{team.season}</small></button>)}</div></section>
}

function TeamHome({ team, matches, onBack, onNew, onOpen }: { team: Team; matches: Match[]; onBack: () => void; onNew: () => void; onOpen: (id: string) => void }) {
  return <section className="page"><div className="page-head"><div><button className="back-btn" onClick={onBack}><ArrowLeft size={16}/> Equipos</button><div className="eyebrow">{team.season} · {team.category}</div><h1>{team.name}</h1></div><button className="primary-btn compact" onClick={onNew}><Plus size={17}/> Nuevo partido</button></div><div className="stats-strip"><div><span>Porteros</span><strong>{team.goalkeepers.length}</strong></div><div><span>Partidos</span><strong>{matches.length}</strong></div><div><span>Finalizados</span><strong>{matches.filter(m=>m.status==='finished').length}</strong></div></div><section className="panel"><div className="panel-title"><h2>Historial de partidos</h2></div>{matches.length===0 ? <div className="empty">Todavía no hay partidos registrados.</div> : <div className="match-list">{matches.map(m => <button className="match-row" key={m.id} onClick={()=>onOpen(m.id)}><div><strong>{m.rivalName}</strong><span>{m.date} · {m.venue==='home'?'Local':'Visitante'}</span></div><div className="match-score">{m.scoreHome} - {m.scoreAway}</div><span className={`status ${m.status}`}>{m.status==='live'?'En curso':m.status==='finished'?'Finalizado':'Borrador'}</span></button>)}</div>}</section></section>
}

function NewMatch({ team, rivals, onBack, onCreate }: { team: Team; rivals: Rival[]; onBack:()=>void; onCreate:(rival:string, venue:'home'|'away', minutes:number)=>void }) {
  const [rival, setRival] = useState('')
  const [venue, setVenue] = useState<'home'|'away'>('home')
  const [minutes, setMinutes] = useState(30)
  return <section className="page narrow"><button className="back-btn" onClick={onBack}><ArrowLeft size={16}/> {team.name}</button><div className="eyebrow">Nuevo partido</div><h1>Configurar partido</h1><form className="panel form-grid" onSubmit={e=>{e.preventDefault(); if(rival.trim()) onCreate(rival.trim(), venue, minutes)}}><label>Rival<input value={rival} onChange={e=>setRival(e.target.value)} list="rivals" placeholder="Ej. Romo" required/><datalist id="rivals">{rivals.map(r=><option key={r.id} value={r.name}/>)}</datalist></label><label>Condición<select value={venue} onChange={e=>setVenue(e.target.value as 'home'|'away')}><option value="home">Local</option><option value="away">Visitante</option></select></label><label>Duración de cada parte<select value={minutes} onChange={e=>setMinutes(Number(e.target.value))}><option value={20}>20 min</option><option value={25}>25 min</option><option value={30}>30 min</option></select></label><button className="primary-btn"><Play size={18}/> Crear e iniciar</button></form></section>
}

function LiveMatch({ team, match, onUpdate, onBack }: { team: Team; match: Match; onUpdate:(m:Match)=>void; onBack:()=>void }) {
  const [running, setRunning] = useState(false)
  const [shooter, setShooter] = useState('')
  const [zone, setZone] = useState<ShotZone>('lat_left')
  const [result, setResult] = useState<ShotResult>('save')
  const [goalPoint, setGoalPoint] = useState<{x:number;y:number}|null>(null)
  const [filterShooter, setFilterShooter] = useState('all')
  const [filterZone, setFilterZone] = useState<'all'|ShotZone>('all')
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!running) return
    timerRef.current = window.setInterval(() => {
      onUpdate({ ...match, clockSeconds: Math.min(match.clockSeconds + 1, match.periodLengthMinutes * 60) })
    }, 1000)
    return () => { if (timerRef.current) window.clearInterval(timerRef.current) }
  }, [running, match, onUpdate])

  const activeExclusions = match.exclusions.map(ex => ({ ...ex, remaining: Math.max(0, ex.durationSeconds - (match.clockSeconds - ex.startedAtMatchSeconds)) })).filter(ex=>ex.remaining>0)
  const filteredShots = match.shots.filter(s => (filterShooter==='all' || s.shooterNumber===Number(filterShooter)) && (filterZone==='all' || s.zone===filterZone))
  const uniqueShooters = [...new Set(match.shots.map(s=>s.shooterNumber))].sort((a,b)=>a-b)
  const savePct = filteredShots.length ? Math.round(filteredShots.filter(s=>s.result==='save').length / filteredShots.filter(s=>s.result==='save'||s.result==='goal').length * 100 || 0) : 0

  function addEvent(type: MatchEvent['type'], label: string): MatchEvent { return { id: uid(), type, label, matchSeconds: match.clockSeconds, period: match.period, createdAt: new Date().toISOString() } }
  function score(side:'home'|'away', delta:number) { const next = Math.max(0, side==='home'?match.scoreHome+delta:match.scoreAway+delta); onUpdate({ ...match, [side==='home'?'scoreHome':'scoreAway']: next, events:[addEvent('score', `${side==='home'?team.name:match.rivalName}: ${delta>0?'+1':'-1'} gol`), ...match.events] }) }
  function addExclusion(teamSide:'home'|'away') { const raw = prompt(`Dorsal del jugador excluido (${teamSide==='home'?team.name:match.rivalName})`); if(!raw) return; const n=Number(raw); if(!Number.isFinite(n)) return; onUpdate({ ...match, exclusions:[...match.exclusions,{id:uid(),team:teamSide,playerNumber:n,startedAtMatchSeconds:match.clockSeconds,durationSeconds:120}], events:[addEvent('exclusion',`Exclusión 2' · ${teamSide==='home'?team.name:match.rivalName} #${n}`),...match.events] }) }
  function addCard(teamSide:'home'|'away') { const raw=prompt(`Dorsal de la tarjeta (${teamSide==='home'?team.name:match.rivalName})`); if(!raw) return; const n=Number(raw); if(!Number.isFinite(n)) return; onUpdate({...match, events:[addEvent('card',`Tarjeta · ${teamSide==='home'?team.name:match.rivalName} #${n}`),...match.events]}) }
  function saveShot() { if(!shooter || !goalPoint) return; const shot: Shot={id:uid(),matchId:match.id,shooterNumber:Number(shooter),zone,goalX:goalPoint.x,goalY:goalPoint.y,result,goalkeeperId:match.goalkeeperId,matchSeconds:match.clockSeconds,period:match.period}; const homeDelta = match.venue==='away' && result==='goal' ? 1 : 0; const awayDelta = match.venue==='home' && result==='goal' ? 1 : 0; onUpdate({...match, shots:[...match.shots,shot], scoreHome:match.scoreHome+homeDelta, scoreAway:match.scoreAway+awayDelta, events:[addEvent('shot',`#${shooter} · ${zoneLabel[zone]} · ${resultLabel[result]}`),...match.events]}); setGoalPoint(null) }
  function undo() { const last=match.events[0]; if(!last) return; let shots=match.shots, exclusions=match.exclusions, scoreHome=match.scoreHome, scoreAway=match.scoreAway; if(last.type==='shot'){ const s=[...shots].sort((a,b)=>b.matchSeconds-a.matchSeconds)[0]; if(s){shots=shots.filter(x=>x.id!==s.id); if(s.result==='goal'){ if(match.venue==='home') scoreAway=Math.max(0,scoreAway-1); else scoreHome=Math.max(0,scoreHome-1)}}} if(last.type==='exclusion') exclusions=exclusions.slice(0,-1); onUpdate({...match,shots,exclusions,scoreHome,scoreAway,events:match.events.slice(1)}) }

  return <section className="live-page"><div className="live-head"><button className="back-btn" onClick={onBack}><ArrowLeft size={16}/> Partido</button><div className="scoreboard"><div><small>{team.name}</small><strong>{match.scoreHome}</strong><div className="score-actions"><button onClick={()=>score('home',-1)}>-</button><button onClick={()=>score('home',1)}>+</button></div></div><div className="clock-box"><span>{match.period}ª parte</span><strong>{formatClock(match.clockSeconds)}</strong><button className={running?'danger-btn':'primary-btn compact'} onClick={()=>setRunning(!running)}>{running?<><Pause size={16}/> Pausar</>:<><Play size={16}/> Iniciar</>}</button><button className="ghost-btn" onClick={()=>onUpdate({...match,clockSeconds:0})}><RotateCcw size={15}/></button><button className="ghost-btn" onClick={()=>onUpdate({...match,period:match.period===1?2:1,clockSeconds:0})}>Cambiar parte</button></div><div><small>{match.rivalName}</small><strong>{match.scoreAway}</strong><div className="score-actions"><button onClick={()=>score('away',-1)}>-</button><button onClick={()=>score('away',1)}>+</button></div></div></div><button className="ghost-btn" onClick={undo}><Undo2 size={16}/> Deshacer</button></div>

    <div className="exclusions-row">{activeExclusions.length===0?<span>Sin exclusiones activas</span>:activeExclusions.map(ex=><div className="exclusion-chip" key={ex.id}><strong>#{ex.playerNumber}</strong><span>{ex.team==='home'?team.name:match.rivalName}</span><b>{formatClock(ex.remaining)}</b></div>)}<button onClick={()=>addExclusion('home')}>+ 2' local</button><button onClick={()=>addExclusion('away')}>+ 2' rival</button><button onClick={()=>addCard('home')}>Tarjeta local</button><button onClick={()=>addCard('away')}>Tarjeta rival</button></div>

    <div className="match-grid">
      <section className="panel shot-entry"><div className="panel-title"><h2><Target size={18}/> Registrar lanzamiento</h2></div><label>Dorsal rival<input value={shooter} onChange={e=>setShooter(e.target.value.replace(/\D/g,''))} inputMode="numeric" placeholder="Obligatorio"/></label><label>Portero<select value={match.goalkeeperId} onChange={e=>onUpdate({...match,goalkeeperId:e.target.value})}>{team.goalkeepers.map(g=><option key={g.id} value={g.id}>#{g.number} {g.name}</option>)}</select></label><div className="field-zones">{(Object.keys(zoneLabel) as ShotZone[]).map(z=><button className={zone===z?'selected':''} key={z} onClick={()=>setZone(z)}>{zoneLabel[z]}</button>)}</div><GoalPicker point={goalPoint} onPick={setGoalPoint}/><div className="result-grid">{(Object.keys(resultLabel) as ShotResult[]).map(r=><button key={r} className={`${result===r?'selected ':''}${r}`} onClick={()=>setResult(r)}>{resultLabel[r]}</button>)}</div><button className="primary-btn" disabled={!shooter||!goalPoint} onClick={saveShot}>Guardar lanzamiento</button></section>

      <section className="panel heatmap-panel"><div className="panel-title"><h2>Mapa de destino</h2><div className="filters"><select value={filterShooter} onChange={e=>setFilterShooter(e.target.value)}><option value="all">Todos los jugadores</option>{uniqueShooters.map(n=><option key={n} value={n}>Jugador #{n}</option>)}</select><select value={filterZone} onChange={e=>setFilterZone(e.target.value as 'all'|ShotZone)}><option value="all">Todas las zonas</option>{(Object.keys(zoneLabel) as ShotZone[]).map(z=><option key={z} value={z}>{zoneLabel[z]}</option>)}</select></div></div><GoalHeatmap shots={filteredShots}/><div className="kpis"><div><span>Tiros</span><strong>{filteredShots.length}</strong></div><div><span>Goles</span><strong>{filteredShots.filter(s=>s.result==='goal').length}</strong></div><div><span>Paradas</span><strong>{filteredShots.filter(s=>s.result==='save').length}</strong></div><div><span>% parada</span><strong>{savePct}%</strong></div></div></section>

      <section className="panel timeline"><div className="panel-title"><h2><Clock3 size={18}/> Cronología</h2></div>{match.events.length===0?<div className="empty">Aún no hay eventos.</div>:match.events.slice(0,14).map(ev=><div className="event-row" key={ev.id}><span>{formatClock(ev.matchSeconds)}</span><div><strong>{ev.label}</strong><small>{ev.period}ª parte</small></div></div>)}</section>
    </div>
  </section>
}

function GoalPicker({ point, onPick }: { point:{x:number;y:number}|null; onPick:(p:{x:number;y:number})=>void }) {
  return <div className="goal-wrap"><div className="goal-label">Toca dónde ha ido el balón</div><svg className="goal-svg" viewBox="0 0 300 190" onClick={e=>{const rect=e.currentTarget.getBoundingClientRect(); onPick({x:((e.clientX-rect.left)/rect.width)*100,y:((e.clientY-rect.top)/rect.height)*100})}}><rect x="8" y="8" width="284" height="174" rx="3" className="goal-frame"/><line x1="103" y1="8" x2="103" y2="182"/><line x1="197" y1="8" x2="197" y2="182"/><line x1="8" y1="66" x2="292" y2="66"/><line x1="8" y1="124" x2="292" y2="124"/>{point&&<circle cx={point.x*3} cy={point.y*1.9} r="7" className="pick-dot"/>}</svg></div>
}

function GoalHeatmap({ shots }: { shots: Shot[] }) {
  return <div className="goal-wrap"><svg className="goal-svg heat" viewBox="0 0 300 190"><rect x="8" y="8" width="284" height="174" rx="3" className="goal-frame"/><line x1="103" y1="8" x2="103" y2="182"/><line x1="197" y1="8" x2="197" y2="182"/><line x1="8" y1="66" x2="292" y2="66"/><line x1="8" y1="124" x2="292" y2="124"/>{shots.map((s,i)=><g key={s.id}><circle cx={s.goalX*3} cy={s.goalY*1.9} r="18" className={`heat-glow ${s.result}`}/><circle cx={s.goalX*3} cy={s.goalY*1.9} r="4" className={`shot-dot ${s.result}`}/><text x={s.goalX*3+7} y={s.goalY*1.9-7} className="shot-number">{s.shooterNumber}</text></g>)}</svg></div>
}

export default App
