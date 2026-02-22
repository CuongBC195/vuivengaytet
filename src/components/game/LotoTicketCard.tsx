'use client'

import type { LotoTicket, StripGrid, TicketColor } from '@/lib/ticket-data'

interface LotoTicketCardProps {
    ticket: LotoTicket
    markedNumbers: Set<number>
    onMark: (num: number) => void
    interactive?: boolean // false in picker, true in game
}

const COLOR_MAP: Record<TicketColor, { blank: string; border: string; banner: string }> = {
    blue: { blank: '#5BA3E6', border: '#3B82C4', banner: '#3B82C4' },
    navy: { blank: '#3B5998', border: '#2C4A80', banner: '#2C4A80' },
    green: { blank: '#4CAF7D', border: '#3A9468', banner: '#3A9468' },
    red: { blank: '#E05A6D', border: '#C94858', banner: '#C94858' },
    orange: { blank: '#F0923A', border: '#D4802E', banner: '#D4802E' },
    yellow: { blank: '#F0D03A', border: '#C4A82E', banner: '#C4A82E' },
    purple: { blank: '#9B72CF', border: '#8258B5', banner: '#8258B5' },
    pink: { blank: '#E47EC6', border: '#C965AD', banner: '#C965AD' },
}

function StripView({
    strip,
    color,
    markedNumbers,
    onMark,
    interactive,
}: {
    strip: StripGrid
    color: TicketColor
    markedNumbers: Set<number>
    onMark: (num: number) => void
    interactive: boolean
}) {
    const colors = COLOR_MAP[color]

    return (
        <div>
            {strip.map((row, rIdx) => {
                const rowNums = row.filter((c): c is number => c !== null)
                const isBingoRow = rowNums.length === 5 && rowNums.every((n) => markedNumbers.has(n))

                return (
                    <div
                        key={rIdx}
                        className="grid grid-cols-9"
                        style={{
                            gap: 1,
                            marginTop: rIdx > 0 ? 1 : 0,
                            background: colors.border,
                        }}
                    >
                        {row.map((cell, cIdx) => {
                            const isBlank = cell === null
                            const isMarked = cell !== null && markedNumbers.has(cell)

                            return (
                                <div
                                    key={cIdx}
                                    onClick={() => {
                                        if (cell !== null && interactive) onMark(cell)
                                    }}
                                    style={{
                                        aspectRatio: '1 / 1.4',
                                        backgroundColor: isBlank
                                            ? colors.blank
                                            : isBingoRow && isMarked
                                                ? '#FFD700'
                                                : '#FFFFFF',
                                    }}
                                    className={`flex items-center justify-center font-black select-none relative text-[clamp(8px,2.8vw,18px)] ${!isBlank && interactive ? 'cursor-pointer active:scale-90 transition-transform' : ''
                                        }`}
                                >
                                    {cell !== null && (
                                        <span className="relative z-10" style={{ color: '#1a1a1a' }}>
                                            {cell}
                                        </span>
                                    )}

                                    {isMarked && (
                                        <div className="absolute inset-[8%] flex items-center justify-center z-20">
                                            <div
                                                className="w-full h-full rounded-full"
                                                style={{
                                                    border: isBingoRow
                                                        ? '2.5px solid #D32F2F'
                                                        : '2px solid #F57C00',
                                                    maxWidth: 36,
                                                    maxHeight: 36,
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )
            })}
        </div>
    )
}

export function LotoTicketCard({
    ticket,
    markedNumbers,
    onMark,
    interactive = true,
}: LotoTicketCardProps) {
    const colors = COLOR_MAP[ticket.color]

    let bingoCount = 0
    ticket.strips.forEach((strip) => {
        strip.forEach((row) => {
            const nums = row.filter((c): c is number => c !== null)
            if (nums.length === 5 && nums.every((n) => markedNumbers.has(n))) bingoCount++
        })
    })

    return (
        <div
            style={{
                border: `2px solid ${colors.border}`,
                borderRadius: 4,
                overflow: 'hidden',
                background: colors.border,
            }}
        >
            {ticket.strips.map((strip, sIdx) => (
                <div key={sIdx}>
                    {sIdx > 0 && (
                        <div
                            style={{
                                backgroundColor: colors.banner,
                                color: '#fff',
                            }}
                            className="flex items-center justify-center font-bold tracking-wider opacity-80 text-[clamp(5px,1.5vw,10px)] py-[2px]"
                        >
                            ✦
                        </div>
                    )}
                    <StripView
                        strip={strip}
                        color={ticket.color}
                        markedNumbers={markedNumbers}
                        onMark={onMark}
                        interactive={interactive}
                    />
                </div>
            ))}

            {bingoCount > 0 && interactive && (
                <div
                    style={{ backgroundColor: '#D32F2F' }}
                    className="text-white text-center font-black py-1 text-[clamp(9px,2vw,14px)] tracking-widest animate-pulse"
                >
                    🎉 BINGO! ({bingoCount} hàng)
                </div>
            )}
        </div>
    )
}
