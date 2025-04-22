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

export default function FeatureSection() {
  return (
    <div className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Why Choose AI Sherpas?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-xl text-slate-500 sm:mt-4">
            Everything you need to implement AI technologies in your organization.
          </p>
        </div>

        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.name}
                className="relative p-6 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="absolute top-6 left-6">
                  <span className="inline-flex items-center justify-center p-3 bg-orange-100 rounded-md">
                    <feature.icon className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </span>
                </div>
                <div className="ml-16">
                  <h3 className="text-lg font-medium text-slate-900">{feature.name}</h3>
                  <p className="mt-2 text-base text-slate-500">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
