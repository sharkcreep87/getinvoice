'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function WhatsAppBotDebugPage() {
    const [diagnostics, setDiagnostics] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    const runDiagnostics = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/whatsapp-bot/debug')
            const data = await response.json()
            setDiagnostics(data)
        } catch (error: any) {
            setDiagnostics({ error: error.message })
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        runDiagnostics()
    }, [])

    return (
        <div className="container mx-auto p-8">
            <Card>
                <CardHeader>
                    <CardTitle>WhatsApp Bot Diagnostics</CardTitle>
                    <CardDescription>
                        Check if your system is ready to run the WhatsApp bot
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button onClick={runDiagnostics} disabled={loading}>
                        {loading ? 'Running...' : 'Run Diagnostics'}
                    </Button>

                    {diagnostics && (
                        <div className="mt-4">
                            <pre className="bg-slate-900 text-white p-4 rounded-lg overflow-auto text-xs">
                                {JSON.stringify(diagnostics, null, 2)}
                            </pre>

                            {diagnostics.summary && (
                                <div className="mt-4 p-4 rounded-lg bg-slate-100">
                                    <h3 className="font-bold mb-2">Summary</h3>
                                    <p className="text-sm">
                                        <strong>Can Initialize:</strong>{' '}
                                        {diagnostics.summary.canInitialize ? (
                                            <span className="text-green-600">✓ Yes</span>
                                        ) : (
                                            <span className="text-red-600">✗ No</span>
                                        )}
                                    </p>
                                    <p className="text-sm mt-2">
                                        <strong>Errors:</strong> {diagnostics.summary.totalErrors}
                                    </p>
                                    {diagnostics.errors.length > 0 && (
                                        <ul className="mt-2 text-sm text-red-600">
                                            {diagnostics.errors.map((error: string, i: number) => (
                                                <li key={i}>• {error}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
