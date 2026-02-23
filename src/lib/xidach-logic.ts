/**
 * Xì Dách (Vietnamese Blackjack) Game Logic
 */
import type { Suit, Rank, Card, CardStr, CompareResult } from '@/types/game'

const SUITS: Suit[] = ['♠', '♥', '♦', '♣']
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']

// ─── Card Serialization ─────────────────────────────────
export function cardToStr(card: Card): CardStr {
    return `${card.rank}${card.suit}`
}

export function strToCard(s: CardStr): Card {
    // Last char is suit, rest is rank
    const suit = s.slice(-1) as Suit
    const rank = s.slice(0, -1) as Rank
    return { suit, rank }
}

export function isRedSuit(suit: Suit): boolean {
    return suit === '♥' || suit === '♦'
}

// ─── Deck ────────────────────────────────────────────────
export function createDeck(): CardStr[] {
    const deck: CardStr[] = []
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push(cardToStr({ suit, rank }))
        }
    }
    return shuffleDeck(deck)
}

export function shuffleDeck(deck: CardStr[]): CardStr[] {
    const a = [...deck]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
            ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

// ─── Scoring ─────────────────────────────────────────────
export function rankValue(rank: Rank): number[] {
    switch (rank) {
        case 'A': return [1, 10, 11]
        case 'J': case 'Q': case 'K': return [10]
        default: return [parseInt(rank)]
    }
}

/**
 * Calculate the best score for a hand.
 * Returns the highest score ≤ 21, or the lowest score if all > 21 (bust).
 */
export function calculateScore(cards: CardStr[]): number {
    const parsed = cards.map(strToCard)

    // Get all possible totals
    function expand(totals: number[], values: number[]): number[] {
        const result: number[] = []
        for (const t of totals) {
            for (const v of values) {
                result.push(t + v)
            }
        }
        return result
    }

    let possibles = [0]
    for (const card of parsed) {
        const values = rankValue(card.rank)
        possibles = expand(possibles, values)
    }

    // Remove duplicates
    const unique = [...new Set(possibles)]

    // Find best: highest ≤ 21, or lowest if all bust
    const valid = unique.filter((s) => s <= 21)
    if (valid.length > 0) return Math.max(...valid)
    return Math.min(...unique)
}

export function isBust(score: number): boolean {
    return score > 21
}

export function isBlackjack(cards: CardStr[]): boolean {
    if (cards.length !== 2) return false
    const score = calculateScore(cards)
    return score === 21
}

/**
 * Xì Dách: 2 cards = 1 Ace + 1 card worth 10 (10, J, Q, K).
 * Multiplier: x2
 */
export function isXiDach(cards: CardStr[]): boolean {
    if (cards.length !== 2) return false
    const parsed = cards.map(strToCard)
    const hasAce = parsed.some(c => c.rank === 'A')
    const hasTen = parsed.some(c => ['10', 'J', 'Q', 'K'].includes(c.rank))
    return hasAce && hasTen
}

/**
 * Xì Bàn: 2 cards = 2 Aces.
 * Multiplier: x3
 */
export function isXiBan(cards: CardStr[]): boolean {
    if (cards.length !== 2) return false
    const parsed = cards.map(strToCard)
    return parsed.every(c => c.rank === 'A')
}

/**
 * Ngũ Linh: 5 cards with total ≤ 21.
 * Beats everything except another Ngũ Linh with a lower score.
 */
export function isNguLinh(cards: CardStr[]): boolean {
    if (cards.length !== 5) return false
    return calculateScore(cards) <= 21
}

/**
 * Get the hand rank for priority comparison.
 * Higher rank = better hand.
 */
export function getHandRank(cards: CardStr[]): number {
    if (isXiBan(cards)) return 4
    if (isXiDach(cards)) return 3
    if (isNguLinh(cards)) return 2
    return 1 // normal
}

/**
 * Get the multiplier for a hand.
 */
export function getMultiplier(cards: CardStr[]): number {
    if (isXiBan(cards)) return 3
    if (isXiDach(cards)) return 2
    return 1
}

/**
 * Get the special hand label.
 */
export function getHandLabel(cards: CardStr[]): string | null {
    if (isXiBan(cards)) return 'XÌ BÀN'
    if (isXiDach(cards)) return 'XÌ DÁCH'
    if (isNguLinh(cards)) return 'NGŨ LINH'
    return null
}

// ─── Display Helpers ─────────────────────────────────────
export function cardDisplayName(s: CardStr): string {
    const card = strToCard(s)
    return `${card.rank}${card.suit}`
}

/**
 * Compare player hand vs dealer hand (Vietnamese Xì Dách rules).
 *
 * Priority:
 *   1. Xì Bàn (2 Aces) x3
 *   2. Xì Dách (Ace + 10/J/Q/K) x2
 *   3. Ngũ Linh (5 cards ≤ 21)
 *   4. Normal: highest score ≤ 21 wins
 *   5. Bust always loses
 */
export function compareHands(
    playerCards: CardStr[],
    dealerCards: CardStr[],
    playerScore: number,
    dealerScore: number,
    playerBust: boolean,
    dealerBust: boolean,
): CompareResult {
    const playerRank = getHandRank(playerCards)
    const dealerRank = getHandRank(dealerCards)
    const playerMult = getMultiplier(playerCards)
    const dealerMult = getMultiplier(dealerCards)

    // Special hands comparison
    if (playerRank > 1 || dealerRank > 1) {
        if (playerRank > dealerRank) return { outcome: 'win', multiplier: playerMult }
        if (playerRank < dealerRank) return { outcome: 'lose', multiplier: dealerMult }
        // Same rank special hands
        if (playerRank >= 3) {
            // Both Xì Dách or both Xì Bàn → draw
            return { outcome: 'draw', multiplier: 1 }
        }
        // Both Ngũ Linh → lower score wins
        if (playerScore < dealerScore) return { outcome: 'win', multiplier: 1 }
        if (playerScore > dealerScore) return { outcome: 'lose', multiplier: 1 }
        return { outcome: 'draw', multiplier: 1 }
    }

    // Normal comparison
    if (playerBust) return { outcome: 'lose', multiplier: 1 }
    if (dealerBust) return { outcome: 'win', multiplier: 1 }
    if (playerScore > dealerScore) return { outcome: 'win', multiplier: 1 }
    if (playerScore < dealerScore) return { outcome: 'lose', multiplier: 1 }
    return { outcome: 'draw', multiplier: 1 }
}
