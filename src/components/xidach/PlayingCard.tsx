'use client'

import { strToCard, isRedSuit } from '@/lib/xidach-logic'
import type { CardStr } from '@/types/game'

interface PlayingCardProps {
    card: CardStr
    faceDown?: boolean
    index?: number
}

export function PlayingCard({ card, faceDown = false, index = 0 }: PlayingCardProps) {
    const delay = index * 100

    if (faceDown) {
        return (
            <div
                className="relative flex-shrink-0 rounded-lg shadow-lg border border-blue-400/30 overflow-hidden transition-all duration-300"
                style={{
                    width: 52,
                    height: 76,
                    background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
                    animationDelay: `${delay}ms`,
                }}
            >
                <div className="absolute inset-1.5 rounded border border-white/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full border-2 border-white/30" />
                </div>
            </div>
        )
    }

    const parsed = strToCard(card)
    const red = isRedSuit(parsed.suit)

    return (
        <div
            className="relative flex-shrink-0 rounded-lg shadow-lg border border-slate-200 overflow-hidden bg-white animate-in slide-in-from-top-4 fade-in-0 duration-300"
            style={{ width: 52, height: 76, animationDelay: `${delay}ms` }}
        >
            <div className={`absolute top-0.5 left-1 leading-none ${red ? 'text-red-600' : 'text-slate-900'}`}>
                <div className="text-[11px] font-black">{parsed.rank}</div>
                <div className="text-[9px] -mt-0.5">{parsed.suit}</div>
            </div>
            <div className={`absolute inset-0 flex items-center justify-center ${red ? 'text-red-600' : 'text-slate-900'}`}>
                <span className="text-xl">{parsed.suit}</span>
            </div>
            <div className={`absolute bottom-0.5 right-1 leading-none rotate-180 ${red ? 'text-red-600' : 'text-slate-900'}`}>
                <div className="text-[11px] font-black">{parsed.rank}</div>
                <div className="text-[9px] -mt-0.5">{parsed.suit}</div>
            </div>
        </div>
    )
}
