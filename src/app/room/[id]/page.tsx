'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { RoomView } from '@/components/game/RoomView'
import { XiDachRoom } from '@/components/xidach/XiDachRoom'
import { Gamepad2, AlertCircle, ArrowLeft } from 'lucide-react'
import type { GameType } from '@/types/game'

interface PageProps {
    params: Promise<{ id: string }>
}

export default function RoomPage({ params }: PageProps) {
    const { id } = use(params)
    const router = useRouter()
    const [gameType, setGameType] = useState<GameType | null>(null)
    const [error, setError] = useState(false)

    useEffect(() => {
        supabase
            .from('rooms')
            .select('game_type')
            .eq('id', id)
            .single()
            .then(({ data, error: err }) => {
                if (err || !data) {
                    setError(true)
                    return
                }
                setGameType((data.game_type as GameType) || 'loto')
            })
    }, [id])

    if (error) {
        return (
            <div className="min-h-dvh bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
                        <AlertCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white mb-1">Không tìm thấy phòng</h2>
                        <p className="text-white/40 text-sm">Phòng này không tồn tại hoặc đã bị xóa</p>
                    </div>
                    <button
                        onClick={() => router.push('/')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white text-sm font-semibold hover:bg-white/15 transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" /> Về trang chủ
                    </button>
                </div>
            </div>
        )
    }

    if (!gameType) {
        return (
            <div className="min-h-dvh bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
                <div className="text-center space-y-3">
                    <Gamepad2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                    <p className="text-white/50 font-semibold text-sm">Đang tải phòng...</p>
                </div>
            </div>
        )
    }

    if (gameType === 'xidach') {
        return <XiDachRoom roomId={id} />
    }

    return <RoomView roomId={id} />
}
