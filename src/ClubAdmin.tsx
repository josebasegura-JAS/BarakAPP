import { useMemo, useState } from 'react'
import { ArrowLeft, Pencil, Plus, Save, Shield, Trash2, Users, X } from 'lucide-react'
import type { Category, Goalkeeper, Team } from './types'
import { loadCategories, loadMatches, loadTeams, saveCategories, saveTeams } from './storage'

function uid() {
  return crypto.randomUUID()
}

export default function ClubAdmin({ onClose }: { onClose: () => void }) {
  const [categories, setCategories] = useState<Category[]>(() => loadCategories())
  const [teams, setTeams] = useState<Team[]>(() => loadTeams())
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id ?? '')
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [categoryName, setCategoryName] = useState('')
  const [teamName, setTeamName] = useState('')
  const [season, setSeason] = useState('2026/27')
  const [goalkeeperName, setGoalkeeperName] = useState('')
  const [goalkeeperNumber, setGoalkeeperNumber] = useState('')
  const [editingGoalkeeperId, setEditingGoalkeeperId] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const selectedCategory = categories.find(category => category.id === selectedCategoryId)
  const teamsInCategory = useMemo(
    () => teams.filter(team => team.categoryId === selectedCategoryId || (!team.categoryId && team.category === selectedCategory?.name)),
    [teams, selectedCategoryId, selectedCategory?.name],
  )
  const selectedTeam = teams.find(team => team.id === selectedTeamId)
  const matches = loadMatches()

  function persistCategories(next: Category[]) {
    setCategories(next)
    saveCategories(next)
  }

  function persistTeams(next: Team[]) {
    setTeams(next)
    saveTeams(next)
  }

  function addCategory() {
    const name = categoryName.trim()
    if (!name) return
    if (categories.some(category => category.name.toLowerCase() === name.toLowerCase())) {
      setMessage('Esa categoría ya existe.')
      return
    }
    const category: Category = { id: uid(), name, active: true }
    persistCategories([...categories, category].sort((a, b) => a.name.localeCompare(b.name, 'es')))
    setSelectedCategoryId(category.id)
    setSelectedTeamId('')
    setCategoryName('')
    setMessage('')
  }

  function toggleCategory(category: Category) {
    persistCategories(categories.map(item => item.id === category.id ? { ...item, active: !item.active } : item))
  }

  function removeCategory(category: Category) {
    const linked = teams.some(team => team.categoryId === category.id || (!team.categoryId && team.category === category.name))
    if (linked) {
      setMessage('No puedes eliminar una categoría que todavía tiene equipos.')
      return
    }
    if (!confirm(`¿Eliminar la categoría ${category.name}?`)) return
    const next = categories.filter(item => item.id !== category.id)
    persistCategories(next)
    setSelectedCategoryId(next[0]?.id ?? '')
    setSelectedTeamId('')
  }

  function addTeam() {
    if (!selectedCategory) {
      setMessage('Selecciona primero una categoría.')
      return
    }
    const name = teamName.trim()
    if (!name) return
    if (teams.some(team => team.name.toLowerCase() === name.toLowerCase() && (team.categoryId === selectedCategory.id || team.category === selectedCategory.name))) {
      setMessage('Ya existe un equipo con ese nombre en la categoría.')
      return
    }
    const team: Team = {
      id: uid(),
      name,
      category: selectedCategory.name,
      categoryId: selectedCategory.id,
      season: season.trim() || '2026/27',
      active: true,
      goalkeepers: [],
      players: [],
    }
    persistTeams([...teams, team])
    setSelectedTeamId(team.id)
    setTeamName('')
    setMessage('')
  }

  function toggleTeam(team: Team) {
    persistTeams(teams.map(item => item.id === team.id ? { ...item, active: !item.active } : item))
  }

  function removeTeam(team: Team) {
    if (matches.some(match => match.teamId === team.id)) {
      setMessage('No puedes eliminar un equipo que ya tiene hojas de lanzamientos.')
      return
    }
    if (!confirm(`¿Eliminar el equipo ${team.name}?`)) return
    persistTeams(teams.filter(item => item.id !== team.id))
    if (selectedTeamId === team.id) setSelectedTeamId('')
  }

  function resetGoalkeeperForm() {
    setGoalkeeperName('')
    setGoalkeeperNumber('')
    setEditingGoalkeeperId(null)
  }

  function saveGoalkeeper() {
    if (!selectedTeam || !selectedCategory) return
    const name = goalkeeperName.trim()
    const number = Number(goalkeeperNumber)
    if (!name || !Number.isInteger(number) || number < 0 || number > 99) {
      setMessage('Indica nombre y un dorsal entre 0 y 99.')
      return
    }
    if (selectedTeam.goalkeepers.some(goalkeeper => goalkeeper.number === number && goalkeeper.id !== editingGoalkeeperId)) {
      setMessage(`El dorsal ${number} ya está asignado en este equipo.`)
      return
    }
    let goalkeepers: Goalkeeper[]
    if (editingGoalkeeperId) {
      goalkeepers = selectedTeam.goalkeepers.map(goalkeeper => goalkeeper.id === editingGoalkeeperId
        ? { ...goalkeeper, name, number, teamId: selectedTeam.id, categoryId: selectedCategory.id }
        : goalkeeper)
    } else {
      goalkeepers = [...selectedTeam.goalkeepers, {
        id: uid(),
        name,
        number,
        teamId: selectedTeam.id,
        categoryId: selectedCategory.id,
        active: true,
      }]
    }
    goalkeepers.sort((a, b) => a.number - b.number)
    persistTeams(teams.map(team => team.id === selectedTeam.id ? { ...team, goalkeepers } : team))
    resetGoalkeeperForm()
    setMessage('')
  }

  function editGoalkeeper(goalkeeper: Goalkeeper) {
    setGoalkeeperName(goalkeeper.name)
    setGoalkeeperNumber(String(goalkeeper.number))
    setEditingGoalkeeperId(goalkeeper.id)
    setMessage('')
  }

  function toggleGoalkeeper(goalkeeper: Goalkeeper) {
    if (!selectedTeam) return
    persistTeams(teams.map(team => team.id === selectedTeam.id
      ? { ...team, goalkeepers: team.goalkeepers.map(item => item.id === goalkeeper.id ? { ...item, active: !item.active } : item) }
      : team))
  }

  function removeGoalkeeper(goalkeeper: Goalkeeper) {
    if (!selectedTeam) return
    const used = matches.some(match => match.teamId === selectedTeam.id && (match.goalkeeperId === goalkeeper.id || match.shots.some(shot => shot.goalkeeperId === goalkeeper.id)))
    if (used) {
      setMessage('No puedes eliminar un portero que ya tiene lanzamientos asociados. Déjalo inactivo para conservar el histórico.')
      return
    }
    if (!confirm(`¿Eliminar a #${goalkeeper.number} ${goalkeeper.name}?`)) return
    persistTeams(teams.map(team => team.id === selectedTeam.id ? { ...team, goalkeepers: team.goalkeepers.filter(item => item.id !== goalkeeper.id) } : team))
    if (editingGoalkeeperId === goalkeeper.id) resetGoalkeeperForm()
  }

  return <div className="club-admin-overlay">
    <section className="club-admin-shell">
      <div className="club-admin-topbar">
        <div><div className="eyebrow">Configuración del club</div><h1>Categorías, equipos y porteros</h1></div>
        <button className="ghost-btn" onClick={onClose}><X size={17}/> Volver a BarakAPP</button>
      </div>

      {message && <div className="form-message club-admin-message">{message}</div>}

      <div className="club-admin-columns">
        <section className="panel club-admin-panel">
          <div className="panel-title"><h2><Users size={18}/> Categorías</h2></div>
          <div className="club-admin-list">
            {categories.map(category => <div key={category.id} className={`club-admin-row ${selectedCategoryId === category.id ? 'active' : ''} ${category.active ? '' : 'is-inactive'}`}>
              <button onClick={() => { setSelectedCategoryId(category.id); setSelectedTeamId(''); setMessage('') }}><strong>{category.name}</strong><small>{teams.filter(team => team.categoryId === category.id || (!team.categoryId && team.category === category.name)).length} equipos</small></button>
              <button className={`status-pill ${category.active ? 'on' : 'off'}`} onClick={() => toggleCategory(category)}>{category.active ? 'Activa' : 'Inactiva'}</button>
              <button className="icon-btn danger-icon" onClick={() => removeCategory(category)} title="Eliminar categoría"><Trash2 size={15}/></button>
            </div>)}
          </div>
          <div className="club-admin-create"><input value={categoryName} onChange={event => setCategoryName(event.target.value)} placeholder="Nueva categoría (ej. Cadete)" onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addCategory() } }} /><button className="primary-btn compact" onClick={addCategory}><Plus size={16}/> Añadir</button></div>
        </section>

        <section className="panel club-admin-panel">
          <div className="panel-title"><h2>Equipos {selectedCategory ? `· ${selectedCategory.name}` : ''}</h2></div>
          {!selectedCategory ? <div className="empty">Crea o selecciona una categoría.</div> : <>
            <div className="club-admin-list">
              {teamsInCategory.map(team => <div key={team.id} className={`club-admin-row ${selectedTeamId === team.id ? 'active' : ''} ${team.active ? '' : 'is-inactive'}`}>
                <button onClick={() => { setSelectedTeamId(team.id); setMessage('') }}><strong>{team.name}</strong><small>{team.season} · {team.goalkeepers.filter(goalkeeper => goalkeeper.active).length}/{team.goalkeepers.length} porteros activos</small></button>
                <button className={`status-pill ${team.active ? 'on' : 'off'}`} onClick={() => toggleTeam(team)}>{team.active ? 'Activo' : 'Inactivo'}</button>
                <button className="icon-btn danger-icon" onClick={() => removeTeam(team)} title="Eliminar equipo"><Trash2 size={15}/></button>
              </div>)}
            </div>
            <div className="club-admin-create stacked-create"><input value={teamName} onChange={event => setTeamName(event.target.value)} placeholder="Nombre del equipo"/><input value={season} onChange={event => setSeason(event.target.value)} placeholder="Temporada"/><button className="primary-btn compact" onClick={addTeam}><Plus size={16}/> Crear equipo</button></div>
          </>}
        </section>

        <section className="panel club-admin-panel">
          <div className="panel-title"><h2><Shield size={18}/> Porteros {selectedTeam ? `· ${selectedTeam.name}` : ''}</h2></div>
          {!selectedTeam ? <div className="empty">Selecciona un equipo para gestionar sus porteros.</div> : <>
            <div className="club-admin-list goalkeeper-admin-list">
              {selectedTeam.goalkeepers.map(goalkeeper => <div key={goalkeeper.id} className={`club-admin-row goalkeeper-admin-row ${goalkeeper.active ? '' : 'is-inactive'}`}>
                <span className="admin-gk-number">{goalkeeper.number}</span>
                <button className="goalkeeper-copy" onClick={() => editGoalkeeper(goalkeeper)}><strong>{goalkeeper.name}</strong><small>{goalkeeper.active ? 'Disponible para partidos' : 'Inactivo · conserva histórico'}</small></button>
                <button className={`status-pill ${goalkeeper.active ? 'on' : 'off'}`} onClick={() => toggleGoalkeeper(goalkeeper)}>{goalkeeper.active ? 'Activo' : 'Inactivo'}</button>
                <button className="icon-btn" onClick={() => editGoalkeeper(goalkeeper)} title="Editar"><Pencil size={15}/></button>
                <button className="icon-btn danger-icon" onClick={() => removeGoalkeeper(goalkeeper)} title="Eliminar"><Trash2 size={15}/></button>
              </div>)}
            </div>
            <div className="club-admin-create stacked-create"><input value={goalkeeperName} onChange={event => setGoalkeeperName(event.target.value)} placeholder="Nombre del portero"/><input value={goalkeeperNumber} onChange={event => setGoalkeeperNumber(event.target.value.replace(/\D/g, '').slice(0, 2))} inputMode="numeric" placeholder="Dorsal"/><button className="primary-btn compact" onClick={saveGoalkeeper}><Save size={16}/> {editingGoalkeeperId ? 'Guardar' : 'Dar de alta'}</button>{editingGoalkeeperId && <button className="ghost-btn" onClick={resetGoalkeeperForm}><ArrowLeft size={15}/> Cancelar edición</button>}</div>
          </>}
        </section>
      </div>
    </section>
  </div>
}
