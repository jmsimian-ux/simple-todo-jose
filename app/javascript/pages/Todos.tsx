import * as React from "react"
import { Head, router, usePage } from "@inertiajs/react"
import { AppShell } from "@/components/AppShell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { PageProps, Todo } from "@/types/inertia"

type TodosPageProps = PageProps<{ todos: Todo[] }>

const DESCRIPTION =
  "Your to-do list: add items, check them off, edit them, and delete them."

export default function Todos() {
  const { props } = usePage<TodosPageProps>()
  const { todos, errors } = props

  const [newDescription, setNewDescription] = React.useState("")
  const [adding, setAdding] = React.useState(false)

  function addTodo(event: React.FormEvent) {
    event.preventDefault()
    setAdding(true)
    router.post(
      "/todos",
      { todo: { description: newDescription } },
      {
        preserveScroll: true,
        onSuccess: (page) => {
          if (!(page.props as { errors?: Record<string, string> }).errors?.description) {
            setNewDescription("")
          }
        },
        onFinish: () => setAdding(false),
      },
    )
  }

  const remaining = todos.filter((todo) => !todo.completed).length

  return (
    <>
      <Head title="My to-dos">
        <meta name="description" content={DESCRIPTION} />
        <meta property="og:title" content="My to-dos" />
        <meta property="og:description" content={DESCRIPTION} />
      </Head>
      <AppShell>
        <h1>My to-dos</h1>
        <p className="mt-2">
          {todos.length === 0
            ? "Nothing here yet. Add your first to-do below."
            : `${remaining} of ${todos.length} still to do.`}
        </p>

        <form onSubmit={addTodo} className="mt-6 flex items-start gap-2">
          <div className="flex-1">
            <label htmlFor="new-todo" className="sr-only">
              New to-do description
            </label>
            <Input
              id="new-todo"
              value={newDescription}
              onChange={(event) => setNewDescription(event.target.value)}
              placeholder="What needs to be done?"
              maxLength={500}
              autoComplete="off"
              aria-invalid={errors?.description ? true : undefined}
            />
            {errors?.description && (
              <p role="alert" className="mt-1 text-xs text-danger-display">
                {errors.description}
              </p>
            )}
          </div>
          <Button type="submit" disabled={adding}>
            Add to-do
          </Button>
        </form>

        {todos.length > 0 && (
          <ul className="mt-6 divide-y divide-hairline rounded-lg border border-hairline p-0">
            {todos.map((todo) => (
              <TodoRow key={todo.id} todo={todo} />
            ))}
          </ul>
        )}
      </AppShell>
    </>
  )
}

function TodoRow({ todo }: { todo: Todo }) {
  const [editing, setEditing] = React.useState(false)
  const [draft, setDraft] = React.useState(todo.description)
  const [confirmingDelete, setConfirmingDelete] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [editError, setEditError] = React.useState<string | null>(null)

  function toggle(completed: boolean) {
    router.patch(`/todos/${todo.id}`, { todo: { completed } }, { preserveScroll: true })
  }

  function startEditing() {
    setDraft(todo.description)
    setEditError(null)
    setEditing(true)
  }

  function saveEdit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    router.patch(
      `/todos/${todo.id}`,
      { todo: { description: draft } },
      {
        preserveScroll: true,
        onSuccess: (page) => {
          const error = (page.props as { errors?: Record<string, string> }).errors?.description
          if (error) {
            setEditError(error)
          } else {
            setEditing(false)
          }
        },
        onFinish: () => setSaving(false),
      },
    )
  }

  function destroy() {
    router.delete(`/todos/${todo.id}`, {
      preserveScroll: true,
      onFinish: () => setConfirmingDelete(false),
    })
  }

  return (
    <li className="flex items-start gap-3 px-4 py-3" data-completed={todo.completed}>
      <Checkbox
        id={`todo-${todo.id}`}
        checked={todo.completed}
        onChange={(event) => toggle(event.target.checked)}
        aria-label={
          todo.completed
            ? `Mark "${todo.description}" as not done`
            : `Mark "${todo.description}" as done`
        }
        className="mt-1"
      />

      {editing ? (
        <form onSubmit={saveEdit} className="flex flex-1 flex-wrap items-start gap-2">
          <div className="min-w-0 flex-1">
            <label htmlFor={`edit-todo-${todo.id}`} className="sr-only">
              Edit description
            </label>
            <Input
              id={`edit-todo-${todo.id}`}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={500}
              autoFocus
              autoComplete="off"
            />
            {editError && (
              <p role="alert" className="mt-1 text-xs text-danger-display">
                {editError}
              </p>
            )}
          </div>
          <Button type="submit" size="sm" disabled={saving}>
            Save
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </form>
      ) : (
        <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
            <span
              className={cn(
                "min-w-0 break-words",
                todo.completed && "text-ink-muted line-through",
              )}
            >
              {todo.description}
            </span>
            <Badge tone={todo.completed ? "accent" : "neutral"}>
              {todo.completed ? "Done" : "To do"}
            </Badge>
          </div>
          <div className="-ml-3 flex shrink-0 items-center gap-1 sm:ml-0">
            <Button type="button" size="sm" variant="ghost" onClick={startEditing}>
              Edit
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setConfirmingDelete(true)}
            >
              Delete
            </Button>
          </div>
        </div>
      )}

      <Dialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Delete this to-do?</DialogTitle>
            <DialogDescription>
              “{todo.description}” will be permanently deleted. This can’t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="button" variant="danger" onClick={destroy}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  )
}
