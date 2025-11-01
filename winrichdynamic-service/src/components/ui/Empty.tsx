import React from 'react'

export default function Empty({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="p-8 text-center">
      <p className="text-gray-500">{title}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}


