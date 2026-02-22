'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { GameType } from '@/types/game'
import {
    Gamepad2, Sparkles, Users, ArrowRight, Dice5, Spade,
} from 'lucide-react'

const GAMES: {
    type: GameType
    name: string
    desc: string
    icon: React.ReactNode
    gradient: string
    borderGlow: string
    players: string
}[] = [
        {
            type: 'loto',
            name: 'Lô Tô',
            desc: 'Truyền thống Việt Nam',
            icon: <Dice5 className="w-10 h-10" />,
            gradient: 'from-amber-500 to-orange-600',
            borderGlow: 'group-hover:shadow-amber-500/30',
            players: '2-20',
        },
        {
            type: 'xidach',
            name: 'Xì Dách',
            desc: 'Kéo bài 21 điểm',
            icon: <Spade className="w-10 h-10" />,
            gradient: 'from-emerald-500 to-teal-600',
            borderGlow: 'group-hover:shadow-emerald-500/30',
            players: '2-10',
        },
    ]

export default function HomePage() {
    const router = useRouter()
    const [roomId, setRoomId] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [loadingGame, setLoadingGame] = useState<GameType | null>(null)

    const getPlayerId = () => {
        let id = localStorage.getItem('loto_player_id')
        if (!id) {
            id = Math.random().toString(36).substring(7)
            localStorage.setItem('loto_player_id', id)
        }
        return id
    }

    const createRoom = async (gameType: GameType) => {
        setIsLoading(true)
        setLoadingGame(gameType)
        const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase()
        const playerId = getPlayerId()

        const { error } = await supabase.from('rooms').insert({
            id: newRoomId,
            host_id: playerId,
            game_type: gameType,
            current_numbers: [],
            status: 'waiting',
        })

        if (error) {
            alert('Lỗi tạo phòng: ' + error.message)
            setIsLoading(false)
            setLoadingGame(null)
            return
        }

        if (gameType === 'xidach') {
            const { error: xdError } = await supabase.from('xidach_games').insert({
                id: newRoomId,
                dealer_id: playerId,
                deck: [],
                players: {},
                dealer_cards: [],
                dealer_status: 'waiting',
                current_turn: null,
                phase: 'waiting',
                results: {},
            })
            if (xdError) {
                alert('Lỗi tạo game: ' + xdError.message)
                setIsLoading(false)
                setLoadingGame(null)
                return
            }
        }

        router.push(`/room/${newRoomId}`)
    }

    const joinRoom = (e: React.FormEvent) => {
        e.preventDefault()
        if (roomId.trim()) {
            router.push(`/room/${roomId.toUpperCase()}`)
        }
    }

    return (
        <div className="min-h-dvh bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
            {/* Decorative bg elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-600/10 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-amber-600/10 blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-purple-600/5 blur-3xl" />
            </div>

            <div className="relative z-10 flex-1 flex flex-col">
                {/* Header */}
                <header className="flex-shrink-0 border-b border-white/5">
                    <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <Gamepad2 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg font-black text-white tracking-tight">GAME ONLINE</h1>
                                <p className="text-[10px] text-white/40 font-medium -mt-0.5 tracking-widest">CHƠI CÙNG BẠN BÈ</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-white/30 text-xs">
                            <span className="inline-flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                                <Sparkles className="w-3 h-3 text-emerald-400" />
                                <span className="text-white/50">{GAMES.length} game</span>
                            </span>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
                    <div className="w-full max-w-lg space-y-8">

                        {/* Title */}
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl sm:text-4xl font-black text-white">
                                Chọn <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">game</span>
                            </h2>
                            <p className="text-white/40 text-sm">Tạo phòng và gửi link cho bạn bè</p>
                        </div>

                        {/* Game Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {GAMES.map((g) => (
                                <button
                                    key={g.type}
                                    onClick={() => createRoom(g.type)}
                                    disabled={isLoading}
                                    className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-6 text-left transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06] hover:shadow-2xl ${g.borderGlow} active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none`}
                                >
                                    {/* Gradient accent */}
                                    <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${g.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />

                                    {/* Icon */}
                                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${g.gradient} flex items-center justify-center text-white shadow-lg mb-4`}>
                                        {g.icon}
                                    </div>

                                    <h3 className="text-xl font-black text-white mb-1">{g.name}</h3>
                                    <p className="text-white/40 text-xs mb-3">{g.desc}</p>

                                    <div className="flex items-center justify-between">
                                        <span className="inline-flex items-center gap-1 text-[11px] text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                                            <Users className="w-3 h-3" /> {g.players} người
                                        </span>
                                        <span className={`inline-flex items-center gap-1 text-xs font-bold bg-gradient-to-r ${g.gradient} bg-clip-text text-transparent group-hover:opacity-100 opacity-0 transition-opacity`}>
                                            Tạo phòng <ArrowRight className="w-3 h-3 text-white/60" />
                                        </span>
                                    </div>

                                    {/* Loading overlay */}
                                    {loadingGame === g.type && (
                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-2xl">
                                            <div className="flex items-center gap-2 text-white font-bold text-sm">
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Đang tạo phòng...
                                            </div>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Join Room */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-slate-950 px-4 text-xs text-white/30 font-medium">hoặc tham gia phòng</span>
                            </div>
                        </div>

                        <form onSubmit={joinRoom} className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Nhập ID phòng..."
                                className="flex-1 h-12 px-4 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                                value={roomId}
                                onChange={(e) => setRoomId(e.target.value)}
                            />
                            <button
                                type="submit"
                                className="h-12 px-6 rounded-xl bg-white/10 border border-white/10 text-white font-bold text-sm hover:bg-white/15 transition-all active:scale-95"
                            >
                                Vào
                            </button>
                        </form>
                    </div>
                </main>

                {/* Footer */}
                <footer className="flex-shrink-0 border-t border-white/5 py-4">
                    <p className="text-center text-white/20 text-xs">
                        Game Online Vietnam
                    </p>
                </footer>
            </div>
        </div>
    )
}
