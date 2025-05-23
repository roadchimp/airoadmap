import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reportId = parseInt(params.id, 10)
    
    if (isNaN(reportId)) {
      return NextResponse.json(
        { error: 'Invalid report ID' },
        { status: 400 }
      )
    }

    const { email, reportUrl, reportTitle } = await request.json()

    if (!email || !reportUrl || !reportTitle) {
      return NextResponse.json(
        { error: 'Missing required fields: email, reportUrl, reportTitle' },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // For now, we'll just log the sharing attempt
    // In a real implementation, you would:
    // 1. Use a service like SendGrid, AWS SES, or Nodemailer
    // 2. Store sharing logs in the database
    // 3. Handle email templates
    
    console.log(`Sharing report ${reportId} (${reportTitle}) with ${email}`)
    console.log(`Report URL: ${reportUrl}`)

    // Simulate email sending (replace with actual email service)
    const emailContent = {
      to: email,
      subject: `AI Transformation Assessment Report: ${reportTitle}`,
      html: `
        <h2>AI Transformation Assessment Report</h2>
        <p>You've been shared an AI Transformation Assessment Report: <strong>${reportTitle}</strong></p>
        <p>Click the link below to view the report:</p>
        <a href="${reportUrl}" style="background-color: #e84c2b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Report</a>
        <p>This link will allow you to view the complete assessment including AI capabilities, prioritization matrix, and recommendations.</p>
      `
    }

    // TODO: Implement actual email sending here
    // Example with a hypothetical email service:
    // await sendEmail(emailContent)

    // For now, just return success
    return NextResponse.json({ 
      success: true, 
      message: `Report shared successfully with ${email}` 
    })

  } catch (error) {
    console.error('Error sharing report:', error)
    return NextResponse.json(
      { error: 'Failed to share report' },
      { status: 500 }
    )
  }
} 