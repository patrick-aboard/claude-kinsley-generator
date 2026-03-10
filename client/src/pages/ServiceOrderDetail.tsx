import { useParams } from 'react-router-dom'

export default function ServiceOrderDetail() {
  const { id } = useParams()
  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-muted-foreground">
        Service Order #{id}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">Coming soon.</p>
    </div>
  )
}
