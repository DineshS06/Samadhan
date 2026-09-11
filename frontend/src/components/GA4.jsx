/** GA4 Tracking Component */
import { useEffect } from 'react'

const GA4_MEASUREMENT_ID = 'G-6LWP2GPD16' // Replace with actual GA4 Measurement ID

export default function GA4() {
  useEffect(() => {
    // Initialize GA4
    window.dataLayer = window.dataLayer || []
    function gtag(){dataLayer.push(arguments)}
    gtag('js', new Date())
    gtag('config', GA4_MEASUREMENT_ID)

    // Create and load GA4 script tag
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`
    document.head.appendChild(script)
  }, [])

  return null
}