import { Moon, Plus, Sun } from 'lucide-react'
import { Btn, IconBtn } from '../components/ui'

export function HeaderActions({ settings, actions, addLabel = 'Quick Add Application', preset }) {
  const dark = settings.theme === 'dark'
  return (
    <>
      <IconBtn
        onClick={actions.toggleTheme}
        aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={dark ? 'Light mode' : 'Dark mode'}
        className="w-10 h-10 rounded-xl border border-line bg-card"
      >
        {dark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
      </IconBtn>
      <Btn variant="primary" icon={Plus} onClick={() => actions.openAdd(preset)}>
        {addLabel}
      </Btn>
    </>
  )
}

export function SectionTitle({ children, count, tone }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-semibold mb-3">
      {children}
      {count != null && (
        <span
          className={`min-w-[22px] h-5 px-1.5 rounded-full text-[11px] grid place-items-center tabular-nums font-semibold ${
            tone === 'red' ? 'bg-pr/60 text-[#5a1d20] dark:text-white' : 'bg-pb/40 text-pbInk'
          }`}
        >
          {count}
        </span>
      )}
    </h2>
  )
}
