import * as XLSX from "xlsx"

/**
 * Converts data to Excel format and triggers a download
 * @param data Array of objects to convert
 * @param filename The name of the file to download
 * @param sheetName Optional sheet name
 * @param headers Optional custom headers
 */
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  filename: string,
  sheetName = "Sheet1",
  headers?: { [key: string]: string },
): void {
  if (data.length === 0) return

  // Create a new workbook
  const workbook = XLSX.utils.book_new()

  // Transform data if custom headers are provided
  if (headers) {
    const transformedData = data.map((item) => {
      const newItem: Record<string, any> = {}
      Object.keys(item).forEach((key) => {
        const headerName = headers[key] || key
        newItem[headerName] = item[key]
      })
      return newItem
    })
    
    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(transformedData)
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  } else {
    // Convert data to worksheet directly
    const worksheet = XLSX.utils.json_to_sheet(data)
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  }

  // Generate the Excel file and trigger download
  XLSX.writeFile(workbook, `${filename}.xlsx`)
} 