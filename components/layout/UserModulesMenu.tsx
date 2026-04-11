'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, ChevronUp } from '@/lib/icons'
import { menuItems, getMenuItemsForUser, filterMenuItemsByCrmEdition } from '@/lib/menuItems'
import {
  MENU_MODULES_HIDDEN_EVENT,
  getRequiredMenuModuleHrefs,
  getHiddenMenuModules,
  resolveVisibleMenuModuleHrefs,
  setHiddenMenuModules,
} from '@/lib/ui/menuModulesPreference'

interface UserModulesMenuProps {
  userId?: string | null
  role?: string | null
  username?: string | null
  userName: string
  userEmail?: string | null
  userInitial: string
}

export function UserModulesMenu({
  userId,
  role,
  username,
  userName,
  userEmail,
  userInitial,
}: UserModulesMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [hiddenModules, setHiddenModules] = useState<string[]>([])
  const userStorageKey = userId ?? userEmail ?? username ?? null

  const availableMenuItems = useMemo(
    () =>
      filterMenuItemsByCrmEdition(getMenuItemsForUser(menuItems, { role, username })),
    [role, username]
  )

  useEffect(() => {
    const sync = () => {
      setHiddenModules(getHiddenMenuModules(userStorageKey))
    }

    const handleHiddenModulesChange = (event: Event) => {
      const customEvent = event as CustomEvent<string[]>
      setHiddenModules(Array.isArray(customEvent.detail) ? customEvent.detail : [])
    }

    sync()
    window.addEventListener('storage', sync)
    window.addEventListener(MENU_MODULES_HIDDEN_EVENT, handleHiddenModulesChange as EventListener)

    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener(
        MENU_MODULES_HIDDEN_EVENT,
        handleHiddenModulesChange as EventListener
      )
    }
  }, [userStorageKey])

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null
      if (!target || !rootRef.current) return
      if (!rootRef.current.contains(target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('touchstart', handleOutsideClick, { passive: true })
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('touchstart', handleOutsideClick)
    }
  }, [])

  const visibleHrefs = useMemo(
    () =>
      resolveVisibleMenuModuleHrefs(
        availableMenuItems.map((item) => item.href),
        hiddenModules
      ),
    [availableMenuItems, hiddenModules]
  )

  const requiredSet = useMemo(() => new Set(getRequiredMenuModuleHrefs()), [])

  const handleToggleModule = (href: string) => {
    if (requiredSet.has(href)) return

    const currentlyHidden = new Set(hiddenModules)
    if (currentlyHidden.has(href)) {
      currentlyHidden.delete(href)
    } else {
      currentlyHidden.add(href)
    }

    const nextHidden = Array.from(currentlyHidden)
    setHiddenModules(nextHidden)
    setHiddenMenuModules(nextHidden, userStorageKey)
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex min-h-[44px] items-center gap-2 rounded-xl px-1.5 py-1 transition-colors hover:bg-slate-100/80 dark:hover:bg-slate-800/55 sm:gap-3 sm:px-2 sm:py-1.5"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title="Personalizar modulos do CRM"
      >
        <div className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl bg-linear-to-br from-slate-600 to-indigo-500 text-sm font-semibold text-white shadow-md shadow-slate-950/45 lg:h-9 lg:w-9">
          <span>{userInitial}</span>
        </div>
        <div className="hidden text-right md:block">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{userName}</p>
          {userEmail && <p className="text-xs text-slate-500 dark:text-slate-400">{userEmail}</p>}
        </div>
        {isOpen ? (
          <ChevronUp size={16} className="hidden text-slate-500 md:block" />
        ) : (
          <ChevronDown size={16} className="hidden text-slate-500 md:block" />
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+0.4rem)] z-50 w-72 rounded-xl border border-slate-200/90 bg-white p-2 shadow-xl dark:border-slate-700/70 dark:bg-slate-900"
        >
          <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Modulos no menu
          </p>
          <div className="max-h-80 overflow-y-auto pr-1">
            {availableMenuItems.map((item) => {
              const isRequired = requiredSet.has(item.href)
              const isVisible = visibleHrefs.includes(item.href)

              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => handleToggleModule(item.href)}
                  disabled={isRequired}
                  className={`mt-1 flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm transition-colors ${
                    isRequired
                      ? 'cursor-not-allowed bg-slate-100 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate">{item.name}</span>
                  <span
                    className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs ${
                      isVisible
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {isVisible ? <Check size={12} /> : 'Oculto'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
