'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'

interface HistoryListProps {
    numbers: number[]
}

export function HistoryList({ numbers }: HistoryListProps) {
    return (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle className="text-lg">Số đã quay ({numbers.length})</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-2 justify-center max-h-48 overflow-y-auto">
                    {numbers.slice().reverse().map((num, i) => (
                        <motion.div
                            key={`${num}-${i}`}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-800 border border-slate-300 shadow-sm"
                        >
                            {num}
                        </motion.div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
