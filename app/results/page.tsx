"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useSearchParams } from "next/navigation";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface EstimationData {
  estimated_price: number;
  price_min: number;
  price_max: number;
  price_per_sqm: number;
  confidence_score: number;
  market_trends: { month: string; price: number }[];
  comparable_properties: {
    address: string;
    price: number;
    surface: number;
    price_per_sqm: number;
    sold_date: string;
  }[];
  factors_analysis: Record<string, number>;
}

interface PropertyDetails {
  address: string;
  property_type: string;
  surface: number;
  rooms: number;
  floor: number;
  bedrooms: number;
  bathrooms: number;
  year: number;
  condition: string;
  parking: string;
  garden: string;
}

const useCurrencyConverter = () => {
  const [rate, setRate] = useState<number | null>(null); // Taux MGA -> EUR
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch(
          "https://v6.exchangerate-api.com/v6/9a7414de33f741e1facc43c3/latest/EUR"
        );
        if (!response.ok) {
          throw new Error("Échec de la récupération du taux de change");
        }
        const data = await response.json();
        setRate(data.conversion_rates.MGA); // Récupère le taux EUR -> MGA
      } catch (err) {
        console.error(
          "Erreur lors de la récupération du taux de change :",
          err
        );
        setError(err instanceof Error ? err.message : "Erreur inconnue");
      } finally {
        setLoading(false);
      }
    };

    fetchExchangeRate();
  }, []);

  const convertToEUR = (mga: number): string => {
    if (rate === null) return "...";
    return (mga / rate).toLocaleString("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return { convertToEUR, loading, error, rate };
};

export default function ResultsPage() {
  const [activeTab, setActiveTab] = useState("estimation");
  const [estimationData, setEstimationData] = useState<EstimationData | null>(
    null
  );
  const [propertyDetails, setPropertyDetails] =
    useState<PropertyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    convertToEUR,
    loading: rateLoading,
    error: rateError,
    rate,
  } = useCurrencyConverter();
  const searchParams = useSearchParams();
  const propertyDataParam = searchParams.get("propertyData");

  useEffect(() => {
    const fetchEstimation = async () => {
      try {
        setLoading(true);

        if (!propertyDataParam) {
          throw new Error("Données du bien manquantes");
        }

        let parsedPropertyData;
        try {
          parsedPropertyData = JSON.parse(
            decodeURIComponent(propertyDataParam)
          );
        } catch (err) {
          throw new Error("Erreur de formatage des données du bien");
        }

        setPropertyDetails({
          address: parsedPropertyData.address,
          property_type: parsedPropertyData.propertyType,
          surface: Array.isArray(parsedPropertyData.surface)
            ? parsedPropertyData.surface[0]
            : parsedPropertyData.surface,
          rooms: parsedPropertyData.rooms,
          floor: parsedPropertyData.floor,
          bedrooms: parsedPropertyData.bedrooms,
          bathrooms: parsedPropertyData.bathrooms,
          year: Array.isArray(parsedPropertyData.year)
            ? parsedPropertyData.year[0]
            : parsedPropertyData.year,
          condition: parsedPropertyData.condition,
          parking: parsedPropertyData.parking,
          garden: parsedPropertyData.garden,
        });

        const response = await fetch("http://localhost:8000/estimate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            address: parsedPropertyData.address,
            property_type: parsedPropertyData.propertyType,
            surface: Array.isArray(parsedPropertyData.surface)
              ? parsedPropertyData.surface[0]
              : parsedPropertyData.surface,
            rooms: parseInt(parsedPropertyData.rooms, 10),
            floor: parseInt(parsedPropertyData.floor, 10),
            bedrooms: parseInt(parsedPropertyData.bedrooms, 10),
            bathrooms: parseInt(parsedPropertyData.bathrooms, 10),
            year: Array.isArray(parsedPropertyData.year)
              ? parsedPropertyData.year[0]
              : parsedPropertyData.year,
            condition: parsedPropertyData.condition,
            parking: parsedPropertyData.parking,
            garden: parsedPropertyData.garden,
            latitude: parsedPropertyData.latitude,
            longitude: parsedPropertyData.longitude,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Erreur backend:", response.status, errorText);
          throw new Error(
            `Erreur lors de la récupération des données: ${
              errorText || response.statusText
            }`
          );
        }

        const data = await response.json();
        setEstimationData(data);
      } catch (err) {
        console.error("Erreur:", err);
        setError(
          err instanceof Error ? err.message : "Une erreur est survenue"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEstimation();
  }, [propertyDataParam]);

  const formatMGA = (value: number): string => {
    return value.toLocaleString("fr-FR");
  };

  const generatePDF = () => {
    if (!estimationData || !propertyDetails || !rate) return;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // En-tête
    doc.setFontSize(22);
    doc.setTextColor(61, 41, 122);
    doc.text("Rapport d'estimation immobilier", 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(128, 128, 128);
    doc.text("EstimPro - Votre partenaire immobilier intelligent", 105, 28, {
      align: "center",
    });

    // Ligne de séparation
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 32, 190, 32);

    // Section 1: Détails du bien
    doc.setFontSize(16);
    doc.setTextColor(61, 41, 122);
    doc.text("1. Détails du bien", 20, 42);

    autoTable(doc, {
      startY: 45,
      head: [["Caractéristique", "Valeur"]],
      body: [
        ["Adresse", propertyDetails.address],
        ["Type de bien", propertyDetails.property_type],
        ["Surface", `${propertyDetails.surface} m²`],
        [
          "Pièces",
          `${propertyDetails.rooms} (${propertyDetails.bedrooms} chambres)`,
        ],
        ["Salles de bain", propertyDetails.bathrooms],
        ["Année de construction", propertyDetails.year],
        ["État", propertyDetails.condition],
        ["Parking", propertyDetails.parking],
        ["Jardin", propertyDetails.garden],
        ["Etage", propertyDetails.floor],
      ],
      theme: "grid",
      headStyles: {
        fillColor: [61, 41, 122],
        textColor: 255,
      },
    });

    // Section 2: Estimation
    doc.setFontSize(16);
    doc.setTextColor(61, 41, 122);
    doc.text("2. Estimation de valeur", 20, doc.lastAutoTable.finalY + 15);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      body: [
        [
          "Estimation moyenne",
          `${formatMGA(estimationData.estimated_price)} MGA (${convertToEUR(
            estimationData.estimated_price
          )} €)`,
        ],
        [
          "Fourchette de prix",
          `${formatMGA(estimationData.price_min)} MGA - ${formatMGA(
            estimationData.price_max
          )} MGA (${convertToEUR(estimationData.price_min)} € - ${convertToEUR(
            estimationData.price_max
          )} €)`,
        ],
        [
          "Prix au m²",
          `${formatMGA(estimationData.price_per_sqm)} MGA/m² (${convertToEUR(
            estimationData.price_per_sqm
          )} €/m²)`,
        ],
        ["Niveau de confiance", `${estimationData.confidence_score}%`],
      ],
      theme: "plain",
      columnStyles: {
        0: { fontStyle: "bold", fillColor: [240, 240, 240] },
        1: { halign: "right" },
      },
    });

    // Section 3: Analyse du marché
    doc.setFontSize(16);
    doc.setTextColor(61, 41, 122);
    doc.text("3. Analyse du marché", 20, doc.lastAutoTable.finalY + 15);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [["Mois", "Prix moyen (MGA)"]],
      body: estimationData.market_trends.map((trend) => [
        trend.month,
        `${formatMGA(trend.price)} MGA (${convertToEUR(trend.price)} €)`,
      ]),
      theme: "grid",
      headStyles: {
        fillColor: [61, 41, 122],
        textColor: 255,
      },
    });

    // Section 4: Biens comparables
    doc.setFontSize(16);
    doc.setTextColor(61, 41, 122);
    doc.text("4. Biens comparables récents", 20, doc.lastAutoTable.finalY + 15);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      head: [["Adresse", "Prix (MGA)", "Surface", "Date"]],
      body: estimationData.comparable_properties.map((prop) => [
        prop.address,
        `${formatMGA(prop.price)} MGA (${convertToEUR(prop.price)} €)`,
        `${prop.surface} m²`,
        new Date(prop.sold_date).toLocaleDateString("fr-FR"),
      ]),
      theme: "grid",
      headStyles: {
        fillColor: [61, 41, 122],
        textColor: 255,
      },
      columnStyles: {
        1: { halign: "right" },
        2: { halign: "right" },
      },
    });

    // Section 5: Recommandations
    doc.setFontSize(16);
    doc.setTextColor(61, 41, 122);
    doc.text("5. Recommandations", 20, doc.lastAutoTable.finalY + 15);

    const marketTrend =
      estimationData.market_trends[estimationData.market_trends.length - 1]
        .price > estimationData.market_trends[0].price;

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 20,
      body: [
        ["Tendance du marché", marketTrend ? "Hausse" : "Baisse"],
        [
          "Évolution 6 mois",
          `${(
            ((estimationData.market_trends[
              estimationData.market_trends.length - 1
            ].price -
              estimationData.market_trends[0].price) /
              estimationData.market_trends[0].price) *
            100
          ).toFixed(1)}%`,
        ],
        [
          "Recommandation",
          marketTrend
            ? "C'est un bon moment pour vendre"
            : "Envisagez d'attendre une période plus favorable",
        ],
      ],
      theme: "plain",
      columnStyles: {
        0: { fontStyle: "bold", fillColor: [240, 240, 240] },
      },
    });

    // Pied de page
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text(
      "Ce rapport a été généré automatiquement par EstimPro - " +
        new Date().toLocaleDateString("fr-FR"),
      105,
      285,
      { align: "center" }
    );

    // Enregistrer le PDF
    doc.save(
      `Rapport_Estimation_${propertyDetails.address.replace(/\s+/g, "_")}.pdf`
    );
  };

  if (loading || rateLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <h3 className="text-2xl font-semibold text-white mb-2">
            {loading
              ? "Analyse en cours..."
              : "Mise à jour des taux de change..."}
          </h3>
          <p className="text-white/70">
            Notre IA analyse votre bien et les données du marché
          </p>
        </div>
      </div>
    );
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
    );
  }

  if (!estimationData || !propertyDetails || !rate) {
    return null;
  }

  const marketData = estimationData.market_trends.map((item) => ({
    month: item.month,
    price: item.price,
  }));

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
              <h2 className="text-xl font-semibold text-black">
                Estimation réalisée avec succès !
              </h2>
              <p className="text-black/80">
                Votre bien a été analysé par notre IA avec un niveau de
                confiance de {estimationData.confidence_score}%
              </p>
              <p className="text-black/60 text-sm mt-1">
                Taux de change: 1 € = {(rate || 0).toFixed(6)} MGA. Valeur
                extraite depuis "exchangerate-api"
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
                  {formatMGA(estimationData.estimated_price)} MGA
                </div>
                <div className="text-2xl text-white mb-2">
                  soit {convertToEUR(estimationData.estimated_price)} €
                </div>
                <div className="text-white/70 text-lg">
                  Fourchette: {formatMGA(estimationData.price_min)} MGA -{" "}
                  {formatMGA(estimationData.price_max)} MGA
                </div>
                <div className="text-white/60 mt-2">
                  Soit {formatMGA(estimationData.price_per_sqm)} MGA/m²
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Niveau de confiance</span>
                  <span className="text-white font-semibold">
                    {estimationData.confidence_score}%
                  </span>
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
                <TabsTrigger
                  value="estimation"
                  className="data-[state=active]:bg-white/20 text-white"
                >
                  Détails
                </TabsTrigger>
                <TabsTrigger
                  value="market"
                  className="data-[state=active]:bg-white/20 text-white"
                >
                  Marché
                </TabsTrigger>
                <TabsTrigger
                  value="price-ranges"
                  className="data-[state=active]:bg-white/20 text-white"
                >
                  Fourchettes de prix du m²
                </TabsTrigger>
              </TabsList>

              <TabsContent value="estimation" className="mt-6">
                <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Analyse détaillée
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="text-white/60 text-sm">Prix au m²</div>
                        <div className="text-2xl font-bold text-white">
                          {formatMGA(estimationData.price_per_sqm)} MGA{" "}
                          <p className="text-lg">
                            soit {convertToEUR(estimationData.price_per_sqm)} €
                          </p>
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4">
                        <div className="text-white/60 text-sm">Écart type</div>
                        <div className="text-2xl font-bold text-white">
                          ±
                          {Math.round(
                            ((estimationData.price_max -
                              estimationData.estimated_price) /
                              estimationData.estimated_price) *
                              100
                          )}
                          %
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {Object.entries(estimationData.factors_analysis).map(
                        ([factor, impact]) => {
                          let displayName = factor.replace("_", " ");
                          // Traduction des noms de facteurs
                          if (factor === "floor_impact") displayName = "Étage";
                          if (factor === "location_impact")
                            displayName = "Localisation";

                          return (
                            <div
                              key={factor}
                              className="flex justify-between items-center"
                            >
                              <span className="text-white/70 capitalize">
                                {displayName}
                              </span>
                              <span
                                className={
                                  impact > 0
                                    ? "text-green-400"
                                    : impact < 0
                                    ? "text-red-400"
                                    : "text-yellow-400"
                                }
                              >
                                {impact > 0 ? "+" : ""}
                                {impact}%
                              </span>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="market" className="mt-6">
                <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Évolution du marché
                  </h3>
                  <div className="h-64 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={marketData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#ffffff20"
                        />
                        <XAxis dataKey="month" stroke="#ffffff80" />
                        <YAxis stroke="#ffffff80" />
                        <Tooltip
                          formatter={(value: number) => [
                            `${formatMGA(value)} MGA (${convertToEUR(
                              value
                            )} €)`,
                            "Prix",
                          ]}
                          labelFormatter={(label) => `Mois: ${label}`}
                          contentStyle={{
                            backgroundColor: "rgba(15, 23, 42, 0.9)",
                            borderColor: "#ffffff20",
                            borderRadius: "0.5rem",
                            color: "white",
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
                        +
                        {(
                          ((marketData[marketData.length - 1].price -
                            marketData[0].price) /
                            marketData[0].price) *
                          100
                        ).toFixed(1)}
                        %
                      </div>
                      <div className="text-white/60 text-sm">
                        6 derniers mois
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {formatMGA(estimationData.price_per_sqm)} MGA
                      </div>
                      <div className="text-white/60 text-sm">Prix moyen/m²</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">
                        23j
                      </div>
                      <div className="text-white/60 text-sm">
                        Temps de vente
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="price-ranges" className="mt-6">
                <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    Fourchettes de prix par du m² quartier
                  </h3>
                  <div className="overflow-y-auto max-h-96">
                    <table className="w-full text-white">
                      <thead>
                        <tr className="bg-gradient-to-r from-purple-600 to-pink-600 sticky top-0">
                          <th className="p-2 text-left">Quartier</th>
                          <th className="p-2 text-right">
                            Fourchette de prix (MGA)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-white/10 hover:bg-white/20">
                          <td className="p-2 font-bold text-purple-300">
                            Centre-ville & quartiers haut de gamme
                          </td>
                          <td></td>
                        </tr>
                        <tr className="bg-white/10 hover:bg-white/20">
                          <td className="p-2">Analakely</td>
                          <td className="p-2 text-right">
                            300 000 – 1 000 000
                          </td>
                        </tr>
                        <tr className="bg-white/10 hover:bg-white/20">
                          <td className="p-2">Antaninarenina</td>
                          <td className="p-2 text-right">
                            300 000 – 1 000 000
                          </td>
                        </tr>
                        <tr className="bg-white/10 hover:bg-white/20">
                          <td className="p-2">Isoraka</td>
                          <td className="p-2 text-right">
                            300 000 – 1 000 000
                          </td>
                        </tr>
                        <tr className="bg-white/10 hover:bg-white/20">
                          <td className="p-2">Ambatonakanga</td>
                          <td className="p-2 text-right">300 000 – 800 000</td>
                        </tr>
                        <tr className="bg-white/10 hover:bg-white/20">
                          <td className="p-2">Ankadifotsy</td>
                          <td className="p-2 text-right">250 000 – 700 000</td>
                        </tr>
                        <tr className="bg-white/10 hover:bg-white/20">
                          <td className="p-2">Tsaralalana</td>
                          <td className="p-2 text-right">300 000 – 600 000</td>
                        </tr>
                        <tr className="bg-white/10 hover:bg-white/20">
                          <td className="p-2 font-bold text-purple-300">
                            Quartiers résidentiels proches
                          </td>
                          <td></td>
                        </tr>
                        <tr className="bg-white/10 hover:bg-white/20">
                          <td className="p-2">Ivandry</td>
                          <td className="p-2 text-right">200 000 – 500 000</td>
                        </tr>
                        <tr className="bg-white/10 hover:bg-white/20">
                          <td className="p-2">Ambohipo</td>
                          <td className="p-2 text-right">150 000 – 300 000</td>
                        </tr>
                        <tr className="bg-white/10 hover:bg-white/20">
                          <td className="p-2">Ambatoroka</td>
                          <td className="p-2 text-right">60 000 – 150 000</td>
                        </tr>
                        <tr className="bg-white/10 hover:bg-white/20">
                          <td className="p-2">Ambohijatovo</td>
                          <td className="p-2 text-right">150 000 – 250 000</td>
                        </tr>
                        <tr className="bg-white/10 hover:bg-white/20">
                          <td className="p-2">Ankadivato</td>
                          <td className="p-2 text-right">200 000 – 350 000</td>
                        </tr>
                        <tr className="bg-white/10 hover:bg-white/20">
                          <td className="p-2">Ampasampito</td>
                          <td className="p-2 text-right">150 000 – 300 000</td>
                        </tr>
                        <tr className="bg-white/10 hover:bg-white/20">
                          <td className="p-2 font-bold text-purple-300">
                            Banlieues et zones en expansion
                          </td>
                          <td></td>
                        </tr>
                        <tr className="bg-white/10 hover:bg-white/20">
                          <td className="p-2">Ivato</td>
                          <td className="p-2 text-right">100 000 – 250 000</td>
                        </tr>
                        <tr className="bg-white/10 hover:bg-white/20">
                          <td className="p-2">Talatamaty</td>
                          <td className="p-2 text-right">80 000 – 150 000</td>
                        </tr>
                        <tr className="bg-white/10 hover:bg-white/20">
                          <td className="p-2">Tanjombato</td>
                          <td className="p-2 text-right">70 000 – 120 000</td>
                        </tr>
                        <tr className="bg-white/10 hover:bg-white/20">
                          <td className="p-2">Ambohidratrimo</td>
                          <td className="p-2 text-right">50 000 – 120 000</td>
                        </tr>
                        <tr className="bg-white/10 hover:bg-white/20">
                          <td className="p-2">Ambohimalaza</td>
                          <td className="p-2 text-right">30 000 – 100 000</td>
                        </tr>
                        <tr className="bg-white/10 hover:bg-white/20">
                          <td className="p-2">Anosizato</td>
                          <td className="p-2 text-right">70 000 – 150 000</td>
                        </tr>
                        <tr className="bg-white/10 hover:bg-white/20">
                          <td className="p-2">Andoharanofotsy</td>
                          <td className="p-2 text-right">60 000 – 130 000</td>
                        </tr>
                        <tr className="bg-white/10 hover:bg-white/20">
                          <td className="p-2 font-bold text-purple-300">
                            Zones périphériques et rurales
                          </td>
                          <td></td>
                        </tr>
                        <tr className="bg-white/10 hover:bg-white/20">
                          <td className="p-2">Alakamisy-Ambohidratrimo</td>
                          <td className="p-2 text-right">4 000 – 20 000</td>
                        </tr>
                        <tr className="bg-white/10 hover:bg-white/20">
                          <td className="p-2">Anjeva Gara</td>
                          <td className="p-2 text-right">10 000 – 30 000</td>
                        </tr>
                        <tr className="bg-white/10 hover:bg-white/20">
                          <td className="p-2">Moramanga</td>
                          <td className="p-2 text-right">3 000 – 15 000</td>
                        </tr>
                        <tr className="bg-white/10 hover:bg-white/20">
                          <td className="p-2">Manjakandriana</td>
                          <td className="p-2 text-right">5 000 – 25 000</td>
                        </tr>
                        <tr className="bg-white/10 hover:bg-white/20">
                          <td className="p-2">Ambatomirahavavy</td>
                          <td className="p-2 text-right">40 000 – 60 000</td>
                        </tr>
                        <tr className="bg-white/10 hover:bg-white/20">
                          <td className="p-2">Anosiala</td>
                          <td className="p-2 text-right">5 000 – 30 000</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Property Summary */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Votre bien
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-white/60" />
                  <span className="text-white/80 text-sm">
                    {propertyDetails.address}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Ruler className="h-4 w-4 text-white/60" />
                  <span className="text-white/80 text-sm">
                    {propertyDetails.surface} m²
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-white/60" />
                  <span className="text-white/80 text-sm">
                    {propertyDetails.rooms} pièces
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Building className="h-4 w-4 text-white/60" />
                  <span className="text-white/80 text-sm">
                    {propertyDetails.floor} étages
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-white/60" />
                  <span className="text-white/80 text-sm">
                    Construit en {propertyDetails.year}
                  </span>
                </div>
              </div>
            </Card>

            {/* Next Steps */}
            <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/30 p-6">
              <h3 className="text-lg font-semibold text-black mb-4">
                Prochaines étapes
              </h3>
              <div className="space-y-3">
                <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                  Contacter un agent
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-white/20 text-black hover:bg-white/10"
                >
                  Affiner l'estimation
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-white/20 text-black hover:bg-white/10"
                >
                  Recevoir des alertes
                </Button>
              </div>
            </Card>

            {/* Market Insights */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Insights marché
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="text-white/80 text-sm">
                    Marché en hausse
                  </span>
                </div>
                <div className="text-white/70 text-sm">
                  Le secteur affiche une croissance de{" "}
                  {(
                    ((marketData[marketData.length - 1].price -
                      marketData[0].price) /
                      marketData[0].price) *
                    100
                  ).toFixed(1)}
                  % sur 6 mois.
                  {marketData[marketData.length - 1].price > marketData[0].price
                    ? " C'est le moment idéal pour vendre."
                    : " Le marché est en baisse, envisagez d'attendre."}
                </div>
                <Badge
                  className={
                    marketData[marketData.length - 1].price >
                    marketData[0].price
                      ? "bg-green-500/20 text-green-400 border-green-500/30"
                      : "bg-red-500/20 text-red-400 border-red-500/30"
                  }
                >
                  Recommandation:{" "}
                  {marketData[marketData.length - 1].price > marketData[0].price
                    ? "Vendre maintenant"
                    : "Attendre une meilleure période"}
                </Badge>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
