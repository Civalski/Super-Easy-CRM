'use client'

import { SideCreateDrawer } from '@/components/common'
import { RegisterEmbeddedCheckout } from '@/components/features/register/RegisterEmbeddedCheckout'

type SubscriptionCheckoutDrawerProps = {
  clientSecret: string
  open: boolean
  onComplete?: () => void
}

export function SubscriptionCheckoutDrawer({
  clientSecret,
  open,
  onComplete,
}: SubscriptionCheckoutDrawerProps) {
  return (
    <SideCreateDrawer
      open={open}
      onClose={() => {}}
      maxWidthClass="max-w-[980px]"
      zIndexClass="z-[10020]"
    >
      <div className="flex h-full flex-col overflow-hidden bg-white">
        <div className="flex-1 overflow-y-auto p-0">
          <RegisterEmbeddedCheckout
            clientSecret={clientSecret}
            onComplete={onComplete}
            variant="bare"
          />
        </div>
      </div>
    </SideCreateDrawer>
  )
}
