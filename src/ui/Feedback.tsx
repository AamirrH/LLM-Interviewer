import { CheckCircle2, CircleAlert } from 'lucide-react'

export type Notice = { kind: 'success' | 'error'; text: string } | null

export function Feedback({ notice }: { notice: Notice }) {
  return (
    <div className="feedback-space">
      {notice && (
        <div
          className={`feedback ${notice.kind}`}
          role={notice.kind === 'error' ? 'alert' : 'status'}
        >
          {notice.kind === 'error' ? <CircleAlert size={17} /> : <CheckCircle2 size={17} />}
          <span>{notice.text}</span>
        </div>
      )}
    </div>
  )
}
