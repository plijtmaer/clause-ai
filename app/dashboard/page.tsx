"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { createBrowserClient } from '@supabase/ssr'
import { FileText, TrendingUp, Shield, BarChart3, Clock, Eye, ArrowLeft, Calendar, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import AuthProvider from '@/components/auth-provider'

interface AnalysisStats {
  totalDocuments: number
  averageScore: number
  totalChunks: number
  documentsThisWeek: number
  highRiskDocuments: number
}

interface DocumentSummary {
  doc_id: string
  title: string
  analysis_date: string
  document_type: string
  chunks_count: number
  average_score: number
  risk_level: 'low' | 'medium' | 'high'
}

function DashboardContent() {
  const { user, loading } = useAuth()
  const [stats, setStats] = useState<AnalysisStats | null>(null)
  const [recentDocuments, setRecentDocuments] = useState<DocumentSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      // Fetch document chunks grouped by doc_id
      const { data: chunks, error } = await supabase
        .from('document_chunks')
        .select('doc_id, created_at, chunk_index')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Process chunks to create document summaries
      const docGroups = chunks?.reduce((acc, chunk) => {
        if (!acc[chunk.doc_id]) {
          acc[chunk.doc_id] = {
            doc_id: chunk.doc_id,
            chunks: [],
            latest_date: chunk.created_at
          }
        }
        acc[chunk.doc_id].chunks.push(chunk)
        return acc
      }, {} as any) || {}

      // Generate mock analytics data (in a real app, this would come from your analysis results)
      const documents: DocumentSummary[] = Object.values(docGroups).map((doc: any) => ({
        doc_id: doc.doc_id,
        title: generateDocumentTitle(doc.doc_id),
        analysis_date: doc.latest_date,
        document_type: getRandomDocType(),
        chunks_count: doc.chunks.length,
        average_score: Math.floor(Math.random() * 40) + 60, // 60-100
        risk_level: getRandomRiskLevel()
      }))

      // Calculate stats
      const stats: AnalysisStats = {
        totalDocuments: documents.length,
        averageScore: documents.length > 0 
          ? Math.round(documents.reduce((acc, doc) => acc + doc.average_score, 0) / documents.length)
          : 0,
        totalChunks: Object.values(docGroups).reduce((acc: number, doc: any) => acc + doc.chunks.length, 0),
        documentsThisWeek: documents.filter(doc => 
          new Date(doc.analysis_date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        highRiskDocuments: documents.filter(doc => doc.risk_level === 'high').length
      }

      setStats(stats)
      setRecentDocuments(documents.slice(0, 10)) // Show last 10 documents
      setIsLoading(false)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setIsLoading(false)
    }
  }

  const generateDocumentTitle = (docId: string): string => {
    const titles = [
      "Privacy Policy - Tech Company",
      "Terms of Service - E-commerce Platform", 
      "User Agreement - Social Media App",
      "Cookie Policy - Marketing Website",
      "End User License Agreement",
      "Non-Disclosure Agreement",
      "Service Agreement - SaaS Platform",
      "Data Processing Agreement",
      "Privacy Notice - Healthcare App",
      "Terms & Conditions - Online Marketplace"
    ]
    const hash = docId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    return titles[Math.abs(hash) % titles.length]
  }

  const getRandomDocType = (): string => {
    const types = ["privacy", "terms", "nda", "eula", "contract"]
    return types[Math.floor(Math.random() * types.length)]
  }

  const getRandomRiskLevel = (): 'low' | 'medium' | 'high' => {
    const levels: ('low' | 'medium' | 'high')[] = ["low", "low", "medium", "medium", "high"]
    return levels[Math.floor(Math.random() * levels.length)]
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-400 bg-red-500/20 border-red-500/30'
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
      case 'low': return 'text-green-400 bg-green-500/20 border-green-500/30'
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/30'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="p-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 hover:bg-white/15 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">Dashboard</h1>
              <p className="text-white/60">Your document analysis overview</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-sm">Welcome back,</p>
            <p className="text-white font-medium">{user?.email}</p>
          </div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Total Documents</p>
                  <p className="text-2xl font-bold text-white">{stats.totalDocuments}</p>
                </div>
                <FileText className="w-8 h-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Average Score</p>
                  <p className={`text-2xl font-bold ${getScoreColor(stats.averageScore)}`}>
                    {stats.averageScore}/100
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-green-400" />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">This Week</p>
                  <p className="text-2xl font-bold text-white">{stats.documentsThisWeek}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-400" />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Total Chunks</p>
                  <p className="text-2xl font-bold text-white">{stats.totalChunks}</p>
                </div>
                <Eye className="w-8 h-8 text-cyan-400" />
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">High Risk</p>
                  <p className="text-2xl font-bold text-red-400">{stats.highRiskDocuments}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </div>
          </div>
        )}

        {/* Recent Documents */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-semibold text-white mb-2">Recent Analyses</h2>
            <p className="text-white/60 text-sm">Your recently analyzed documents</p>
          </div>

          {recentDocuments.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No documents analyzed yet</h3>
              <p className="text-white/60 mb-6">Start analyzing documents to see your dashboard data</p>
              <Link 
                href="/"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-colors"
              >
                Analyze Document
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left p-4 text-white/80 font-medium">Document</th>
                    <th className="text-left p-4 text-white/80 font-medium">Type</th>
                    <th className="text-left p-4 text-white/80 font-medium">Score</th>
                    <th className="text-left p-4 text-white/80 font-medium">Risk</th>
                    <th className="text-left p-4 text-white/80 font-medium">Chunks</th>
                    <th className="text-left p-4 text-white/80 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDocuments.map((doc, index) => (
                    <tr key={doc.doc_id} className="border-t border-white/10 hover:bg-white/5">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-white/60" />
                          <div>
                            <p className="text-white font-medium">{doc.title}</p>
                            <p className="text-white/50 text-sm">ID: {doc.doc_id.split('-')[0]}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-white/10 rounded-md text-white/80 text-sm capitalize">
                          {doc.document_type}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`font-semibold ${getScoreColor(doc.average_score)}`}>
                          {doc.average_score}/100
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-md text-sm font-medium border ${getRiskColor(doc.risk_level)}`}>
                          {doc.risk_level.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-white/80">{doc.chunks_count}</td>
                      <td className="p-4 text-white/60 text-sm">
                        {new Date(doc.analysis_date).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <AuthProvider>
      <DashboardContent />
    </AuthProvider>
  )
} 