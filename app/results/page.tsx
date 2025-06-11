"use client"

import { useState, useEffect, useRef } from "react"
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
import { useSearchParams } from 'next/navigation'
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

interface EstimationData {
  estimated_price: number
  price_min: number
  price_max: number
  price_per_sqm: number
  confidence_score: number
  market_trends: { month: string; price: number }[]
  comparable_properties: {
    address: string
    price: number
    surface: number
    price_per_sqm: number
    sold_date: string
  }[]
  factors_analysis: Record<string, number>
}

interface PropertyDetails {
  address: string
  property_type: string
  surface: number
  rooms: number
  bedrooms: number
  bathrooms: number
  year: number
  condition: string
  parking: string
  garden: string
}

const useCurrencyConverter = () => {
  const [rate, setRate] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch('https://v6.exchangerate-api.com/v6/9a7414de33f741e1facc43c3/latest/EUR')
        if (!response.ok) {
          throw new Error('Failed to fetch exchange rate')
        }
        const data = await response.json()
        setRate(data.conversion_rates.MGA)
      } catch (err) {
        console.error('Error fetching exchange rate:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchExchangeRate()
  }, [])

  const convertToMGA = (eur: number): string => {
    if (rate === null) return '...'
    return Math.round(eur * rate).toLocaleString('fr-FR')
  }

  return { convertToMGA, loading, error, rate }
}

export default function ResultsPage() {
  const [activeTab, setActiveTab] = useState("estimation")
  const [estimationData, setEstimationData] = useState<EstimationData | null>(null)
  const [propertyDetails, setPropertyDetails] = useState<PropertyDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { convertToMGA, loading: rateLoading, error: rateError, rate } = useCurrencyConverter()
  const searchParams = useSearchParams()
  const propertyDataParam = searchParams.get('propertyData')

  useEffect(() => {
    const fetchEstimation = async () => {
      try {
        setLoading(true)
        
        if (!propertyDataParam) {
          throw new Error("Données du bien manquantes")
        }
        
        const parsedPropertyData = JSON.parse(decodeURIComponent(propertyDataParam))
        setPropertyDetails({
          address: parsedPropertyData.address,
          property_type: parsedPropertyData.propertyType,
          surface: parsedPropertyData.surface[0],
          rooms: parsedPropertyData.rooms,
          bedrooms: parsedPropertyData.bedrooms,
          bathrooms: parsedPropertyData.bathrooms,
          year: parsedPropertyData.year[0],
          condition: parsedPropertyData.condition,
          parking: parsedPropertyData.parking,
          garden: parsedPropertyData.garden
        })

        const response = await fetch('http://localhost:8000/estimate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            address: parsedPropertyData.address,
            property_type: parsedPropertyData.propertyType,
            surface: parsedPropertyData.surface[0],
            rooms: parseInt(parsedPropertyData.rooms),
            bedrooms: parseInt(parsedPropertyData.bedrooms),
            bathrooms: parseInt(parsedPropertyData.bathrooms),
            year: parsedPropertyData.year[0],
            condition: parsedPropertyData.condition,
            parking: parsedPropertyData.parking,
            garden: parsedPropertyData.garden,
            latitude: parsedPropertyData.latitude,
            longitude: parsedPropertyData.longitude
          })
        })

        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des données')
        }

        const data = await response.json()
        setEstimationData(data)
      } catch (err) {
        console.error('Erreur:', err)
        setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      } finally {
        setLoading(false)
      }
    }

    fetchEstimation()
  }, [propertyDataParam])

  const generatePDF = () => {
    if (!estimationData || !propertyDetails || !rate) return

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    })

    // En-tête
    doc.setFontSize(22)
    doc.setTextColor(61, 41, 122)
    doc.text("Rapport d'estimation immobilier", 105, 20, { align: "center" })
    
    doc.setFontSize(12)
    doc.setTextColor(128, 128, 128)
    doc.text("EstimPro - Votre partenaire immobilier intelligent", 105, 28, { align: "center" })
    
    // Ligne de séparation
    doc.setDrawColor(200, 200, 200)
    doc.line(20, 32, 190, 32)

    // Section 1: Détails du bien
    doc.setFontSize(16)
    doc.setTextColor(61, 41, 122)
    doc.text("1. Détails du bien", 20, 42)
    
    autoTable(doc, {
      startY: 45,
      head: [['Caractéristique', 'Valeur']],
      body: [
        ['Adresse', propertyDetails.address],
        ['Type de bien', propertyDetails.property_type],
        ['Surface', `${propertyDetails.surface} m²`],
        ['Pièces', `${propertyDetails.rooms} (${propertyDetails.bedrooms} chambres)`],
        ['Salles de bain', propertyDetails.bathrooms],
        ['Année de construction', propertyDetails.year],
        ['État', propertyDetails.condition],
        ['Parking', propertyDetails.parking],
        ['Jardin', propertyDetails.garden]
      ],
      theme: 'grid',
      headStyles: {
        fillColor: [61, 41, 122],
        textColor: 255
      }
    })

    // Section 2: Estimation
    doc.setFontSize(16)
    doc.setTextColor(61, 41, 122)
    doc.text("2. Estimation de valeur", 20, doc.lastAutoTable.finalY + 15)
    
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      body: [
        ['Estimation moyenne', `${convertToMGA(estimationData.estimated_price)} MGA`],
        ['Fourchette de prix', `${convertToMGA(estimationData.price_min)} MGA - ${convertToMGA(estimationData.price_max)} MGA`],
        ['Prix au m²', `${convertToMGA(estimationData.price_per_sqm)} MGA/m²`],
        ['Niveau de confiance', `${estimationData.confidence_score}%`]
      ],
      theme: 'plain',
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [240, 240, 240] },
        1: { halign: 'right' }
      }
    })

    // Section 3: Analyse du marché
    doc.setFontSize(16)
    doc.setTextColor(61, 41, 122)
    doc.text("3. Analyse du marché", 20, doc.lastAutoTable.finalY + 15)
    
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Mois', 'Prix moyen (MGA)']],
      body: estimationData.market_trends.map(trend => [
        trend.month, 
        convertToMGA(trend.price)
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: [61, 41, 122],
        textColor: 255
      }
    })

    // Section 4: Biens comparables
    doc.setFontSize(16)
    doc.setTextColor(61, 41, 122)
    doc.text("4. Biens comparables récents", 20, doc.lastAutoTable.finalY + 15)
    
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Adresse', 'Prix (MGA)', 'Surface', 'Date']],
      body: estimationData.comparable_properties.map(prop => [
        prop.address, 
        convertToMGA(prop.price),
        `${prop.surface} m²`,
        new Date(prop.sold_date).toLocaleDateString("fr-FR")
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: [61, 41, 122],
        textColor: 255
      },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' }
      }
    })

    // Section 5: Recommandations
    doc.setFontSize(16)
    doc.setTextColor(61, 41, 122)
    doc.text("5. Recommandations", 20, doc.lastAutoTable.finalY + 15)
    
    const marketTrend = estimationData.market_trends[estimationData.market_trends.length - 1].price > 
                       estimationData.market_trends[0].price
    
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      body: [
        ['Tendance du marché', marketTrend ? 'Hausse' : 'Baisse'],
        ['Évolution 6 mois', `${((estimationData.market_trends[estimationData.market_trends.length - 1].price - estimationData.market_trends[0].price) / estimationData.market_trends[0].price * 100).toFixed(1)}%`],
        ['Recommandation', marketTrend ? 'C\'est un bon moment pour vendre' : 'Envisagez d\'attendre une période plus favorable']
      ],
      theme: 'plain',
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [240, 240, 240] }
      }
    })

    // Pied de page
    doc.setFontSize(10)
    doc.setTextColor(128, 128, 128)
    doc.text("Ce rapport a été généré automatiquement par EstimPro - " + new Date().toLocaleDateString("fr-FR"), 105, 285, { align: "center" })

    // Enregistrer le PDF
    doc.save(`Rapport_Estimation_${propertyDetails.address.replace(/\s+/g, '_')}.pdf`)
  }

  if (loading || rateLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <h3 className="text-2xl font-semibold text-white mb-2">
            {loading ? "Analyse en cours..." : "Mise à jour des taux de change..."}
          </h3>
          <p className="text-white/70">Notre IA analyse votre bien et les données du marché</p>
        </div>
      </div>
    )
  }

  if (error || rateError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur-md border-white/20 p-8 max-w-md">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Erreur</h2>
            <p className="text-white/70 mb-6">{error || rateError}</p>
            <div className="flex flex-col space-y-2">
              <Link href="/estimate">
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white w-full">
                  Nouvelle estimation
                </Button>
              </Link>
              <Button 
                onClick={() => window.location.reload()} 
                className="w-full"
                variant="outline"
              >
                Réessayer
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (!estimationData || !propertyDetails || !rate) {
    return null
  }

  const marketDataInMGA = estimationData.market_trends.map(item => ({
    month: item.month,
    price: Math.round(item.price * rate)
  }))

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
              <Button
                size="sm"
                onClick={generatePDF}
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
              <h2 className="text-xl font-semibold text-black">Estimation réalisée avec succès !</h2>
              <p className="text-black/80">
                Votre bien a été analysé par notre IA avec un niveau de confiance de {estimationData.confidence_score}%
              </p>
              <p className="text-black/60 text-sm mt-1">
                Taux de change: 1€ = {Math.round(rate)} MGA. Valeur extraite depuis "exchangerate-api"
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
                  Estimation IA • Confiance {estimationData.confidence_score}%
                </Badge>
                <div className="text-5xl font-bold text-white mb-2">
                  {convertToMGA(estimationData.estimated_price)} MGA
                </div>
                <div className="text-white/70 text-lg">
                  Fourchette: {convertToMGA(estimationData.price_min)} MGA -{" "}
                  {convertToMGA(estimationData.price_max)} MGA
                </div>
                <div className="text-white/60 mt-2">Soit {convertToMGA(estimationData.price_per_sqm)} MGA/m²</div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Niveau de confiance</span>
                  <span className="text-white font-semibold">{estimationData.confidence_score}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${estimationData.confidence_score}%` }}
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
                        <div className="text-2xl font-bold text-white">{convertToMGA(estimationData.price_per_sqm)} MGA</div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="text-white/60 text-sm">Écart type</div>
                        <div className="text-2xl font-bold text-white">
                          ±{Math.round((estimationData.price_max - estimationData.estimated_price) / estimationData.estimated_price * 100)}%
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {Object.entries(estimationData.factors_analysis).map(([factor, impact]) => (
                        <div key={factor} className="flex justify-between items-center">
                          <span className="text-white/70 capitalize">{factor.replace('_', ' ')}</span>
                          <span className={impact > 0 ? "text-green-400" : impact < 0 ? "text-red-400" : "text-yellow-400"}>
                            {impact > 0 ? '+' : ''}{impact}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="market" className="mt-6">
                <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Évolution du marché</h3>
                  <div className="h-64 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={marketDataInMGA}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                        <XAxis dataKey="month" stroke="#ffffff80" />
                        <YAxis stroke="#ffffff80" />
                        <Tooltip 
                          formatter={(value) => [`${value} MGA`, "Prix"]}
                          labelFormatter={(label) => `Mois: ${label}`}
                          contentStyle={{
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            borderColor: '#ffffff20',
                            borderRadius: '0.5rem',
                            color: 'white'
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="price"
                          stroke="#8884d8"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">
                        +{((marketDataInMGA[marketDataInMGA.length - 1].price - marketDataInMGA[0].price) / marketDataInMGA[0].price * 100).toFixed(1)}%
                      </div>
                      <div className="text-white/60 text-sm">6 derniers mois</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {convertToMGA(estimationData.price_per_sqm)} MGA
                      </div>
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
                    {estimationData.comparable_properties.map((property, index) => (
                      <div key={index} className="bg-white/5 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="text-white font-medium">{property.address}</div>
                            <div className="text-white/60 text-sm">
                              Vendu le {new Date(property.sold_date).toLocaleDateString("fr-FR")}
                            </div>
                          </div>
                          <Badge variant="outline" className="border-white/20 text-white">
                            {property.surface} m²
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-lg font-semibold text-white">
                            {convertToMGA(property.price)} MGA
                          </div>
                          <div className="text-white/70">{convertToMGA(property.price_per_sqm)} MGA/m²</div>
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
                  <span className="text-white/80 text-sm">{propertyDetails.address}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Ruler className="h-4 w-4 text-white/60" />
                  <span className="text-white/80 text-sm">{propertyDetails.surface} m²</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-white/60" />
                  <span className="text-white/80 text-sm">{propertyDetails.rooms} pièces</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-white/60" />
                  <span className="text-white/80 text-sm">Construit en {propertyDetails.year}</span>
                </div>
              </div>
            </Card>

            {/* Next Steps */}
            <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30 p-6">
              <h3 className="text-lg font-semibold text-black mb-4">Prochaines étapes</h3>
              <div className="space-y-3">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                  Contacter un agent
                </Button>
                <Button variant="outline" className="w-full border-white/20 text-black hover:bg-white/10">
                  Affiner l'estimation
                </Button>
                <Button variant="outline" className="w-full border-white/20 text-black hover:bg-white/10">
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
                  Le secteur affiche une croissance de {((marketDataInMGA[marketDataInMGA.length - 1].price - marketDataInMGA[0].price) / marketDataInMGA[0].price * 100).toFixed(1)}% sur 6 mois. 
                  {marketDataInMGA[marketDataInMGA.length - 1].price > marketDataInMGA[0].price 
                    ? " C'est le moment idéal pour vendre." 
                    : " Le marché est en baisse, envisagez d'attendre."}
                </div>
                <Badge className={marketDataInMGA[marketDataInMGA.length - 1].price > marketDataInMGA[0].price 
                  ? "bg-green-500/20 text-green-400 border-green-500/30" 
                  : "bg-red-500/20 text-red-400 border-red-500/30"}>
                  Recommandation: {marketDataInMGA[marketDataInMGA.length - 1].price > marketDataInMGA[0].price 
                    ? "Vendre maintenant" 
                    : "Attendre une meilleure période"}
                </Badge>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}