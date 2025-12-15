import React from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTelegramConfig } from '@/lib/telegram/config'

export const dynamic = 'force-dynamic'

export default async function AdminExportsPage({ searchParams }: { searchParams?: { secret?: string } }) {
  const secret = searchParams?.secret
  const adminSecret = process.env.ADMIN_UI_SECRET
  if (adminSecret && secret !== adminSecret) {
    return (
      <div className="p-8">
        <h1 className="text-lg font-semibold">Unauthorized</h1>
        <p className="text-sm text-gray-500">Provide a valid `secret` query parameter to view this page.</p>
      </div>
    )
  }

  const admin = createAdminClient()
  const { data, error } = await admin.from('exports').select('*').order('updated_at', { ascending: false }).limit(100)
  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-lg font-semibold">Error fetching exports</h1>
        <pre className="text-xs text-red-500">{String(error)}</pre>
      </div>
    )
  }

  const { botToken } = getTelegramConfig()

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold mb-4">Exports (recent)</h1>
      <div className="overflow-auto">
        <table className="w-full text-sm table-auto">
          <thead>
            <tr className="text-left">
              <th>ID</th>
              <th>User</th>
              <th>Date</th>
              <th>Status</th>
              <th>Attempts</th>
              <th>Telegram</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {(data || []).map((r: any) => {
              let fileLink: string | null = null
              try {
                const raw = r.telegram_response ? JSON.parse(r.telegram_response) : r.telegram_response
                const filePath = raw?.result?.document?.file_path
                if (filePath && botToken) {
                  fileLink = `https://api.telegram.org/file/bot${botToken}/${filePath}`
                }
              } catch (e) {
                // ignore
              }
              return (
                <tr key={r.id} className="border-t">
                  <td className="py-2">{r.id}</td>
                  <td className="py-2">{r.user_id}</td>
                  <td className="py-2">{r.report_date}</td>
                  <td className="py-2">{r.status}</td>
                  <td className="py-2">{r.attempt_count}</td>
                  <td className="py-2">
                    {r.telegram_message_id && <div>msg: {r.telegram_message_id}</div>}
                    {fileLink && (
                      <a href={fileLink} target="_blank" rel="noreferrer" className="text-indigo-600">Download</a>
                    )}
                  </td>
                  <td className="py-2">{new Date(r.updated_at).toLocaleString()}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
