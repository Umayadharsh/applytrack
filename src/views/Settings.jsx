import { useRef } from 'react'
import { Database, Download, Moon, RotateCcw, Sun, Trash2, Upload, User } from 'lucide-react'
import { Btn, Card, Field, PageHeader, Segmented, inputCls } from '../components/ui'

function Block({ icon: Icon, title, desc, children }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-5">
        <span className="w-9 h-9 rounded-xl bg-pbSoft text-pbInk grid place-items-center shrink-0">
          <Icon className="w-[18px] h-[18px]" />
        </span>
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-sm text-muted">{desc}</p>
        </div>
      </div>
      {children}
    </Card>
  )
}

export default function Settings({ apps, settings, setSettings, actions }) {
  const fileRef = useRef(null)
  return (
    <>
      <PageHeader title="Settings" subtitle="Personalise ApplyTrack and manage your data." />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 max-w-[1100px]">
        <Block icon={User} title="Profile" desc="Shown in the sidebar and your dashboard greeting.">
          <Field label="Your name">
            <input className={inputCls} value={settings.name} maxLength={40} onChange={(e) => setSettings((s) => ({ ...s, name: e.target.value }))} placeholder="Your name" />
          </Field>
        </Block>

        <Block icon={settings.theme === 'dark' ? Moon : Sun} title="Appearance" desc="Light is the default. Switch to dark if you work late.">
          <Segmented
            value={settings.theme}
            onChange={(theme) => setSettings((s) => ({ ...s, theme }))}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
          />
        </Block>

        <Block icon={RotateCcw} title="Follow-up reminders" desc="When you move a wishlist role to Applied, a follow-up is scheduled automatically.">
          <Field label="Default follow-up after applying (days)" hint="Set to 0 to turn off automatic reminders.">
            <input
              type="number"
              min="0"
              max="60"
              className={inputCls + ' max-w-[140px]'}
              value={settings.followUpDays}
              onChange={(e) => setSettings((s) => ({ ...s, followUpDays: Math.max(0, Math.min(60, parseInt(e.target.value, 10) || 0)) }))}
            />
          </Field>
        </Block>

        <Block icon={Database} title="Your data" desc={`${apps.length} application${apps.length === 1 ? '' : 's'} stored privately in this browser. Nothing is sent to a server.`}>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) actions.importCSV(f)
                e.target.value = ''
              }}
            />
            <Btn icon={Download} onClick={() => actions.exportCSV(apps)}>
              Export CSV
            </Btn>
            <Btn icon={Upload} onClick={() => fileRef.current?.click()}>
              Import CSV
            </Btn>
            <Btn icon={RotateCcw} onClick={actions.loadSample}>
              Load sample data
            </Btn>
            <Btn variant="danger" icon={Trash2} onClick={actions.clearAll}>
              Delete everything
            </Btn>
          </div>
          <p className="text-xs text-muted mt-4">
            Tip: clearing your browser's site data erases your applications. Export a CSV now and then as a backup.
          </p>
        </Block>
      </div>
    </>
  )
}
