'use client'

import { PlayingCard } from './PlayingCard'
import { calculateScore } from '@/lib/xidach-logic'
import { Button } from '@/components/ui/button'
import { Crown, Eye } from 'lucide-react'
import type { XiDachDealerStatus, CardStr, XiDachPhase } from '@/types/game'

interface DealerAreaProps {
    cards: CardStr[]
    status: XiDachDealerStatus
    isDealer: boolean
    phase: XiDachPhase
    onHit: () => void
    onStand: () => void
    onReveal: () => void
}

export function DealerArea({
    cards,
    status,
    isDealer,
    phase,
    onHit,
    onStand,
    onReveal,
}: DealerAreaProps) {
    const canSeeCards = isDealer || phase === 'result'
    const score = calculateScore(cards)
    const bust = score > 21

    return (
        <div className="flex flex-col items-center gap-2">
            {/* Dealer badge */}
            <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${phase === 'dealer_turn' && isDealer
                    ? 'bg-emerald-400 text-emerald-900'
                    : 'bg-white/15 text-white/80'
                }`}>
                <Crown className="w-3.5 h-3.5 text-yellow-400" />
                <span>Cái{isDealer ? ' (Bạn)' : ''}</span>
                {canSeeCards && cards.length > 0 && (
                    <span className={`ml-1 font-black ${bust ? 'text-red-500' : ''}`}>
                        · {score}{bust ? ' Quắc' : ''}
                    </span>
                )}
            </div>

            {/* Cards */}
            <div className="flex gap-1.5">
                {cards.map((card, i) => (
                    <PlayingCard
                        key={i}
                        card={card}
                        faceDown={!canSeeCards && i === 1}
                        index={i}
                    />
                ))}
            </div>

            {/* Dealer controls */}
            {isDealer && phase === 'dealer_turn' && status !== 'bust' && (
                <div className="flex gap-2 mt-1">
                    <Button onClick={onHit} size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6">
                        Kéo
                    </Button>
                    <Button onClick={onStand} size="sm" className="bg-slate-600 hover:bg-slate-700 text-white font-bold px-6">
                        Dừng
                    </Button>
                </div>
            )}

            {/* Reveal button */}
            {isDealer && phase === 'dealer_done' && (
                <Button
                    onClick={onReveal}
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold gap-2 mt-1"
                >
                    <Eye className="w-4 h-4" />
                    Lật bài tất cả
                </Button>
            )}
        </div>
    )
}
