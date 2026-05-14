import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import AdminLoading from '../components/AdminLoading'
import MoodGraph from '../components/MoodGraph'
import { useAdminData } from '../hooks/useAdminData'

// ============================================================
//  AdminDashboard — the live admin view
// ============================================================
//  Renders the user-similarity graph once data has loaded.
//  Hover a node for the user's name + Telegram handle.
// ============================================================

interface Props {
  session: Session
}

export default function AdminDashboard({ session }: Props) {
  const username =
    (session.user.app_metadata?.username as string | undefined) ?? 'master'
  const role =
    (session.user.app_metadata?.role as string | undefined) ?? null
  const { loading, error, users, entries, refetch } = useAdminData()
  const [retrying, setRetrying] = useState(false)

  async function signOut() {
    await supabase.auth.signOut()
  }

  async function refreshAndRetry() {
    if (retrying) return
    setRetrying(true)
    try {
      // Force-refresh the JWT so any newly-set app_metadata (e.g. role:'admin'
      // set on a previously-existing user) actually shows up in the token RLS
      // policies evaluate against.
      await supabase.auth.refreshSession()
      refetch()
    } finally {
      setRetrying(false)
    }
  }

  return (
    <div className="admin__dashboard">
      <div className="admin__dashboard-head">
        <p className="admin__welcome">
          Signed in as <strong>{username}</strong>
        </p>
        <div className="admin__dashboard-stats">
          <span>
            <strong>{users.length}</strong> users
          </span>
          <span aria-hidden="true">·</span>
          <span>
            <strong>{entries.length}</strong> moods · 30 d
          </span>
        </div>
      </div>

      <div className="admin__graph-wrap">
        {loading ? (
          <AdminLoading label="Loading graph" />
        ) : error ? (
          <div className="admin__error-panel" role="alert">
            <p className="admin__error-headline">Couldn’t load the graph</p>
            <p className="admin__error-detail">{error}</p>
            <p className="admin__error-hint">
              JWT role: <code>{role ?? 'none'}</code>
              {role === 'admin'
                ? ' — token looks right. If this persists, verify migration 004 was applied (the is_admin() function + admin SELECT policies).'
                : ' — token is missing the admin claim. Click below to refresh the session.'}
            </p>
            <div className="admin__error-actions">
              <button
                type="button"
                className="admin__submit admin__error-button"
                onClick={refreshAndRetry}
                disabled={retrying}
              >
                {retrying ? 'Refreshing…' : 'Refresh session & retry'}
              </button>
              <button
                type="button"
                className="admin__signout"
                onClick={signOut}
              >
                Sign out
              </button>
            </div>
          </div>
        ) : (
          <MoodGraph users={users} entries={entries} />
        )}
      </div>

      {!error && (
        <button type="button" className="admin__signout" onClick={signOut}>
          Sign out
        </button>
      )}
    </div>
  )
}
