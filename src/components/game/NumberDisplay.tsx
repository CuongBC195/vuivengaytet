'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'

interface NumberDisplayProps {
    currentNumber: number | null
    previousNumber: number | null
}

export function NumberDisplay({ currentNumber, previousNumber }: NumberDisplayProps) {
    return (
        <div className="flex justify-center items-center py-10">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentNumber ?? 'empty'}
                    initial={{ scale: 0.5, opacity: 0, rotate: -180 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 1.5, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="relative"
                >
                    <div className="w-64 h-64 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-xl border-8 border-white">
                        <span className="text-9xl font-black text-white drop-shadow-md">
                            {currentNumber ?? '--'}
                        </span>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
