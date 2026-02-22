'use client'

import { PlayingCard } from './PlayingCard'
import { calculateScore } from '@/lib/xidach-logic'
import type { XiDachPlayerState, XiDachResult } from '@/types/game'
import { Button } from '@/components/ui/button'
import { Target, Hand, XCircle, Trophy, Frown, Equal } from 'lucide-react'

interface PlayerHandProps {
    playerId: string
    player: XiDachPlayerState
    isMe: boolean
    isMyTurn: boolean
    canSeeCards: boolean
    result?: XiDachResult
    onHit: () => void
    onStand: () => void
    position?: 'bottom' | 'top' | 'left' | 'right'
}

const RESULT_CONFIG: Record<XiDachResult, { icon: React.ReactNode; text: string; bg: string }> = {
    win: { icon: <Trophy className="w-4 h-4" />, text: 'THẮNG', bg: 'bg-green-500' },
    lose: { icon: <Frown className="w-4 h-4" />, text: 'THUA', bg: 'bg-red-500' },
    draw: { icon: <Equal className="w-4 h-4" />, text: 'HÒA', bg: 'bg-yellow-500' },
}

export function PlayerHand({
    playerId,
    player,
    isMe,
    isMyTurn,
    canSeeCards,
    result,
    onHit,
    onStand,
    position = 'bottom',
}: PlayerHandProps) {
    const score = calculateScore(player.cards)
    const name = isMe ? 'Bạn' : playerId.slice(0, 5).toUpperCase()
    const isBottom = position === 'bottom'

    return (
        <div className={`flex flex-col items-center gap-2 ${isBottom ? '' : 'scale-90'}`}>
            {/* Name + Score badge */}
            <div className="flex items-center gap-2">
                <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${isMyTurn
                        ? 'bg-yellow-400 text-yellow-900'
                        : 'bg-white/15 text-white/80'
                    }`}>
                    {isMyTurn && <Target className="w-3 h-3" />}
                    {player.status === 'stand' && !isMyTurn && <Hand className="w-3 h-3" />}
                    {player.status === 'bust' && <XCircle className="w-3 h-3" />}
                    <span>{name}</span>
                    {canSeeCards && (
                        <span className={`ml-1 font-black ${player.status === 'bust' ? 'text-red-500' : ''}`}>
                            · {score}
                        </span>
                    )}
                </div>

                {/* Result badge */}
                {result && canSeeCards && (
                    <div className={`px-2 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1 ${RESULT_CONFIG[result].bg}`}>
                        {RESULT_CONFIG[result].icon}
                        {RESULT_CONFIG[result].text}
                    </div>
                )}
            </div>

            {/* Cards */}
            <div className="flex gap-1.5">
                {player.cards.map((card, i) => (
                    <PlayingCard key={i} card={card} faceDown={!canSeeCards} index={i} />
                ))}
                {player.cards.length === 0 && (
                    <div className="text-white/20 text-xs">Chưa có bài</div>
                )}
            </div>

            {/* Actions — only for my hand on my turn */}
            {isMe && isMyTurn && player.status === 'playing' && (
                <div className="flex gap-2 mt-1">
                    <Button
                        onClick={onHit}
                        size="sm"
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-6"
                    >
                        Kéo
                    </Button>
                    <Button
                        onClick={onStand}
                        size="sm"
                        className="bg-slate-600 hover:bg-slate-700 text-white font-bold px-6"
                    >
                        Dừng
                    </Button>
                </div>
            )}
        </div>
    )
}
