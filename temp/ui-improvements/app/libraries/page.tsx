"use client"

import { useState } from "react"
import { Search, Filter, Plus, Edit, Eye, Trash2 } from "lucide-react"
import SidebarLayout from "@/components/layout/sidebar-layout"

// Sample job roles data
const jobRoles = [
  {
    id: "role-001",
    title: "Sales Operations Specialist",
    department: "Department 1",
    responsibilities: "Manage RFP responses, Maintain sales data, Perform CRM analysis, Create sales reports",
    aiPotential: "High",
  },
  {
    id: "role-002",
    title: "Content Marketing Manager",
    department: "Department 1",
    responsibilities: "Create marketing content, Manage editorial calendar, Coordinate content distribution",
    aiPotential: "Medium",
  },
  {
    id: "role-003",
    title: "Digital Marketing Specialist",
    department: "Department 1",
    responsibilities: "Manage online ad campaigns, Analyze marketing data, Optimize conversion rates",
    aiPotential: "Medium",
  },
  {
    id: "role-004",
    title: "Customer Support Agent",
    department: "Department 2",
    responsibilities: "Handle customer inquiries, Troubleshoot basic issues, Escalate complex problems",
    aiPotential: "High",
  },
  {
    id: "role-005",
    title: "Technical Support Specialist",
    department: "Department 2",
    responsibilities: "Diagnose technical problems, Provide advanced troubleshooting, Document solutions",
    aiPotential: "Medium",
  },
]

export default function LibrariesPage() {
  const [activeTab, setActiveTab] = useState("job-roles")
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<any>(null)

  const filteredRoles = jobRoles.filter(
    (role) =>
      role.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.department.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleEditRole = (role: any) => {
    setSelectedRole(role)
    setIsModalOpen(true)
  }

  return (
    <SidebarLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Library Management</h1>
          <button
            onClick={() => {
              setSelectedRole(null)
              setIsModalOpen(true)
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("job-roles")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "job-roles"
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              Job Roles
            </button>
            <button
              onClick={() => setActiveTab("ai-capabilities")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "ai-capabilities"
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              AI Capabilities
            </button>
          </nav>
        </div>

        {/* Search and filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder={activeTab === "job-roles" ? "Search roles..." : "Search capabilities..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-slate-300 bg-white rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-slate-300 bg-white rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50">
            Import
          </button>
        </div>

        {/* Job Roles Table */}
        {activeTab === "job-roles" && (
          <div className="bg-white shadow-sm rounded-lg border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                    >
                      Role Name
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                    >
                      Department
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                    >
                      Key Responsibilities
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                    >
                      AI Potential
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredRoles.map((role) => (
                    <tr key={role.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{role.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{role.department}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 max-w-md truncate">{role.responsibilities}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            role.aiPotential === "High"
                              ? "bg-green-100 text-green-800"
                              : role.aiPotential === "Medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          {role.aiPotential}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEditRole(role)}
                          className="text-slate-600 hover:text-slate-900 mr-3"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button className="text-red-600 hover:text-red-900 mr-3">
                          <Eye className="h-5 w-5" />
                        </button>
                        <button className="text-slate-600 hover:text-slate-900">
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 text-sm text-slate-500">
              Showing 1 to {filteredRoles.length} of {filteredRoles.length} results
            </div>
          </div>
        )}

        {/* AI Capabilities Tab Content */}
        {activeTab === "ai-capabilities" && (
          <div className="bg-white shadow-sm rounded-lg border border-slate-200 p-6">
            <p className="text-slate-500">AI capabilities content will be displayed here.</p>
          </div>
        )}
      </div>

      {/* Edit Role Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                {selectedRole ? "Edit Job Role" : "Add New Job Role"}
              </h2>

              <form className="space-y-6">
                <div>
                  <label htmlFor="roleTitle" className="block text-sm font-medium text-slate-700 mb-1">
                    Role Title
                  </label>
                  <input
                    type="text"
                    id="roleTitle"
                    name="roleTitle"
                    defaultValue={selectedRole?.title || ""}
                    className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-slate-700 mb-1">
                    Department
                  </label>
                  <select
                    id="department"
                    name="department"
                    defaultValue={selectedRole?.department || ""}
                    className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="Department 1">Department 1</option>
                    <option value="Department 2">Department 2</option>
                    <option value="Department 3">Department 3</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    defaultValue={selectedRole?.description || ""}
                    className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label htmlFor="responsibilities" className="block text-sm font-medium text-slate-700 mb-1">
                    Key Responsibilities
                  </label>
                  <textarea
                    id="responsibilities"
                    name="responsibilities"
                    rows={4}
                    defaultValue={selectedRole?.responsibilities || ""}
                    className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                  />
                  <p className="mt-1 text-sm text-slate-500">Enter each responsibility on a new line</p>
                </div>

                <div>
                  <label htmlFor="aiPotential" className="block text-sm font-medium text-slate-700 mb-1">
                    AI Potential
                  </label>
                  <select
                    id="aiPotential"
                    name="aiPotential"
                    defaultValue={selectedRole?.aiPotential || "Medium"}
                    className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </form>
            </div>

            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-200">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                {selectedRole ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </SidebarLayout>
  )
}
