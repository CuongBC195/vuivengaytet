/**
 * Xì Dách (Vietnamese Blackjack) Game Logic
 */
import type { Suit, Rank, Card, CardStr } from '@/types/game'

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
 * Ngũ Linh: 5 cards with total ≤ 21.
 * Beats everything except another Ngũ Linh with a lower score.
 */
export function isNguLinh(cards: CardStr[]): boolean {
    if (cards.length !== 5) return false
    return calculateScore(cards) <= 21
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
 *   1. Ngũ Linh (5 cards ≤ 21) beats non-Ngũ Linh
 *   2. Both Ngũ Linh → lower score wins, equal = draw
 *   3. Bust always loses
 *   4. Higher score wins
 */
export function compareHands(
    playerScore: number,
    dealerScore: number,
    playerBust: boolean,
    dealerBust: boolean,
    playerNguLinh: boolean = false,
    dealerNguLinh: boolean = false,
): 'win' | 'lose' | 'draw' {
    // Ngũ Linh takes priority
    if (playerNguLinh && !dealerNguLinh) return 'win'
    if (!playerNguLinh && dealerNguLinh) return 'lose'
    if (playerNguLinh && dealerNguLinh) {
        // Both Ngũ Linh — lower score wins
        if (playerScore < dealerScore) return 'win'
        if (playerScore > dealerScore) return 'lose'
        return 'draw'
    }

    // Normal comparison
    if (playerBust) return 'lose'
    if (dealerBust) return 'win'
    if (playerScore > dealerScore) return 'win'
    if (playerScore < dealerScore) return 'lose'
    return 'draw'
}
