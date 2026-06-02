import NewWorkItemForm from './NewWorkItemForm'

interface SearchParams {
  type?: string
  title?: string
  nextAction?: string
  notes?: string
}

export default function NewWorkItemPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <NewWorkItemForm
      initial={{
        type: searchParams.type,
        title: searchParams.title,
        nextAction: searchParams.nextAction,
        notes: searchParams.notes,
      }}
    />
  )
}
