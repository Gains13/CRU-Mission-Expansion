'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Task = {
  id: string
  title: string
  status: string
  due_date: string | null
}

export default function CampusTasksPanel({
  campusId,
  goalsNotes,
}: {
  campusId: string
  goalsNotes: string | null
}) {
  const supabase = createClient()

  const [notes, setNotes] = useState(goalsNotes || '')
  const [savingNotes, setSavingNotes] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)

  const [tasks, setTasks] = useState<Task[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newDue, setNewDue] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTasks()
  }, [campusId])

  async function loadTasks() {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('goals_tasks')
      .select('id, title, status, due_date')
      .eq('campus_id', campusId)
      .eq('intern_id', user.id)
      .order('due_date', { ascending: true, nullsFirst: false })
    if (data) setTasks(data)
    setLoading(false)
  }

  async function saveNotes() {
    setSavingNotes(true)
    const { error } = await supabase.from('campuses').update({ goals_notes: notes }).eq('id', campusId)
    setSavingNotes(false)
    if (!error) {
      setNotesSaved(true)
      setTimeout(() => setNotesSaved(false), 2000)
    }
  }

  async function addTask() {
    if (!newTitle.trim()) return
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('goals_tasks')
      .insert({
        campus_id: campusId,
        intern_id: user.id,
        title: newTitle.trim(),
        due_date: newDue || null,
        status: 'todo',
      })
      .select('id, title, status, due_date')
      .single()

    if (!error && data) {
      setTasks((prev) => [...prev, data])
      setNewTitle('')
      setNewDue('')
    }
  }

  async function toggleTask(task: Task) {
    const next = task.status === 'done' ? 'todo' : 'done'
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: next } : t)))
    await supabase.from('goals_tasks').update({ status: next }).eq('id', task.id)
  }

  async function deleteTask(task: Task) {
    setTasks((prev) => prev.filter((t) => t.id !== task.id))
    await supabase.from('goals_tasks').delete().eq('id', task.id)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-1.5">
        <span className="font-heading text-[11px] uppercase tracking-widest text-neutral-700">
          Weekly goals
        </span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="rounded-md border border-divider bg-transparent px-3 py-2.5 text-sm focus:border-accent focus:outline-none"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={saveNotes}
            disabled={savingNotes}
            className="w-fit rounded-md border border-accent px-4 py-1.5 font-heading text-xs font-semibold text-accent-700 hover:bg-accent-100 disabled:opacity-50"
          >
            {savingNotes ? 'Saving…' : 'Save goals'}
          </button>
          {notesSaved && <span className="text-xs text-accent-800">Saved.</span>}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="font-heading text-[11px] uppercase tracking-widest text-neutral-700">
          Tasks
        </span>

        {loading && <p className="text-sm text-neutral-600">Loading…</p>}
        {!loading && tasks.length === 0 && (
          <p className="text-sm text-neutral-600">No tasks yet — add one below.</p>
        )}

        {tasks.map((task) => (
          <label
            key={task.id}
            className="flex items-center gap-3 rounded-md border border-divider px-3 py-2 text-sm"
          >
            <input
              type="checkbox"
              checked={task.status === 'done'}
              onChange={() => toggleTask(task)}
              className="accent-accent"
            />
            <span className={task.status === 'done' ? 'flex-1 text-neutral-500 line-through' : 'flex-1'}>
              {task.title}
            </span>
            {task.due_date && <span className="text-xs text-neutral-600">{task.due_date}</span>}
            <button
              onClick={() => deleteTask(task)}
              className="text-neutral-500 hover:text-accent-800"
              title="Delete task"
            >
              ×
            </button>
          </label>
        ))}

        <div className="mt-1 flex items-end gap-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="New task"
            className="flex-1 rounded-md border border-divider bg-transparent px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
          <input
            type="date"
            value={newDue}
            onChange={(e) => setNewDue(e.target.value)}
            className="rounded-md border border-divider bg-transparent px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
          <button
            onClick={addTask}
            className="rounded-md border border-accent px-4 py-2 font-heading text-sm font-semibold text-accent-700 hover:bg-accent-100"
          >
            + Add
          </button>
        </div>
      </div>
    </div>
  )
}
