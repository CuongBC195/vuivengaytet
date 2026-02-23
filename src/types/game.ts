export type GameType = 'loto' | 'xidach'

export interface Room {
    id: string
    host_id: string
    game_type: GameType
    status: 'waiting' | 'playing' | 'finished'
    current_numbers: number[]
    created_at: string
}

export interface Player {
    id: string
    name: string
    is_host: boolean
}

export type GameStatus = 'waiting' | 'playing' | 'finished'

// ─── Xì Dách Types ──────────────────────────────────────
export type Suit = '♠' | '♥' | '♦' | '♣'
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A'

export interface Card {
    suit: Suit
    rank: Rank
}

// Card stored as string in DB: "A♠", "10♥", etc.
export type CardStr = string

export type XiDachPlayerStatus = 'playing' | 'stand' | 'bust'
export type XiDachDealerStatus = 'waiting' | 'playing' | 'stand' | 'bust'
export type XiDachPhase = 'waiting' | 'dealing' | 'player_turns' | 'dealer_turn' | 'dealer_done' | 'result'
export type XiDachResult = 'win' | 'lose' | 'draw'

export interface CompareResult {
    outcome: XiDachResult
    multiplier: number // 1 = normal, 2 = Xì Dách, 3 = Xì Bàn
}

export interface XiDachPlayerState {
    cards: CardStr[]
    status: XiDachPlayerStatus
    score: number
    name?: string
    revealed_cards?: number[] // card indices permanently revealed by dealer
}

export interface XiDachGame {
    id: string
    deck: CardStr[]
    dealer_id: string
    players: Record<string, XiDachPlayerState>
    dealer_cards: CardStr[]
    dealer_status: XiDachDealerStatus
    current_turn: string | null
    phase: XiDachPhase
    results: Record<string, XiDachResult>
    created_at: string
}
