/**
 * Converts an array of objects to CSV format
 * @param data Array of objects to convert
 * @param headers Optional custom headers (if not provided, will use object keys)
 * @returns CSV formatted string
 */
export function convertToCSV<T extends Record<string, any>>(data: T[], headers?: { [key: string]: string }): string {
  if (data.length === 0) return ""

  const keys = Object.keys(data[0])

  // Create header row
  let csvContent = ""
  if (headers) {
    csvContent = keys.map((key) => headers[key] || key).join(",") + "\n"
  } else {
    csvContent = keys.join(",") + "\n"
  }

  // Add data rows
  data.forEach((item) => {
    const row = keys.map((key) => {
      const value = item[key]
      // Handle values that might contain commas or quotes
      if (value === null || value === undefined) {
        return ""
      }
      const stringValue = String(value)
      if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`
      }
      return stringValue
    })
    csvContent += row.join(",") + "\n"
  })

  return csvContent
}

/**
 * Triggers a download of data as a CSV file
 * @param data The data to download
 * @param filename The name of the file to download
 */
export function downloadCSV(data: string, filename: string): void {
  const blob = new Blob([data], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
} 