'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'

type TaskSection = {
  title: string
  items: string[]
}

export default function Plans() {
  const [plannedTasks, setPlannedTasks] = useState<TaskSection[]>([])

  useEffect(() => {
    async function loadPlanned() {
      try {
        const res = await fetch('/Planned.md')
        const text = await res.text()
        const lines = text.split('\n')
        const sections: TaskSection[] = []
        let current: TaskSection | null = null

        for (const line of lines) {
          if (line.startsWith('# ')) {
            if (current) sections.push(current)
            current = { title: line.slice(2).trim(), items: [] }
          } else if (line.startsWith('* ')) {
            current?.items.push(line.slice(2).trim())
          }
        }
        if (current) sections.push(current)
        setPlannedTasks(sections)
      } catch (e) {
        console.error('Error loading planned tasks', e)
      }
    }
    loadPlanned()
  }, [])

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="px-6 py-8 h-[50vh]"
    >
      <h2 className="text-2xl mb-4 text-center">Planned Tasks</h2>
      {plannedTasks.length > 0 ? (
        <div
          className="grid gap-6"
          style={{ gridTemplateColumns: `repeat(${plannedTasks.length}, 1fr)` }}
        >
          {plannedTasks.map(section => (
            <div key={section.title}>
              <h3 className="text-xl font-semibold mb-2">{section.title}</h3>
              <ul className="list-disc list-inside space-y-1">
                {section.items.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500">No planned tasks found.</p>
      )}
    </motion.section>
  )
}
