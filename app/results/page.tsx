"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Download,
  Share2,
  TrendingUp,
  MapPin,
  Home,
  Calendar,
  Ruler,
  Building,
  CheckCircle,
} from "lucide-react"
import Link from "next/link"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export default function ResultsPage() {
  const [activeTab, setActiveTab] = useState("estimation")

  // Mock data
  const estimationData = {
    price: 485000,
    priceMin: 460000,
    priceMax: 510000,
    pricePerSqm: 4850,
    confidence: 92,
    address: "123 Rue de la Paix, 75001 Paris",
    surface: 100,
    rooms: 3,
    year: 2000,
  }

  const marketTrends = [
    { month: "Jan", price: 4200 },
    { month: "Fév", price: 4350 },
    { month: "Mar", price: 4400 },
    { month: "Avr", price: 4500 },
    { month: "Mai", price: 4650 },
    { month: "Jun", price: 4850 },
  ]

  const comparableProperties = [
    { address: "125 Rue de Rivoli", price: 470000, surface: 95, pricePerSqm: 4947, sold: "2024-01-15" },
    { address: "89 Rue Saint-Honoré", price: 520000, surface: 105, pricePerSqm: 4952, sold: "2024-02-03" },
    { address: "67 Rue de la Paix", price: 445000, surface: 92, pricePerSqm: 4837, sold: "2024-01-28" },
    { address: "156 Rue de Castiglione", price: 495000, surface: 102, pricePerSqm: 4853, sold: "2024-02-12" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/estimate"
              className="flex items-center space-x-2 text-white hover:text-white/80 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Nouvelle estimation</span>
            </Link>
            <div className="flex items-center space-x-2">
              <Home className="h-6 w-6 text-white" />
              <span className="text-lg font-bold text-white">EstimPro</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                <Share2 className="h-4 w-4 mr-2" />
                Partager
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Banner */}
        <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30 p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="bg-green-500 rounded-full p-2">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Estimation réalisée avec succès !</h2>
              <p className="text-white/80">
                Votre bien a été analysé par notre IA avec un niveau de confiance de {estimationData.confidence}%
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Price Estimation */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20 p-8">
              <div className="text-center mb-6">
                <Badge className="mb-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                  Estimation IA • Confiance {estimationData.confidence}%
                </Badge>
                <div className="text-5xl font-bold text-white mb-2">
                  {estimationData.price.toLocaleString("fr-FR")} €
                </div>
                <div className="text-white/70 text-lg">
                  Fourchette: {estimationData.priceMin.toLocaleString("fr-FR")} € -{" "}
                  {estimationData.priceMax.toLocaleString("fr-FR")} €
                </div>
                <div className="text-white/60 mt-2">Soit {estimationData.pricePerSqm.toLocaleString("fr-FR")} €/m²</div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Niveau de confiance</span>
                  <span className="text-white font-semibold">{estimationData.confidence}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${estimationData.confidence}%` }}
                  ></div>
                </div>
              </div>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 bg-white/10 border-white/20">
                <TabsTrigger value="estimation" className="data-[state=active]:bg-white/20 text-white">
                  Détails
                </TabsTrigger>
                <TabsTrigger value="market" className="data-[state=active]:bg-white/20 text-white">
                  Marché
                </TabsTrigger>
                <TabsTrigger value="comparables" className="data-[state=active]:bg-white/20 text-white">
                  Comparables
                </TabsTrigger>
              </TabsList>

              <TabsContent value="estimation" className="mt-6">
                <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Analyse détaillée</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="text-white/60 text-sm">Prix au m²</div>
                        <div className="text-2xl font-bold text-white">{estimationData.pricePerSqm} €</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="text-white/60 text-sm">Écart type</div>
                        <div className="text-2xl font-bold text-white">±5.2%</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">Localisation (quartier premium)</span>
                        <span className="text-green-400">+15%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">État du bien (bon)</span>
                        <span className="text-green-400">+5%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">Année de construction</span>
                        <span className="text-yellow-400">0%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/70">Surface optimale</span>
                        <span className="text-green-400">+3%</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="market" className="mt-6">
                <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Évolution du marché</h3>
                  <div className="h-64 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={marketTrends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis dataKey="month" stroke="rgba(255,255,255,0.7)" />
                        <YAxis stroke="rgba(255,255,255,0.7)" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(0,0,0,0.8)",
                            border: "1px solid rgba(255,255,255,0.2)",
                            borderRadius: "8px",
                            color: "white",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="price"
                          stroke="url(#gradient)"
                          strokeWidth={3}
                          dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#ec4899" />
                          </linearGradient>
                        </defs>
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">+15.5%</div>
                      <div className="text-white/60 text-sm">6 derniers mois</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">4,850€</div>
                      <div className="text-white/60 text-sm">Prix moyen/m²</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">23j</div>
                      <div className="text-white/60 text-sm">Temps de vente</div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="comparables" className="mt-6">
                <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Ventes comparables récentes</h3>
                  <div className="space-y-4">
                    {comparableProperties.map((property, index) => (
                      <div key={index} className="bg-white/5 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="text-white font-medium">{property.address}</div>
                            <div className="text-white/60 text-sm">
                              Vendu le {new Date(property.sold).toLocaleDateString("fr-FR")}
                            </div>
                          </div>
                          <Badge variant="outline" className="border-white/20 text-white">
                            {property.surface} m²
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-lg font-semibold text-white">
                            {property.price.toLocaleString("fr-FR")} €
                          </div>
                          <div className="text-white/70">{property.pricePerSqm.toLocaleString("fr-FR")} €/m²</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Property Summary */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Votre bien</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-white/60" />
                  <span className="text-white/80 text-sm">{estimationData.address}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Ruler className="h-4 w-4 text-white/60" />
                  <span className="text-white/80 text-sm">{estimationData.surface} m²</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-white/60" />
                  <span className="text-white/80 text-sm">{estimationData.rooms} pièces</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-white/60" />
                  <span className="text-white/80 text-sm">Construit en {estimationData.year}</span>
                </div>
              </div>
            </Card>

            {/* Next Steps */}
            <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Prochaines étapes</h3>
              <div className="space-y-3">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                  Contacter un agent
                </Button>
                <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                  Affiner l'estimation
                </Button>
                <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                  Recevoir des alertes
                </Button>
              </div>
            </Card>

            {/* Market Insights */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Insights marché</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="text-white/80 text-sm">Marché en hausse</span>
                </div>
                <div className="text-white/70 text-sm">
                  Le secteur affiche une croissance de 15.5% sur 6 mois. C'est le moment idéal pour vendre.
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  Recommandation: Vendre maintenant
                </Badge>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
