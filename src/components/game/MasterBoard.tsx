'use client'

import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface MasterBoardProps {
    drawnNumbers: number[]
}

export function MasterBoard({ drawnNumbers }: MasterBoardProps) {
    const numbers = Array.from({ length: 90 }, (_, i) => i + 1)

    return (
        <Card className="w-full">
            <CardHeader className="py-4">
                <CardTitle className="text-center text-lg">Bảng Số (Master Board)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-10 gap-1 sm:gap-2">
                    {numbers.map((num) => {
                        const isDrawn = drawnNumbers.includes(num)
                        return (
                            <div
                                key={num}
                                className={cn(
                                    "aspect-square flex items-center justify-center rounded-sm text-xs sm:text-sm font-bold border transition-colors",
                                    isDrawn
                                        ? "bg-green-500 text-white border-green-600"
                                        : "bg-slate-50 text-slate-300 border-slate-100"
                                )}
                            >
                                {num}
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
