'use client'

import { useEffect, useState, useCallback } from 'react'
import { useXiDach } from '@/hooks/use-xidach'
import { PlayingCard } from './PlayingCard'
import { Button } from '@/components/ui/button'
import { calculateScore, isNguLinh } from '@/lib/xidach-logic'
import {
    Copy, Volume2, VolumeX, Users, Clock, RefreshCw,
    Gamepad2, CircleDot, Crown, Eye, Target, Hand, XCircle,
    Trophy, Frown, Equal, Lock, ArrowLeft,
} from 'lucide-react'
import type { XiDachResult, CardStr } from '@/types/game'

interface XiDachRoomProps {
    roomId: string
}

/* ─── Interactive Card: clickable, shows peek/reveal state ─── */
interface InteractiveCardProps {
    card: CardStr
    index: number
    faceDown: boolean
    dealerRevealed?: boolean  // permanently revealed by dealer
    onClick?: () => void
}

function InteractiveCard({ card, index, faceDown, dealerRevealed, onClick }: InteractiveCardProps) {
    return (
        <div className="relative cursor-pointer" onClick={onClick}>
            <PlayingCard card={card} faceDown={faceDown} index={index} />
            {/* Dealer revealed indicator */}
            {dealerRevealed && !faceDown && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center shadow-md">
                    <Lock className="w-2.5 h-2.5 text-white" />
                </div>
            )}
        </div>
    )
}

/* ─── Seat: unified card display ─── */
interface SeatProps {
    seatId: string       // player id or 'dealer'
    name: string
    cards: CardStr[]
    isMe: boolean
    isDealer: boolean    // am I the dealer (viewer)?
    isDealerSeat: boolean // is this seat the dealer?
    isCurrentTurn: boolean
    status: string
    score: number
    canSeeCards: boolean  // result phase reveals all
    revealedCards: number[] // cards permanently revealed by dealer
    result?: XiDachResult
    peekedCards: Set<number>  // local peek state
    onCardClick: (index: number) => void
}

function Seat({
    name, cards, isMe, isDealer, isDealerSeat, isCurrentTurn,
    status, score, canSeeCards, revealedCards, result, peekedCards, onCardClick,
}: SeatProps) {
    const RESULT_MAP: Record<XiDachResult, { icon: React.ReactNode; text: string; bg: string }> = {
        win: { icon: <Trophy className="w-3 h-3" />, text: 'Thắng', bg: 'bg-green-500' },
        lose: { icon: <Frown className="w-3 h-3" />, text: 'Thua', bg: 'bg-red-500' },
        draw: { icon: <Equal className="w-3 h-3" />, text: 'Hòa', bg: 'bg-yellow-500' },
    }

    // For each card, determine if it's face up
    const isCardVisible = (idx: number) => {
        if (canSeeCards) return true            // result phase
        if (revealedCards.includes(idx)) return true // dealer permanently revealed
        if (isMe && peekedCards.has(idx)) return true // I'm peeking
        return false
    }

    // Should we show score? Only if ALL cards are visible to the viewer
    const allVisible = cards.every((_, i) => isCardVisible(i))

    return (
        <div className="flex flex-col items-center gap-1.5">
            {/* Name badge */}
            <div className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${isCurrentTurn ? 'bg-yellow-400 text-yellow-900' : 'bg-black/40 text-white/80'
                }`}>
                {isDealerSeat && <Crown className="w-3 h-3 text-yellow-400" />}
                {isCurrentTurn && !isDealerSeat && <Target className="w-3 h-3" />}
                {allVisible && status === 'stand' && !isCurrentTurn && <Hand className="w-3 h-3 opacity-60" />}
                {allVisible && status === 'bust' && <XCircle className="w-3 h-3 text-red-400" />}
                <span>{name}</span>
                {allVisible && cards.length > 0 && (
                    <span className={`font-black ${status === 'bust' ? 'text-red-400' : ''}`}>
                        · {score}
                    </span>
                )}
            </div>

            {/* Ngũ Linh badge */}
            {allVisible && isNguLinh(cards) && (
                <div className="px-2 py-0.5 rounded-full text-[10px] font-black text-yellow-900 bg-yellow-400">
                    NGŨ LINH
                </div>
            )}

            {/* Cards */}
            <div className="flex gap-1">
                {cards.map((c, i) => (
                    <InteractiveCard
                        key={i}
                        card={c}
                        index={i}
                        faceDown={!isCardVisible(i)}
                        dealerRevealed={revealedCards.includes(i)}
                        onClick={() => onCardClick(i)}
                    />
                ))}
            </div>

            {/* Peek hint for own cards */}
            {isMe && cards.length > 0 && !canSeeCards && (
                <span className="text-[9px] text-white/30">Nhấn vào lá bài để xem</span>
            )}

            {/* Result */}
            {result && allVisible && (
                <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white flex items-center gap-1 ${RESULT_MAP[result].bg}`}>
                    {RESULT_MAP[result].icon} {RESULT_MAP[result].text}
                </div>
            )}
        </div>
    )
}

/* ─── Main Room ─── */
export function XiDachRoom({ roomId }: XiDachRoomProps) {
    const [playerId, setPlayerId] = useState('')
    const [playerName, setPlayerName] = useState('')
    const [isMuted, setIsMuted] = useState(false)
    // Local peek state: { [playerId]: Set<cardIndex> }
    const [peekedMap, setPeekedMap] = useState<Record<string, Set<number>>>({})

    useEffect(() => {
        let id = localStorage.getItem('loto_player_id')
        if (!id) {
            id = Math.random().toString(36).substring(7)
            localStorage.setItem('loto_player_id', id)
        }
        setPlayerId(id)
        // Load saved name
        const savedName = localStorage.getItem('loto_player_name') || ''
        setPlayerName(savedName)
    }, [])

    const {
        game, isConnected, isDealer, isMyTurn, myHand, phase,
        joinGame, startGame, hit, stand, dealerHit, dealerStand, revealAll, revealPlayer, newRound,
    } = useXiDach(roomId, playerId)

    const copyRoomLink = () => {
        navigator.clipboard.writeText(window.location.href)
        alert('Đã copy link phòng!')
    }

    // Toggle peek on my own card (local only)
    const togglePeek = useCallback((cardIndex: number) => {
        setPeekedMap((prev) => {
            const myPeeks = new Set(prev[playerId] ?? [])
            if (myPeeks.has(cardIndex)) {
                myPeeks.delete(cardIndex)
            } else {
                myPeeks.add(cardIndex)
            }
            return { ...prev, [playerId]: myPeeks }
        })
    }, [playerId])

    // Dealer clicks opponent card → nothing (dealer uses Lật button per player)
    // Player clicks own card → peek toggle
    const getCardClickHandler = useCallback((seatId: string, isMe: boolean, revealedCards: number[]) => {
        return (cardIndex: number) => {
            if (isMe) {
                // If dealer already revealed this card, can't toggle
                if (revealedCards.includes(cardIndex)) return
                togglePeek(cardIndex)
            }
            // Dealer/others clicking opponent cards: nothing (use button)
        }
    }, [togglePeek])

    // ─── Loading ──────────────────────────────────────────
    if (!isConnected) {
        return (
            <div className="flex h-screen items-center justify-center bg-gradient-to-br from-emerald-950 to-slate-900">
                <Gamepad2 className="w-12 h-12 text-emerald-400 animate-bounce" />
            </div>
        )
    }

    // ─── Lobby ────────────────────────────────────────────
    const MAX_PLAYERS = 9
    if (!game || phase === 'waiting') {
        const playerCount = game ? Object.keys(game.players).length : 0
        const hasJoined = game ? !!game.players[playerId] : false
        const isFull = playerCount >= MAX_PLAYERS

        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-950 to-slate-900 flex flex-col">
                <header className="bg-black/30 border-b border-white/10">
                    <div className="container mx-auto px-4 h-14 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <a href="/" className="text-white/60 hover:text-white transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </a>
                            <span className="font-bold text-lg text-white flex items-center gap-2">
                                <Gamepad2 className="w-5 h-5 text-emerald-400" /> Xì Dách
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-emerald-300 font-mono bg-white/10 px-2 py-1 rounded">{roomId}</span>
                            <Button variant="ghost" size="icon" onClick={copyRoomLink} className="text-white w-8 h-8">
                                <Copy className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </header>
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="w-full max-w-sm text-center space-y-5">
                        <Gamepad2 className="w-16 h-16 text-emerald-400 mx-auto" />
                        <h1 className="text-3xl font-black text-white">Xì Dách Online</h1>
                        <p className="text-emerald-300 text-sm">{isDealer ? 'Bạn là Cái (Dealer)' : 'Phòng chờ'}</p>
                        <div className="bg-white/5 rounded-xl p-4 space-y-3 border border-white/10">
                            <div className="flex items-center justify-center gap-2 text-white text-sm">
                                <Users className="w-4 h-4 text-emerald-400" />
                                Người chơi: <strong className="text-emerald-300">{playerCount}/{MAX_PLAYERS}</strong>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-1.5">
                                <div className="bg-emerald-400 h-1.5 rounded-full transition-all" style={{ width: `${(playerCount / MAX_PLAYERS) * 100}%` }} />
                            </div>
                            {!isDealer && !hasJoined && !isFull && (
                                <div className="space-y-2">
                                    <input
                                        type="text"
                                        value={playerName}
                                        onChange={(e) => setPlayerName(e.target.value)}
                                        placeholder="Nhập tên của bạn..."
                                        className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-emerald-400"
                                        maxLength={12}
                                    />
                                    <Button
                                        onClick={() => {
                                            const name = playerName.trim() || playerId.slice(0, 5).toUpperCase()
                                            localStorage.setItem('loto_player_name', name)
                                            joinGame(name)
                                        }}
                                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-5"
                                    >
                                        Tham gia chơi
                                    </Button>
                                </div>
                            )}
                            {!isDealer && !hasJoined && isFull && (
                                <p className="text-red-400 text-sm font-semibold">Phòng đã đầy!</p>
                            )}
                            {!isDealer && hasJoined && (
                                <div className="flex items-center justify-center gap-2 text-emerald-300 text-sm animate-pulse">
                                    <Clock className="w-4 h-4" /> Chờ Cái chia bài...
                                </div>
                            )}
                            {isDealer && (
                                <Button onClick={startGame} disabled={playerCount === 0}
                                    className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold py-5">
                                    CHIA BÀI ({playerCount} người)
                                </Button>
                            )}
                        </div>
                        <p className="text-white/40 text-xs">Tối đa {MAX_PLAYERS} người chơi + 1 Cái · Gửi link cho bạn bè</p>
                    </div>
                </div>
            </div>
        )
    }

    // ─── Build seats ─────────────────────────────────────
    const isResult = phase === 'result'
    const isDealerDone = phase === 'dealer_done'
    const playerIds = Object.keys(game.players)

    interface OtherSeatData {
        id: string
        name: string
        cards: CardStr[]
        isDealerSeat: boolean
        isCurrentTurn: boolean
        status: string
        score: number
        result?: XiDachResult
        revealedCards: number[]
    }

    const others: OtherSeatData[] = []

    // Dealer seat (if I'm not the dealer)
    if (!isDealer) {
        others.push({
            id: game.dealer_id,
            name: 'Cái',
            cards: game.dealer_cards,
            isDealerSeat: true,
            isCurrentTurn: phase === 'dealer_turn',
            status: game.dealer_status,
            score: calculateScore(game.dealer_cards),
            revealedCards: [],
        })
    }

    // Other players
    for (const pid of playerIds) {
        if (pid === playerId) continue
        const p = game.players[pid]
        others.push({
            id: pid,
            name: p.name || pid.slice(0, 5).toUpperCase(),
            cards: p.cards,
            isDealerSeat: false,
            isCurrentTurn: game.current_turn === pid,
            status: p.status,
            score: p.score,
            result: isResult ? (game.results[pid] as XiDachResult) : undefined,
            revealedCards: p.revealed_cards ?? [],
        })
    }

    // My seat data
    const myCards = isDealer ? game.dealer_cards : (myHand?.cards ?? [])
    const myScore = calculateScore(myCards)
    const myStatus = isDealer ? game.dealer_status : (myHand?.status ?? 'playing')
    const myResult = isResult && !isDealer ? (game.results[playerId] as XiDachResult) : undefined
    const myRevealedCards = !isDealer ? (myHand?.revealed_cards ?? []) : []

    const showHitStand = isDealer
        ? (phase === 'dealer_turn' && game.dealer_status !== 'bust')
        : (isMyTurn && phase === 'player_turns' && (myHand?.status === 'playing' || myHand?.status === 'bust'))

    const phaseText =
        phase === 'player_turns' ? 'Lượt người chơi'
            : phase === 'dealer_turn' ? 'Lượt Cái'
                : phase === 'dealer_done' ? 'Chờ lật bài'
                    : phase === 'result' ? 'Kết quả'
                        : ''

    // Render a seat with optional dealer reveal button
    const isPlayerFullyRevealed = (o: OtherSeatData) =>
        o.cards.length > 0 && o.revealedCards.length >= o.cards.length

    const renderSeat = (o: OtherSeatData) => (
        <div key={o.id} className="flex flex-col items-center gap-1.5">
            <Seat
                seatId={o.id}
                name={o.name}
                cards={o.cards}
                isMe={false}
                isDealer={isDealer}
                isDealerSeat={o.isDealerSeat}
                isCurrentTurn={o.isCurrentTurn}
                status={o.status}
                score={o.score}
                canSeeCards={isResult}
                revealedCards={o.revealedCards}
                result={o.result}
                peekedCards={new Set()}
                onCardClick={getCardClickHandler(o.id, false, o.revealedCards)}
            />
            {/* Per-player reveal button for dealer (only when player is done) */}
            {isDealer && !o.isDealerSeat && !isPlayerFullyRevealed(o) && o.cards.length > 0 && (o.status === 'stand' || o.status === 'bust') && (
                <button
                    onClick={() => revealPlayer(o.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/15 text-white/80 hover:bg-white/25 transition-colors"
                >
                    <Eye className="w-3 h-3" /> Lật bài
                </button>
            )}
        </div>
    )

    return (
        <div className="h-dvh flex flex-col bg-gradient-to-br from-emerald-950 to-slate-900 overflow-hidden">
            {/* Header */}
            <header className="flex-shrink-0 bg-black/40 border-b border-white/10">
                <div className="px-3 h-11 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                        <a href="/" className="text-white/60 hover:text-white transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                        </a>
                        <span className="font-bold text-sm text-white flex items-center gap-1.5">
                            <Gamepad2 className="w-4 h-4 text-emerald-400" /> Xì Dách
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 bg-white/10 text-white/60 text-[10px] px-2 py-0.5 rounded-full">
                            <CircleDot className="w-3 h-3" /> {phaseText}
                        </span>
                        <span className="text-[10px] text-emerald-300 font-mono bg-white/10 px-1.5 py-0.5 rounded">{roomId}</span>
                        <Button variant="ghost" size="icon" onClick={copyRoomLink} className="text-white w-7 h-7">
                            <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)} className="text-white w-7 h-7">
                            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        </Button>
                    </div>
                </div>
            </header>

            {/* Table */}
            <div className="flex-1 relative">
                <div className="absolute inset-2 sm:inset-4 rounded-[2rem] bg-gradient-to-br from-emerald-800 to-emerald-900 border-[3px] border-emerald-700/60 shadow-2xl shadow-black/40" />

                <div className="relative z-10 h-full flex flex-col px-6 sm:px-10">
                    {/* Top row */}
                    {others.length > 0 && (
                        <div className={`flex-shrink-0 pt-6 sm:pt-8 flex justify-center ${others.length === 1 ? '' : 'gap-4 sm:gap-8'
                            }`}>
                            {others.length <= 2 ? (
                                others.map(renderSeat)
                            ) : (
                                renderSeat(others[0])
                            )}
                        </div>
                    )}

                    {/* Middle row */}
                    <div className="flex-1 flex items-center justify-between">
                        <div className="flex flex-col gap-4">
                            {others.length >= 3 && renderSeat(others[1])}
                            {others.length >= 5 && renderSeat(others[3])}
                        </div>

                        <div className="flex flex-col items-center gap-2">
                            {isDealerDone && isDealer && (
                                <Button onClick={revealAll} className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold gap-2 shadow-xl">
                                    <Eye className="w-4 h-4" /> Lật tất cả
                                </Button>
                            )}
                            {isResult && isDealer && (
                                <Button onClick={newRound} className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold gap-2 shadow-xl">
                                    <RefreshCw className="w-4 h-4" /> Ván mới
                                </Button>
                            )}
                        </div>

                        <div className="flex flex-col gap-4">
                            {others.length >= 4 && renderSeat(others[2])}
                            {others.length >= 6 && renderSeat(others[4])}
                        </div>
                    </div>

                    {/* Bottom: My seat */}
                    <div className="flex-shrink-0 pb-6 sm:pb-8">
                        <div className="flex flex-col items-center gap-2">
                            <Seat
                                seatId={playerId}
                                name={isDealer ? 'Cái (Bạn)' : `${myHand?.name || playerName || 'Bạn'}`}
                                cards={myCards}
                                isMe
                                isDealer={isDealer}
                                isDealerSeat={isDealer}
                                isCurrentTurn={isDealer ? phase === 'dealer_turn' : isMyTurn}
                                status={myStatus}
                                score={myScore}
                                canSeeCards={isResult}
                                revealedCards={myRevealedCards}
                                result={myResult}
                                peekedCards={peekedMap[playerId] ?? new Set()}
                                onCardClick={getCardClickHandler(playerId, true, myRevealedCards)}
                            />

                            {/* Hit / Stand */}
                            {showHitStand && (
                                <div className="flex gap-3">
                                    {myStatus !== 'bust' && (
                                        <Button onClick={isDealer ? dealerHit : hit} size="sm"
                                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-8 shadow-lg">
                                            Kéo
                                        </Button>
                                    )}
                                    <Button onClick={isDealer ? dealerStand : stand} size="sm"
                                        className="bg-slate-500 hover:bg-slate-600 text-white font-bold px-8 shadow-lg">
                                        Dừng
                                    </Button>
                                </div>
                            )}

                            {/* Dealer reveal all */}
                            {isDealerDone && isDealer && (
                                <Button onClick={revealAll}
                                    className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold gap-2 shadow-xl">
                                    <Eye className="w-4 h-4" /> Lật tất cả
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
