import { useEffect, useRef, useState } from 'react'
import type { FormEvent, MouseEvent as ReactMouseEvent } from 'react'
import { ArrowLeft, Clock3, Delete, LogOut, Pause, Pencil, Play, Plus, RotateCcw, Save, Shield, Target, Trash2, Undo2, Users, X } from 'lucide-react'
import type { Goalkeeper, Match, MatchEvent, Rival, Shot, ShotResult, ShotZone, Team } from './types'
import { loadMatches, loadRivals, loadTeams, saveMatches, saveRivals, saveTeams } from './storage'

type Screen = 'login' | 'teams' | 'team' | 'goalkeepers' | 'new' | 'match'

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
  const [teams, setTeams] = useState<Team[]>(() => loadTeams())
  const [matches, setMatches] = useState<Match[]>(() => loadMatches())
  const [rivals, setRivals] = useState<Rival[]>(() => loadRivals())
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [selectedMatchId, setSelectedMatchId] = useState<string>('')
  const [demoUser, setDemoUser] = useState('demo@barakapp.local')

  useEffect(() => saveTeams(teams), [teams])
  useEffect(() => saveMatches(matches), [matches])
  useEffect(() => saveRivals(rivals), [rivals])

  const selectedTeam = teams.find(t => t.id === selectedTeamId)
  const selectedMatch = matches.find(m => m.id === selectedMatchId)

  async function handleLogin(email: string, _password: string) {
    setDemoUser(email || 'demo@barakapp.local')
    setScreen('teams')
  }

  function logout() {
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
            <span className="mode-badge">Modo local · Electron</span>
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
            onGoalkeepers={() => setScreen('goalkeepers')}
            onOpen={(id) => { setSelectedMatchId(id); setScreen('match') }}
          />
        )}
        {screen === 'goalkeepers' && selectedTeam && (
          <GoalkeeperManager
            team={selectedTeam}
            matches={matches.filter(m => m.teamId === selectedTeam.id)}
            onBack={() => setScreen('team')}
            onChange={(goalkeepers) => setTeams(prev => prev.map(t => t.id === selectedTeam.id ? { ...t, goalkeepers } : t))}
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
        <div className="demo-note">Versión local de pruebas: los datos se guardan únicamente en este PC. Cualquier usuario y contraseña permiten entrar.</div>
      </form>
    </section>
  )
}

function TeamPicker({ teams, onSelect }: { teams: Team[]; onSelect: (id: string) => void }) {
  return <section className="page"><div className="page-head"><div><div className="eyebrow">Club</div><h1>Selecciona equipo</h1><p>Elige el equipo del que vas a llevar el partido.</p></div></div><div className="team-grid">{teams.map(team => <button key={team.id} className="team-card" onClick={() => onSelect(team.id)}><div className="team-icon"><Users /></div><strong>{team.name}</strong><span>{team.category}</span><small>{team.season}</small></button>)}</div></section>
}

function TeamHome({ team, matches, onBack, onNew, onGoalkeepers, onOpen }: { team: Team; matches: Match[]; onBack: () => void; onNew: () => void; onGoalkeepers: () => void; onOpen: (id: string) => void }) {
  return <section className="page"><div className="page-head"><div><button className="back-btn" onClick={onBack}><ArrowLeft size={16}/> Equipos</button><div className="eyebrow">{team.season} · {team.category}</div><h1>{team.name}</h1></div><div className="team-head-actions"><button className="ghost-btn" onClick={onGoalkeepers}><Shield size={17}/> Gestionar porteros</button><button className="primary-btn compact" onClick={onNew}><Plus size={17}/> Nuevo partido</button></div></div><div className="stats-strip"><div><span>Porteros</span><strong>{team.goalkeepers.length}</strong></div><div><span>Partidos</span><strong>{matches.length}</strong></div><div><span>Finalizados</span><strong>{matches.filter(m=>m.status==='finished').length}</strong></div></div><section className="panel"><div className="panel-title"><h2>Historial de partidos</h2></div>{matches.length===0 ? <div className="empty">Todavía no hay partidos registrados.</div> : <div className="match-list">{matches.map(m => <button className="match-row" key={m.id} onClick={()=>onOpen(m.id)}><div><strong>{m.rivalName}</strong><span>{m.date} · {m.venue==='home'?'Local':'Visitante'}</span></div><div className="match-score">{m.scoreHome} - {m.scoreAway}</div><span className={`status ${m.status}`}>{m.status==='live'?'En curso':m.status==='finished'?'Finalizado':'Borrador'}</span></button>)}</div>}</section></section>
}

function GoalkeeperManager({ team, matches, onBack, onChange }: { team: Team; matches: Match[]; onBack: () => void; onChange: (goalkeepers: Goalkeeper[]) => void }) {
  const [name, setName] = useState('')
  const [number, setNumber] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  function resetForm() {
    setName('')
    setNumber('')
    setEditingId(null)
    setMessage('')
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const cleanName = name.trim()
    const parsedNumber = Number(number)
    if (!cleanName || !Number.isInteger(parsedNumber) || parsedNumber < 0 || parsedNumber > 99) {
      setMessage('Indica un nombre y un dorsal entre 0 y 99.')
      return
    }
    const duplicated = team.goalkeepers.some(g => g.number === parsedNumber && g.id !== editingId)
    if (duplicated) {
      setMessage(`El dorsal ${parsedNumber} ya está asignado a otro portero de este equipo.`)
      return
    }
    if (editingId) {
      onChange(team.goalkeepers.map(g => g.id === editingId ? { ...g, name: cleanName, number: parsedNumber } : g))
    } else {
      onChange([...team.goalkeepers, { id: uid(), name: cleanName, number: parsedNumber }].sort((a,b)=>a.number-b.number))
    }
    resetForm()
  }

  function edit(goalkeeper: Goalkeeper) {
    setEditingId(goalkeeper.id)
    setName(goalkeeper.name)
    setNumber(String(goalkeeper.number))
    setMessage('')
  }

  function remove(goalkeeper: Goalkeeper) {
    const used = matches.some(m => m.goalkeeperId === goalkeeper.id || m.shots.some(s => s.goalkeeperId === goalkeeper.id))
    if (used) {
      setMessage(`No se puede eliminar a ${goalkeeper.name}: ya tiene datos asociados en uno o más partidos.`)
      return
    }
    if (!confirm(`¿Eliminar al portero #${goalkeeper.number} ${goalkeeper.name}?`)) return
    onChange(team.goalkeepers.filter(g => g.id !== goalkeeper.id))
    if (editingId === goalkeeper.id) resetForm()
  }

  return <section className="page goalkeeper-admin">
    <button className="back-btn" onClick={onBack}><ArrowLeft size={16}/> {team.name}</button>
    <div className="page-head goalkeeper-admin-head"><div><div className="eyebrow">{team.season} · {team.category}</div><h1>Porteros de {team.name}</h1><p>Estos porteros estarán disponibles automáticamente al crear o abrir partidos de este equipo.</p></div></div>
    <div className="goalkeeper-admin-grid">
      <section className="panel">
        <div className="panel-title"><h2><Shield size={18}/> Plantilla de porteros</h2><span className="count-badge">{team.goalkeepers.length}</span></div>
        {team.goalkeepers.length === 0 ? <div className="empty">No hay porteros dados de alta.</div> : <div className="admin-gk-list">{team.goalkeepers.map(g => <div className="admin-gk-row" key={g.id}><span className="admin-gk-number">{g.number}</span><div><strong>{g.name}</strong><small>Dorsal {g.number}</small></div><div className="admin-gk-actions"><button className="icon-btn" onClick={()=>edit(g)} title="Editar portero"><Pencil size={16}/></button><button className="icon-btn danger-icon" onClick={()=>remove(g)} title="Eliminar portero"><Trash2 size={16}/></button></div></div>)}</div>}
      </section>
      <form className="panel gk-form" onSubmit={submit}>
        <div className="panel-title"><h2>{editingId ? <><Pencil size={18}/> Editar portero</> : <><Plus size={18}/> Alta de portero</>}</h2></div>
        <label>Nombre del portero<input value={name} onChange={e=>setName(e.target.value)} placeholder="Ej. A. Gómez" autoFocus /></label>
        <label>Dorsal<input value={number} onChange={e=>setNumber(e.target.value.replace(/\D/g,'').slice(0,2))} inputMode="numeric" placeholder="Ej. 1" /></label>
        {message && <div className="form-message">{message}</div>}
        <div className="gk-form-actions"><button className="primary-btn" type="submit"><Save size={17}/>{editingId?'Guardar cambios':'Dar de alta'}</button>{editingId && <button className="ghost-btn" type="button" onClick={resetForm}><X size={17}/>Cancelar</button>}</div>
      </form>
    </div>
  </section>
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
  const [originPoint, setOriginPoint] = useState<{x:number;y:number}|null>(null)
  const [goalPoint, setGoalPoint] = useState<{x:number;y:number}|null>(null)
  const [filterShooter, setFilterShooter] = useState('all')
  const [filterZone, setFilterZone] = useState<'all'|ShotZone>('all')
  const [mapMode, setMapMode] = useState<'traces'|'heat'>('traces')
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!running) return
    timerRef.current = window.setInterval(() => {
      onUpdate({ ...match, clockSeconds: Math.min(match.clockSeconds + 1, match.periodLengthMinutes * 60) })
    }, 1000)
    return () => { if (timerRef.current) window.clearInterval(timerRef.current) }
  }, [running, match, onUpdate])

  const activeExclusions = match.exclusions
    .map(ex => ({ ...ex, remaining: Math.max(0, ex.durationSeconds - (match.clockSeconds - ex.startedAtMatchSeconds)) }))
    .filter(ex => ex.remaining > 0)

  const filteredShots = match.shots.filter(s =>
    (filterShooter === 'all' || s.shooterNumber === Number(filterShooter)) &&
    (filterZone === 'all' || s.zone === filterZone)
  )
  const uniqueShooters = [...new Set(match.shots.map(s => s.shooterNumber))].sort((a,b)=>a-b)
  const saves = filteredShots.filter(s=>s.result==='save').length
  const goals = filteredShots.filter(s=>s.result==='goal').length
  const onTarget = saves + goals
  const savePct = onTarget ? Math.round((saves / onTarget) * 100) : 0
  const currentGoalkeeper = team.goalkeepers.find(g => g.id === match.goalkeeperId)

  function addEvent(type: MatchEvent['type'], label: string): MatchEvent {
    return { id: uid(), type, label, matchSeconds: match.clockSeconds, period: match.period, createdAt: new Date().toISOString() }
  }

  function score(side:'home'|'away', delta:number) {
    const next = Math.max(0, side==='home' ? match.scoreHome + delta : match.scoreAway + delta)
    onUpdate({
      ...match,
      [side==='home'?'scoreHome':'scoreAway']: next,
      events:[addEvent('score', `${side==='home'?team.name:match.rivalName}: ${delta>0?'+1':'-1'} gol`), ...match.events]
    })
  }

  function addExclusion(teamSide:'home'|'away') {
    const raw = prompt(`Dorsal del jugador excluido (${teamSide==='home'?team.name:match.rivalName})`)
    if(!raw) return
    const n=Number(raw)
    if(!Number.isFinite(n)) return
    onUpdate({
      ...match,
      exclusions:[...match.exclusions,{id:uid(),team:teamSide,playerNumber:n,startedAtMatchSeconds:match.clockSeconds,durationSeconds:120}],
      events:[addEvent('exclusion',`Exclusión 2' · ${teamSide==='home'?team.name:match.rivalName} #${n}`),...match.events]
    })
  }

  function addCard(teamSide:'home'|'away') {
    const raw=prompt(`Dorsal de la tarjeta (${teamSide==='home'?team.name:match.rivalName})`)
    if(!raw) return
    const n=Number(raw)
    if(!Number.isFinite(n)) return
    onUpdate({...match, events:[addEvent('card',`Tarjeta · ${teamSide==='home'?team.name:match.rivalName} #${n}`),...match.events]})
  }

  function saveShot() {
    if(!shooter || !goalPoint || !originPoint) return
    const shot: Shot={
      id:uid(), matchId:match.id, shooterNumber:Number(shooter), zone,
      originX:originPoint.x, originY:originPoint.y,
      goalX:goalPoint.x, goalY:goalPoint.y, result,
      goalkeeperId:match.goalkeeperId, matchSeconds:match.clockSeconds, period:match.period
    }
    const homeDelta = match.venue==='away' && result==='goal' ? 1 : 0
    const awayDelta = match.venue==='home' && result==='goal' ? 1 : 0
    onUpdate({
      ...match,
      shots:[...match.shots,shot],
      scoreHome:match.scoreHome+homeDelta,
      scoreAway:match.scoreAway+awayDelta,
      events:[addEvent('shot',`#${shooter} · ${zoneLabel[zone]} · ${resultLabel[result]}`),...match.events]
    })
    setGoalPoint(null)
    setOriginPoint(null)
  }

  function undo() {
    const last=match.events[0]
    if(!last) return
    let shots=match.shots, exclusions=match.exclusions, scoreHome=match.scoreHome, scoreAway=match.scoreAway
    if(last.type==='shot'){
      const s=[...shots].sort((a,b)=>b.matchSeconds-a.matchSeconds)[0]
      if(s){
        shots=shots.filter(x=>x.id!==s.id)
        if(s.result==='goal'){
          if(match.venue==='home') scoreAway=Math.max(0,scoreAway-1)
          else scoreHome=Math.max(0,scoreHome-1)
        }
      }
    }
    if(last.type==='exclusion') exclusions=exclusions.slice(0,-1)
    onUpdate({...match,shots,exclusions,scoreHome,scoreAway,events:match.events.slice(1)})
  }

  function pickOrigin(point: {x:number;y:number}) {
    setOriginPoint(point)
    setZone(zoneFromOrigin(point.x, point.y))
  }

  const shooterDigits = [1,2,3,4,5,6,7,8,9,0]

  function appendShooterDigit(digit: number) {
    setShooter(prev => {
      if (prev.length >= 2) return prev
      const next = `${prev}${digit}`
      return String(Math.min(99, Number(next)))
    })
  }

  function removeShooterDigit() {
    setShooter(prev => prev.slice(0, -1))
  }

  return <section className="live-page live-v2">
    <div className="match-commandbar">
      <button className="back-btn compact-back" onClick={onBack}><ArrowLeft size={16}/> Partido</button>
      <div className="match-team left-team"><span>{team.name}</span><strong>{match.scoreHome}</strong><div className="mini-score"><button onClick={()=>score('home',-1)}>-</button><button onClick={()=>score('home',1)}>+</button></div></div>
      <div className="match-clock-main">
        <span>{match.period}ª PARTE</span>
        <strong>{formatClock(match.clockSeconds)}</strong>
        <div><button className={running?'danger-btn':'primary-btn compact'} onClick={()=>setRunning(!running)}>{running?<><Pause size={15}/> Pausar</>:<><Play size={15}/> Iniciar</>}</button><button className="icon-btn" onClick={()=>onUpdate({...match,clockSeconds:0})} title="Reiniciar tiempo"><RotateCcw size={15}/></button></div>
        <button className="period-link" onClick={()=>onUpdate({...match,period:match.period===1?2:1,clockSeconds:0})}>Cambiar parte</button>
      </div>
      <div className="match-team right-team"><strong>{match.scoreAway}</strong><span>{match.rivalName}</span><div className="mini-score"><button onClick={()=>score('away',-1)}>-</button><button onClick={()=>score('away',1)}>+</button></div></div>
      <button className="ghost-btn undo-top" onClick={undo}><Undo2 size={16}/> Deshacer</button>
    </div>

    <div className="discipline-strip">
      <div className="active-exclusions">
        {activeExclusions.length===0 ? <span>Sin exclusiones activas</span> : activeExclusions.map(ex=><div className="exclusion-chip" key={ex.id}><strong>#{ex.playerNumber}</strong><span>{ex.team==='home'?team.name:match.rivalName}</span><b>{formatClock(ex.remaining)}</b></div>)}
      </div>
      <div className="discipline-actions"><button onClick={()=>addExclusion('home')}>+ 2' local</button><button onClick={()=>addExclusion('away')}>+ 2' rival</button><button onClick={()=>addCard('home')}>Tarjeta local</button><button onClick={()=>addCard('away')}>Tarjeta rival</button></div>
    </div>

    <div className="match-dashboard">
      <aside className="panel left-rail">
        <div className="rail-title"><Shield size={18}/><h2>Porteros</h2></div>
        <div className="goalkeeper-list">
          {team.goalkeepers.map(g=>{
            const gShots=match.shots.filter(s=>s.goalkeeperId===g.id)
            const gSaves=gShots.filter(s=>s.result==='save').length
            const gGoals=gShots.filter(s=>s.result==='goal').length
            const pct=(gSaves+gGoals)?Math.round(gSaves/(gSaves+gGoals)*100):0
            const active=g.id===match.goalkeeperId
            return <button key={g.id} className={`goalkeeper-card ${active?'active':''}`} onClick={()=>onUpdate({...match,goalkeeperId:g.id})}>
              <span className="gk-number">{g.number}</span><span className="gk-copy"><strong>{g.name}</strong><small>{gSaves}/{gSaves+gGoals} · {pct}%</small></span><span className={`live-dot ${active?'on':''}`}></span>
            </button>
          })}
        </div>

        <div className="rail-divider" />
        <div className="shooter-section-title"><span>Lanzador rival</span><small>Dorsal obligatorio · sin alta previa</small></div>
        <div className="shooter-display"><span>#</span><strong>{shooter || '—'}</strong></div>
        <div className="digit-pad">{shooterDigits.map((digit,index)=><button key={`${digit}-${index}`} type="button" onClick={()=>appendShooterDigit(digit)}>{digit}</button>)}<button type="button" className="digit-action" onClick={removeShooterDigit} disabled={!shooter} title="Borrar último dígito"><Delete size={18}/></button><button type="button" className="digit-action clear" onClick={()=>setShooter('')} disabled={!shooter}>C</button></div>
      </aside>

      <main className="panel visual-stage">
        <div className="visual-toolbar">
          <div><div className="eyebrow">Hoja de lanzamientos</div><h2>Origen + destino</h2><p>Toca la pista para marcar el origen y la portería para marcar el destino.</p></div>
          <div className="view-switch"><button className={mapMode==='traces'?'active':''} onClick={()=>setMapMode('traces')}>Trazas</button><button className={mapMode==='heat'?'active':''} onClick={()=>setMapMode('heat')}>Calor</button></div>
        </div>

        <ShotCourt
          shots={filteredShots}
          draftOrigin={originPoint}
          draftGoal={goalPoint}
          mapMode={mapMode}
          onOriginPick={pickOrigin}
          onGoalPick={setGoalPoint}
        />

        <div className="draft-summary">
          <div><span>Lanzador</span><strong>{shooter?`#${shooter}`:'—'}</strong></div>
          <div><span>Origen</span><strong>{originPoint?zoneLabel[zone]:'Toca la pista'}</strong></div>
          <div><span>Destino</span><strong>{goalPoint?'Seleccionado':'Toca la portería'}</strong></div>
          <div><span>Portero</span><strong>{currentGoalkeeper?`#${currentGoalkeeper.number}`:'—'}</strong></div>
        </div>

        <div className="shot-controls">
          <label>Zona detectada<select value={zone} onChange={e=>setZone(e.target.value as ShotZone)}>{(Object.keys(zoneLabel) as ShotZone[]).map(z=><option key={z} value={z}>{zoneLabel[z]}</option>)}</select></label>
          <div className="result-inline">{(Object.keys(resultLabel) as ShotResult[]).map(r=><button key={r} className={`${result===r?'selected ':''}${r}`} onClick={()=>setResult(r)}>{resultLabel[r]}</button>)}</div>
          <button className="primary-btn save-shot" disabled={!shooter||!goalPoint||!originPoint} onClick={saveShot}>Guardar lanzamiento</button>
        </div>
      </main>

      <aside className="right-rail">
        <section className="panel filter-panel">
          <div className="rail-title"><Target size={18}/><h2>Análisis en tiempo real</h2></div>
          <div className="filters stacked"><label>Jugador<select value={filterShooter} onChange={e=>setFilterShooter(e.target.value)}><option value="all">Todos los jugadores</option>{uniqueShooters.map(n=><option key={n} value={n}>Jugador #{n}</option>)}</select></label><label>Zona de origen<select value={filterZone} onChange={e=>setFilterZone(e.target.value as 'all'|ShotZone)}><option value="all">Todas las zonas</option>{(Object.keys(zoneLabel) as ShotZone[]).map(z=><option key={z} value={z}>{zoneLabel[z]}</option>)}</select></label></div>
          <button className="reset-filters" onClick={()=>{setFilterShooter('all');setFilterZone('all')}}>Limpiar filtros</button>
        </section>

        <section className="panel compact-kpis">
          <div><span>Tiros</span><strong>{filteredShots.length}</strong></div><div><span>Goles</span><strong>{goals}</strong></div><div><span>Paradas</span><strong>{saves}</strong></div><div><span>% parada</span><strong>{savePct}%</strong></div>
        </section>

        <section className="panel timeline timeline-v2">
          <div className="panel-title"><h2><Clock3 size={18}/> Cronología</h2></div>
          {match.events.length===0?<div className="empty">Aún no hay eventos.</div>:match.events.slice(0,12).map(ev=><div className="event-row" key={ev.id}><span>{formatClock(ev.matchSeconds)}</span><div><strong>{ev.label}</strong><small>{ev.period}ª parte</small></div></div>)}
        </section>
      </aside>
    </div>
  </section>
}

function zoneFromOrigin(x:number, y:number): ShotZone {
  if (y > 41 && y < 58 && x > 43 && x < 57) return 'seven_m'
  if (y < 34 && x > 34 && x < 66) return 'pivot'
  if (x < 18) return 'ext_left'
  if (x < 38) return 'lat_left'
  if (x < 62) return 'central'
  if (x < 82) return 'lat_right'
  return 'ext_right'
}

function shotOriginSvgPoint(shot: Shot) {
  const fallback: Record<ShotZone,{x:number;y:number}> = {
    ext_left:{x:10,y:54}, lat_left:{x:28,y:56}, central:{x:50,y:62}, lat_right:{x:72,y:56}, ext_right:{x:90,y:54}, pivot:{x:50,y:27}, seven_m:{x:50,y:49}
  }
  const p = shot.originX == null || shot.originY == null ? fallback[shot.zone] : {x:shot.originX,y:shot.originY}
  return {x:60+(p.x/100)*580, y:175+(p.y/100)*500}
}

function shotGoalSvgPoint(shot: Shot) {
  return {x:235+(shot.goalX/100)*230, y:40+(shot.goalY/100)*115}
}

function ShotCourt({ shots, draftOrigin, draftGoal, mapMode, onOriginPick, onGoalPick }: {
  shots: Shot[]
  draftOrigin:{x:number;y:number}|null
  draftGoal:{x:number;y:number}|null
  mapMode:'traces'|'heat'
  onOriginPick:(p:{x:number;y:number})=>void
  onGoalPick:(p:{x:number;y:number})=>void
}) {
  function handlePick(e: ReactMouseEvent<SVGSVGElement>) {
    const rect=e.currentTarget.getBoundingClientRect()
    const sx=((e.clientX-rect.left)/rect.width)*700
    const sy=((e.clientY-rect.top)/rect.height)*720
    if (sx>=225 && sx<=475 && sy>=28 && sy<=170) {
      onGoalPick({x:Math.max(0,Math.min(100,((sx-235)/230)*100)), y:Math.max(0,Math.min(100,((sy-40)/115)*100))})
      return
    }
    if (sx>=60 && sx<=640 && sy>=175 && sy<=690) {
      onOriginPick({x:Math.max(0,Math.min(100,((sx-60)/580)*100)), y:Math.max(0,Math.min(100,((sy-175)/500)*100))})
    }
  }

  const draftOriginSvg = draftOrigin ? {x:60+(draftOrigin.x/100)*580,y:175+(draftOrigin.y/100)*500} : null
  const draftGoalSvg = draftGoal ? {x:235+(draftGoal.x/100)*230,y:40+(draftGoal.y/100)*115} : null

  return <div className="court-wrap">
    <svg className="court-svg" viewBox="0 0 700 720" onClick={handlePick} role="img" aria-label="Media pista y portería para seleccionar origen y destino del lanzamiento">
      <defs>
        <radialGradient id="shotGlow"><stop offset="0" stopColor="currentColor" stopOpacity=".55"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></radialGradient>
      </defs>
      <rect x="0" y="0" width="700" height="720" rx="18" className="court-bg"/>
      <rect x="235" y="40" width="230" height="115" rx="3" className="court-goal"/>
      <line x1="312" y1="40" x2="312" y2="155" className="goal-grid"/><line x1="388" y1="40" x2="388" y2="155" className="goal-grid"/><line x1="235" y1="78" x2="465" y2="78" className="goal-grid"/><line x1="235" y1="117" x2="465" y2="117" className="goal-grid"/>
      <line x1="60" y1="175" x2="640" y2="175" className="court-line"/>
      <line x1="60" y1="175" x2="60" y2="690" className="court-line"/><line x1="640" y1="175" x2="640" y2="690" className="court-line"/>
      <path d="M105 175 Q120 350 350 350 Q580 350 595 175" className="court-line thick"/>
      <path d="M70 175 Q100 440 350 440 Q600 440 630 175" className="court-dash"/>
      <line x1="305" y1="420" x2="395" y2="420" className="seven-line"/>
      <text x="350" y="412" textAnchor="middle" className="court-label">7 m</text>
      <text x="92" y="555" className="zone-caption">Extremo izq.</text><text x="195" y="590" className="zone-caption">Lateral izq.</text><text x="350" y="622" textAnchor="middle" className="zone-caption">Central</text><text x="505" y="590" className="zone-caption">Lateral der.</text><text x="608" y="555" textAnchor="end" className="zone-caption">Extremo der.</text><text x="350" y="320" textAnchor="middle" className="zone-caption">Pivote</text>

      {shots.map(s=>{
        const o=shotOriginSvgPoint(s), g=shotGoalSvgPoint(s)
        return <g key={s.id} className={`court-shot ${s.result}`}>
          {mapMode==='traces' && <line x1={o.x} y1={o.y} x2={g.x} y2={g.y} className="shot-trace"/>}
          {mapMode==='heat' && <><circle cx={o.x} cy={o.y} r="42" className="heat-origin"/><circle cx={g.x} cy={g.y} r="32" className="heat-target"/></>}
          <circle cx={o.x} cy={o.y} r="7" className="origin-dot"/><circle cx={g.x} cy={g.y} r="6" className="target-dot"/><text x={o.x+10} y={o.y-9} className="court-shot-number">#{s.shooterNumber}</text>
        </g>
      })}

      {draftOriginSvg && <g className="draft-marker"><circle cx={draftOriginSvg.x} cy={draftOriginSvg.y} r="12"/><text x={draftOriginSvg.x+16} y={draftOriginSvg.y-12}>ORIGEN</text></g>}
      {draftGoalSvg && <g className="draft-marker goal-draft"><circle cx={draftGoalSvg.x} cy={draftGoalSvg.y} r="10"/><text x={draftGoalSvg.x+14} y={draftGoalSvg.y-10}>DESTINO</text></g>}
      {draftOriginSvg && draftGoalSvg && <line x1={draftOriginSvg.x} y1={draftOriginSvg.y} x2={draftGoalSvg.x} y2={draftGoalSvg.y} className="draft-trace"/>}
    </svg>
    <div className="court-legend"><span><i className="legend-dot save"></i>Parada</span><span><i className="legend-dot goal"></i>Gol</span><span><i className="legend-dot post_out"></i>Fuera/Poste</span><span><i className="legend-dot blocked"></i>Bloqueo</span></div>
  </div>
}

export default App
