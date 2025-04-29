import { Brain, Code, BookOpen, Users } from "lucide-react"

const features = [
  {
    name: "Personalized Learning Paths",
    description: "Customized roadmaps based on your experience level and learning goals.",
    icon: Brain,
  },
  {
    name: "Practical Projects",
    description: "Hands-on projects to apply your knowledge and build your portfolio.",
    icon: Code,
  },
  {
    name: "Curated Resources",
    description: "The best tutorials, courses, and documentation for each topic.",
    icon: BookOpen,
  },
  {
    name: "Community Support",
    description: "Connect with other learners and experts in the AI community.",
    icon: Users,
  },
]

interface FeatureSectionProps {
  title?: string
  subtitle?: string
  className?: string
}

export default function FeatureSection({ 
  title = "Why Choose AI Sherpas?",
  subtitle = "Everything you need to implement AI technologies in your organization.",
  className = ""
}: FeatureSectionProps) {
  return (
    <div className={`bg-background py-16 sm:py-24 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-xl text-muted-foreground sm:mt-4">
            {subtitle}
          </p>
        </div>

        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.name}
                className="relative p-6 bg-card rounded-lg hover:bg-accent transition-colors"
              >
                <div className="absolute top-6 left-6">
                  <span className="inline-flex items-center justify-center p-3 bg-orange-100 rounded-md">
                    <feature.icon className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </span>
                </div>
                <div className="ml-16">
                  <h3 className="text-lg font-medium text-card-foreground">{feature.name}</h3>
                  <p className="mt-2 text-base text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 