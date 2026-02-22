import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { createDeck, calculateScore, isBust, isNguLinh, compareHands } from '@/lib/xidach-logic'
import type { XiDachGame, XiDachPlayerState, XiDachPhase, CardStr } from '@/types/game'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export function useXiDach(roomId: string, playerId: string) {
    const [game, setGame] = useState<XiDachGame | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const gameRef = useRef<XiDachGame | null>(null)

    useEffect(() => {
        gameRef.current = game
    }, [game])

    // Fetch & subscribe + Presence
    useEffect(() => {
        if (!roomId || !playerId) return

        const fetchGame = async () => {
            const { data } = await supabase
                .from('xidach_games')
                .select('*')
                .eq('id', roomId)
                .single()

            if (data) {
                setGame(data as XiDachGame)
                gameRef.current = data as XiDachGame
                setIsConnected(true)
            } else {
                setIsConnected(true) // connected but no game yet
            }
        }
        fetchGame()

        const channel = supabase
            .channel(`xidach:${roomId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'xidach_games',
                    filter: `id=eq.${roomId}`,
                },
                (payload: RealtimePostgresChangesPayload<XiDachGame>) => {
                    if (payload.eventType === 'DELETE') {
                        setGame(null)
                    } else {
                        const newGame = payload.new as XiDachGame
                        setGame(newGame)
                        gameRef.current = newGame
                    }
                },
            )
            .on('presence', { event: 'leave' }, async ({ leftPresences }) => {
                const currentGame = gameRef.current
                if (!currentGame) return

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const leftIds = leftPresences.map((p: any) => p.player_id as string)

                // Check how many remain
                const presenceState = channel.presenceState()
                const remaining = new Set<string>()
                for (const key of Object.keys(presenceState)) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    for (const p of presenceState[key] as any[]) {
                        if (!leftIds.includes(p.player_id)) {
                            remaining.add(p.player_id)
                        }
                    }
                }

                // If nobody remains, delete the room
                if (remaining.size === 0) {
                    await supabase.from('xidach_games').delete().eq('id', roomId)
                    await supabase.from('rooms').delete().eq('id', roomId)
                    return
                }

                // If dealer left, transfer to first remaining player
                if (leftIds.includes(currentGame.dealer_id)) {
                    const playerIds = Object.keys(currentGame.players)
                    const newDealer = playerIds.find((pid) => remaining.has(pid)) || [...remaining][0]
                    if (newDealer) {
                        // Remove new dealer from players (they become the dealer)
                        const players = { ...currentGame.players }
                        delete players[newDealer]

                        await supabase
                            .from('xidach_games')
                            .update({
                                dealer_id: newDealer,
                                players,
                                phase: 'waiting',
                                dealer_cards: [],
                                dealer_status: 'waiting',
                                current_turn: null,
                                deck: [],
                                results: {},
                            })
                            .eq('id', roomId)

                        // Also update room host
                        await supabase
                            .from('rooms')
                            .update({ host_id: newDealer })
                            .eq('id', roomId)
                    }
                }
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({ player_id: playerId })
                }
            })

        return () => {
            channel.untrack()
            supabase.removeChannel(channel)
        }
    }, [roomId, playerId])

    const isDealer = game?.dealer_id === playerId
    const isMyTurn = game?.current_turn === playerId
    const myHand = game?.players?.[playerId] ?? null
    const phase = game?.phase ?? 'waiting'

    // ─── Join as player ────────────────────────────────────
    const joinGame = useCallback(async (playerName?: string) => {
        if (!game) return
        const players = { ...game.players }
        if (players[playerId]) return // already joined
        if (Object.keys(players).length >= 9) return // max 9 players

        players[playerId] = { cards: [], status: 'playing', score: 0, name: playerName || playerId.slice(0, 5).toUpperCase() }
        await supabase
            .from('xidach_games')
            .update({ players })
            .eq('id', roomId)
    }, [game, playerId, roomId])

    // ─── Start game (dealer only) ─────────────────────────
    const startGame = useCallback(async () => {
        if (!game || !isDealer) return

        const deck = createDeck()
        const playerIds = Object.keys(game.players)
        if (playerIds.length === 0) return

        const players: Record<string, XiDachPlayerState> = {}
        let deckIdx = 0

        // Deal 2 cards to each player
        for (const pid of playerIds) {
            const cards = [deck[deckIdx++], deck[deckIdx++]]
            const score = calculateScore(cards)
            players[pid] = { cards, status: 'playing', score, name: game.players[pid]?.name }
        }

        // Deal 2 cards to dealer
        const dealerCards = [deck[deckIdx++], deck[deckIdx++]]
        const remainingDeck = deck.slice(deckIdx)

        // First player's turn
        const firstPlayer = playerIds[0]

        await supabase
            .from('xidach_games')
            .update({
                deck: remainingDeck,
                players,
                dealer_cards: dealerCards,
                dealer_status: 'waiting',
                current_turn: firstPlayer,
                phase: 'player_turns',
                results: {},
            })
            .eq('id', roomId)
    }, [game, isDealer, roomId])

    // ─── Hit (player draws a card) ────────────────────────
    const hit = useCallback(async () => {
        if (!game || !isMyTurn || phase !== 'player_turns') return
        const myState = game.players[playerId]
        if (!myState || myState.status !== 'playing') return

        const deck = [...game.deck]
        if (deck.length === 0) return

        const newCard = deck.shift()!
        const player = { ...myState }
        player.cards = [...player.cards, newCard]
        player.score = calculateScore(player.cards)

        // Bust: mark internally but DON'T auto-advance (player clicks Dừng)
        if (isBust(player.score)) {
            player.status = 'bust'
        }

        // Ngũ Linh: 5 cards ≤21 → auto stand & advance
        if (isNguLinh(player.cards)) {
            player.status = 'stand'
        }

        const players = { ...game.players, [playerId]: player }

        // Only auto-advance on Ngũ Linh (not bust)
        let currentTurn = game.current_turn
        let newPhase = game.phase
        if (isNguLinh(player.cards)) {
            const result = advanceTurn(players, playerId, game)
            currentTurn = result.currentTurn
            newPhase = result.phase
        }

        await supabase
            .from('xidach_games')
            .update({ deck, players, current_turn: currentTurn, phase: newPhase })
            .eq('id', roomId)
    }, [game, isMyTurn, phase, playerId, roomId])

    // ─── Stand (player stops — works even when busted) ─────
    const stand = useCallback(async () => {
        if (!game || !isMyTurn || phase !== 'player_turns') return

        const player = { ...game.players[playerId] }
        if (player.status === 'playing') player.status = 'stand'
        // If already 'bust', keep bust status
        const players = { ...game.players, [playerId]: player }

        const result = advanceTurn(players, playerId, game)

        await supabase
            .from('xidach_games')
            .update({
                players,
                current_turn: result.currentTurn,
                phase: result.phase,
            })
            .eq('id', roomId)
    }, [game, isMyTurn, phase, playerId, roomId])

    // ─── Dealer Hit ───────────────────────────────────────
    const dealerHit = useCallback(async () => {
        if (!game || !isDealer || phase !== 'dealer_turn') return

        const deck = [...game.deck]
        if (deck.length === 0) return

        const newCard = deck.shift()!
        const dealerCards = [...game.dealer_cards, newCard]
        const dealerScore = calculateScore(dealerCards)
        let dealerStatus = game.dealer_status

        if (isBust(dealerScore)) {
            dealerStatus = 'bust'
            await supabase
                .from('xidach_games')
                .update({ deck, dealer_cards: dealerCards, dealer_status: dealerStatus, phase: 'dealer_done' })
                .eq('id', roomId)
            return
        }

        // Ngũ Linh: 5 cards ≤ 21 → auto done
        if (isNguLinh(dealerCards)) {
            await supabase
                .from('xidach_games')
                .update({ deck, dealer_cards: dealerCards, dealer_status: 'stand', phase: 'dealer_done' })
                .eq('id', roomId)
            return
        }

        await supabase
            .from('xidach_games')
            .update({ deck, dealer_cards: dealerCards, dealer_status: 'playing' })
            .eq('id', roomId)
    }, [game, isDealer, phase, roomId])

    // ─── Dealer Stand ─────────────────────────────────────
    const dealerStand = useCallback(async () => {
        if (!game || !isDealer || phase !== 'dealer_turn') return

        await supabase
            .from('xidach_games')
            .update({
                dealer_status: 'stand',
                phase: 'dealer_done',
            })
            .eq('id', roomId)
    }, [game, isDealer, phase, roomId])

    // ─── Reveal All (dealer flips all cards) ─────────────
    const revealAll = useCallback(async () => {
        if (!game || !isDealer || phase !== 'dealer_done') return

        // Mark all cards of all players as revealed
        const players = { ...game.players }
        for (const pid of Object.keys(players)) {
            const p = players[pid]
            players[pid] = {
                ...p,
                revealed_cards: p.cards.map((_, i) => i),
            }
        }

        const dealerScore = calculateScore(game.dealer_cards)
        const dealerBust = dealerScore > 21
        const dealerNL = isNguLinh(game.dealer_cards)
        const results = resolveGame(game.players, dealerScore, dealerBust, dealerNL, game.dealer_cards)

        await supabase
            .from('xidach_games')
            .update({ players, phase: 'result', results })
            .eq('id', roomId)
    }, [game, isDealer, phase, roomId])

    // ─── Reveal all cards of a single player (dealer can do anytime) ───
    const revealPlayer = useCallback(async (targetPid: string) => {
        if (!game || !isDealer) return

        const players = { ...game.players }
        if (!players[targetPid]) return

        players[targetPid] = {
            ...players[targetPid],
            revealed_cards: players[targetPid].cards.map((_, i) => i),
        }

        await supabase
            .from('xidach_games')
            .update({ players })
            .eq('id', roomId)
    }, [game, isDealer, roomId])

    // ─── New Round (dealer only) ──────────────────────────
    const newRound = useCallback(async () => {
        if (!game || !isDealer) return

        const players: Record<string, XiDachPlayerState> = {}
        for (const pid of Object.keys(game.players)) {
            players[pid] = { cards: [], status: 'playing', score: 0, name: game.players[pid]?.name }
        }

        await supabase
            .from('xidach_games')
            .update({
                deck: [],
                players,
                dealer_cards: [],
                dealer_status: 'waiting',
                current_turn: null,
                phase: 'waiting',
                results: {},
            })
            .eq('id', roomId)
    }, [game, isDealer, roomId])

    return {
        game,
        isConnected,
        isDealer,
        isMyTurn,
        myHand,
        phase,
        joinGame,
        startGame,
        hit,
        stand,
        dealerHit,
        dealerStand,
        revealAll,
        revealPlayer,
        newRound,
    }
}

// ─── Helpers ─────────────────────────────────────────────

function advanceTurn(
    players: Record<string, XiDachPlayerState>,
    currentPlayerId: string,
    game: XiDachGame,
): { currentTurn: string | null; phase: XiDachPhase } {
    const playerIds = Object.keys(players)
    const currentIdx = playerIds.indexOf(currentPlayerId)

    // Find next player still playing
    for (let i = currentIdx + 1; i < playerIds.length; i++) {
        if (players[playerIds[i]].status === 'playing') {
            return { currentTurn: playerIds[i], phase: 'player_turns' }
        }
    }

    // All players done → dealer's turn
    return { currentTurn: game.dealer_id, phase: 'dealer_turn' }
}

function resolveGame(
    players: Record<string, XiDachPlayerState>,
    dealerScore: number,
    dealerBust: boolean,
    dealerNguLinh: boolean,
    dealerCards: string[],
): Record<string, string> {
    const results: Record<string, string> = {}
    for (const [pid, player] of Object.entries(players)) {
        const playerBust = player.status === 'bust'
        const playerNL = isNguLinh(player.cards)
        results[pid] = compareHands(player.score, dealerScore, playerBust, dealerBust, playerNL, dealerNguLinh)
    }
    return results
}
