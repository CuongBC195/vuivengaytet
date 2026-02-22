/**
 * Vietnamese Loto Ticket Generator (Deterministic)
 *
 * Rules enforced:
 * - Each ticket: 3 strips × (3 rows × 9 cols) = 9 rows total
 * - Each row: exactly 5 numbers, 4 blanks
 * - Column ranges: Col0: 1-9, Col1: 10-19, ..., Col8: 80-90
 * - NO duplicate numbers within the same column across all 9 rows
 * - Two tickets of the same color share ZERO numbers
 * - Each ticket uses exactly 45 numbers
 */

export type TicketColor = 'blue' | 'navy' | 'green' | 'red' | 'orange' | 'yellow' | 'purple' | 'pink'
export type TicketCell = number | null
export type StripGrid = TicketCell[][] // 3 rows × 9 cols

export interface LotoTicket {
    id: string
    strips: [StripGrid, StripGrid, StripGrid]
    color: TicketColor
}

// ─── Seeded RNG ─────────────────────────────────────────
function createRng(seed: number) {
    let s = seed
    return () => {
        s = (s * 16807) % 2147483647
        return (s - 1) / 2147483646
    }
}

function shuffled<T>(arr: T[], rng: () => number): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1))
            ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

// Column ranges
const COL_RANGES: [number, number][] = [
    [1, 9], [10, 19], [20, 29], [30, 39], [40, 49],
    [50, 59], [60, 69], [70, 79], [80, 90],
]

/**
 * Build a 3×9 strip pattern (which cells are filled).
 * Each row has exactly 5 filled cells.
 * colBudget[c] = how many numbers this column contributes to this strip.
 */
function buildStripPattern(colBudget: number[], rng: () => number): boolean[][] {
    const pattern = [
        Array(9).fill(false),
        Array(9).fill(false),
        Array(9).fill(false),
    ]

    // For each column with budget > 0, assign to rows
    // Process columns with higher budget first (more constrained)
    const colOrder = shuffled([0, 1, 2, 3, 4, 5, 6, 7, 8], rng)
        .sort((a, b) => colBudget[b] - colBudget[a])

    const rowCounts = [0, 0, 0]

    for (const c of colOrder) {
        const budget = colBudget[c]
        if (budget === 0) continue

        // Pick rows with least numbers first
        const candidates = [0, 1, 2]
            .filter((r) => !pattern[r][c] && rowCounts[r] < 5)
            .sort((a, b) => rowCounts[a] - rowCounts[b])

        const pick = candidates.slice(0, budget)
        for (const r of pick) {
            pattern[r][c] = true
            rowCounts[r]++
        }
    }

    return pattern
}

/**
 * Build one ticket from the given column numbers (each column is pre-sorted).
 * Distributes numbers across 3 strips ensuring 5 per row, no column repeats.
 */
function buildTicket(colNums: number[][], rng: () => number): [StripGrid, StripGrid, StripGrid] {
    const strips: StripGrid[] = []
    const usedPerCol = Array(9).fill(0)

    for (let s = 0; s < 3; s++) {
        const stripsLeft = 3 - s

        // Determine column budgets for this strip
        const colBudget: number[] = Array(9).fill(0)
        let total = 0

        for (let c = 0; c < 9; c++) {
            const remaining = colNums[c].length - usedPerCol[c]
            // Divide remaining evenly across remaining strips
            const share = Math.round(remaining / stripsLeft)
            colBudget[c] = Math.min(share, 3) // max 3 per strip (one per row)
            total += colBudget[c]
        }

        // Adjust to exactly 15
        const adjustOrder = shuffled([0, 1, 2, 3, 4, 5, 6, 7, 8], rng)
        while (total > 15) {
            for (const c of adjustOrder) {
                if (total <= 15) break
                if (colBudget[c] > 0) {
                    const remaining = colNums[c].length - usedPerCol[c]
                    const futureStrips = stripsLeft - 1
                    // Only reduce if future strips can absorb
                    if (futureStrips > 0 && remaining - colBudget[c] >= 0) {
                        colBudget[c]--
                        total--
                    }
                }
            }
            // Force reduce if still over
            if (total > 15) {
                for (const c of adjustOrder) {
                    if (total <= 15) break
                    if (colBudget[c] > 0) { colBudget[c]--; total-- }
                }
            }
        }
        while (total < 15) {
            for (const c of adjustOrder) {
                if (total >= 15) break
                const remaining = colNums[c].length - usedPerCol[c]
                if (colBudget[c] < 3 && colBudget[c] < remaining) {
                    colBudget[c]++
                    total++
                }
            }
            // Force add if still under
            if (total < 15) {
                for (const c of adjustOrder) {
                    if (total >= 15) break
                    if (colBudget[c] < 3) { colBudget[c]++; total++ }
                }
            }
        }

        // Build fill pattern
        const pattern = buildStripPattern(colBudget, rng)

        // Populate strip with actual numbers
        const strip: TicketCell[][] = [
            Array(9).fill(null) as TicketCell[],
            Array(9).fill(null) as TicketCell[],
            Array(9).fill(null) as TicketCell[],
        ]

        for (let c = 0; c < 9; c++) {
            const nums: number[] = []
            for (let i = 0; i < colBudget[c]; i++) {
                if (usedPerCol[c] + i < colNums[c].length) {
                    nums.push(colNums[c][usedPerCol[c] + i])
                }
            }
            nums.sort((a, b) => a - b)

            let ni = 0
            for (let r = 0; r < 3; r++) {
                if (pattern[r][c] && ni < nums.length) {
                    strip[r][c] = nums[ni++]
                }
            }
            usedPerCol[c] += colBudget[c]
        }

        strips.push(strip)
    }

    return strips as [StripGrid, StripGrid, StripGrid]
}

/**
 * Generate a pair of tickets for one color.
 * Split 90 numbers so each ticket gets exactly 45.
 * No overlapping numbers between the two tickets.
 */
function generatePair(seed: number): [[StripGrid, StripGrid, StripGrid], [StripGrid, StripGrid, StripGrid]] {
    const rng = createRng(seed)

    // For each column, shuffle all numbers
    const allCols: number[][] = COL_RANGES.map(([min, max]) => {
        const nums: number[] = []
        for (let i = min; i <= max; i++) nums.push(i)
        return shuffled(nums, rng)
    })

    // Split ensuring total = 45 each
    // Col sizes: [9, 10, 10, 10, 10, 10, 10, 10, 11] = 90 total
    // Default split: each col gives ceil(n/2) to A → may not total 45
    // Strategy: split each col as floor(n/2), then distribute extras to reach 45

    const aColNums: number[][] = []
    const bColNums: number[][] = []

    // Start with floor split
    const splits: number[] = allCols.map((col) => Math.floor(col.length / 2))
    let totalA = splits.reduce((s, v) => s + v, 0)

    // totalA with floor: 4+5+5+5+5+5+5+5+5 = 44. Need 45. Add 1 more to some col.
    // Pick columns with odd lengths (9 and 11) to give the extra
    const oddCols = shuffled(
        allCols.map((col, i) => ({ i, len: col.length })).filter((c) => c.len % 2 !== 0),
        rng,
    )

    let idx = 0
    while (totalA < 45 && idx < oddCols.length) {
        splits[oddCols[idx].i]++
        totalA++
        idx++
    }

    for (let c = 0; c < 9; c++) {
        const splitAt = splits[c]
        aColNums.push(allCols[c].slice(0, splitAt).sort((a, b) => a - b))
        bColNums.push(allCols[c].slice(splitAt).sort((a, b) => a - b))
    }

    return [buildTicket(aColNums, rng), buildTicket(bColNums, rng)]
}

// ─── COLOR CONFIG ───────────────────────────────────────
export const COLOR_LABELS: Record<TicketColor, string> = {
    blue: 'Xanh dương',
    navy: 'Xanh đậm',
    green: 'Xanh lá',
    red: 'Đỏ',
    orange: 'Cam',
    yellow: 'Vàng',
    purple: 'Tím',
    pink: 'Hồng',
}

const COLORS: TicketColor[] = ['blue', 'navy', 'green', 'red', 'orange', 'yellow', 'purple', 'pink']

// ─── GENERATE ALL TICKETS ───────────────────────────────
function generateAll(): { color: TicketColor; tickets: LotoTicket[] }[] {
    return COLORS.map((color, i) => {
        const seed = 2024 + i * 997
        const [stripsA, stripsB] = generatePair(seed)
        return {
            color,
            tickets: [
                { id: `${color}-1`, strips: stripsA, color },
                { id: `${color}-2`, strips: stripsB, color },
            ],
        }
    })
}

export const TICKET_GROUPS = generateAll()
export const ALL_TICKETS: LotoTicket[] = TICKET_GROUPS.flatMap((g) => g.tickets)
