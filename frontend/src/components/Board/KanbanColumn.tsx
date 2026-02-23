import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Column, Task } from '../../types'
import TaskCard from './TaskCard'

interface Props {
  column: Column
  tasks: Task[]
}

export default function KanbanColumn({ column, tasks }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  const taskIds = tasks.map((t) => t.id)

  return (
    <div className="flex flex-col w-72 shrink-0">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">
          {column.title}
        </h3>
        <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
          {tasks.length}
        </span>
      </div>

      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`flex flex-col gap-2 min-h-24 rounded-xl p-2 transition-colors ${
            isOver ? 'bg-blue-50' : 'bg-gray-100'
          }`}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}
