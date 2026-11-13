'use client'

/**
 * Upload the bank's transaction file (CSV) and confirm Zelle payments in one
 * go. The first time, say which columns hold the date, amount, memo and
 * sender (saved for next time). Rows are sorted into:
 *   Matched   - an open request's reference code is in the memo, and the
 *               amount is what is owed: ticked, ready to confirm.
 *   Possible  - right amount and a name in common, or right code and another
 *               amount: a person picks.
 *   Not ours  - anything else; tick to remember it, so it is not shown again.
 * Rows already handled in an earlier file are skipped. Confirming goes
 * through the same step as confirming by hand.
 * Spec: docs/architecture/payments.md, "Bank file import".
 */

import { useState } from 'react'
import { CheckIcon, FileUpIcon, SettingsIcon } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Field, Select } from '@/components/ui/Field'
import { formatCurrency, formatDate } from '@/utils/format'
import { guessCsvMapping, parseCsv, type BankMatch, type CsvMapping } from '@/lib/zelle'

type Choice = { requestId: string | null; include: boolean }
const money = (n: number) => formatCurrency(n, true)

export default function ZelleImportPage() {
  const [csv, setCsv] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [headers, setHeaders] = useState<string[] | null>(null)
  const [mapping, setMapping] = useState<Partial<CsvMapping>>({})
  const [matches, setMatches] = useState<BankMatch[] | null>(null)
  const [already, setAlready] = useState(0)
  const [choices, setChoices] = useState<Record<string, Choice>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<Array<{ hash: string; ok: boolean; message: string }> | null>(null)

  const analyze = async (text: string) => {
    setBusy(true)
    setError(null)
    setResults(null)
    try {
      const res = await fetch('/api/zelle/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ csv: text }) })
      const d = await res.json()
      if (res.status === 409 && d.headers) {
        // Columns not set up yet (or this file has different ones).
        setHeaders(d.headers)
        setMapping(guessCsvMapping(d.headers))
        setMatches(null)
        return
      }
      if (!res.ok) {
        if (d.headers) {
          setHeaders(d.headers)
          setMapping(guessCsvMapping(d.headers))
        }
        throw new Error(d.error || 'Could not read the file')
      }
      setHeaders(null)
      setMatches(d.matches)
      setAlready(d.alreadyImported)
      const initial: Record<string, Choice> = {}
      for (const m of d.matches as BankMatch[]) {
        initial[m.row.hash] =
          m.kind === 'matched'
            ? { requestId: m.request.id, include: true }
            : m.kind === 'possible'
              ? { requestId: m.candidates.length === 1 ? m.candidates[0].id : null, include: false }
              : { requestId: null, include: false }
      }
      setChoices(initial)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const onFile = async (file: File) => {
    const text = await file.text()
    setFileName(file.name)
    setCsv(text)
    analyze(text)
  }

  const saveMapping = async () => {
    if (!csv || !mapping.date || !mapping.amount || !mapping.memo || !mapping.sender) {
      setError('Choose a column for each of date, amount, memo and sender.')
      return
    }
    setBusy(true)
    const res = await fetch('/api/zelle/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: { csvMapping: mapping } }),
    })
    const d = await res.json()
    setBusy(false)
    if (!res.ok) {
      setError(d.error || 'Could not save the columns (Office Manager or Admin only)')
      return
    }
    analyze(csv)
  }

  const confirm = async () => {
    if (!matches) return
    const decisions = matches
      .filter((m) => choices[m.row.hash]?.include)
      .map((m) => ({ ...m.row, requestId: m.kind === 'unmatched' ? null : choices[m.row.hash].requestId }))
      .filter((d) => d.requestId !== undefined)
    if (decisions.length === 0) {
      setError('Tick the rows to confirm.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/zelle/import', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ decisions }) })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Could not confirm')
      setResults(d.results)
      if (csv) await analyze(csv) // what is left
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const groups: Array<{ kind: BankMatch['kind']; title: string; description: string }> = [
    { kind: 'matched', title: 'Matched', description: 'Reference code in the memo and the amount owed. Ready to confirm.' },
    { kind: 'possible', title: 'Possible matches', description: 'Check each one and pick the request it pays.' },
    { kind: 'unmatched', title: 'Not matched', description: 'Not a portal payment, or record it by hand. Tick to stop showing it.' },
  ]
  const ticked = Object.values(choices).filter((c) => c.include).length

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Zelle"
        title="Upload a bank file"
        description="Download the account's recent transactions as CSV from the bank's website and upload it here. Nothing changes until you confirm."
      />

      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <label className="inline-flex">
            <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
            <span className="inline-flex h-12 cursor-pointer items-center gap-2.5 rounded-xl bg-saffron px-5 text-[15.5px] font-semibold text-white hover:bg-saffron-hover">
              <FileUpIcon className="h-[18px] w-[18px]" aria-hidden="true" />
              {fileName ? 'Choose another file' : 'Choose the bank file'}
            </span>
          </label>
          {fileName && <span className="text-[14.5px] text-ink-2">{fileName}</span>}
          {csv && !headers && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={SettingsIcon}
              onClick={() => {
                const h = parseCsv(csv)[0] ?? []
                setHeaders(h)
                setMapping(guessCsvMapping(h))
              }}
            >
              Change columns
            </Button>
          )}
        </div>
      </Card>

      {error && (
        <Alert tone="danger" title="That did not work">
          {error}
        </Alert>
      )}
      {results && (
        <Alert tone="success" title={`${results.filter((r) => r.ok).length} of ${results.length} done`}>
          {results.filter((r) => !r.ok).map((r) => r.message).join(' ') || 'Receipts were emailed for every payment completed.'}
        </Alert>
      )}

      {headers && (
        <Card>
          <CardHeader title="Which columns are which?" description="Asked once; saved for this bank's files." />
          <div className="grid gap-5 sm:grid-cols-2">
            {(['date', 'amount', 'memo', 'sender'] as const).map((k) => (
              <Field key={k} label={{ date: 'Date', amount: 'Amount', memo: 'Memo / description', sender: 'Sender name' }[k]} required>
                {({ id }) => (
                  <Select id={id} value={mapping[k] ?? ''} onChange={(e) => setMapping({ ...mapping, [k]: e.target.value })}>
                    <option value="">Choose…</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            ))}
          </div>
          <div className="mt-5">
            <Button type="button" loading={busy} onClick={saveMapping}>
              Save columns and read the file
            </Button>
          </div>
        </Card>
      )}

      {matches && (
        <>
          {already > 0 && <p className="text-[14px] text-ink-3">{already} rows were handled in an earlier file and are not shown.</p>}
          {matches.length === 0 && <Alert tone="info" title="Nothing new">Every money-in row in this file has already been handled.</Alert>}
          {groups.map((g) => {
            const list = matches.filter((m) => m.kind === g.kind)
            if (list.length === 0) return null
            return (
              <Card key={g.kind}>
                <CardHeader title={`${g.title} (${list.length})`} description={g.description} />
                <ul className="divide-y divide-line">
                  {list.map((m) => {
                    const c = choices[m.row.hash] ?? { requestId: null, include: false }
                    const setC = (next: Partial<Choice>) => setChoices({ ...choices, [m.row.hash]: { ...c, ...next } })
                    return (
                      <li key={m.row.hash} className="flex flex-wrap items-center gap-4 py-3">
                        <input
                          type="checkbox"
                          aria-label="Include this row"
                          checked={c.include}
                          disabled={m.kind === 'possible' && !c.requestId}
                          onChange={(e) => setC({ include: e.target.checked })}
                          className="h-4 w-4 rounded border-line-strong text-saffron focus:ring-saffron-ring"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] font-semibold text-ink">
                            <span className="tnum">{money(m.row.amount)}</span> from {m.row.sender || 'unknown sender'}
                            {m.row.postedOn && <span className="font-normal text-ink-3"> · {formatDate(m.row.postedOn)}</span>}
                          </p>
                          <p className="truncate text-[13.5px] text-ink-3">{m.row.memo || 'No memo'}</p>
                        </div>
                        {m.kind === 'matched' && (
                          <Badge tone="success">
                            {m.request.reference_code} · {m.request.memberName}
                          </Badge>
                        )}
                        {m.kind === 'possible' && (
                          <Select
                            aria-label="Which request this pays"
                            value={c.requestId ?? ''}
                            onChange={(e) => setC({ requestId: e.target.value || null, include: !!e.target.value })}
                            className="w-auto"
                          >
                            <option value="">Not this one…</option>
                            {m.candidates.map((r) => (
                              <option key={r.id} value={r.id}>
                                {r.reference_code} · {r.memberName} · {money(r.amount_due - r.received)} owed
                              </option>
                            ))}
                          </Select>
                        )}
                        {m.kind === 'unmatched' && <span className="text-[13px] text-ink-3">Tick: not a portal payment</span>}
                      </li>
                    )
                  })}
                </ul>
              </Card>
            )
          })}
          {matches.length > 0 && (
            <div className="flex justify-end">
              <Button icon={CheckIcon} loading={busy} disabled={ticked === 0} onClick={confirm}>
                Confirm {ticked} {ticked === 1 ? 'row' : 'rows'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
