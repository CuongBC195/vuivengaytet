/**
 * Vietnamese Loto Ticket Generator
 *
 * Traditional rules:
 * - Each ticket has 2 "tờ" (sheets)
 * - Each sheet: 3 rows × 9 columns = 27 cells
 * - Each row has exactly 5 numbers and 4 blank (colored) cells
 * - Column ranges: Col0: 1-9, Col1: 10-19, ..., Col8: 80-90
 * - Numbers within a column are sorted top to bottom
 * - Total 15 numbers per sheet, 30 per ticket
 */

export type TicketCell = number | null
export type TicketGrid = TicketCell[][]

export interface LotoSheet {
    grid: TicketGrid // 3 rows x 9 cols
}

export interface LotoTicket {
    id: string
    sheets: [LotoSheet, LotoSheet] // 2 sheets per ticket
    color: TicketColor
}

export type TicketColor = 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'pink'

const COLUMN_RANGES: [number, number][] = [
    [1, 9],
    [10, 19],
    [20, 29],
    [30, 39],
    [40, 49],
    [50, 59],
    [60, 69],
    [70, 79],
    [80, 90],
]

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
            ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

function generateSheet(): LotoSheet {
    // Step 1: For each column, generate pool of available numbers
    const colPools: number[][] = COLUMN_RANGES.map(([min, max]) => {
        const nums: number[] = []
        for (let i = min; i <= max; i++) nums.push(i)
        return shuffle(nums)
    })

    // Step 2: Decide how many numbers go in each column
    // Total must be 15 (5 per row × 3 rows)
    // Each column: 0-3 numbers, but at least 1 per column is typical
    // Start with 1 per column (9), then add 6 more
    const colCounts = Array(9).fill(1)
    let remaining = 6
    while (remaining > 0) {
        const available = colCounts
            .map((c, i) => (c < 3 ? i : -1))
            .filter((i) => i !== -1)
        if (available.length === 0) break
        const idx = available[Math.floor(Math.random() * available.length)]
        colCounts[idx]++
        remaining--
    }

    // Step 3: Assign numbers to rows, ensuring each row has exactly 5
    const grid: TicketCell[][] = [
        Array(9).fill(null),
        Array(9).fill(null),
        Array(9).fill(null),
    ]
    const rowCounts = [0, 0, 0]

    // Sort columns by count descending to place constrained ones first
    const colOrder = [0, 1, 2, 3, 4, 5, 6, 7, 8].sort(
        (a, b) => colCounts[b] - colCounts[a]
    )

    for (const col of colOrder) {
        const count = colCounts[col]
        const nums = colPools[col].slice(0, count).sort((a, b) => a - b)

        // Pick 'count' rows - prefer rows that have fewer numbers and haven't reached 5
        let availableRows = [0, 1, 2]
            .filter((r) => rowCounts[r] < 5)
            .sort((a, b) => rowCounts[a] - rowCounts[b])

        if (availableRows.length < count) {
            // Fallback
            availableRows = [0, 1, 2].sort((a, b) => rowCounts[a] - rowCounts[b])
        }

        const chosenRows = availableRows.slice(0, count).sort((a, b) => a - b)

        for (let i = 0; i < count; i++) {
            grid[chosenRows[i]][col] = nums[i]
            rowCounts[chosenRows[i]]++
        }
    }

    // Step 4: Fix rows - ensure exactly 5 per row
    for (let r = 0; r < 3; r++) {
        const filled = grid[r].filter((v) => v !== null).length

        if (filled > 5) {
            const filledIndices = grid[r]
                .map((v, i) => (v !== null ? i : -1))
                .filter((i) => i !== -1)
            const toRemove = shuffle(filledIndices).slice(0, filled - 5)
            for (const idx of toRemove) grid[r][idx] = null
        } else if (filled < 5) {
            const emptyIndices = grid[r]
                .map((v, i) => (v === null ? i : -1))
                .filter((i) => i !== -1)
            const toAdd = shuffle(emptyIndices).slice(0, 5 - filled)
            for (const idx of toAdd) {
                const [min, max] = COLUMN_RANGES[idx]
                const usedInCol = [0, 1, 2]
                    .map((row) => grid[row][idx])
                    .filter((v) => v !== null) as number[]
                for (let n = min; n <= max; n++) {
                    if (!usedInCol.includes(n)) {
                        grid[r][idx] = n
                        break
                    }
                }
            }
        }
    }

    return { grid }
}

const COLORS: TicketColor[] = ['blue', 'green', 'yellow', 'purple', 'red', 'pink']

export function generateTickets(count: number): LotoTicket[] {
    const tickets: LotoTicket[] = []
    for (let i = 0; i < count; i++) {
        tickets.push({
            id: `ticket-${i}-${Math.random().toString(36).substring(2, 6)}`,
            sheets: [generateSheet(), generateSheet()],
            color: COLORS[i % COLORS.length],
        })
    }
    return tickets
}

export function generateRandomNumber(exclude: number[]): number | null {
    if (exclude.length >= 90) return null
    let num: number
    do {
        num = Math.floor(Math.random() * 90) + 1
    } while (exclude.includes(num))
    return num
}
