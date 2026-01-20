'use client'

import { LeadsSearchComponent, LeadsHeader } from '@/components/features/leads'

export default function LeadsPage() {
    return (
        <div className="space-y-6">
            <LeadsHeader />
            <LeadsSearchComponent />
        </div>
    )
}
