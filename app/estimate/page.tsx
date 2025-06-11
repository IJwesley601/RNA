"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, ArrowRight, Home, MapPin, Building, Ruler, Sparkles } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function EstimatePage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    address: "",
    propertyType: "",
    surface: [100],
    rooms: "",
    bedrooms: "",
    bathrooms: "",
    year: [2000],
    condition: "",
    parking: "",
    garden: "",
    balcony: "",
    floor: "",
    elevator: "",
    latitude: null,
    longitude: null
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const totalSteps = 4
  const progress = (currentStep / totalSteps) * 100

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    
    try {
      // Géocodage de l'adresse
      const geocodeResponse = await fetch(`http://localhost:8000/geocode?address=${encodeURIComponent(formData.address)}`)
      if (!geocodeResponse.ok) {
        throw new Error('Erreur lors du géocodage')
      }
      const { latitude, longitude } = await geocodeResponse.json()
      
      // Mettre à jour les coordonnées
      setFormData(prev => ({ ...prev, latitude, longitude }))
      
      // Rediriger vers la page de résultats avec les données
      router.push(`/results?propertyData=${encodeURIComponent(JSON.stringify({
        ...formData,
        latitude,
        longitude
      }))}`)
    } catch (err) {
      console.error('Erreur:', err)
      setIsLoading(false)
    }
  }

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 text-white hover:text-white/80 transition-colors">
              <ArrowLeft className="h-5 w-5" />
              <span>Retour</span>
            </Link>
            <div className="flex items-center space-x-2">
              <Home className="h-6 w-6 text-white" />
              <span className="text-lg font-bold text-white">EstimPro</span>
            </div>
            <div className="text-white/60">
              Étape {currentStep}/{totalSteps}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-white/80 text-sm">Progression</span>
            <span className="text-white/80 text-sm">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2 bg-white/20" />
        </div>

        <Card className="bg-white/10 backdrop-blur-md border-white/20 p-8">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <h3 className="text-2xl font-semibold text-white mb-2">Analyse en cours...</h3>
              <p className="text-white/70">Notre IA analyse votre bien et les données du marché</p>
            </div>
          ) : (
            <>
              {/* Step 1: Location */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MapPin className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Localisation</h2>
                    <p className="text-white/70">Où se situe votre bien immobilier ?</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="address" className="text-white mb-2 block">
                        Adresse complète
                      </Label>
                      <Input
                        id="address"
                        placeholder="Ex: 123 Rue de la Paix, 75001 Paris"
                        value={formData.address}
                        onChange={(e) => updateFormData("address", e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      />
                    </div>

                    <div>
                      <Label htmlFor="propertyType" className="text-white mb-2 block">
                        Type de bien
                      </Label>
                      <Select
                        value={formData.propertyType}
                        onValueChange={(value) => updateFormData("propertyType", value)}
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Sélectionnez le type de bien" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="apartment">Appartement</SelectItem>
                          <SelectItem value="house">Maison</SelectItem>
                          <SelectItem value="studio">Studio</SelectItem>
                          <SelectItem value="loft">Loft</SelectItem>
                          <SelectItem value="duplex">Duplex</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Characteristics */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Ruler className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Caractéristiques</h2>
                    <p className="text-white/70">Décrivez les principales caractéristiques de votre bien</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-white mb-4 block">Surface habitable: {formData.surface[0]} m²</Label>
                      <Slider
                        value={formData.surface}
                        onValueChange={(value) => updateFormData("surface", value)}
                        max={500}
                        min={10}
                        step={5}
                        className="mb-4"
                      />
                    </div>

                    <div>
                      <Label htmlFor="rooms" className="text-white mb-2 block">
                        Nombre de pièces
                      </Label>
                      <Select value={formData.rooms} onValueChange={(value) => updateFormData("rooms", value)}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Sélectionnez" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 pièce</SelectItem>
                          <SelectItem value="2">2 pièces</SelectItem>
                          <SelectItem value="3">3 pièces</SelectItem>
                          <SelectItem value="4">4 pièces</SelectItem>
                          <SelectItem value="5">5 pièces</SelectItem>
                          <SelectItem value="6+">6+ pièces</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="bedrooms" className="text-white mb-2 block">
                        Chambres
                      </Label>
                      <Select value={formData.bedrooms} onValueChange={(value) => updateFormData("bedrooms", value)}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Nombre de chambres" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="4">4</SelectItem>
                          <SelectItem value="5+">5+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="bathrooms" className="text-white mb-2 block">
                        Salles de bain
                      </Label>
                      <Select value={formData.bathrooms} onValueChange={(value) => updateFormData("bathrooms", value)}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Nombre de SDB" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="4+">4+</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Details */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Building className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Détails du bien</h2>
                    <p className="text-white/70">Informations complémentaires pour affiner l'estimation</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-white mb-4 block">Année de construction: {formData.year[0]}</Label>
                      <Slider
                        value={formData.year}
                        onValueChange={(value) => updateFormData("year", value)}
                        max={2024}
                        min={1900}
                        step={1}
                        className="mb-4"
                      />
                    </div>

                    <div>
                      <Label htmlFor="condition" className="text-white mb-2 block">
                        État du bien
                      </Label>
                      <Select value={formData.condition} onValueChange={(value) => updateFormData("condition", value)}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="État général" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excellent">Excellent</SelectItem>
                          <SelectItem value="good">Bon</SelectItem>
                          <SelectItem value="average">Moyen</SelectItem>
                          <SelectItem value="renovation">À rénover</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="parking" className="text-white mb-2 block">
                        Parking
                      </Label>
                      <Select value={formData.parking} onValueChange={(value) => updateFormData("parking", value)}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Type de parking" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucun</SelectItem>
                          <SelectItem value="street">Rue</SelectItem>
                          <SelectItem value="garage">Garage</SelectItem>
                          <SelectItem value="covered">Couvert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="garden" className="text-white mb-2 block">
                        Extérieur
                      </Label>
                      <Select value={formData.garden} onValueChange={(value) => updateFormData("garden", value)}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Espace extérieur" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucun</SelectItem>
                          <SelectItem value="balcony">Balcon</SelectItem>
                          <SelectItem value="terrace">Terrasse</SelectItem>
                          <SelectItem value="garden">Jardin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Confirmation */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Récapitulatif</h2>
                    <p className="text-white/70">Vérifiez les informations avant de lancer l'estimation</p>
                  </div>

                  <div className="bg-white/5 rounded-lg p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-white/60">Adresse:</span>
                        <p className="text-white font-medium">{formData.address || "Non renseigné"}</p>
                      </div>
                      <div>
                        <span className="text-white/60">Type:</span>
                        <p className="text-white font-medium">{formData.propertyType || "Non renseigné"}</p>
                      </div>
                      <div>
                        <span className="text-white/60">Surface:</span>
                        <p className="text-white font-medium">{formData.surface[0]} m²</p>
                      </div>
                      <div>
                        <span className="text-white/60">Pièces:</span>
                        <p className="text-white font-medium">{formData.rooms || "Non renseigné"}</p>
                      </div>
                      <div>
                        <span className="text-white/60">Année:</span>
                        <p className="text-white font-medium">{formData.year[0]}</p>
                      </div>
                      <div>
                        <span className="text-white/60">État:</span>
                        <p className="text-white font-medium">{formData.condition || "Non renseigné"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg p-6 text-center">
                    <h3 className="text-xl font-semibold text-white mb-2">Prêt pour l'estimation ?</h3>
                    <p className="text-white/70">
                      Notre IA va analyser votre bien et vous fournir une estimation précise
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className="border-white/20 text-black hover:bg-white/10"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Précédent
                </Button>

                <Button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  {currentStep === totalSteps ? "Lancer l'estimation" : "Suivant"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
