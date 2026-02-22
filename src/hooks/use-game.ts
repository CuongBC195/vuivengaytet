import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { generateRandomNumber } from '@/lib/game-logic'
import { Room } from '@/types/game'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export function useGame(roomId: string, playerId: string) {
    const [room, setRoom] = useState<Room | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [isMuted, setIsMuted] = useState(false)
    const roomRef = useRef<Room | null>(null)

    // Keep ref in sync
    useEffect(() => {
        roomRef.current = room
    }, [room])

    const playSound = useCallback((num: number) => {
        if (isMuted) return
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel()
            const utterance = new SpeechSynthesisUtterance(`Số ${num}`)
            utterance.lang = 'vi-VN'
            utterance.rate = 0.9
            window.speechSynthesis.speak(utterance)
        }
    }, [isMuted])

    // Fetch room & subscribe to changes
    useEffect(() => {
        if (!roomId) return

        const fetchRoom = async () => {
            const { data } = await supabase
                .from('rooms')
                .select('*')
                .eq('id', roomId)
                .single()

            if (data) {
                const roomData = data as Room
                setRoom(roomData)
                roomRef.current = roomData
                setIsConnected(true)
            }
        }
        fetchRoom()

        const channel = supabase
            .channel(`room:${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'rooms',
                    filter: `id=eq.${roomId}`,
                },
                (payload: RealtimePostgresChangesPayload<Room>) => {
                    const newRoom = payload.new as Room
                    if (roomRef.current) {
                        const prevLen = roomRef.current.current_numbers.length
                        const newLen = newRoom.current_numbers.length
                        if (newLen > prevLen) {
                            const newNum = newRoom.current_numbers[newLen - 1]
                            playSound(newNum)
                        }
                    }
                    setRoom(newRoom)
                    roomRef.current = newRoom
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [roomId, playSound])

    const isHost = room?.host_id === playerId

    const drawNumber = async () => {
        if (!room || !isHost) return

        const newNum = generateRandomNumber(room.current_numbers)
        if (!newNum) return

        const newNumbers = [...room.current_numbers, newNum]

        await supabase
            .from('rooms')
            .update({
                current_numbers: newNumbers,
                status: newNumbers.length >= 90 ? 'finished' : 'playing',
            })
            .eq('id', roomId)
    }

    const resetGame = async () => {
        if (!isHost) return

        await supabase
            .from('rooms')
            .update({
                current_numbers: [],
                status: 'waiting',
            })
            .eq('id', roomId)
    }

    return {
        room,
        isConnected,
        isHost,
        drawNumber,
        resetGame,
        isMuted,
        toggleMute: () => setIsMuted((m) => !m),
    }
}
