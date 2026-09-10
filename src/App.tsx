import { useEffect, useState } from 'react'
import type { FormEvent, MouseEvent as ReactMouseEvent } from 'react'
import { ArrowLeft, Delete, LogOut, Pencil, Plus, Save, Shield, Target, Trash2, Undo2, Users, X } from 'lucide-react'
import type { Goalkeeper, Match, Rival, Shot, ShotResult, ShotZone, Team } from './types'
import { loadMatches, loadRivals, loadTeams, saveMatches, saveRivals, saveTeams } from './storage'
import shotCourtImage from './assets/shot-court.png'

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

const selectableShotZones: ShotZone[] = ['ext_left', 'lat_left', 'central', 'pivot', 'lat_right', 'ext_right']

const resultLabel: Record<ShotResult, string> = {
  goal: 'Gol',
  save: 'Parada',
  post_out: 'Fuera/Poste',
  blocked: 'Bloqueo',
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

  function createMatch(rivalName: string) {
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
      goalkeeperId: selectedTeam.goalkeepers[0]?.id ?? '',
      shots: [],
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
  return <section className="page"><div className="page-head"><div><div className="eyebrow">Club</div><h1>Selecciona equipo</h1><p>Elige el equipo del que vas a registrar los lanzamientos.</p></div></div><div className="team-grid">{teams.map(team => <button key={team.id} className="team-card" onClick={() => onSelect(team.id)}><div className="team-icon"><Users /></div><strong>{team.name}</strong><span>{team.category}</span><small>{team.season}</small></button>)}</div></section>
}

function TeamHome({ team, matches, onBack, onNew, onGoalkeepers, onOpen }: { team: Team; matches: Match[]; onBack: () => void; onNew: () => void; onGoalkeepers: () => void; onOpen: (id: string) => void }) {
  return <section className="page"><div className="page-head"><div><button className="back-btn" onClick={onBack}><ArrowLeft size={16}/> Equipos</button><div className="eyebrow">{team.season} · {team.category}</div><h1>{team.name}</h1></div><div className="team-head-actions"><button className="ghost-btn" onClick={onGoalkeepers}><Shield size={17}/> Gestionar porteros</button><button className="primary-btn compact" onClick={onNew}><Plus size={17}/> Nueva hoja</button></div></div><div className="stats-strip"><div><span>Porteros</span><strong>{team.goalkeepers.length}</strong></div><div><span>Hojas</span><strong>{matches.length}</strong></div><div><span>Lanzamientos</span><strong>{matches.reduce((sum,m)=>sum+m.shots.length,0)}</strong></div></div><section className="panel"><div className="panel-title"><h2>Hojas de lanzamientos</h2></div>{matches.length===0 ? <div className="empty">Todavía no hay hojas de lanzamientos registradas.</div> : <div className="match-list">{matches.map(m => <button className="match-row" key={m.id} onClick={()=>onOpen(m.id)}><div><strong>{m.rivalName}</strong><span>{m.date}</span></div><div className="match-shot-count"><Target size={16}/><strong>{m.shots.length}</strong><span>lanzamientos</span></div></button>)}</div>}</section></section>
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

function NewMatch({ team, rivals, onBack, onCreate }: { team: Team; rivals: Rival[]; onBack:()=>void; onCreate:(rival:string)=>void }) {
  const [rival, setRival] = useState('')
  return <section className="page narrow"><button className="back-btn" onClick={onBack}><ArrowLeft size={16}/> {team.name}</button><div className="eyebrow">Nueva hoja de lanzamientos</div><h1>Seleccionar rival</h1><form className="panel form-grid simplified-new-match" onSubmit={e=>{e.preventDefault(); if(rival.trim()) onCreate(rival.trim())}}><label>Rival<input value={rival} onChange={e=>setRival(e.target.value)} list="rivals" placeholder="Ej. Romo" required/><datalist id="rivals">{rivals.map(r=><option key={r.id} value={r.name}/>)}</datalist></label><button className="primary-btn"><Plus size={18}/> Empezar a registrar</button></form></section>
}

function LiveMatch({ team, match, onUpdate, onBack }: { team: Team; match: Match; onUpdate:(m:Match)=>void; onBack:()=>void }) {
  const [shooter, setShooter] = useState('')
  const [zone, setZone] = useState<ShotZone>('lat_left')
  const [result, setResult] = useState<ShotResult>('save')
  const [originPoint, setOriginPoint] = useState<{x:number;y:number}|null>(null)
  const [goalPoint, setGoalPoint] = useState<{x:number;y:number}|null>(null)
  const [filterShooter, setFilterShooter] = useState('all')
  const [filterZone, setFilterZone] = useState<'all'|ShotZone>('all')
  const [mapMode, setMapMode] = useState<'traces'|'heat'>('traces')

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

  function saveShot() {
    if(!shooter || !goalPoint || !originPoint || !match.goalkeeperId) return
    const shot: Shot={
      id:uid(), matchId:match.id, shooterNumber:Number(shooter), zone,
      originX:originPoint.x, originY:originPoint.y,
      goalX:goalPoint.x, goalY:goalPoint.y, result,
      goalkeeperId:match.goalkeeperId
    }
    onUpdate({ ...match, shots:[...match.shots,shot] })
    setGoalPoint(null)
    setOriginPoint(null)
  }

  function undo() {
    if (!match.shots.length) return
    onUpdate({ ...match, shots: match.shots.slice(0, -1) })
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

  return <section className="live-page shots-only-page">
    <div className="shots-commandbar">
      <button className="back-btn compact-back" onClick={onBack}><ArrowLeft size={16}/> {team.name}</button>
      <div className="shots-match-heading"><div className="eyebrow">Hoja de lanzamientos</div><h1>{team.name} · {match.rivalName}</h1><span>{match.date}</span></div>
      <button className="ghost-btn undo-top" onClick={undo} disabled={!match.shots.length}><Undo2 size={16}/> Deshacer último</button>
    </div>

    <div className="shots-dashboard">
      <aside className="panel left-rail shots-left-rail">
        <div className="rail-title"><Shield size={18}/><h2>Portero</h2></div>
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

      <main className="panel visual-stage shots-visual-stage">
        <div className="visual-toolbar shots-visual-toolbar">
          <div><div className="eyebrow">Registrar lanzamiento</div><h2>Selecciona origen y destino</h2><p>Primero toca el punto de lanzamiento en la pista y después el punto de llegada en la portería.</p></div>
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

        <div className="draft-summary shots-draft-summary">
          <div><span>Lanzador</span><strong>{shooter?`#${shooter}`:'—'}</strong></div>
          <div><span>Origen</span><strong>{originPoint?zoneLabel[zone]:'Toca la pista'}</strong></div>
          <div><span>Destino</span><strong>{goalPoint?'Seleccionado':'Toca la portería'}</strong></div>
          <div><span>Portero</span><strong>{currentGoalkeeper?`#${currentGoalkeeper.number}`:'Selecciona portero'}</strong></div>
        </div>

        <div className="shot-controls shots-controls">
          <div className="result-inline">{(Object.keys(resultLabel) as ShotResult[]).map(r=><button key={r} className={`${result===r?'selected ':''}${r}`} onClick={()=>setResult(r)}>{resultLabel[r]}</button>)}</div>
          <button className="primary-btn save-shot" disabled={!shooter||!goalPoint||!originPoint||!match.goalkeeperId} onClick={saveShot}>Guardar lanzamiento</button>
        </div>
      </main>

      <aside className="right-rail shots-right-rail">
        <section className="panel compact-kpis shots-kpis">
          <div><span>Tiros</span><strong>{filteredShots.length}</strong></div><div><span>Goles</span><strong>{goals}</strong></div><div><span>Paradas</span><strong>{saves}</strong></div><div><span>% parada</span><strong>{savePct}%</strong></div>
        </section>
        <section className="panel filter-panel">
          <div className="rail-title"><Target size={18}/><h2>Filtrar lanzamientos</h2></div>
          <div className="filters stacked"><label>Jugador<select value={filterShooter} onChange={e=>setFilterShooter(e.target.value)}><option value="all">Todos los jugadores</option>{uniqueShooters.map(n=><option key={n} value={n}>Jugador #{n}</option>)}</select></label><label>Zona de origen<select value={filterZone} onChange={e=>setFilterZone(e.target.value as 'all'|ShotZone)}><option value="all">Todas las zonas</option>{selectableShotZones.map(z=><option key={z} value={z}>{zoneLabel[z]}</option>)}</select></label></div>
          <button className="reset-filters" onClick={()=>{setFilterShooter('all');setFilterZone('all')}}>Limpiar filtros</button>
        </section>
      </aside>
    </div>
  </section>
}

function zoneFromOrigin(x:number, y:number): ShotZone {
  if (x > 38 && x < 62 && y < 50) return 'pivot'
  if (x < 18) return 'ext_left'
  if (x < 38) return 'lat_left'
  if (x < 62) return 'central'
  if (x < 82) return 'lat_right'
  return 'ext_right'
}

const SHOT_IMAGE = { width: 1338, height: 1176 }
const SHOT_COURT_RECT = { x: 73, y: 326, w: 1192, h: 850 }
const SHOT_GOAL_PLANE = { x: 430, y: 121, w: 438, h: 205 }

function shotOriginSvgPoint(shot: Shot) {
  const fallback: Record<ShotZone,{x:number;y:number}> = {
    ext_left:{x:9,y:61}, lat_left:{x:29,y:72}, central:{x:50,y:82}, lat_right:{x:71,y:72}, ext_right:{x:91,y:61}, pivot:{x:50,y:48}, seven_m:{x:50,y:48}
  }
  const p = shot.originX == null || shot.originY == null ? fallback[shot.zone] : {x:shot.originX,y:shot.originY}
  return {x:SHOT_COURT_RECT.x+(p.x/100)*SHOT_COURT_RECT.w, y:SHOT_COURT_RECT.y+(p.y/100)*SHOT_COURT_RECT.h}
}

function shotGoalSvgPoint(shot: Shot) {
  return {x:SHOT_GOAL_PLANE.x+(shot.goalX/100)*SHOT_GOAL_PLANE.w, y:SHOT_GOAL_PLANE.y+(shot.goalY/100)*SHOT_GOAL_PLANE.h}
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
    const rect = e.currentTarget.getBoundingClientRect()
    const sx = ((e.clientX - rect.left) / rect.width) * SHOT_IMAGE.width
    const sy = ((e.clientY - rect.top) / rect.height) * SHOT_IMAGE.height

    if (sx >= SHOT_GOAL_PLANE.x && sx <= SHOT_GOAL_PLANE.x + SHOT_GOAL_PLANE.w && sy >= SHOT_GOAL_PLANE.y && sy <= SHOT_GOAL_PLANE.y + SHOT_GOAL_PLANE.h) {
      onGoalPick({
        x: Math.max(0, Math.min(100, ((sx - SHOT_GOAL_PLANE.x) / SHOT_GOAL_PLANE.w) * 100)),
        y: Math.max(0, Math.min(100, ((sy - SHOT_GOAL_PLANE.y) / SHOT_GOAL_PLANE.h) * 100)),
      })
      return
    }

    if (sx >= SHOT_COURT_RECT.x && sx <= SHOT_COURT_RECT.x + SHOT_COURT_RECT.w && sy >= SHOT_COURT_RECT.y && sy <= SHOT_COURT_RECT.y + SHOT_COURT_RECT.h) {
      onOriginPick({
        x: Math.max(0, Math.min(100, ((sx - SHOT_COURT_RECT.x) / SHOT_COURT_RECT.w) * 100)),
        y: Math.max(0, Math.min(100, ((sy - SHOT_COURT_RECT.y) / SHOT_COURT_RECT.h) * 100)),
      })
    }
  }

  const draftOriginSvg = draftOrigin
    ? { x: SHOT_COURT_RECT.x + (draftOrigin.x / 100) * SHOT_COURT_RECT.w, y: SHOT_COURT_RECT.y + (draftOrigin.y / 100) * SHOT_COURT_RECT.h }
    : null
  const draftGoalSvg = draftGoal
    ? { x: SHOT_GOAL_PLANE.x + (draftGoal.x / 100) * SHOT_GOAL_PLANE.w, y: SHOT_GOAL_PLANE.y + (draftGoal.y / 100) * SHOT_GOAL_PLANE.h }
    : null

  return <div className="court-wrap photographic-court-wrap">
    <svg className="court-svg photographic-court-svg" viewBox={`0 0 ${SHOT_IMAGE.width} ${SHOT_IMAGE.height}`} onClick={handlePick} role="img" aria-label="Pista de balonmano para seleccionar origen y destino del lanzamiento">
      <image href={shotCourtImage} x="0" y="0" width={SHOT_IMAGE.width} height={SHOT_IMAGE.height} preserveAspectRatio="xMidYMid meet" />
      <defs>
        <radialGradient id="shotGlow"><stop offset="0" stopColor="currentColor" stopOpacity=".52"/><stop offset="1" stopColor="currentColor" stopOpacity="0"/></radialGradient>
      </defs>

      {shots.map(s => {
        const o = shotOriginSvgPoint(s)
        const g = shotGoalSvgPoint(s)
        return <g key={s.id} className={`court-shot ${s.result}`}>
          {mapMode === 'traces' && <line x1={o.x} y1={o.y} x2={g.x} y2={g.y} className="shot-trace" />}
          {mapMode === 'heat' && <><circle cx={o.x} cy={o.y} r="70" className="heat-origin"/><circle cx={g.x} cy={g.y} r="48" className="heat-target"/></>}
          <circle cx={o.x} cy={o.y} r="12" className="origin-dot"/>
          <circle cx={g.x} cy={g.y} r="10" className="target-dot"/>
          <text x={o.x + 17} y={o.y - 15} className="court-shot-number">#{s.shooterNumber}</text>
        </g>
      })}

      {draftOriginSvg && <g className="draft-marker"><circle cx={draftOriginSvg.x} cy={draftOriginSvg.y} r="18"/><text x={draftOriginSvg.x + 25} y={draftOriginSvg.y - 19}>ORIGEN</text></g>}
      {draftGoalSvg && <g className="draft-marker goal-draft"><circle cx={draftGoalSvg.x} cy={draftGoalSvg.y} r="16"/><text x={draftGoalSvg.x + 22} y={draftGoalSvg.y - 17}>DESTINO</text></g>}
      {draftOriginSvg && draftGoalSvg && <line x1={draftOriginSvg.x} y1={draftOriginSvg.y} x2={draftGoalSvg.x} y2={draftGoalSvg.y} className="draft-trace"/>}
    </svg>
    <div className="court-legend"><span><i className="legend-dot save"></i>Parada</span><span><i className="legend-dot goal"></i>Gol</span><span><i className="legend-dot post_out"></i>Fuera/Poste</span><span><i className="legend-dot blocked"></i>Bloqueo</span></div>
  </div>
}


export default App
