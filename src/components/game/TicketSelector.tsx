'use client'

import { useState } from 'react'
import { TICKET_GROUPS, COLOR_LABELS, type LotoTicket, type TicketColor } from '@/lib/ticket-data'
import { LotoTicketCard } from '@/components/game/LotoTicketCard'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface TicketSelectorProps {
    onConfirm: (tickets: LotoTicket[]) => void
}

const MAX_TICKETS = 2

const COLOR_DOT: Record<TicketColor, string> = {
    blue: '#5BA3E6',
    navy: '#3B5998',
    green: '#4CAF7D',
    red: '#E05A6D',
    orange: '#F0923A',
    yellow: '#F0D03A',
    purple: '#9B72CF',
    pink: '#E47EC6',
}

export function TicketSelector({ onConfirm }: TicketSelectorProps) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                if (next.size >= MAX_TICKETS) return prev
                next.add(id)
            }
            return next
        })
    }

    const handleConfirm = () => {
        const allTickets = TICKET_GROUPS.flatMap((g) => g.tickets)
        const selected = allTickets.filter((t) => selectedIds.has(t.id))
        if (selected.length > 0) onConfirm(selected)
    }

    const emptyMarked = new Set<number>()

    return (
        <div className="min-h-screen bg-slate-100 pb-20">
            <div className="sticky top-0 z-20 bg-white shadow-sm border-b">
                <div className="container mx-auto max-w-5xl px-4 py-3">
                    <h1 className="text-2xl sm:text-3xl font-black text-center text-slate-800">
                        Chọn Phiếu Dò
                    </h1>
                    <p className="text-center text-sm text-slate-500 mt-0.5">
                        Chọn tối đa <strong>{MAX_TICKETS} vé</strong> · Đã chọn:{' '}
                        <span className="font-bold text-green-600">{selectedIds.size}/{MAX_TICKETS}</span>
                    </p>
                </div>
            </div>

            <div className="container mx-auto max-w-5xl px-4 py-4 space-y-6">
                {TICKET_GROUPS.map((group) => (
                    <div key={group.color}>
                        <div className="flex items-center gap-2 mb-2">
                            <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: COLOR_DOT[group.color] }}
                            />
                            <span className="text-sm font-bold text-slate-700">
                                {COLOR_LABELS[group.color]}
                            </span>
                            <div className="h-px flex-1 bg-slate-200" />
                        </div>

                        <div className="flex justify-center gap-4 flex-wrap">
                            {group.tickets.map((ticket) => {
                                const isSelected = selectedIds.has(ticket.id)
                                const isDisabled = selectedIds.size >= MAX_TICKETS && !isSelected

                                return (
                                    <div
                                        key={ticket.id}
                                        onClick={() => !isDisabled && toggleSelect(ticket.id)}
                                        className={cn(
                                            'relative cursor-pointer rounded-lg p-1.5 transition-all duration-150',
                                            isSelected
                                                ? 'ring-4 ring-green-500 bg-green-50 shadow-lg scale-[1.01]'
                                                : 'bg-white hover:shadow-md',
                                            isDisabled && 'opacity-30 cursor-not-allowed',
                                        )}
                                    >
                                        {isSelected && (
                                            <div className="absolute -top-2 -right-2 z-10 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg">
                                                <Check className="w-5 h-5" strokeWidth={3} />
                                            </div>
                                        )}

                                        <LotoTicketCard
                                            ticket={ticket}
                                            markedNumbers={emptyMarked}
                                            onMark={() => { }}
                                            interactive={false}
                                        />
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t shadow-lg">
                <div className="container mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
                    <span className="text-sm text-slate-600">
                        Đã chọn <strong className="text-green-600">{selectedIds.size}</strong> / {MAX_TICKETS} vé
                    </span>
                    <Button
                        size="lg"
                        onClick={handleConfirm}
                        disabled={selectedIds.size === 0}
                        className="gap-2 bg-green-500 hover:bg-green-600 text-white px-8 font-bold text-base"
                    >
                        <Check className="w-5 h-5" />
                        CHỌN
                    </Button>
                </div>
            </div>
        </div>
    )
}
