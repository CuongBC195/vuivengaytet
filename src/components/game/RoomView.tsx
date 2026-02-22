'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useGame } from '@/hooks/use-game'
import { LotoTicketCard } from '@/components/game/LotoTicketCard'
import { TicketSelector } from '@/components/game/TicketSelector'
import { ControlPanel } from '@/components/game/ControlPanel'
import { HistoryList } from '@/components/game/HistoryList'
import { Button } from '@/components/ui/button'
import { Copy, Volume2, VolumeX, ChevronLeft, ChevronRight, Dice5, ArrowLeft } from 'lucide-react'
import type { LotoTicket } from '@/lib/ticket-data'

interface RoomViewProps {
    roomId: string
}

function countBingoRows(tickets: LotoTicket[], marked: Set<number>): number {
    let count = 0
    for (const ticket of tickets) {
        for (const strip of ticket.strips) {
            for (const row of strip) {
                const nums = row.filter((c): c is number => c !== null)
                if (nums.length === 5 && nums.every((n) => marked.has(n))) count++
            }
        }
    }
    return count
}

export function RoomView({ roomId }: RoomViewProps) {
    const [playerId, setPlayerId] = useState('')
    const [selectedTickets, setSelectedTickets] = useState<LotoTicket[] | null>(null)
    const [markedNumbers, setMarkedNumbers] = useState<Set<number>>(new Set())
    const [showBingo, setShowBingo] = useState(false)
    const [lastBingoCount, setLastBingoCount] = useState(0)
    const [activeTab, setActiveTab] = useState(0)

    // Swipe handling
    const touchStartX = useRef(0)
    const touchEndX = useRef(0)

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX
    }
    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.touches[0].clientX
    }
    const handleTouchEnd = () => {
        const diff = touchStartX.current - touchEndX.current
        const threshold = 60
        if (selectedTickets && selectedTickets.length > 1) {
            if (diff > threshold && activeTab < selectedTickets.length - 1) {
                setActiveTab((t) => t + 1)
            } else if (diff < -threshold && activeTab > 0) {
                setActiveTab((t) => t - 1)
            }
        }
    }

    useEffect(() => {
        let id = localStorage.getItem('loto_player_id')
        if (!id) {
            id = Math.random().toString(36).substring(7)
            localStorage.setItem('loto_player_id', id)
        }
        setPlayerId(id)
    }, [])

    const {
        room,
        isConnected,
        isHost,
        drawNumber,
        resetGame,
        isMuted,
        toggleMute,
    } = useGame(roomId, playerId)

    const handleMark = useCallback((num: number) => {
        setMarkedNumbers((prev) => {
            const next = new Set(prev)
            if (next.has(num)) next.delete(num)
            else next.add(num)
            return next
        })
    }, [])

    const bingoCount = useMemo(() => {
        if (!selectedTickets) return 0
        return countBingoRows(selectedTickets, markedNumbers)
    }, [selectedTickets, markedNumbers])

    useEffect(() => {
        if (bingoCount > lastBingoCount) {
            setShowBingo(true)
            setLastBingoCount(bingoCount)
            const timer = setTimeout(() => setShowBingo(false), 4000)
            return () => clearTimeout(timer)
        }
    }, [bingoCount, lastBingoCount])

    // Auto-clear on room reset
    useEffect(() => {
        if (room && room.current_numbers.length === 0 && room.status === 'waiting') {
            setMarkedNumbers(new Set())
            setLastBingoCount(0)
        }
    }, [room])

    if (!isConnected || !room) {
        return (
            <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
                <div className="text-center space-y-3">
                    <Dice5 className="w-12 h-12 text-amber-400 mx-auto animate-bounce" />
                    <p className="text-white/50 font-semibold text-sm">Đang kết nối vào phòng...</p>
                </div>
            </div>
        )
    }

    if (!selectedTickets) {
        return <TicketSelector onConfirm={(tickets) => setSelectedTickets(tickets)} />
    }

    const currentNumber =
        room.current_numbers.length > 0
            ? room.current_numbers[room.current_numbers.length - 1]
            : null

    const copyRoomLink = () => {
        navigator.clipboard.writeText(window.location.href)
        alert('Đã copy link phòng!')
    }

    const handleReset = () => {
        resetGame()
        setMarkedNumbers(new Set())
        setLastBingoCount(0)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-32">
            {/* BINGO Overlay */}
            {showBingo && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
                    onClick={() => setShowBingo(false)}
                >
                    <div className="text-center animate-bounce">
                        <div className="text-8xl sm:text-9xl font-black text-yellow-400 drop-shadow-2xl">
                            BINGO!
                        </div>
                        <div className="text-2xl text-white mt-4 font-bold">
                            {bingoCount} hàng đã đủ!
                        </div>
                        <p className="text-white/70 mt-2 text-sm">Nhấn để đóng</p>
                    </div>
                </div>
            )}

            {/* Header with Number Ball */}
            <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm shadow-sm border-b">
                <div className="container mx-auto px-3 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0 shrink">
                        <a href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </a>
                        <Dice5 className="w-5 h-5 text-amber-500" />
                        <span className="font-bold text-sm sm:text-lg text-primary whitespace-nowrap">LÔ TÔ</span>
                        <span className="text-[10px] sm:text-xs text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                            {roomId}
                        </span>
                    </div>

                    <div className="flex-shrink-0">
                        <div
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-xl border-4 border-white"
                            style={{
                                background: currentNumber
                                    ? 'linear-gradient(135deg, #FACC15, #F97316)'
                                    : 'linear-gradient(135deg, #94A3B8, #64748B)',
                            }}
                        >
                            <span className="text-3xl sm:text-5xl font-black text-white drop-shadow-md">
                                {currentNumber ?? '—'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 shrink">
                        <Button variant="ghost" size="icon" onClick={copyRoomLink} className="w-8 h-8">
                            <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={toggleMute} className="w-8 h-8">
                            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-3 sm:px-4 py-4 space-y-4 max-w-2xl">
                {room.status === 'finished' && (
                    <div className="text-center text-2xl font-bold text-red-500 animate-bounce">
                        🎉 ĐÃ HẾT SỐ!
                    </div>
                )}

                {/* Ticket Tabs + BINGO badge */}
                <div className="flex items-center justify-between">
                    <h2 className="text-base sm:text-lg font-bold text-slate-700">🎫 Vé của bạn</h2>
                    {bingoCount > 0 && (
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs sm:text-sm font-bold animate-pulse">
                            BINGO × {bingoCount}
                        </span>
                    )}
                </div>

                {/* Tab Selector */}
                {selectedTickets.length > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        <button
                            onClick={() => setActiveTab(0)}
                            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${activeTab === 0
                                ? 'bg-primary text-white shadow-md'
                                : 'bg-slate-200 text-slate-600'
                                }`}
                        >
                            Vé 1
                        </button>
                        <button
                            onClick={() => setActiveTab(1)}
                            className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${activeTab === 1
                                ? 'bg-primary text-white shadow-md'
                                : 'bg-slate-200 text-slate-600'
                                }`}
                        >
                            Vé 2
                        </button>
                    </div>
                )}

                {/* Swipeable Ticket Area */}
                <div
                    className="overflow-hidden touch-pan-y"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div
                        className="flex transition-transform duration-300 ease-out"
                        style={{ transform: `translateX(-${activeTab * 100}%)` }}
                    >
                        {selectedTickets.map((ticket) => (
                            <div key={ticket.id} className="w-full flex-shrink-0 px-1">
                                <LotoTicketCard
                                    ticket={ticket}
                                    markedNumbers={markedNumbers}
                                    onMark={handleMark}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Swipe hint dots */}
                {selectedTickets.length > 1 && (
                    <div className="flex justify-center gap-2">
                        {selectedTickets.map((_, i) => (
                            <div
                                key={i}
                                className={`w-2.5 h-2.5 rounded-full transition-all ${i === activeTab ? 'bg-primary scale-110' : 'bg-slate-300'
                                    }`}
                            />
                        ))}
                        <span className="text-[10px] text-slate-400 ml-2">← vuốt →</span>
                    </div>
                )}

                {/* Nav arrows for desktop */}
                {selectedTickets.length > 1 && (
                    <div className="hidden sm:flex justify-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveTab(0)}
                            disabled={activeTab === 0}
                            className="gap-1"
                        >
                            <ChevronLeft className="w-4 h-4" /> Vé 1
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveTab(1)}
                            disabled={activeTab === 1}
                            className="gap-1"
                        >
                            Vé 2 <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                )}

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        setSelectedTickets(null)
                        setMarkedNumbers(new Set())
                        setLastBingoCount(0)
                        setActiveTab(0)
                    }}
                    className="text-xs"
                >
                    Đổi vé khác
                </Button>

                {/* History */}
                <HistoryList numbers={room.current_numbers} />

                <div className="text-center text-xs sm:text-sm text-slate-500">
                    {isHost ? '🎤 Bạn là Host (MC)' : 'Đang chờ Host quay số...'}
                    {' · '}
                    Đã quay: {room.current_numbers.length}/90
                </div>
            </main>

            <ControlPanel
                onDraw={drawNumber}
                onReset={handleReset}
                canDraw={room.status !== 'finished'}
                isMuted={isMuted}
                toggleMute={toggleMute}
                isHost={isHost}
            />
        </div>
    )
}
