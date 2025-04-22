import Link from "next/link"
import { ArrowRight, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface RoadmapCardProps {
  id: string
  title: string
  description: string
  category: string
  difficulty: "Beginner" | "Intermediate" | "Advanced"
  popularity?: number
  isNew?: boolean
}

export default function RoadmapCard({
  id,
  title,
  description,
  category,
  difficulty,
  popularity,
  isNew = false,
}: RoadmapCardProps) {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border border-gray-200 hover:border-orange-300">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-bold text-slate-800">{title}</CardTitle>
          <div className="flex space-x-2">
            {isNew && <Badge className="bg-red-600 hover:bg-red-700">New</Badge>}
            <Badge variant="outline" className="border-slate-300 text-slate-600">
              {difficulty}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="text-slate-600 mb-4">{description}</p>
        <div className="flex items-center text-sm text-slate-500">
          <span className="bg-slate-100 px-2 py-1 rounded-full">{category}</span>
          {popularity && (
            <div className="flex items-center ml-auto">
              <Star className="h-4 w-4 text-orange-500 mr-1" />
              <span>{popularity}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="bg-slate-50 border-t border-slate-100">
        <Link
          href={`/roadmap/${id}`}
          className="flex items-center text-red-600 hover:text-red-700 transition-colors font-medium"
        >
          View Roadmap
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </CardFooter>
    </Card>
  )
}
