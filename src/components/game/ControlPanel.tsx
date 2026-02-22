'use client'

import { Button } from '@/components/ui/button'
import { Volume2, VolumeX } from 'lucide-react'

interface ControlPanelProps {
    onDraw: () => void
    onReset: () => void
    canDraw: boolean
    isMuted: boolean
    toggleMute: () => void
    isHost: boolean
}

export function ControlPanel({ onDraw, onReset, canDraw, isMuted, toggleMute, isHost }: ControlPanelProps) {
    if (!isHost) return null

    return (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t z-50">
            <div className="container mx-auto max-w-lg flex items-center justify-between gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMute}
                    className="flex-shrink-0"
                >
                    {isMuted ? <VolumeX /> : <Volume2 />}
                </Button>

                <Button
                    size="lg"
                    className="w-full text-xl font-bold py-8 shadow-lg shadow-primary/20"
                    onClick={onDraw}
                    disabled={!canDraw}
                >
                    QUAY SỐ
                </Button>

                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                        if (confirm('Bạn chắc chắn muốn reset game?')) onReset()
                    }}
                    className="flex-shrink-0"
                >
                    Reset
                </Button>
            </div>
        </div>
    )
}
